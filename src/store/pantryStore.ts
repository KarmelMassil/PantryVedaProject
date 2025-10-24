import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indianRecipesDatabase } from '@/data/recipes';
import { Recipe, Ingredient, UserPreferences, ConsumptionEvent, WasteEvent } from '@/types';
import { indianIngredientsDatabase as initialMasterList } from '@/data/ingredients';
import { formatISO, addDays } from 'date-fns';
import { typicalShelfLife } from '@/lib/dateUtils';

export interface MasterIngredient {
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Spices' | 'Grains' | 'Dairy' | 'Meats' | 'Herbs' | 'Other';
  defaultExpiryDays: number;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'bunches';
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: MasterIngredient['category'];
  quantity: number;
  unit: MasterIngredient['unit'];
  checked: boolean;
  price: number;
  expiryDate: string;
  defaultExpiryDays: number;
  reason?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface DayPlan {
  breakfast: string | null; // We will store recipe IDs
  lunch: string | null;
  dinner: string | null;
}

// Define the main meal plan structure
export type MealPlan = Record<string, DayPlan>; // Key is ISO date string 'YYYY-MM-DD'


interface PantryState {
  masterIngredientList: MasterIngredient[];
  inventory: Ingredient[];
  preferences: UserPreferences;
  recipes: Recipe[];
  shoppingList: ShoppingListItem[];
  mealPlan: MealPlan; 
  consumptionLog: ConsumptionEvent[];
  wasteLog: WasteEvent[];
  addMasterIngredient: (ingredient: MasterIngredient) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  addItemsToShoppingList: (items: Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'>[]) => void;
  updateShoppingListItem: (id: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingListItem: (id: string) => void;
  clearShoppingList: () => void;
  assignRecipeToMeal: (date: string, meal: keyof DayPlan, recipeId: string) => void;
  removeRecipeFromMeal: (date: string, meal: keyof DayPlan) => void;
  logConsumption: (events: ConsumptionEvent[]) => void;
  logWaste: (event: WasteEvent) => void;
  deductFromInventory: (name: string, quantity: number) => void;
  restockCheckedItems: () => void;
  addRecipe: (recipe: Recipe) => void;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set, get) => ({
      masterIngredientList: initialMasterList.map(item => ({...item, defaultExpiryDays: typicalShelfLife[item.category] || 14 })), // Initialize the list
      inventory: [],
      preferences: {
        familySize: 2,
        favoriteCuisines: ['North Indian', 'South Indian'],
        spiceLevels: ['mild', 'medium'],
        dietaryRestrictions: ['veg'],
        cookingSkill: 'intermediate',
      },
      recipes: indianRecipesDatabase,
      shoppingList: [],
      mealPlan: {},
      consumptionLog: [],
      wasteLog: [],

      addMasterIngredient: (ingredient) =>
        set((state) => ({
          masterIngredientList: [...state.masterIngredientList, ingredient],
        })),
      
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
          } else if (existingItemIndex === -1) {
            // If item doesn't exist, add it with additional fields
            const purchaseDate = new Date();
            updatedList.push({
                ...newItem,
                id: crypto.randomUUID(),
                checked: false,
                price: 0,
                expiryDate: formatISO(addDays(purchaseDate, newItem.defaultExpiryDays || 14)),
            });
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
        logConsumption: (events) =>
        set((state) => ({
          consumptionLog: [...state.consumptionLog, ...events],
        })),

      logWaste: (event) =>
        set((state) => ({
          wasteLog: [...state.wasteLog, event],
        })),

      deductFromInventory: (name, quantity) => {
        const { inventory } = get();
        const updatedInventory = inventory.map(item => {
          if (item.name.toLowerCase() === name.toLowerCase()) {
            return { ...item, quantity: Math.max(0, item.quantity - quantity) };
          }
          return item;
        }).filter(item => item.quantity > 0); // Remove if quantity is zero
        
        set({ inventory: updatedInventory });
      },

      restockCheckedItems: () =>
        set((state) => {
            const itemsToRestock = state.shoppingList.filter(item => item.checked);
            if (itemsToRestock.length === 0) return state; // Do nothing if no items are checked
            // Create new inventory items from the shopping list items
            const newInventoryItems: Omit<Ingredient, 'id'>[] = itemsToRestock.map(item => ({
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                purchaseDate: new Date().toISOString(),
                expiryDate: item.expiryDate,
                value: item.price,
            }));
            // Add the new items to the inventory
            const updatedInventory = [...state.inventory];
            newInventoryItems.forEach(newItem => {
                const existingIndex = updatedInventory.findIndex(inv => inv.name === newItem.name);
                if (existingIndex > -1) {
                    // If item exists, add to quantity
                    updatedInventory[existingIndex].quantity += newItem.quantity;
                } else {
                    // Otherwise, add as a new item
                    updatedInventory.push({ ...newItem, id: crypto.randomUUID() });
                }
            });
            // Remove the checked items from the shopping list
            const updatedShoppingList = state.shoppingList.filter(item => !item.checked);
            return {
                inventory: updatedInventory,
                shoppingList: updatedShoppingList,
            };
          }),

      addRecipe: (recipe) =>
        set((state) => ({
          recipes: [...state.recipes, recipe],
        })),
    }),
    {
      name: 'pantryveda-storage',
    }
  )
);