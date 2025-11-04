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
  const [servings, setServings] = useState(recipe.servings);
  const { inventory, addItemsToShoppingList, masterIngredientList } = usePantryStore();

  const getMatchColor = () => {
    if (recipe.matchPercentage === 100) return 'bg-green-100 text-green-800';
    if (recipe.matchPercentage >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleViewClick = () => {
    onView(recipe); // Call the onView prop when card is clicked
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 flex flex-col">
      <div className="cursor-pointer" onClick={handleViewClick}>
        <div className="relative">
          <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover" />
          <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${getMatchColor()}`}>
            {recipe.matchPercentage}% Match
          </span>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-text-primary mb-1">{recipe.name}</h3>
          <p className="text-sm text-text-secondary mb-3 flex-grow">{recipe.description}</p>
        </div>
      </div>
      <div className="p-4 pt-2 mt-auto">
        <div className="flex justify-between items-center text-xs text-text-secondary mb-4">
          <div className="flex items-center gap-1"><Clock size={14} /> {recipe.cookingTime}m</div>
          <div className="flex items-center gap-1"><Users size={14} /> {recipe.servings} servings</div>
          <div className="flex items-center gap-1 capitalize"><Flame size={14} /> {recipe.spiceLevel}</div>
        </div>

        <div>
          {recipe.matchPercentage === 100 ? (
            <div className="bg-curry-green/10 text-curry-green text-sm p-2 rounded-md font-semibold text-center">
              You have all ingredients!
            </div>
          ) : (
            <div className="bg-chili-red/10 text-chili-red text-sm p-2 rounded-md">
              <p className="font-semibold">Missing ({recipe.missingIngredients.length}):</p>
              <p className="text-xs">{recipe.missingIngredients.join(', ')}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
            <button 
                onClick={() => onCook(recipe)}
                className="flex-1 flex items-center justify-center gap-1 bg-accent-secondary/10 text-accent-secondary font-semibold py-2 rounded-lg hover:bg-accent-secondary/20 transition-colors text-sm"
            >
                <Utensils size={16} /> Cook Now
            </button>
            <button 
                onClick={() => onAddToPlan(recipe)}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-500/10 text-blue-600 font-semibold py-2 rounded-lg hover:bg-blue-500/20 transition-colors text-sm"
            >
                <CalendarPlus size={16} /> Add to Plan
            </button>
          </div>
      </div>
    </div>
  );
};