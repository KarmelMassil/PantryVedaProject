import { Recipe, Ingredient, UserPreferences } from '@/types';
import { differenceInDays } from 'date-fns';

export interface MatchedRecipe extends Recipe {
  matchPercentage: number;
  missingIngredients: string[];
  expiringSoon: boolean;
  preferenceScore: number;
  finalScore: number;
}

export const getRecipeMatches = (
  inventory: Ingredient[],
  recipes: Recipe[],
  preferences: UserPreferences
): MatchedRecipe[] => {
  const inventoryMap = new Map<string, number>(
    inventory.map((item) => [item.name.toLowerCase(), item.quantity])
  );

  const matchedRecipes = recipes.map((recipe) => {
    let availableCount = 0;
    const missingIngredients: string[] = [];
    let usesExpiringIngredient = false;
    
    recipe.ingredients.forEach((req) => {
      const inventoryQty = inventoryMap.get(req.name.toLowerCase()) || 0;
      if (inventoryQty >= req.quantity) {
        availableCount++;
      } else {
        missingIngredients.push(req.name);
      }
    });

    inventory.forEach(item => {
        const isUsed = recipe.ingredients.some(req => req.name.toLowerCase() === item.name.toLowerCase());
        const daysToExpire = differenceInDays(new Date(item.expiryDate), new Date());
        if (isUsed && daysToExpire <= 3 && daysToExpire >= 0) {
            usesExpiringIngredient = true;
        }
    });

    const matchPercentage = Math.round((availableCount / recipe.ingredients.length) * 100);

    let preferenceScore = 0;
    if (preferences.favoriteCuisines.includes(recipe.cuisine)) preferenceScore += 20;
    if (preferences.spiceLevels.includes(recipe.spiceLevel)) preferenceScore += 10;
    if (recipe.difficulty === preferences.cookingSkill) preferenceScore += 15;
    
    let finalScore = matchPercentage + preferenceScore;
    if (usesExpiringIngredient) {
      finalScore += 50;
    }

    return {
      ...recipe,
      matchPercentage,
      missingIngredients,
      expiringSoon: usesExpiringIngredient,
      preferenceScore,
      finalScore
    };
  });

  return matchedRecipes.sort((a, b) => b.finalScore - a.finalScore);
};