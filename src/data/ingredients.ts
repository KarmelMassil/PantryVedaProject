import { Ingredient } from "@/types";

export const indianIngredientsDatabase: Omit<Ingredient, 'id' | 'quantity' | 'purchaseDate' | 'expiryDate' | 'value'>[] = [
  { name: 'Onion', category: 'Vegetables', unit: 'pcs' },
  { name: 'Tomato', category: 'Vegetables', unit: 'pcs' },
  { name: 'Ginger', category: 'Vegetables', unit: 'pcs' },
  { name: 'Garlic', category: 'Vegetables', unit: 'pcs' },
  { name: 'Potato', category: 'Vegetables', unit: 'pcs' },
  { name: 'Paneer', category: 'Dairy', unit: 'g' },
  { name: 'Yogurt', category: 'Dairy', unit: 'g' },
  { name: 'Milk', category: 'Dairy', unit: 'l' },
  { name: 'Ghee', category: 'Dairy', unit: 'ml' },
  { name: 'Turmeric Powder', category: 'Spices', unit: 'g' },
  { name: 'Coriander Powder', category: 'Spices', unit: 'g' },
  { name: 'Cumin Seeds', category: 'Spices', unit: 'g' },
  { name: 'Red Chili Powder', category: 'Spices', unit: 'g' },
  { name: 'Garam Masala', category: 'Spices', unit: 'g' },
  { name: 'Basmati Rice', category: 'Grains', unit: 'kg' },
  { name: 'Toor Dal', category: 'Grains', unit: 'g' },
  { name: 'Moong Dal', category: 'Grains', unit: 'g' },
  { name: 'Chicken', category: 'Meats', unit: 'kg' },
  { name: 'Mint Leaves', category: 'Herbs', unit: 'bunches' },
  { name: 'Coriander Leaves', category: 'Herbs', unit: 'bunches' },
];