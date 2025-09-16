import { Ingredient } from "@/types";
import { differenceInDays } from "date-fns";

export interface CategoryData {
  name: string;
  count: number;
}

export interface ExpiryData {
  name: string;
  value: number;
}

export const generateCategoryData = (inventory: Ingredient[]): CategoryData[] => {
  const categoryMap = new Map<string, number>();
  
  inventory.forEach(item => {
    categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
  });
  
  return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
};

export const generateExpiryData = (inventory: Ingredient[]): ExpiryData[] => {
  let fresh = 0;
  let expiring = 0;
  let expired = 0;

  inventory.forEach(item => {
    const days = differenceInDays(new Date(item.expiryDate), new Date());
    if (days < 0) {
      expired++;
    } else if (days <= 3) {
      expiring++;
    } else {
      fresh++;
    }
  });

  return [
    { name: 'Fresh', value: fresh },
    { name: 'Expiring Soon', value: expiring },
    { name: 'Expired', value: expired },
  ].filter(d => d.value > 0);
};

export const calculateTotalValue = (inventory: Ingredient[]): number => {
  return inventory.reduce((total, item) => total + item.value, 0);
};

export const calculateFoodWaste = (inventory: Ingredient[]): { value: number; percentage: number, totalValue: number } => {
    const totalValue = calculateTotalValue(inventory);
    if (totalValue === 0) return { value: 0, percentage: 0, totalValue: 0 };
    
    const wasteValue = inventory
        .filter(item => differenceInDays(new Date(item.expiryDate), new Date()) < 0)
        .reduce((total, item) => total + item.value, 0);

    const percentage = (wasteValue / totalValue) * 100;
    return { value: wasteValue, percentage, totalValue };
};