import { Ingredient } from "@/types";
import { differenceInDays, parseISO } from "date-fns";
import { MatchedRecipe, getRecipeMatches } from "./recipeMatcher";
import { usePantryStore } from "@/store/pantryStore";

export const getDashboardStats = (inventory: Ingredient[]) => {
  const expiringSoon = inventory.filter(item => {
    const days = differenceInDays(new Date(item.expiryDate), new Date());
    return days >= 0 && days <= 3;
  });

  const fresh = inventory.filter(item => differenceInDays(new Date(item.expiryDate), new Date()) > 3);
  
  const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);

  return {
    totalItems: inventory.length,
    expiringSoonCount: expiringSoon.length,
    freshItemsCount: fresh.length,
    totalValue,
  };
};

export const getExpiringSoonItems = (inventory: Ingredient[], limit: number = 3) => {
  return inventory
    .filter(item => {
      const days = differenceInDays(new Date(item.expiryDate), new Date());
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, limit);
};

export const getRecentlyAddedItems = (inventory: Ingredient[], limit: number = 3) => {
  return inventory
    .sort((a, b) => parseISO(b.purchaseDate).getTime() - parseISO(a.purchaseDate).getTime())
    .slice(0, limit);
};

export const getRecommendedRecipes = (): MatchedRecipe[] => {
  const { inventory, recipes, preferences } = usePantryStore.getState();
  const allMatches = getRecipeMatches(inventory, recipes, preferences);

  const recommended = allMatches
    .filter(recipe => recipe.expiringSoon) 
    .sort((a, b) => b.matchPercentage - a.matchPercentage) 
    .slice(0, 3);

  return recommended;
};