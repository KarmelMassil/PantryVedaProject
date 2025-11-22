"use client";
import { Recipe } from '@/types';
import { X, Clock, Users, Flame, Minus, Plus } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { scaleRecipeIngredients } from '@/lib/recipeUtils';
import Image from 'next/image';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f0f0f0" offset="20%" />
      <stop stop-color="#e0e0e0" offset="50%" />
      <stop stop-color="#f0f0f0" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f0f0f0" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  const [desiredServings, setDesiredServings] = useState(recipe.baseServings);

  const scaledRecipe = useMemo(() => {
    return scaleRecipeIngredients(recipe, desiredServings);
  }, [recipe, desiredServings]);

  const handleServingsChange = (amount: number) => {
    setDesiredServings(prev => Math.max(1, prev + amount));
  };

  const getSpiceEmoji = (level: string) => {
    switch (level) {
      case 'mild': return '😊';
      case 'medium': return '🔥';
      case 'hot': return '🔥🔥';
      default: return '🔥';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Hero Image Section */}
        <div className="relative h-56 flex-shrink-0">
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            className="object-cover"
            placeholder={`data:image/svg+xml;base64,${toBase64(shimmer(600, 224))}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
          >
            <X size={24} className="text-gray-700" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg">{recipe.name}</h2>
            {recipe.description && (
              <p className="text-white/80 mt-2 text-sm line-clamp-2">{recipe.description}</p>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-semibold">{recipe.cookingTime} min</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Flame size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Spice</p>
                <p className="font-semibold capitalize">{getSpiceEmoji(recipe.spiceLevel)} {recipe.spiceLevel}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border-2 border-gray-200">
            <button 
              onClick={() => handleServingsChange(-1)} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Minus size={16} />
            </button>
            <div className="flex items-center gap-2 min-w-[100px] justify-center">
              <Users size={18} className="text-gray-500" />
              <span className="font-bold text-lg">{desiredServings}</span>
              <span className="text-gray-500 text-sm">servings</span>
            </div>
            <button 
              onClick={() => handleServingsChange(1)} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Ingredients
              <span className="ml-2 text-sm font-normal text-gray-500">({scaledRecipe.ingredients.length} items)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {scaledRecipe.ingredients.map((ing) => (
                <div 
                  key={ing.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-800">{ing.name}</span>
                  <span className="font-semibold text-gray-600">
                    {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(1)} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Instructions
              <span className="ml-2 text-sm font-normal text-gray-500">({recipe.instructions.length} steps)</span>
            </h3>
            <div className="space-y-4">
              {recipe.instructions.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    {i + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};