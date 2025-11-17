import { MatchedRecipe } from '@/lib/recipeMatcher';
import { Flame, Clock, Users, Utensils, CalendarPlus, Eye } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { generateFromRecipe } from '@/lib/shoppingListGenerator';

interface RecipeCardProps {
  recipe: MatchedRecipe;
  onView: (recipe: MatchedRecipe) => void;
  onCook: (recipe: MatchedRecipe) => void;
  onAddToPlan: (recipe: MatchedRecipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onView, onCook, onAddToPlan }) => {
  const { inventory, addItemsToShoppingList, masterIngredientList } = usePantryStore();

  const getMatchColor = () => {
    if (recipe.matchPercentage === 100) return 'bg-accent text-white';
    if (recipe.matchPercentage >= 80) return 'bg-warning text-white';
    return 'bg-red-500 text-white';
  };

  const handleViewClick = () => {
    onView(recipe);
  };

  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-subtle border border-gray-200 flex flex-col transition-all duration-300 hover:shadow-lg">
      <div className="cursor-pointer" onClick={handleViewClick}>
        <div className="relative">
          <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover" />
          <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${getMatchColor()}`}>
            {recipe.matchPercentage}% Match
          </span>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-secondary mb-1 font-poppins">{recipe.name}</h3>
          <p className="text-sm text-secondary mb-3 flex-grow font-inter">{recipe.description}</p>
        </div>
      </div>
      <div className="p-4 pt-2 mt-auto">
        <div className="flex justify-between items-center text-xs text-secondary mb-4">
          <div className="flex items-center gap-1"><Clock size={14} /> {recipe.cookingTime}m</div>
          <div className="flex items-center gap-1"><Users size={14} /> {recipe.baseServings} servings</div>
          <div className="flex items-center gap-1 capitalize"><Flame size={14} /> {recipe.spiceLevel}</div>
        </div>

        <div>
          {recipe.matchPercentage === 100 ? (
            <div className="bg-accent/10 text-accent text-sm p-2 rounded-md font-semibold text-center">
              You have all ingredients!
            </div>
          ) : (
            <div className="bg-warning/10 text-warning text-sm p-2 rounded-md">
              <p className="font-semibold">Missing ({recipe.missingIngredients.length}):</p>
              <p className="text-xs">{recipe.missingIngredients.join(', ')}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
            <button
                onClick={() => onCook(recipe)}
                className="flex-1 flex items-center justify-center gap-1 bg-accent/10 text-accent font-semibold py-2 rounded-lg hover:bg-accent/20 transition-colors text-sm"
            >
                <Utensils size={16} /> Cook Now
            </button>
            <button
                onClick={() => onAddToPlan(recipe)}
                className="flex-1 flex items-center justify-center gap-1 bg-primary/10 text-primary font-semibold py-2 rounded-lg hover:bg-primary/20 transition-colors text-sm"
            >
                <CalendarPlus size={16} /> Add to Plan
            </button>
          </div>
      </div>
    </div>
  );
};