// src/lib/recipeUtils.ts
import { Recipe } from '@/types';

/**
 * Scales the ingredients of a recipe based on the desired number of servings.
 * @param recipe The original recipe object.
 * @param desiredServings The target number of servings.
 * @returns A new recipe object with ingredient quantities adjusted for the desired servings.
 */
export function scaleRecipeIngredients(recipe: Recipe, desiredServings: number): Recipe {
  if (!recipe || desiredServings <= 0 || !recipe.baseServings || recipe.baseServings <= 0) {
    return recipe; // Return original recipe if input is invalid
  }

  const scalingFactor = desiredServings / recipe.baseServings;

  const scaledIngredients = recipe.ingredients.map(ingredient => ({
    ...ingredient,
    quantity: ingredient.quantity * scalingFactor,
  }));

  return {
    ...recipe,
    ingredients: scaledIngredients,
  };
}
