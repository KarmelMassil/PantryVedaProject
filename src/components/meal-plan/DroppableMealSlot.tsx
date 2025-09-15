"use client";
import { usePantryStore } from '@/store/pantryStore';
import { Recipe } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import React from 'react';

interface DroppableMealSlotProps {
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner';
}

export const DroppableMealSlot: React.FC<DroppableMealSlotProps> = ({ date, meal }) => {
  const { mealPlan, recipes, removeRecipeFromMeal } = usePantryStore();
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
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-xs text-gray-400">Drop recipe here</p>
        </div>
      )}
    </div>
  );
};