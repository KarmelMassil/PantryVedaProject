import { MasterIngredient, MealPlan, ShoppingListItem } from "@/store/pantryStore";
import { ConsumptionEvent, Ingredient, WasteEvent, Recipe } from "@/types";
import { generateHeuristicSuggestions } from "./suggestionEngine";
import { trainAndSuggest, generateMlSuggestions, hasTrainedModel } from "./mlService";
import { addDays, format } from "date-fns";

// The minimum number of consumption events required to trigger the first training
const MIN_DATA_POINTS_FOR_TRAINING = 10;
// A reusable type for our suggestions
type Suggestion = Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'>;

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
    recipes: Recipe[],
    masterIngredientList: MasterIngredient[]
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
    const mealPlanDemand = calculateMealPlanDemand(mealPlan, recipes);
    const finalSuggestions = new Map<string, Suggestion & { reason: string, priority: 'high' | 'medium' | 'low' }>();

    //  Add historical suggestions first
    historicalSuggestions.forEach(s => {
        finalSuggestions.set(s.name, {
            ...s,
            reason: s.priority || "Based on consumption history",
            priority: s.priority || 'Low',
        });
    });

    //  Add or update with meal plan demand
    mealPlanDemand.forEach((demand, name) => {
        const existingSuggestion = finalSuggestions.get(name)
        const inventoryItem = inventory.find(i => i.name === name);
        const currentStock = inventoryItem ? inventoryItem.quantity : 0;
        const neededForRecipes = Math.max(0, demand.quantity - currentStock);

        if (neededForRecipes > (existingSuggestion?.quantity ?? 0)) {
            const dbItem = masterIngredientList.find(i => i.name.toLowerCase() === name.toLowerCase());
            finalSuggestions.set(name, {
                name: name,
                quantity: Math.ceil(neededForRecipes),
                unit: dbItem?.unit || 'pcs',
                reason: existingSuggestion
                    ? "Needed for upcoming meals"
                    : "Required for your planned meals",
                priority: 'high',
                category: dbItem?.category || "Other",
                defaultExpiryDays: dbItem?.defaultExpiryDays || 14,
            });
        }
    });

    return Array.from(finalSuggestions.values());
}
