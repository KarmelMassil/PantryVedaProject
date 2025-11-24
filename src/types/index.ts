export interface Ingredient {
  id: string;
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Spices' | 'Grains' | 'Dairy' | 'Meats' | 'Herbs' | 'Other';
  quantity: number;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'bunches';
  purchaseDate: string; // ISO string
  expiryDate: string;   // ISO string
  value: number; // Cost in INR
}

export interface Recipe {
  id: string;
  name:string;
  description: string;
  cuisine: 'North Indian' | 'South Indian' | 'Bengali' | 'Gujarati';
  difficulty: 'beginner' | 'intermediate' | 'expert';
  cookingTime: number; // in minutes
  baseServings: number;
  dietary: ('veg' | 'non-veg' | 'vegan' | 'gluten-free')[];
  ingredients: {
    name: string;
    quantity: number;
    unit: Ingredient['unit'];
  }[];
  instructions: string[];
  spiceLevel: 'mild' | 'medium' | 'hot';
  image: string;
}

export interface ConsumptionEvent {
  ingredientName: string;
  quantityConsumed: number;
  unit: Ingredient['unit'];
  timestamp: string;
  context: 'recipe' | 'manual';
  recipeId?: string;
}

export interface WasteEvent {
  ingredientName: string;
  quantityWasted: number;
  unit: Ingredient['unit'];
  timestamp: string;
  reason: 'expired' | 'other';
}