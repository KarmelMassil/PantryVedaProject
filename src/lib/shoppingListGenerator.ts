import { Ingredient, Recipe } from "@/types";
import { MealPlan, ShoppingListItem } from "@/store/pantryStore";
import { eachDayOfInterval, isWithinInterval } from "date-fns";
import { indianIngredientsDatabase } from "@/data/ingredients";

type ShoppingSuggestion = Omit<ShoppingListItem, 'id' | 'checked'>;

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

export const generateFromMealPlan = (
  mealPlan: MealPlan, 
  recipes: Recipe[], 
  inventory: Ingredient[],
  startDate: Date,
  endDate: Date
): ShoppingSuggestion[] => {
  const requiredIngredients = new Map<string, { quantity: number; unit: Ingredient['unit']; category: Ingredient['category'] }>();
  
  const weekDates = eachDayOfInterval({ start: startDate, end: endDate });

  weekDates.forEach(date => {
    const dateKey = date.toISOString().split('T')[0];
    const dayPlan = mealPlan[dateKey];
    if (!dayPlan) return;

    const recipeIds = Object.values(dayPlan).filter(id => id !== null) as string[];
    
    recipeIds.forEach(id => {
      const recipe = recipes.find(r => r.id === id);
      if (!recipe) return;

      recipe.ingredients.forEach(req => {
        const key = req.name.toLowerCase();
        const existing = requiredIngredients.get(key);
        if (existing) {
          existing.quantity += req.quantity;
        } else {
          requiredIngredients.set(key, {
            quantity: req.quantity,
            unit: req.unit,
            category: findCategory(req.name) || 'Other',
          });
        }
      });
    });
  });

  const inventoryMap = new Map<string, number>(inventory.map(item => [item.name.toLowerCase(), item.quantity]));
  const missingItems: ShoppingSuggestion[] = [];

  requiredIngredients.forEach((req, name) => {
    const availableQty = inventoryMap.get(name) || 0;
    if (availableQty < req.quantity) {
      const originalName = indianIngredientsDatabase.find(i => i.name.toLowerCase() === name)?.name || name;
      missingItems.push({
        name: originalName,
        category: req.category,
        quantity: req.quantity - availableQty,
        unit: req.unit,
      });
    }
  });

  return missingItems;
};


export const generateLowStockSuggestions = (inventory: Ingredient[]): ShoppingSuggestion[] => {
  const stapleThresholds: Record<string, number> = {
    'Onion': 0.5, 'Tomato': 0.5, 'Ginger': 50, 'Garlic': 50, 'Basmati Rice': 1, 'Milk': 1,
  };
  
  const suggestions: ShoppingSuggestion[] = [];

  inventory.forEach(item => {
    const threshold = stapleThresholds[item.name];
    if (threshold && item.quantity < threshold) {
      suggestions.push({
        name: item.name,
        category: item.category,
        quantity: (threshold * 2) - item.quantity,
        unit: item.unit,
      });
    }
  });
  
  return suggestions;
};

const ingredientCategoryMap = new Map(indianIngredientsDatabase.map(i => [i.name, i.category]));
export const findCategory = (name: string) => ingredientCategoryMap.get(name);