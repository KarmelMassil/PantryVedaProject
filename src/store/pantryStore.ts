import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ingredient, UserPreferences, Recipe } from '@/types';
import { indianRecipesDatabase } from '@/data/recipes';

interface PantryState {
  inventory: Ingredient[];
  preferences: UserPreferences;
  recipes: Recipe[];
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set) => ({
      inventory: [],
      preferences: {
        familySize: 2,
        favoriteCuisines: ['North Indian', 'South Indian'],
        spiceLevels: ['mild', 'medium'],
        dietaryRestrictions: ['veg'],
        cookingSkill: 'intermediate',
      },
      recipes: indianRecipesDatabase,
      
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
    }),
    {
      name: 'pantryveda-storage',
    }
  )
);