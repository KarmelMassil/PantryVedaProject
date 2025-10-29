"use client";
import { Recipe } from '@/types';
import { X, Clock, Users, Flame, Save } from 'lucide-react';
import React from 'react';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onCook?: () => void; 
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose, onCook }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-bold text-text-primary">{recipe.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={28} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <img src={recipe.image} alt={recipe.name} className="w-full h-64 object-cover rounded-lg" />
          <div className="flex justify-around items-center text-sm text-text-secondary py-2">
            <span className="flex items-center gap-1"><Clock size={16} /> {recipe.cookingTime}m</span>
            <span className="flex items-center gap-1"><Users size={16} /> {recipe.servings} servings</span>
            <span className="flex items-center gap-1 capitalize"><Flame size={16} /> {recipe.spiceLevel}</span>
          </div>
          <p className="text-text-secondary">{recipe.description}</p>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
            <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md text-sm">
              {recipe.ingredients.map(ing => (
                <li key={ing.name}>{ing.quantity} {ing.unit} {ing.name}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2">
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
            <button onClick={onCook} className="bg-accent-secondary text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
              <Save size={18} /> Finish Cooking & Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
};