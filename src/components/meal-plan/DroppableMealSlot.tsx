"use client";
import { usePantryStore, DayPlan } from '@/store/pantryStore';
import { Recipe } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { Trash2, Utensils, Sparkles, Plus, Users, Minus } from 'lucide-react';
import React from 'react';

interface DroppableMealSlotProps {
  date: string;
  meal: keyof DayPlan;
  mealPlan: DayPlan | undefined;
  suggestion?: Recipe;
  onViewRecipe?: (recipe: Recipe, context?: {date: string; meal: keyof DayPlan}) => void;
}

export const DroppableMealSlot: React.FC<DroppableMealSlotProps> = ({ date, meal, mealPlan, suggestion, onViewRecipe }) => {
  const { recipes, removeRecipeFromMeal, assignRecipeToMeal, updateMealServings } = usePantryStore();
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${date}-${meal}`,
    data: { date, meal },
  });

  const mealData = mealPlan?.[meal];
  const recipe = mealData?.recipeId ? recipes.find(r => r.id === mealData.recipeId) : null;

  const handleServingsChange = (amount: number) => {
    if (mealData) {
      const newServings = Math.max(1, mealData.servings + amount);
      updateMealServings(date, meal, newServings);
    }
  };

  const style = {
    backgroundColor: isOver ? 'rgba(39, 174, 96, 0.1)' : undefined,
    borderColor: isOver ? '#27AE60' : 'rgb(229 231 235)',
  };

  return (
    <div ref={setNodeRef} style={style} className="h-16 border rounded-lg p-2 flex flex-col justify-between transition-colors relative group">
      {recipe ? (
        <div className="bg-white p-2 rounded-md shadow-sm text-sm group">
            <p className="font-bold truncate">{recipe.name}</p>
            <div className="flex items-center justify-between mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                    <button onClick={() => handleServingsChange(-1)} className="p-0.5 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={12}/></button>
                    <span className="text-xs flex items-center gap-0.5"><Users size={12}/>{mealData?.servings}</span>
                    <button onClick={() => handleServingsChange(1)} className="p-0.5 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={12}/></button>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => removeRecipeFromMeal(date, meal)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                    <button onClick={() => onViewRecipe?.(recipe, { date, meal })} className="p-1 text-gray-400 hover:text-accent-secondary"><Utensils size={14}/></button>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-xs text-gray-400 group-hover:opacity-0 transition-opacity">Drop recipe here</p>
            {suggestion && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                    <Sparkles size={16} className="text-accent-primary mx-auto" />
                    <p className="text-xs font-semibold mt-1">Try: {suggestion.name}</p>
                    <button 
                      onClick={() => assignRecipeToMeal(date, meal, suggestion.id, suggestion.baseServings)}
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