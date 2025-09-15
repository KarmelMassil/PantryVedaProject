import { Ingredient, Recipe } from "@/types";
import { ShoppingListItem } from "@/store/pantryStore";

type ShoppingSuggestion = Omit<ShoppingListItem, 'id' | 'checked'>;

/**
 * Generates a list of missing ingredients for a single recipe.
 * It calculates the difference between required quantity and pantry quantity.
 */
export const generateFromRecipe = (recipe: Recipe, inventory: Ingredient[]): ShoppingSuggestion[] => {
  const inventoryMap = new Map<string, number>(
    inventory.map(item => [item.name.toLowerCase(), item.quantity])
  );

  const missingItems: ShoppingSuggestion[] = [];

  recipe.ingredients.forEach(req => {
    const availableQty = inventoryMap.get(req.name.toLowerCase()) || 0;
    if (availableQty < req.quantity) {
      missingItems.push({
        name: req.name,
        category: findCategory(req.name) || 'Other',
        quantity: req.quantity - availableQty,
        unit: req.unit,
      });
    }
  });

  return missingItems;
};

/**
 * ML Simulation: Identifies items that are running low based on predefined thresholds.
 * In a real app, these thresholds would be learned from user consumption patterns.
 */
export const generateLowStockSuggestions = (inventory: Ingredient[]): ShoppingSuggestion[] => {
  // SIMULATION: Define staples and their minimum stock levels.
  const stapleThresholds: Record<string, number> = {
    'Onion': 0.5, // kg
    'Tomato': 0.5, // kg
    'Ginger': 50,  // g
    'Garlic': 50,  // g
    'Basmati Rice': 1, // kg
    'Milk': 1, // l
  };
  
  const suggestions: ShoppingSuggestion[] = [];

  inventory.forEach(item => {
    const threshold = stapleThresholds[item.name];
    if (threshold && item.quantity < threshold) {
      suggestions.push({
        name: item.name,
        category: item.category,
        quantity: (threshold * 2) - item.quantity, // Suggest buying enough to restock
        unit: item.unit,
      });
    }
  });
  
  return suggestions;
};


// Helper to find an ingredient's category from its name (useful for manual adds)
import { indianIngredientsDatabase } from "@/data/ingredients";
const ingredientCategoryMap = new Map(indianIngredientsDatabase.map(i => [i.name, i.category]));

export const findCategory = (name: string) => ingredientCategoryMap.get(name);