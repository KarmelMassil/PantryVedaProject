// src/lib/unitConverter.ts

export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'bunches' | 'cup' | 'tbsp' | 'tsp';

// --- Configuration ---

// 1. Density map for converting volume to weight
const ingredientDensity: Record<string, number> = {
  // g / ml
  water: 1,
  milk: 1.03,
  oil: 0.92,
  flour: 0.53, // All-purpose
  sugar: 0.84, // Granulated
  salt: 1.2,
  rice: 0.85, // Uncooked
  // Add more as needed
};

// 2. Piece-to-weight approximation for display
const averagePieceWeight: Record<string, number> = {
  // in grams per piece
  tomato: 150,
  potato: 200,
  onion: 180,
  apple: 180,
  banana: 120,
  garlic: 10, // Clove
  // Add more as needed
};

// 3. Volumetric conversions to ml
const mlConversionRates: Record<Exclude<Unit, 'kg' | 'g' | 'l' | 'pcs' | 'bunches'>, number> = {
  cup: 240,
  tbsp: 15,
  tsp: 5,
  ml: 1,
};

// --- Core Conversion Logic ---

/**
 * Converts a given quantity from a source unit to a target unit.
 * @param quantity The amount to convert.
 * @param fromUnit The unit to convert from.
 * @param toUnit The unit to convert to.
 * @param ingredientName Optional name of the ingredient for density-based conversions.
 * @returns The converted quantity, or null if conversion is not possible.
 */
export function convertUnit(
  quantity: number,
  fromUnit: Unit,
  toUnit: Unit,
  ingredientName?: string
): number | null {
  if (fromUnit === toUnit) {
    return quantity;
  }

  // Step 1: Standardize everything to a base unit (g for weight, ml for volume)
  let baseQuantity: number | null = null;
  let baseUnit: 'g' | 'ml' | null = null;

  switch (fromUnit) {
    // Weight conversions to 'g'
    case 'kg':
      baseQuantity = quantity * 1000;
      baseUnit = 'g';
      break;
    case 'g':
      baseQuantity = quantity;
      baseUnit = 'g';
      break;

    // Volume conversions to 'ml'
    case 'l':
      baseQuantity = quantity * 1000;
      baseUnit = 'ml';
      break;
    case 'cup':
    case 'tbsp':
    case 'tsp':
    case 'ml':
      baseQuantity = quantity * mlConversionRates[fromUnit];
      baseUnit = 'ml';
      break;

    // Approximations (cannot be reliably converted to a base unit without context)
    case 'pcs':
    case 'bunches':
      return null; // Direct conversion is not supported
  }

  if (baseQuantity === null || baseUnit === null) {
    return null; // Should not happen if all cases are handled
  }

  // Step 2: Convert from base unit to the target unit
  switch (toUnit) {
    // Target: Weight
    case 'g':
      if (baseUnit === 'g') return baseQuantity;
      if (baseUnit === 'ml' && ingredientName) {
        const density = ingredientDensity[ingredientName.toLowerCase()];
        return density ? baseQuantity * density : null;
      }
      return null;
    case 'kg':
        if (baseUnit === 'g') return baseQuantity / 1000;
        if (baseUnit === 'ml' && ingredientName) {
            const density = ingredientDensity[ingredientName.toLowerCase()];
            return density ? (baseQuantity * density) / 1000 : null;
        }
        return null;

    // Target: Volume
    case 'ml':
      if (baseUnit === 'ml') return baseQuantity;
      if (baseUnit === 'g' && ingredientName) {
        const density = ingredientDensity[ingredientName.toLowerCase()];
        return density ? baseQuantity / density : null;
      }
      return null;
    case 'l':
        if (baseUnit === 'ml') return baseQuantity / 1000;
        if (baseUnit === 'g' && ingredientName) {
            const density = ingredientDensity[ingredientName.toLowerCase()];
            return density ? (baseQuantity / density) / 1000 : null;
        }
        return null;

    // Volumetric units from ml
    case 'cup':
    case 'tbsp':
    case 'tsp':
        if (baseUnit === 'ml') {
            return baseQuantity / mlConversionRates[toUnit];
        }
        return null; // Cannot convert from grams to cups without density

    default:
      return null;
  }
}

// --- Specific Helper Functions ---

/**
 * Provides a display-friendly approximation of pieces to kg.
 * This should NOT be used for inventory calculations.
 * @param quantity The number of pieces.
 * @param ingredientName The name of the ingredient.
 * @returns A string like " (approx. 1.2 kg)" or an empty string.
 */
export function getApproximateWeightDisplay(quantity: number, ingredientName: string): string {
  const lowerCaseName = ingredientName.toLowerCase();
  const pieceWeight = Object.keys(averagePieceWeight).find(key => lowerCaseName.includes(key));

  if (pieceWeight) {
    const totalGrams = quantity * averagePieceWeight[pieceWeight];
    const totalKg = totalGrams / 1000;
    if (totalKg > 0.1) { // Only show if it's a meaningful weight
        return ` (approx. ${totalKg.toFixed(1)} kg)`;
    }
  }
  return '';
}
