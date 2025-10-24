"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { getRecipeMatches, MatchedRecipe } from '@/lib/recipeMatcher';
import { RecipeCard } from '@/components/RecipeCard';
import { Card } from '@/components/ui/Card';
import { Frown, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function RecipesPage() {
  const { inventory, recipes, preferences } = usePantryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('match-desc');

  const processedRecipes = useMemo(() => {
    let items: MatchedRecipe[] = getRecipeMatches(inventory, recipes, preferences);
    // 1. Filter by search (name or ingredient)
    if (searchQuery) {
      items = items.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    // 2. Filter by cuisine
    if (filterCuisine !== 'all') {
      items = items.filter(r => r.cuisine === filterCuisine);
    }
    // 3. Sort results
    items.sort((a, b) => {
      switch (sortBy) {
        case 'time-asc':
          return a.cookingTime - b.cookingTime;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'match-desc':
        default:
          return b.finalScore - a.finalScore;
      }
    });

    return items;
  }, [inventory, recipes, preferences, searchQuery, filterCuisine, sortBy]);

  const allCuisines = ['all', ...new Set(recipes.map(r => r.cuisine))]

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-4">Recipe Recommendations</h1>
      <p className="text-text-secondary mb-6">Discover authentic Indian recipes you can make with what you have.</p>
      <Link href="/recipes/add" className="flex items-center gap-2 bg-accent-secondary text-white font-semibold px-4 py-2 rounded-lg">
        <PlusCircle size={20} />
        Add Custom Dish
      </Link>
      
      <Card className="p-4 space-y-4 mb-6">
          <input 
              type="text"
              placeholder="Search recipes by name or ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-md"
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Cuisine:</label>
                <select value={filterCuisine} onChange={e => setFilterCuisine(e.target.value)} className="p-2 border rounded-md text-sm">
                    {allCuisines.map(c => <option key={c} value={c}>{c === 'all' ? 'All Cuisines' : c}</option>)}
                </select>
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 border rounded-md text-sm">
                <option value="match-desc">Sort by Best Match</option>
                <option value="time-asc">Sort by Cooking Time</option>
                <option value="name-asc">Sort by Name (A-Z)</option>
            </select>
          </div>
      </Card>

      {processedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedRecipes.map((recipe) => (
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