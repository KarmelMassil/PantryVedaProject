import { Ingredient, Recipe } from "@/types";
import { ShoppingListItem, MasterIngredient } from "@/store/pantryStore";

type ShoppingSuggestion = Omit<
  ShoppingListItem,
  "id" | "checked" | "price" | "expiryDate"
>;

export const generateFromRecipe = (
  recipe: Recipe,
  inventory: Ingredient[],
  masterIngredientList: MasterIngredient[]
): ShoppingSuggestion[] => {
  const inventoryMap = new Map<string, number>(
    inventory.map((item) => [item.name.toLowerCase(), item.quantity])
  );

  const missingItems: ShoppingSuggestion[] = [];

  recipe.ingredients.forEach((req) => {
    const availableQty = inventoryMap.get(req.name.toLowerCase()) || 0;
    if (availableQty < req.quantity) {
      // Try to match with master ingredient database
      const dbItem = masterIngredientList.find(
        (i) => i.name.toLowerCase() === req.name.toLowerCase()
      );

      // Build shopping item
      missingItems.push({
        name: req?.name,
        category: dbItem?.category || "Other",
        quantity: req.quantity - availableQty,
        unit: dbItem?.unit || req.unit,
        defaultExpiryDays: dbItem?.defaultExpiryDays || 14,
      });
    }
  });

  return missingItems;
};
