"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { getRecipeMatches } from '@/lib/recipeMatcher';
import { RecipeCard } from '@/components/RecipeCard';
import { Frown, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function RecipesPage() {
  const { inventory, recipes, preferences } = usePantryStore();
  const [filter, setFilter] = useState('all');

  const matchedRecipes = useMemo(() => {
    let matches = getRecipeMatches(inventory, recipes, preferences);
    if (filter === 'canMake') {
      matches = matches.filter(r => r.matchPercentage === 100);
    } else if (filter === 'almostThere') {
      matches = matches.filter(r => r.matchPercentage > 75 && r.matchPercentage < 100);
    }
    return matches;
  }, [inventory, recipes, preferences, filter]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-4">Recipe Recommendations</h1>
      <p className="text-text-secondary mb-6">Discover authentic Indian recipes you can make with what you have.</p>
      <Link href="/recipes/add" className="flex items-center gap-2 bg-accent-secondary text-white font-semibold px-4 py-2 rounded-lg">
        <PlusCircle size={20} />
        Add Custom Dish
      </Link>
      
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full font-semibold ${filter === 'all' ? 'bg-accent-primary text-white' : 'bg-white'}`}>All Recipes</button>
        <button onClick={() => setFilter('canMake')} className={`px-4 py-2 rounded-full font-semibold ${filter === 'canMake' ? 'bg-accent-primary text-white' : 'bg-white'}`}>Can Make Now</button>
        <button onClick={() => setFilter('almostThere')} className={`px-4 py-2 rounded-full font-semibold ${filter === 'almostThere' ? 'bg-accent-primary text-white' : 'bg-white'}`}>Almost There</button>
      </div>
      
      {matchedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {matchedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg">
          <Frown className="mx-auto text-gray-400" size={48} />
          <h3 className="mt-2 text-lg font-medium text-text-primary">No Recipes Found</h3>
          <p className="mt-1 text-sm text-text-secondary">Try adjusting your filters or adding more ingredients to your pantry.</p>
        </div>
      )}
    </div>
  );
}