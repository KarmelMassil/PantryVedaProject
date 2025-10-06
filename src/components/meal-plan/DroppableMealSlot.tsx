"use client";
import { usePantryStore } from '@/store/pantryStore';
import { Recipe, ConsumptionEvent } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import React from 'react';
import { CookingPot } from 'lucide-react';

interface DroppableMealSlotProps {
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner';
}

export const DroppableMealSlot: React.FC<DroppableMealSlotProps> = ({ date, meal }) => {
  const { mealPlan, recipes, removeRecipeFromMeal, logConsumption, deductFromInventory } = usePantryStore();
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${date}-${meal}`,
    data: { date, meal },
  });

  const recipeId = mealPlan[date]?.[meal];
  const recipe = recipeId ? recipes.find(r => r.id === recipeId) : null;

  const style = {
    backgroundColor: isOver ? 'rgba(39, 174, 96, 0.1)' : undefined,
    borderColor: isOver ? '#27AE60' : 'rgb(229 231 235)',
  };

  const handleCookRecipe = () => {
    if (!recipe) return;
    
    // 1. Create consumption events for each ingredient
    const consumptionEvents: ConsumptionEvent[] = recipe.ingredients.map(ing => ({
      ingredientName: ing.name,
      quantityConsumed: ing.quantity,
      unit: ing.unit,
      timestamp: new Date().toISOString(),
      context: 'recipe',
      recipeId: recipe.id,
    }));
    
    // 2. Log the events
    logConsumption(consumptionEvents);
    
    // 3. Deduct each ingredient from inventory
    recipe.ingredients.forEach(ing => {
      deductFromInventory(ing.name, ing.quantity);
    });
    
    alert(`Enjoy your ${recipe.name}! Ingredients have been deducted from your pantry.`);
  };

  return (
    <div ref={setNodeRef} style={style} className="h-28 border rounded-lg p-2 flex flex-col justify-between transition-colors">
      <p className="text-xs font-bold uppercase text-gray-500">{meal}</p>
      {recipe ? (
        <div className="bg-white p-2 rounded-md shadow-sm text-sm relative">
            <p className="font-bold">{recipe.name}</p>
            <p className="text-xs text-gray-500">{recipe.cookingTime} min</p>
            <button 
                onClick={() => removeRecipeFromMeal(date, meal)}
                className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500"
            >
                <Trash2 size={14}/>
            </button>
            <button 
                onClick={handleCookRecipe}
                className="absolute bottom-1 right-1 p-1 text-gray-400 hover:text-green-500"
            >
                <CookingPot size={16}/>
            </button>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-xs text-gray-400">Drop recipe here</p>
        </div>
      )}
    </div>
  );
};