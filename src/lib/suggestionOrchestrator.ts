import { MealPlan } from "@/store/pantryStore";
import { ConsumptionEvent, Ingredient, WasteEvent, Recipe } from "@/types";
import { generateHeuristicSuggestions } from "./suggestionEngine";
import { trainAndSuggest, generateMlSuggestions, hasTrainedModel } from "./mlService";
import { addDays, format } from "date-fns";

// The minimum number of consumption events required to trigger the first training
const MIN_DATA_POINTS_FOR_TRAINING = 10;

// -- Helper function --
function calculateMealPlanDemand(mealPlan: MealPlan, recipes: Recipe[]): Map<string, { quantity: number, unit: string }> {
    const demand = new Map<string, { quantity: number, unit: string }>();
    const today = new Date();

    for (let i = 0; i < 7; i++) { // Look at the next 7 days
        const dateStr = format(addDays(today, i), 'yyyy-MM-dd');
        const dayPlan = mealPlan[dateStr];
        if (!dayPlan) continue;

        const recipeIds = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner].filter(Boolean);
        for (const id of recipeIds) {
            const recipe = recipes.find(r => r.id === id);
            if (!recipe) continue;

            for (const ingredient of recipe.ingredients) {
                const existing = demand.get(ingredient.name) || { quantity: 0, unit: ingredient.unit };
                demand.set(ingredient.name, {
                    quantity: existing.quantity + ingredient.quantity,
                    unit: ingredient.unit
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
    recipes: Recipe[]
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
        historicalSuggestions = await generateMlSuggestions(consumptionLog, wasteLog, inventory);
    } 
    else if (hasEnoughData) {
        console.log("Sufficient data found. Training a new ML model for the first time...");
        historicalSuggestions = await trainAndSuggest(consumptionLog, wasteLog, inventory);
    }
    else {
        console.log("Not enough data for ML. Using heuristic model.");
        historicalSuggestions = generateHeuristicSuggestions(inventory, consumptionLog);
    }

    // --- Merge with Meal Plan Demand ---
    const mealPlanDemand = calculateMealPlanDemand(mealPlan, recipes);
    const finalSuggestions = new Map<string, any>();

    //  Add historical suggestions first
    historicalSuggestions.forEach(s => {
        finalSuggestions.set(s.name, {
            ...s,
            reason: s.priority || "Based on consumption history",
            priority: s.priority || 'Low',
            category: s.category || inventory.find(i => i.name === s.name)?.category || "Other"
        });
    });

    //  Add or update with meal plan demand
    mealPlanDemand.forEach((demand, name) => {
        const existingSuggestion = finalSuggestions.get(name) || { quantity: 0, priority: 0 };
        const inventoryItem = inventory.find(i => i.name === name);
        const currentStock = inventoryItem ? inventoryItem.quantity : 0;
        const neededForRecipes = Math.max(0, demand.quantity - currentStock);

        if (neededForRecipes > existingSuggestion.quantity) {
            finalSuggestions.set(name, {
                name: name,
                quantity: Math.ceil(neededForRecipes),
                unit: inventoryItem?.unit || demand.unit,
                reason: existingSuggestion.reason
                    ? existingSuggestion.reason + " & Required for upcoming meals"
                    : "Required for upcoming meals",
                priority: 'high',
                category: inventoryItem?.category || "Other"
            });
        }
    });

    return Array.from(finalSuggestions.values());
}
