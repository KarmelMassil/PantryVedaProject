import { Ingredient, Recipe } from "@/types";
import { MealPlan } from "@/store/pantryStore";
import { getRecipeMatches } from "./recipeMatcher";
import { scaleRecipeIngredients } from "./recipeUtils";
import { convertUnit } from "./unitConverter";

/**
 * Calculates a "projected" inventory by simulating the consumption
 * of all planned meals up to a specific date.
 */
export function getProjectedInventory(
  inventory: Ingredient[],
  mealPlan: MealPlan,
  recipes: Recipe[],
  upToDate: Date
): Ingredient[] {
  // Create a deep copy of the inventory to simulate with
  let projectedInventory = JSON.parse(JSON.stringify(inventory));
  const inventoryMap = new Map<string, Ingredient>(projectedInventory.map((item: Ingredient) => [item.name, item]));

  const datesToSimulate = Object.keys(mealPlan).filter(dateStr => new Date(dateStr) < upToDate);
  datesToSimulate.sort();

  for (const dateStr of datesToSimulate) {
    const dayPlan = mealPlan[dateStr];
    if (!dayPlan) continue;
    
    const meals = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner];
    for (const meal of meals) {
        if (!meal || !meal.recipeId) continue;

        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (!recipe) continue;

        const scaledRecipe = scaleRecipeIngredients(recipe, meal.servings);

        for (const req of scaledRecipe.ingredients) {
            if (inventoryMap.has(req.name)) {
                const item = inventoryMap.get(req.name)!;

                let quantityToDeduct = req.quantity;
                if (req.unit !== item.unit) {
                    const converted = convertUnit(req.quantity, req.unit as any, item.unit as any, req.name);
                    if (converted !== null) {
                        quantityToDeduct = converted;
                    } else {
                        console.warn(`Could not convert for projection: ${req.name} from ${req.unit} to ${item.unit}`);
                        continue;
                    }
                }
                item.quantity = Math.max(0, item.quantity - quantityToDeduct);
            }
        }
    }
  }
  return Array.from(inventoryMap.values());
}

/**
 * Gets the single best recipe suggestion for a given inventory.
 */
export function getBestSuggestion(projectedInventory: Ingredient[], recipes: Recipe[], preferences: any) {
    const matches = getRecipeMatches(projectedInventory, recipes, preferences);
    // Prioritize high-match, expiring-soon items
    const bestMatch = matches.find(m => m.matchPercentage >= 90 && m.expiringSoon) || matches[0];
    return bestMatch;
}