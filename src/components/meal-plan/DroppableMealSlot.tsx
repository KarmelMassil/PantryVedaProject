"use client";
import { usePantryStore, DayPlan } from '@/store/pantryStore';
import { Recipe } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { Trash2, Utensils, Sparkles, Plus, Users, Minus, Clock } from 'lucide-react';
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
    borderColor: isOver ? '#ED8936' : (recipe ? '#FBD38D' : '#E2E8F0'),
    backgroundColor: isOver ? '#FEFBF6' : (recipe ? '#FFF5E6' : 'transparent'),
  };

  const containerClasses = [
    "h-auto min-h-[60px]", "border-2", "rounded-lg", "p-1", "flex", "flex-col",
    "justify-center", "transition-colors", "relative", "group",
  ].join(" ");

  return (
    <div ref={setNodeRef} style={style} className={containerClasses}>
      {recipe ? (
        <div className="p-1 rounded-md text-sm">
           <div className="flex items-start justify-between">
              <p className="font-bold truncate pr-2 flex-1">{recipe.name}</p>
            </div>
            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleServingsChange(-1)} className="p-0.5 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={12}/></button>
                      <span className="flex items-center gap-0.5"><Users size={12}/>{mealData?.servings}</span>
                      <button onClick={() => handleServingsChange(1)} className="p-0.5 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={12}/></button>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock size={12} />
                      <span className="font-medium">{recipe.cookingTime} min</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => removeRecipeFromMeal(date, meal)} className="p-0.5  text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                    <button onClick={() => onViewRecipe?.(recipe, { date, meal })} className="p-0.5 text-gray-400 hover:text-accent-secondary"><Utensils size={12}/></button>
                </div>
            </div>
        </div>
      ) : (
        <div className="p-0.5 rounded-md shadow-sm text-sm group">
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