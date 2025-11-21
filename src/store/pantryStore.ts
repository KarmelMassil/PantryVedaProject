import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indianRecipesDatabase } from '@/data/recipes';
import { Recipe, Ingredient, UserPreferences, ConsumptionEvent, WasteEvent } from '@/types';
import { indianIngredientsDatabase as initialMasterList } from '@/data/ingredients';
import { formatISO, addDays } from 'date-fns';
import { typicalShelfLife } from '@/lib/dateUtils';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

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

export interface Meal {
  recipeId: string | null;
  servings: number;
}


export interface DayPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

// Define the main meal plan structure
export type MealPlan = Record<string, DayPlan>; // Key is ISO date string 'YYYY-MM-DD'

export interface WeeklySnapshot {
  date: string; // ISO date string 'YYYY-MM-DD'
  totalItems: number;
  totalValue: number;
  freshItems: number;
}

interface PantryState {
  masterIngredientList: MasterIngredient[];
  inventory: Ingredient[];
  preferences: UserPreferences;
  recipes: Recipe[];
  shoppingList: ShoppingListItem[];
  mealPlan: MealPlan; 
  consumptionLog: ConsumptionEvent[];
  wasteLog: WasteEvent[];
  weeklySnapshots: WeeklySnapshot[];
  toasts: Toast[];
  recipeIngredientFilter: string | null;
  addMasterIngredient: (ingredient: MasterIngredient) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  addItemsToShoppingList: (items: Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'>[]) => void;
  updateShoppingListItem: (id: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingListItem: (id: string) => void;
  clearShoppingList: () => void;
  assignRecipeToMeal: (date: string, meal: keyof DayPlan, recipeId: string, servings: number) => void;
  updateMealServings: (date: string, meal: keyof DayPlan, servings: number) => void;
  removeRecipeFromMeal: (date: string, meal: keyof DayPlan) => void;
  logConsumption: (events: ConsumptionEvent[]) => void;
  logWaste: (event: WasteEvent) => void;
  deductFromInventory: (name: string, quantity: number) => void;
  restockCheckedItems: () => void;
  addRecipe: (recipe: Recipe) => void;
  createWeeklySnapshot: () => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setRecipeIngredientFilter: (ingredientName: string | null) => void;
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
      weeklySnapshots: [],
      toasts: [],
      recipeIngredientFilter: null,

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
            const existingItem = updatedList[existingItemIndex];
            // If suggestion is for a meal and item exists, add to quantity
            if (newItem.reason?.toLowerCase().includes('meal')) {
              existingItem.quantity += newItem.quantity;
            } else {
              // Otherwise, just set the new quantity (for historical/waste suggestions)
              existingItem.quantity = newItem.quantity;
            }
             updatedList[existingItemIndex] = existingItem;
          } else {
            // If item doesn't exist, add it
            const purchaseDate = new Date();
            updatedList.push({
                ...newItem,
                id: crypto.randomUUID(),
                checked: false,
                price: 0, // Default price, can be edited
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

      assignRecipeToMeal: (date, meal, recipeId, servings) =>
        set(state => {
          const newMealPlan = { ...state.mealPlan };
          const day = newMealPlan[date] || {
            breakfast: { recipeId: null, servings: 2 },
            lunch: { recipeId: null, servings: 2 },
            dinner: { recipeId: null, servings: 2 },
          };
          day[meal] = { recipeId, servings };
          newMealPlan[date] = day;
          return { mealPlan: newMealPlan };
        }),

      updateMealServings: (date, meal, servings) =>
        set(state => {
            const newMealPlan = { ...state.mealPlan };
            if (newMealPlan[date] && newMealPlan[date][meal]) {
                newMealPlan[date][meal].servings = servings;
            }
            return { mealPlan: newMealPlan };
        }),

      removeRecipeFromMeal: (date, meal) =>
        set(state => {
          const newMealPlan = { ...state.mealPlan };
          if (newMealPlan[date]) {
            newMealPlan[date][meal] = { recipeId: null, servings: 2 };
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

        createWeeklySnapshot: () => {
        const { inventory, weeklySnapshots } = get();
        const today = new Date();
        const lastSnapshotDate = weeklySnapshots.length > 0 ? new Date(weeklySnapshots[weeklySnapshots.length - 1].date) : null;
        if (!lastSnapshotDate || today.getTime() - lastSnapshotDate.getTime() > 7 * 24 * 60 * 60 * 1000) {
          const totalItems = inventory.length;
          const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);
          const freshItems = inventory.filter(item => new Date(item.expiryDate) > new Date()).length;
          const newSnapshot: WeeklySnapshot = {
            date: today.toISOString(),
            totalItems,
            totalValue,
            freshItems,
          };
          set({ weeklySnapshots: [...weeklySnapshots, newSnapshot] });
        }
      },

        addToast: (message, type = 'info') => {
        const id = crypto.randomUUID();
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }));
      },
      
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      setRecipeIngredientFilter: (ingredientName) => set({ recipeIngredientFilter: ingredientName }),
    }),
    {
      name: 'pantryveda-storage',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['toasts'].includes(key))
        ),
    }
  )
);