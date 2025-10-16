import { addDays, formatISO } from 'date-fns';

// Simplified shelf life map. A real app would have this be much more extensive.
export const typicalShelfLife: Record<string, number> = {
  'Vegetables': 7,
  'Herbs': 5,
  'Dairy': 10,
  'Meats': 4,
  'Fruits': 7,
  'Grains': 365,
  'Spices': 730,
  'Other': 180,
};

export const calculateDefaultExpiry = (purchaseDate: Date, category: string): string => {
  const daysToAdd = typicalShelfLife[category] || 14; // Default to 14 days if category not found
  return formatISO(addDays(purchaseDate, daysToAdd));
};