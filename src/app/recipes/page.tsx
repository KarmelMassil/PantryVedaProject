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
import { CookingModeModal } from '@/components/CookingModeModal';

const difficulties: Recipe['difficulty'][] = ['beginner', 'intermediate', 'expert'];
const dietaryOptions: Recipe['dietary'][0][] = ['veg', 'non-veg', 'vegan', 'gluten-free'];
const spiceLevels: Recipe['spiceLevel'][] = ['mild', 'medium', 'hot'];

export default function RecipesPage() {
  const { 
      inventory, recipes, preferences, 
      logConsumption, deductFromInventory, assignRecipeToMeal, addToast
  } = usePantryStore();
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [addToPlanRecipe, setAddToPlanRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('match-desc');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterDietary, setFilterDietary] = useState('all');
  const [filterSpice, setFilterSpice] = useState('all');

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
    // 3. Filter by difficulty
    if (filterDifficulty !== 'all') {
      items = items.filter(r => r.difficulty === filterDifficulty);
    }
    // 4. Filter by dietary needs
    if (filterDietary !== 'all') {
      items = items.filter(r => r.dietary.includes(filterDietary as any));
    }
    // 5. Filter by spice level
    if (filterSpice !== 'all') {
      items = items.filter(r => r.spiceLevel === filterSpice);
    }
    // 7. Sort results
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
  }, [inventory, recipes, preferences, searchQuery, filterCuisine, sortBy, filterDifficulty, filterDietary, filterSpice]);

  const allCuisines = ['all', ...new Set(recipes.map(r => r.cuisine))]

  const handleOpenViewModal = (recipe: Recipe) => {
    setViewingRecipe(recipe);
  };
  
  const handleOpenCookModal = (recipe: Recipe) => {
    setCookingRecipe(recipe);
  };
  
  const handleOpenAddToPlanModal = (recipe: Recipe) => {
    setAddToPlanRecipe(recipe);
  };

  const handleCloseModal = () => {
    setViewingRecipe(null);
    setAddToPlanRecipe(null);
    setCookingRecipe(null);
  };

  const handleFinishCooking = (recipe: Recipe) => {
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

    addToast(`Enjoy your ${recipe.name}! Ingredients logged.`, 'success');
    handleCloseModal();
  };

  const handleSaveToMealPlan = (recipeId: string, date: string, meal: keyof DayPlan, servings: number) => {
    assignRecipeToMeal(date, meal, recipeId, servings);
    addToast(`Recipe added to ${meal} on ${date}.`, 'success');
  };

  return (
    <>
      {/* Render Modals */}
      {viewingRecipe && (
        <RecipeModal recipe={viewingRecipe} onClose={handleCloseModal} />
      )}
      {addToPlanRecipe && (
        <AddToMealPlanModal
          recipe={addToPlanRecipe}
          onClose={handleCloseModal}
          onSave={handleSaveToMealPlan}
        />
      )}
      {cookingRecipe && (
        <CookingModeModal
          recipe={cookingRecipe}
          onClose={handleCloseModal}
          onFinishCooking={handleFinishCooking}
        />
      )}

      <div>
        <div className="flex justify-between items-center mb-6">
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
          {/* Filter Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Cuisine:</label>
                    <select value={filterCuisine} onChange={e => setFilterCuisine(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                        {allCuisines.map(c => <option key={c} value={c}>{c === 'all' ? 'All' : c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Difficulty:</label>
                    <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                        <option value="all">All</option>
                        {difficulties.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Dietary:</label>
                    <select value={filterDietary} onChange={e => setFilterDietary(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                        <option value="all">All</option>
                        {dietaryOptions.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Spice Level:</label>
                    <select value={filterSpice} onChange={e => setFilterSpice(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                        <option value="all">All</option>
                        {spiceLevels.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                </div>
            </div>
             {/* Filter Row 2 */}
             <div className="flex justify-end items-center">
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