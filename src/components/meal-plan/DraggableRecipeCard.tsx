"use client";
import { Recipe } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { Eye, Clock, Flame } from 'lucide-react';
import React from 'react';
import Image from 'next/image';

interface DraggableRecipeCardProps {
  recipe: Recipe;
  onView: (recipe: Recipe) => void;
  isOverlay?: boolean;
  isAssigned?: boolean;
}

const RecipeCardContent: React.FC<{ recipe: Recipe; onView: (recipe: Recipe) => void; isOverlay?: boolean }> = ({ recipe, onView, isOverlay }) => (
  <>
    <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
      <Image
        src={recipe.image}
        alt={recipe.name}
        width={48}
        height={48}
        className="object-cover w-full h-full"
      />
    </div>
    <div className="flex-grow overflow-hidden">
      <p className="font-semibold text-sm truncate">{recipe.name}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
        <span className="flex items-center gap-1"><Clock size={12} /> {recipe.cookingTime} min</span>
        <span className="flex items-center gap-1 capitalize"><Flame size={12} /> {recipe.spiceLevel}</span>
      </div>
    </div>
    {!isOverlay && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(recipe);
        }}
        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="View Recipe"
      >
        <Eye size={16} />
      </button>
    )}
  </>
);

export const DraggableRecipeCard: React.FC<DraggableRecipeCardProps> = ({ recipe, onView, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id, recipe },
  });

  const commonClasses = "p-2 mb-2 border rounded-lg shadow-sm cursor-grab touch-none relative group flex items-center gap-3";

  // Styles for the item being dragged in the DragOverlay
  if (isOverlay) {
    const style = {
      transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0) scale(1.05) rotate(3deg)`,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    };
    return (
      <div style={style} className={`${commonClasses} bg-white`}>
        <RecipeCardContent recipe={recipe} onView={onView} isOverlay={true} />
      </div>
    );
  }

  // Styles for the original item in the list
  const style = {
    transition: 'opacity 0.2s ease',
    // DO NOT apply transform here, it causes the container to scroll
    transform: undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`${commonClasses} bg-white`}>
      <RecipeCardContent recipe={recipe} onView={onView} />
    </div>
  );
};