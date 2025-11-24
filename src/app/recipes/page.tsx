"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore, DayPlan } from '@/store/pantryStore';
import { getRecipeMatches, MatchedRecipe } from '@/lib/recipeMatcher';
import { RecipeCard } from '@/components/RecipeCard';
import { Card } from '@/components/ui/Card';
import { 
    Frown, PlusCircle, CookingPot, Filter, ChefHat, BookOpen, Info,
    ArrowDown, ArrowUp, Star, Clock, Flame
} from 'lucide-react';
import Link from 'next/link';
import { RecipeModal } from '@/components/RecipeModal';
import { AddToMealPlanModal } from '@/components/AddToMealPlanModal';
import { Recipe } from '@/types';
import { CookingModeModal } from '@/components/CookingModeModal';
import { FilterAndSort, SortOption } from '@/components/ui/FilterAndSort';

const difficulties: Recipe['difficulty'][] = ['beginner', 'intermediate', 'expert'];
const spiceLevels: Recipe['spiceLevel'][] = ['mild', 'medium', 'hot'];

const sortOptions: SortOption[] = [
    { group: 'By Match', value: 'match-desc', label: 'Best Match', icon: Star },
    { group: 'By Time', value: 'time-asc', label: 'Cooking Time (Shortest)', icon: Clock },
    { group: 'By Name', value: 'name-asc', label: 'Name (A-Z)', icon: ArrowDown },
    { group: 'By Name', value: 'name-za', label: 'Name (Z-A)', icon: ArrowUp },
    { group: 'By Difficulty', value: 'difficulty-asc', label: 'Difficulty (Easiest)', icon: ArrowUp },
    { group: 'By Difficulty', value: 'difficulty-desc', label: 'Difficulty (Hardest)', icon: ArrowDown },
    { group: 'By Spice Level', value: 'spice-asc', label: 'Spice Level (Mildest)', icon: Flame },
];

export default function RecipesPage() {
  const { 
      inventory, recipes, 
      logConsumption, deductFromInventory, assignRecipeToMeal, addToast,
      recipeIngredientFilter, setRecipeIngredientFilter
  } = usePantryStore();
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [addToPlanRecipe, setAddToPlanRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState(recipeIngredientFilter || '');
  const [sortBy, setSortBy] = useState('match-desc');
  const [filterTime, setFilterTime] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSpice, setFilterSpice] = useState('all');

  const processedRecipes = useMemo(() => {
    let items: MatchedRecipe[] = getRecipeMatches(inventory, recipes);
    if (searchQuery) {
      items = items.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterTime !== 'all') {
        items = items.filter(r => {
            if (filterTime === '<30') return r.cookingTime < 30;
            if (filterTime === '30-60') return r.cookingTime >= 30 && r.cookingTime <= 60;
            if (filterTime === '>60') return r.cookingTime > 60;
            return true;
        });
    }

    if (filterDifficulty !== 'all') {
        items = items.filter(r => r.difficulty === filterDifficulty);
    }

    if (filterSpice !== 'all') {
        items = items.filter(r => r.spiceLevel === filterSpice);
    }

    items.sort((a, b) => {
        const difficultyOrder = { beginner: 1, intermediate: 2, expert: 3 };
        const spiceOrder = { mild: 1, medium: 2, hot: 3 };
        switch (sortBy) {
            case 'time-asc': return a.cookingTime - b.cookingTime;
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-za': return b.name.localeCompare(a.name);
            case 'difficulty-asc': return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
            case 'difficulty-desc': return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
            case 'spice-asc': return spiceOrder[a.spiceLevel] - spiceOrder[b.spiceLevel];
            case 'match-desc': default: return b.finalScore - a.finalScore;
        }
    });

    return items;
  }, [inventory, recipes, searchQuery, sortBy, filterTime, filterDifficulty, filterSpice]);

  const areFiltersActive = useMemo(() => {
    return searchQuery || filterTime !== 'all' || filterDifficulty !== 'all' || filterSpice !== 'all';
  }, [searchQuery, filterTime, filterDifficulty, filterSpice]);

  const { canCookNow, almostReady } = useMemo(() => {
    const canCookNow: MatchedRecipe[] = [];
    const almostReady: MatchedRecipe[] = [];
    processedRecipes.forEach(recipe => {
      if (recipe.missingIngredients.length === 0) {
        canCookNow.push(recipe);
      } else {
        almostReady.push(recipe);
      }
    });
    return { canCookNow, almostReady };
  }, [processedRecipes]);

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

    <div className="space-y-2 py-1">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <BookOpen className="text-primary" size={36} />
          <div>
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">
              Recipes
            </h1>
            <div className="flex items-center gap-1.5">
              <Info size={14} className="text-text-secondary" />
              <p className="text-text-secondary font-medium">
                Find meals based on what you already have
              </p>
            </div>
          </div>
          </div>

        <Link 
          href="/recipes/add"
          className="flex items-center gap-2 bg-green-500 text-white font-semibold px-4 py-2 rounded-lg 
                    hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
        >
          <PlusCircle size={20} />
          Add Custom Recipe
        </Link>
      </div>


        
      
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <input
              type="text"
              placeholder="Search by name or ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow p-2 border rounded-md text-sm"
          />
          <FilterAndSort
            sortOptions={sortOptions}
            sortBy={sortBy}
            setSortBy={setSortBy}
            activeFilterCount={[filterTime, filterDifficulty, filterSpice].filter(f => f !== 'all').length}
            filterContent={
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Cooking Time</h4>
                  <select aria-label="Filter by time" value={filterTime} onChange={e => setFilterTime(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                    <option value="all">Any</option>
                    <option value="<30">&lt; 30 mins</option>
                    <option value="30-60">30-60 mins</option>
                    <option value=">60">&gt; 60 mins</option>
                  </select>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Difficulty</h4>
                  <select aria-label="Filter by difficulty" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                    <option value="all">Any</option>
                    {difficulties.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Spice Level</h4>
                  <select aria-label="Filter by spice level" value={filterSpice} onChange={e => setFilterSpice(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                    <option value="all">Any</option>
                    {spiceLevels.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            }
          />
        </div>
        {recipeIngredientFilter && (
            <div>
                <button
                    onClick={() => {
                        setSearchQuery('');
                        setRecipeIngredientFilter(null);
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-xs"
                >
                    Clear ingredient filter: &quot;{recipeIngredientFilter}&quot;
                </button>
            </div>
        )}
      </Card>

      {processedRecipes.length > 0 ? (
        areFiltersActive ? (
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4 text-text-primary">
              <Filter size={24} /> Filtered Results ({processedRecipes.length})
            </h2>
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
          </div>
        ) : (
          <div className="space-y-12">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4 text-text-primary">
                <ChefHat size={24} className="text-accent" /> You Can Cook Now ({canCookNow.length})
              </h2>
              {canCookNow.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {canCookNow.map((recipe) => (
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
                <div className="text-center py-10 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 rounded-lg"> 
                  <CookingPot size={48} className="mx-auto text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-text-primary">No Recipes Match 100% Yet</h3>
                  <p className="mt-1 text-sm text-text-secondary">Add more ingredients to see recipes you can make right away!</p>
                  <Link href="/scanner" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover: transition-all duration-300 transform hover:scale-105 shadow-md">
                    Add Ingredients
                  </Link>
                </div>
              )}
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4 text-text-primary">
                <CookingPot size={24} className="text-orange-500" /> Almost Ready ({almostReady.length})
              </h2>
              {almostReady.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {almostReady.map((recipe) => (
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
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Frown size={48} className="mx-auto text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-text-primary">No Recipes to Show Here</h3>
                    <p className="mt-1 text-sm text-text-secondary">Your pantry is well-stocked! No recipes are &quot;almost ready.&quot;</p>
                </div>
              )}
            </div>
          </div>
        )
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