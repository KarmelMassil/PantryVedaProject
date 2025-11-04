import { Ingredient, Recipe } from "@/types";
import { MealPlan } from "@/store/pantryStore";
import { getRecipeMatches } from "./recipeMatcher";

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
    const recipeIds = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner].filter(Boolean);
    
    for (const id of recipeIds) {
      const recipe = recipes.find(r => r.id === id);
      if (!recipe) continue;

      for (const req of recipe.ingredients) {
        if (inventoryMap.has(req.name)) {
          const item = inventoryMap.get(req.name)!;
          item.quantity = Math.max(0, item.quantity - req.quantity);
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