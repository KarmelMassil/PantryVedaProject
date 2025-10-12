import { usePantryStore } from "@/store/pantryStore";
import { ConsumptionEvent, Ingredient, WasteEvent } from "@/types";
import { generateHeuristicSuggestions } from "./suggestionEngine";
import { trainAndSuggest, generateMlSuggestions, hasTrainedModel } from "./mlService";

// The minimum number of consumption events required to trigger the first training
const MIN_DATA_POINTS_FOR_TRAINING = 10;

/**
 * This is the main function that orchestrates the suggestion process.
 * It checks for data, trains the model if needed, and returns the best possible suggestions.
 */
export async function getSmartSuggestions(
    inventory: Ingredient[],
    consumptionLog: ConsumptionEvent[],
    wasteLog: WasteEvent[]
) {
    const isModelAlreadyTrained = await hasTrainedModel();
    const hasEnoughData = consumptionLog.length >= MIN_DATA_POINTS_FOR_TRAINING;

    if (isModelAlreadyTrained) {
        console.log("Using pre-trained ML model for predictions.");
        return await generateMlSuggestions(consumptionLog, wasteLog, inventory);
    } 
    
    if (hasEnoughData) {
        console.log("Sufficient data found. Training a new ML model for the first time...");
        // This function will train the model and then immediately use it for suggestions.
        return await trainAndSuggest(consumptionLog, wasteLog, inventory);
    }

    // If there's no model and not enough data, fall back to the simple heuristic.
    console.log("Not enough data for ML. Using heuristic model.");
    return generateHeuristicSuggestions(inventory, consumptionLog);
}