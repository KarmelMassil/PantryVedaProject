import { usePantryStore, ShoppingListItem } from "@/store/pantryStore";
import { ConsumptionEvent, Ingredient } from "@/types";
import { differenceInDays, subDays } from "date-fns";
import { indianIngredientsDatabase } from "@/data/ingredients";

// A simple heuristic model to start
export const generateHeuristicSuggestions = (
    inventory: Ingredient[],
    consumptionLog: ConsumptionEvent[]
) => {
    const suggestions: Omit<ShoppingListItem, 'id' | 'checked'>[] = [];
    const sevenDaysAgo = subDays(new Date(), 7);

    // Get a list of unique ingredients consumed
    const consumedIngredientNames = [...new Set(consumptionLog.map(e => e.ingredientName))];

    consumedIngredientNames.forEach(name => {
        // 1. Calculate average weekly consumption for this ingredient
        const weeklyConsumptionEvents = consumptionLog.filter(e => 
            e.ingredientName === name && new Date(e.timestamp) > sevenDaysAgo
        );
        const totalWeeklyConsumed = weeklyConsumptionEvents.reduce((sum, e) => sum + e.quantityConsumed, 0);
        
        // Find the item in the current inventory
        const inventoryItem = inventory.find(item => item.name === name);
        const currentStock = inventoryItem ? inventoryItem.quantity : 0;
        
        // 2. Define a restock threshold (e.g., when stock is less than a week's supply)
        const restockThreshold = totalWeeklyConsumed;

        if (currentStock < restockThreshold && totalWeeklyConsumed > 0) {
            // 3. Suggest buying a bit more than a week's supply
            const purchaseQuantity = Math.ceil(totalWeeklyConsumed * 1.25); // Buy 125% of weekly use

            const dbItem = indianIngredientsDatabase.find(i => i.name === name);
            
            suggestions.push({
                name: name,
                category: dbItem?.category || 'Other',
                quantity: purchaseQuantity,
                unit: dbItem?.unit || 'pcs',
            });
        }
    });

    return suggestions;
};