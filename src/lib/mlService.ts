import * as tf from '@tensorflow/tfjs';
import { ConsumptionEvent, WasteEvent, Ingredient } from '@/types';
import { subWeeks, isWithinInterval } from 'date-fns';
import { indianIngredientsDatabase } from '@/data/ingredients';
import { ShoppingListItem } from '../store/pantryStore';

const MODEL_STORAGE_KEY = 'indexeddb://pantryveda-model';
const MODEL_COLUMNS_KEY = 'pantryveda-model-columns';

// #################################################################
// ## SECTION 1: PUBLIC FUNCTIONS (Called by the Orchestrator)    ##
// #################################################################

/**
 * Checks if a trained model already exists in the browser's storage.
 */
export async function hasTrainedModel(): Promise<boolean> {
    try {
        await tf.loadLayersModel(MODEL_STORAGE_KEY);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Trains a new model and then immediately uses it to generate suggestions.
 * This is called only the first time there's enough data.
 */
export async function trainAndSuggest(
    consumptionLog: ConsumptionEvent[], 
    wasteLog: WasteEvent[], 
    inventory: Ingredient[]
): Promise<Omit<ShoppingListItem, 'id' | 'checked'>[]> {
    const model = await _trainModelInternal(consumptionLog, wasteLog);
    if (!model) {
        return []; // Training failed or not enough data
    }
    // After training, immediately generate suggestions with the new model
    return await _predictWithModel(model, consumptionLog, wasteLog, inventory);
}

/**
 * Loads an existing model and uses it to generate suggestions.
 * This is called every time after the model has been trained once.
 */
export async function generateMlSuggestions(
    consumptionLog: ConsumptionEvent[], 
    wasteLog: WasteEvent[], 
    inventory: Ingredient[]
): Promise<Omit<ShoppingListItem, 'id' | 'checked'>[]> {
    try {
        const model = await tf.loadLayersModel(MODEL_STORAGE_KEY);
        return await _predictWithModel(model, consumptionLog, wasteLog, inventory);
    } catch (error) {
        console.error("Failed to load or use ML model:", error);
        return []; // Return empty array on failure so it can fall back
    }
}


// #################################################################
// ## SECTION 2: INTERNAL HELPER FUNCTIONS                        ##
// #################################################################

/**
 * The core training logic. This is now an internal function.
 * It takes the logs, prepares data, trains, saves, and returns the model object.
 */
async function _trainModelInternal(consumptionLog: ConsumptionEvent[], wasteLog: WasteEvent[]): Promise<tf.LayersModel | null> {
    const { features, labels, uniqueIngredients } = prepareData(consumptionLog, wasteLog);

    if (features.size === 0) {
        console.warn("Not enough data to train the model.");
        return null;
    }
    
    const featureCount = features.shape[1]!;
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [featureCount], units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    console.log("Starting model training...");
    await model.fit(features, labels, {
        epochs: 50,
        batchSize: 4,
        callbacks: { onEpochEnd: (epoch, logs) => console.log(`Epoch ${epoch + 1}: Loss = ${logs!.loss.toFixed(4)}`) }
    });
    console.log("Model training complete.");

    await model.save(MODEL_STORAGE_KEY);
    localStorage.setItem(MODEL_COLUMNS_KEY, JSON.stringify(uniqueIngredients)); // Save the ingredient list
    localStorage.setItem('lastTrainedTimestamp', new Date().toISOString());

    console.log("Model saved to IndexedDB.");
    
    return model;
}

/**
 * The core prediction logic. It takes a trained model and the logs,
 * prepares prediction data, and returns formatted suggestions.
 */
async function _predictWithModel(
    model: tf.LayersModel,
    consumptionLog: ConsumptionEvent[],
    wasteLog: WasteEvent[],
    inventory: Ingredient[]
): Promise<Omit<ShoppingListItem, 'id' | 'checked'>[]> {
   // Load the list of ingredients the model knows about
    const trainingColumns = JSON.parse(localStorage.getItem(MODEL_COLUMNS_KEY) || '[]');
    if (trainingColumns.length === 0) {
        console.error("Could not find the list of ingredients the model was trained on.");
        return [];
    }

    // Prepare prediction data using ONLY the ingredients the model was trained on
    const { features, ingredientsToPredict } = prepareDataForPrediction(consumptionLog, wasteLog, trainingColumns);
     
    if (features.size === 0) return [];

    const predictionsTensor = model.predict(features) as tf.Tensor;
    const predictionData = await predictionsTensor.data();
    tf.dispose(predictionsTensor);

    const suggestions: Omit<ShoppingListItem, 'id' | 'checked'>[] = [];
    
    for (let i = 0; i < ingredientsToPredict.length; i++) {
        const ingredientName = ingredientsToPredict[i];
        const predictedWeeklyConsumption = predictionData[i];
        
        const inventoryItem = inventory.find(item => item.name === ingredientName);
        const currentStock = inventoryItem ? inventoryItem.quantity : 0;

        // Only suggest if predicted need is higher than current stock
        if (predictedWeeklyConsumption > currentStock) {
            const purchaseQuantity = Math.ceil(predictedWeeklyConsumption); // Round up to nearest whole number
            const dbItem = indianIngredientsDatabase.find(item => item.name === ingredientName);

            if (purchaseQuantity > 0 && dbItem) {
                suggestions.push({
                    name: ingredientName,
                    category: dbItem.category,
                    quantity: purchaseQuantity,
                    unit: dbItem.unit,
                });
            }
        }
    }
    return suggestions;
}


// #################################################################
// ## SECTION 3: DATA PREPARATION ##
// #################################################################

/**
 * Converts raw logs into numerical tensors for TRAINING.
 */
function prepareData(consumptionLog: ConsumptionEvent[], wasteLog: WasteEvent[]) {
    const fourWeeksAgo = subWeeks(new Date(), 4);
    const now = new Date();
    const dateRange = { start: fourWeeksAgo, end: now };
    const recentConsumption = consumptionLog.filter(e => isWithinInterval(new Date(e.timestamp), dateRange));
    
    const features: number[][] = [];
    const labels: number[] = [];
    const uniqueIngredients = [...new Set(recentConsumption.map(e => e.ingredientName))];
    const ingredientMap = new Map(uniqueIngredients.map((name, i) => [name, i]));

    uniqueIngredients.forEach(name => {
        const consumptionEvents = recentConsumption.filter(e => e.ingredientName === name);
        if (consumptionEvents.length === 0) return;

        const totalConsumption = consumptionEvents.reduce((sum, e) => sum + e.quantityConsumed, 0);
        const avgWeeklyConsumption = totalConsumption / 4;

        const wasteEvents = wasteLog.filter(e => e.ingredientName === name && isWithinInterval(new Date(e.timestamp), dateRange));
        const totalWasted = wasteEvents.reduce((sum, e) => sum + e.quantityWasted, 0);

        // Calculate wastage rate to avoid division by zero
        const totalAvailable = totalConsumption + totalWasted;
        const wastageRate = totalAvailable > 0 ? totalWasted / totalAvailable : 0;
        
        const oneHotIngredient = Array(uniqueIngredients.length).fill(0);
        oneHotIngredient[ingredientMap.get(name)!] = 1;

        const numericalFeatures = [avgWeeklyConsumption, wastageRate];
        features.push([...oneHotIngredient, ...numericalFeatures]);
        labels.push(avgWeeklyConsumption);
    });

    return {
        features: tf.tensor2d(features),
        labels: tf.tensor1d(labels),
        uniqueIngredients, // Return the list of ingredients used for training
    };
}

/**
 * Converts raw logs into numerical tensors for PREDICTION.
 */
function prepareDataForPrediction(consumptionLog: ConsumptionEvent[], wasteLog: WasteEvent[], trainingColumns: string[]) {
  const ingredientMap = new Map(trainingColumns.map((name, i) => [name, i]));
    const fourWeeksAgo = subWeeks(new Date(), 4);
    const now = new Date();
    const dateRange = { start: fourWeeksAgo, end: now };

    const features = trainingColumns.map(name => {
        const consumptionEvents = consumptionLog.filter(e => 
            e.ingredientName === name && isWithinInterval(new Date(e.timestamp), dateRange)
        );

        const totalConsumption = consumptionEvents.reduce((sum, e) => sum + e.quantityConsumed, 0);
        const avgWeeklyConsumption = totalConsumption / 4;

        const wasteEvents = wasteLog.filter(e => e.ingredientName === name && isWithinInterval(new Date(e.timestamp), dateRange));
        const totalWasted = wasteEvents.reduce((sum, e) => sum + e.quantityWasted, 0);

        // Calculate wastage rate to avoid division by zero
        const totalAvailable = totalConsumption + totalWasted;
        const wastageRate = totalAvailable > 0 ? totalWasted / totalAvailable : 0;

        
        const oneHotIngredient = Array(trainingColumns.length).fill(0);
        oneHotIngredient[ingredientMap.get(name)!] = 1;

        const numericalFeatures = [avgWeeklyConsumption, wastageRate];

        return [...oneHotIngredient, ...numericalFeatures];
    });

    return {
        features: tf.tensor2d(features),
        ingredientsToPredict: trainingColumns,
    };
}