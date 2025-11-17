"use client";
import { Recipe } from '@/types';
import { X, Clock, Users, Flame, Save, Minus, Plus } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { scaleRecipeIngredients } from '@/lib/recipeUtils';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onCook?: (scaledRecipe: Recipe) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose, onCook }) => {
  const [desiredServings, setDesiredServings] = useState(recipe.baseServings);

  const scaledRecipe = useMemo(() => {
    return scaleRecipeIngredients(recipe, desiredServings);
  }, [recipe, desiredServings]);

  const handleServingsChange = (amount: number) => {
    setDesiredServings(prev => Math.max(1, prev + amount));
  };

  const handleCookClick = () => {
    if (onCook) {
      onCook(scaledRecipe);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-subtle w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-bold text-secondary font-poppins">{recipe.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={28} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <img src={recipe.image} alt={recipe.name} className="w-full h-64 object-cover rounded-lg" />
          <div className="flex justify-around items-center text-sm text-secondary py-2">
            <span className="flex items-center gap-1"><Clock size={16} /> {recipe.cookingTime}m</span>
            <div className="flex items-center gap-2">
              <button onClick={() => handleServingsChange(-1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={14}/></button>
              <span className="flex items-center gap-1"><Users size={16} /> {desiredServings} servings</span>
              <button onClick={() => handleServingsChange(1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={14}/></button>
            </div>
            <span className="flex items-center gap-1 capitalize"><Flame size={16} /> {recipe.spiceLevel}</span>
          </div>
          <p className="text-secondary font-inter">{recipe.description}</p>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary font-poppins">Ingredients</h3>
            <ul className="list-disc list-inside bg-background p-3 rounded-md text-sm">
              {scaledRecipe.ingredients.map(ing => (
                <li key={ing.name}>{ing.quantity.toFixed(1)} {ing.unit} {ing.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary font-poppins">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 font-inter">
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg">
            Close
          </button>
          {onCook && (
            <button onClick={handleCookClick} className="gradient-accent text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
              <Save size={18} /> Finish Cooking & Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
};