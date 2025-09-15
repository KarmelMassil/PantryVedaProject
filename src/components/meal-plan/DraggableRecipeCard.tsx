"use client";
import { Recipe } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import React from 'react';

interface DraggableRecipeCardProps {
  recipe: Recipe;
}

export const DraggableRecipeCard: React.FC<DraggableRecipeCardProps> = ({ recipe }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id }, // Pass recipe data
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
    cursor: 'grabbing',
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="p-2 mb-2 bg-white border rounded-lg shadow-sm cursor-grab touch-none">
      <p className="font-semibold text-sm">{recipe.name}</p>
      <p className="text-xs text-gray-500">{recipe.cuisine}</p>
    </div>
  );
};