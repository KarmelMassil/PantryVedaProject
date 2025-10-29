"use client";
import { Recipe } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { Eye } from 'lucide-react';
import React from 'react';

interface DraggableRecipeCardProps {
  recipe: Recipe;
  onView: (recipe: Recipe) => void;
}

export const DraggableRecipeCard: React.FC<DraggableRecipeCardProps> = ({ recipe, onView }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id }, // Pass recipe data
  });

const style = transform ? {/*...*/} : undefined;

  return (
    <div className="p-2 mb-2 bg-white border rounded-lg shadow-sm cursor-grab touch-none relative group">
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <p className="font-semibold text-sm">{recipe.name}</p>
        <p className="text-xs text-gray-500">{recipe.cuisine}</p>
      </div>
      <button 
        onClick={() => onView(recipe)} 
        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="View Recipe"
      >
        <Eye size={16} />
      </button>
    </div>
  );
};