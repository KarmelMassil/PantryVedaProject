"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore, DayPlan } from '@/store/pantryStore';
import { getRecipeMatches, MatchedRecipe } from '@/lib/recipeMatcher';
import { RecipeCard } from '@/components/RecipeCard';
import { Card } from '@/components/ui/Card';
import { Frown, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { RecipeModal } from '@/components/RecipeModal';
import { AddToMealPlanModal } from '@/components/AddToMealPlanModal';
import { Recipe } from '@/types';

export default function RecipesPage() {
  const { 
      inventory, recipes, preferences, 
      logConsumption, deductFromInventory, assignRecipeToMeal
  } = usePantryStore();
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isCookMode, setIsCookMode] = useState(false); // To know if RecipeModal is for cooking
  const [addToPlanRecipe, setAddToPlanRecipe] = useState<Recipe | null>(null); // Recipe for the AddToPlan modal
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

  const handleOpenViewModal = (recipe: Recipe) => {
    setViewingRecipe(recipe);
    setIsCookMode(false);
  };
  
  const handleOpenCookModal = (recipe: Recipe) => {
    setViewingRecipe(recipe);
    setIsCookMode(true);
  };
  
  const handleOpenAddToPlanModal = (recipe: Recipe) => {
    setAddToPlanRecipe(recipe);
  };

  const handleCloseModal = () => {
    setViewingRecipe(null);
    setIsCookMode(false);
    setAddToPlanRecipe(null);
  };

  const handleCookAndClose = () => {
    if (!viewingRecipe) return handleCloseModal();
    const recipe = viewingRecipe;

    const consumptionEvents = recipe.ingredients.map(ing => ({
      ingredientName: ing.name,
      quantityConsumed: ing.quantity,
      unit: ing.unit as any,
      timestamp: new Date().toISOString(),
      context: 'recipe' as 'recipe',
      recipeId: recipe.id,
    }));
    logConsumption(consumptionEvents);
    recipe.ingredients.forEach(ing => {
      deductFromInventory(ing.name, ing.quantity);
    });

    alert(`Enjoy your ${recipe.name}! Ingredients logged.`);
    handleCloseModal();
  };

  const handleSaveToMealPlan = (recipeId: string, date: string, meal: keyof DayPlan) => {
    assignRecipeToMeal(date, meal, recipeId);
    alert(`Recipe added to ${meal} on ${date}.`);
  };

  return (
    <>
      {/* Render Modals */}
      {viewingRecipe && (
        <RecipeModal 
          recipe={viewingRecipe}
          onClose={handleCloseModal}
          onCook={isCookMode ? handleCookAndClose : undefined}
        />
      )}
      {addToPlanRecipe && (
        <AddToMealPlanModal
          recipe={addToPlanRecipe}
          onClose={handleCloseModal}
          onSave={handleSaveToMealPlan}
        />
      )}

      <div>
        <div className="flex justify-between items-center mb-6"> {/* Added mb-6 */}
          <div>
              <h1 className="text-3xl font-bold text-text-primary">Recipe Discovery</h1>
              <p className="text-text-secondary">Find recipes based on your pantry.</p>
          </div>
          <Link href="/recipes/add" className="flex items-center gap-2 bg-accent-secondary text-white font-semibold px-4 py-2 rounded-lg">
            <PlusCircle size={20} /> Add Custom Dish
          </Link>
        </div>
      
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
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onView={handleOpenViewModal}
                onCook={handleOpenCookModal}
                onAddToPlan={handleOpenAddToPlanModal}
              />
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
    </>
  );
}