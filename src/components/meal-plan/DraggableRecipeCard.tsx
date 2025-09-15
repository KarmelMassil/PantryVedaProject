"use client";
import { Recipe } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import React from 'react';

interface DraggableRecipeCardProps {
  recipe: Recipe;
}

export const DraggableRecipeCard: React.FC<DraggableRecipeCardProps> = ({ recipe }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id }, // Pass recipe data
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-2 mb-2 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none"
    >
      <p className="font-semibold text-sm">{recipe.name}</p>
      <p className="text-xs text-gray-500">{recipe.cuisine}</p>
    </div>
  );
};
