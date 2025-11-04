"use client";
import { usePantryStore, DayPlan } from '@/store/pantryStore';
import { Recipe, ConsumptionEvent } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { Trash2, Utensils, Sparkles, Plus, CookingPot } from 'lucide-react';
import React from 'react';

interface DroppableMealSlotProps {
  date: string;
  meal: keyof DayPlan;
  suggestion?: Recipe;
  onViewRecipe?: (recipe: Recipe, context?: {date: string; meal: keyof DayPlan}) => void;
}

export const DroppableMealSlot: React.FC<DroppableMealSlotProps> = ({ date, meal, suggestion, onViewRecipe }) => {
  const { mealPlan, recipes, removeRecipeFromMeal, logConsumption, deductFromInventory, assignRecipeToMeal } = usePantryStore();
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
    <div ref={setNodeRef} style={style} className="h-28 border rounded-lg p-2 flex flex-col justify-between transition-colors relative group">
      <p className="text-xs font-bold uppercase text-gray-500">{meal}</p>
      {recipe ? (
        <div className="bg-white p-2 rounded-md shadow-sm text-sm relative">
            <p className="font-bold">{recipe.name}</p>
            <p className="text-xs text-gray-500">{recipe.cookingTime} min</p>
            <button onClick={() => removeRecipeFromMeal(date, meal)} className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500">
                <Trash2 size={14}/>
            </button>
            <button 
                onClick={() => onViewRecipe?.(recipe, { date, meal })}
                className="absolute bottom-1 right-1 p-1 text-gray-400 hover:text-accent-secondary"
            >
                <Utensils size={16}/>
            </button>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-xs text-gray-400 group-hover:opacity-0 transition-opacity">Drop recipe here</p>
            {suggestion && (
                <div className="absolute inset-0 flex-col items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles size={16} className="text-accent-primary" />
                    <p className="text-xs font-semibold text-center mt-1">Try: {suggestion.name}</p>
                    <button 
                      onClick={() => assignRecipeToMeal(date, meal, suggestion.id)}
                      className="mt-2 bg-accent-secondary/20 text-accent-secondary p-1 rounded-full"
                    >
                      <Plus size={16} />
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};