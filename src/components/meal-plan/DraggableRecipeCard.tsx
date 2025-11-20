"use client";
import { Recipe } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { Eye } from 'lucide-react';
import React from 'react';
import Image from 'next/image';

interface DraggableRecipeCardProps {
  recipe: Recipe;
  onView: (recipe: Recipe) => void;
}

export const DraggableRecipeCard: React.FC<DraggableRecipeCardProps> = ({ recipe, onView }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id, recipe },
  });

  const style = {
    transition: 'box-shadow 0.2s ease',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  if (isDragging) {
    style.transform = transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.05) rotate(2deg)`
      : 'scale(1.05) rotate(2deg)';
  }

  const cardClasses = [
    "p-2", "mb-2", "border", "rounded-lg", "shadow-sm",
    "cursor-grab", "touch-none", "relative", "group",
    "flex", "items-center", "gap-3",
    "bg-white",
    isDragging ? "shadow-xl z-10" : "",
  ].join(" ");

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cardClasses}>
      <div className="flex-shrink-0 h-12 w-12">
        <Image
          src={recipe.photoUrl}
          alt={recipe.name}
          width={48}
          height={48}
          className="rounded-md object-cover w-full h-full"
        />
      </div>

      <div className="flex-grow overflow-hidden">
        <p className="font-semibold text-sm truncate">{recipe.name}</p>
        <p className="text-xs text-gray-500 truncate">{recipe.cuisine}</p>
      </div>

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
    </div>
  );
};