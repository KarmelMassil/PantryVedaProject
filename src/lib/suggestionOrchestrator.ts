import { MasterIngredient, MealPlan, ShoppingListItem } from "@/store/pantryStore";
import { ConsumptionEvent, Ingredient, WasteEvent, Recipe } from "@/types";
import { generateHeuristicSuggestions } from "./suggestionEngine";
import { trainAndSuggest, generateMlSuggestions, hasTrainedModel } from "./mlService";
import { addDays, format } from "date-fns";
import { scaleRecipeIngredients } from "./recipeUtils";
import { convertUnit } from "./unitConverter";

// The minimum number of consumption events required to trigger the first training
const MIN_DATA_POINTS_FOR_TRAINING = 10;
// A reusable type for our suggestions
type Suggestion = Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'>;

// -- Helper function --
function calculateMealPlanDemand(mealPlan: MealPlan, recipes: Recipe[], masterIngredientList: MasterIngredient[]): Map<string, { quantity: number, unit: string }> {
    const demand = new Map<string, { quantity: number, unit: string }>();
    const today = new Date();

    for (let i = 0; i < 7; i++) { // Look at the next 7 days
        const dateStr = format(addDays(today, i), 'yyyy-MM-dd');
        const dayPlan = mealPlan[dateStr];
        if (!dayPlan) continue;

        const meals = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner];
        for (const meal of meals) {
            if (!meal || !meal.recipeId) continue;

            const recipe = recipes.find(r => r.id === meal.recipeId);
            if (!recipe) continue;

            const scaledRecipe = scaleRecipeIngredients(recipe, meal.servings);

            for (const ingredient of scaledRecipe.ingredients) {
                const masterIngredient = masterIngredientList.find(mi => mi.name.toLowerCase() === ingredient.name.toLowerCase());
                if (!masterIngredient) continue;

                // Standardize to base unit
                const baseUnit = masterIngredient.unit;
                let convertedQuantity = ingredient.quantity;

                if (ingredient.unit !== baseUnit) {
                    const converted = convertUnit(ingredient.quantity, ingredient.unit as any, baseUnit as any, ingredient.name);
                    if (converted !== null) {
                        convertedQuantity = converted;
                    } else {
                        console.warn(`Could not convert ${ingredient.name} from ${ingredient.unit} to ${baseUnit}`);
                        continue; // Skip if conversion fails
                    }
                }

                const existing = demand.get(ingredient.name) || { quantity: 0, unit: baseUnit };
                demand.set(ingredient.name, {
                    quantity: existing.quantity + convertedQuantity,
                    unit: baseUnit
                });
            }
        }
    }
    return demand;
}

/**
 * Main function to generate smart shopping suggestions.
 */
export async function getSmartSuggestions(
    inventory: Ingredient[],
    consumptionLog: ConsumptionEvent[],
    wasteLog: WasteEvent[],
    mealPlan: MealPlan,
    recipes: Recipe[],
    masterIngredientList: MasterIngredient[],
    shoppingList: ShoppingListItem[]
) {
    const isModelAlreadyTrained = await hasTrainedModel();
    const hasEnoughData = consumptionLog.length >= MIN_DATA_POINTS_FOR_TRAINING;

    let historicalSuggestions: any[] = [];
    let shouldRetrain = false;

    if (isModelAlreadyTrained) {
        const lastTrained = localStorage.getItem('lastTrainedTimestamp');
        if (lastTrained) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            // If last training was more than 7 days ago, retrain
            if (new Date(lastTrained) < sevenDaysAgo) {
                shouldRetrain = true;
                console.log("Model is over a week old. Retraining...");
            }
        }
    }

    if (isModelAlreadyTrained && !shouldRetrain) {
        console.log("Using pre-trained ML model for predictions.");
        historicalSuggestions = await generateMlSuggestions(consumptionLog, wasteLog, inventory, masterIngredientList);
    } 
    else if (hasEnoughData) {
        console.log("Sufficient data found. Training a new ML model for the first time...");
        historicalSuggestions = await trainAndSuggest(consumptionLog, wasteLog, inventory, masterIngredientList);
    }
    else {
        console.log("Not enough data for ML. Using heuristic model.");
        historicalSuggestions = generateHeuristicSuggestions(inventory, consumptionLog, masterIngredientList);
    }

    // --- Merge with Meal Plan Demand ---
    const mealPlanDemand = calculateMealPlanDemand(mealPlan, recipes, masterIngredientList);
    const idealQuantities = new Map<string, Suggestion & { reason: string, priority: 'high' | 'medium' | 'low' }>();

    //  Add historical suggestions first
    historicalSuggestions.forEach(s => {
        idealQuantities.set(s.name, {
            ...s,
            reason: s.reason || "Based on consumption history",
            priority: s.priority || 'low',
        });
    });

    //  Add or update with meal plan demand
    mealPlanDemand.forEach((demand, name) => {
        const existingSuggestion = idealQuantities.get(name)
        const inventoryItem = inventory.find(i => i.name === name);
        const currentStock = inventoryItem ? inventoryItem.quantity : 0;
        const neededForRecipes = Math.max(0, demand.quantity - currentStock);

        if (neededForRecipes > (existingSuggestion?.quantity ?? 0)) {
            const dbItem = masterIngredientList.find(i => i.name.toLowerCase() === name.toLowerCase());
            idealQuantities.set(name, {
                name: name,
                quantity: Math.ceil(neededForRecipes),
                unit: dbItem?.unit || 'pcs',
                reason: existingSuggestion
                    ? "Increased quantity for meal plan"
                    : "Required for your planned meals",
                priority: 'high',
                category: dbItem?.category || "Other",
                defaultExpiryDays: dbItem?.defaultExpiryDays || 14,
            });
        }
    });

    // --- Compare with current shopping list and generate final suggestions ---
    const finalSuggestions: (Suggestion & { reason: string, priority: 'high' | 'medium' | 'low' })[] = [];

    idealQuantities.forEach((idealItem, name) => {
        const shoppingListItem = shoppingList.find(item => item.name === name);
        const currentQuantity = shoppingListItem ? shoppingListItem.quantity : 0;

        // Only create a suggestion if the ideal quantity is different from the current quantity
        if (idealItem.quantity !== currentQuantity) {
            finalSuggestions.push(idealItem);
        }
    });

    // Also check for items on the shopping list that are NOT in the ideal plan (suggest removal/reduction)
    shoppingList.forEach(shoppingListItem => {
        if (!idealQuantities.has(shoppingListItem.name)) {
            // If the ideal quantity is 0, but it's on the list, suggest reducing to 0
            const existingSuggestion = finalSuggestions.find(s => s.name === shoppingListItem.name);
            if (!existingSuggestion) {
                 finalSuggestions.push({
                    ...shoppingListItem,
                    quantity: 0,
                    reason: "Not required based on current habits and plans",
                    priority: 'low',
                });
            }
        }
    });


    return finalSuggestions;
}
