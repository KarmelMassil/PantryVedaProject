import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indianRecipesDatabase } from '@/data/recipes';
import { Recipe, Ingredient, UserPreferences } from '@/types';

// Add this new type for our shopping list items
export interface ShoppingListItem {
  id: string;
  name: string;
  category: Ingredient['category'];
  quantity: number;
  unit: Ingredient['unit'];
  checked: boolean;
}

export interface DayPlan {
  breakfast: string | null; // We will store recipe IDs
  lunch: string | null;
  dinner: string | null;
}

// Define the main meal plan structure
export type MealPlan = Record<string, DayPlan>; // Key is ISO date string 'YYYY-MM-DD'


interface PantryState {
  inventory: Ingredient[];
  preferences: UserPreferences;
  recipes: Recipe[];
  shoppingList: ShoppingListItem[]; // New state
  mealPlan: MealPlan; // New state
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  // --- New Actions for Shopping List ---
  addItemsToShoppingList: (items: Omit<ShoppingListItem, 'id' | 'checked'>[]) => void;
  updateShoppingListItem: (id: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingListItem: (id: string) => void;
  clearShoppingList: () => void;
  assignRecipeToMeal: (date: string, meal: keyof DayPlan, recipeId: string) => void;
  removeRecipeFromMeal: (date: string, meal: keyof DayPlan) => void;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set, get) => ({ // Add 'get' to access current state
      inventory: [],
      preferences: {
        familySize: 2,
        favoriteCuisines: ['North Indian', 'South Indian'],
        spiceLevels: ['mild', 'medium'],
        dietaryRestrictions: ['veg'],
        cookingSkill: 'intermediate',
      },
      recipes: indianRecipesDatabase,
      shoppingList: [], // Initialize empty shopping list
      mealPlan: {}, // Initialize empty meal plan
      
      addIngredient: (ingredient) =>
        set((state) => ({
          inventory: [...state.inventory, { ...ingredient, id: crypto.randomUUID() }],
        })),

      removeIngredient: (id) =>
        set((state) => ({
          inventory: state.inventory.filter((item) => item.id !== id),
        })),

      updateIngredient: (id, updates) =>
        set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
        
      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),
      
      // --- Implementation of New Actions ---
      addItemsToShoppingList: (itemsToAdd) => {
        const { shoppingList } = get();
        const updatedList = [...shoppingList];

        itemsToAdd.forEach(newItem => {
          const existingItemIndex = updatedList.findIndex(
            item => item.name.toLowerCase() === newItem.name.toLowerCase()
          );

          if (existingItemIndex > -1) {
            // If item exists, just add to its quantity
            updatedList[existingItemIndex].quantity += newItem.quantity;
          } else {
            // Otherwise, add the new item to the list
            updatedList.push({ ...newItem, id: crypto.randomUUID(), checked: false });
          }
        });
        
        set({ shoppingList: updatedList });
      },

      updateShoppingListItem: (id, updates) =>
        set((state) => ({
          shoppingList: state.shoppingList.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      removeShoppingListItem: (id) =>
        set((state) => ({
          shoppingList: state.shoppingList.filter((item) => item.id !== id),
        })),
        
      clearShoppingList: () => set({ shoppingList: [] }),

     // --- New Actions for Meal Plan ---
      assignRecipeToMeal: (date, meal, recipeId) =>
        set((state) => ({
          mealPlan: {
            ...state.mealPlan,
            [date]: {
              ...(state.mealPlan[date] || { breakfast: null, lunch: null, dinner: null }),
              [meal]: recipeId,
            },
          },
        })),

      removeRecipeFromMeal: (date, meal) =>
        set((state) => {
          const newMealPlan = { ...state.mealPlan };
          if (newMealPlan[date]) {
            newMealPlan[date][meal] = null;
          }
          return { mealPlan: newMealPlan };
        }),
    }),
    {
      name: 'pantryveda-storage',
    }
  )
);