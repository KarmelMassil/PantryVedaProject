"use client";
import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { usePantryStore, DayPlan } from '@/store/pantryStore';
import { DraggableRecipeCard } from '@/components/meal-plan/DraggableRecipeCard';
import { DroppableMealSlot } from '@/components/meal-plan/DroppableMealSlot';
import { format, addDays, startOfWeek, subDays, endOfWeek, set } from 'date-fns';
import { ArrowLeft, ArrowRight, ShoppingCart, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RecipeModal } from '@/components/RecipeModal';
import { Recipe } from '@/types';
import { getProjectedInventory, getBestSuggestion } from '@/lib/mealPlanLogic';
import { CookingModeModal } from '@/components/CookingModeModal';

type CookingContext = { date: string, meal: keyof DayPlan } | null;

export default function MealPlannerPage() {
  const { recipes, mealPlan, inventory, assignRecipeToMeal, addItemsToShoppingList, logConsumption, deductFromInventory, preferences, addToast } = usePantryStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeRecipe, setActiveRecipe] = useState<string | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [cookingContext, setCookingContext] = useState<CookingContext>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    setActiveRecipe(null); 
    if (over && over.data.current && active.data.current) {
      const recipeId = active.data.current.recipeId as string;
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;

      const { date, meal } = over.data.current as { date: string; meal: keyof DayPlan };
      assignRecipeToMeal(date, meal, recipeId, recipe.baseServings);
    }
  };

  const weekStartsOn = 1;
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const goToPreviousWeek = () => setCurrentDate(subDays(currentDate, 7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleOpenViewModal = (recipe: Recipe, context?: CookingContext) => {
    if (context) {
      setCookingRecipe(recipe);
      setCookingContext(context);
    } else {
      setViewingRecipe(recipe);
    }
  };
  
  const handleCloseModal = () => {
    setViewingRecipe(null);
    setCookingContext(null);
    setCookingRecipe(null);
  };

  const handleFinishCooking = (recipe: Recipe) => {
    if (!cookingContext) return;

    // 1. Log consumption
    const consumptionEvents = recipe.ingredients.map(ing => ({
      ingredientName: ing.name,
      quantityConsumed: ing.quantity,
      unit: ing.unit as any,
      timestamp: new Date().toISOString(),
      context: 'recipe' as 'recipe',
      recipeId: recipe.id,
    }));
    logConsumption(consumptionEvents);

    // 2. Deduct from inventory
    recipe.ingredients.forEach(ing => {
      deductFromInventory(ing.name, ing.quantity);
    });

    addToast(`Enjoy your ${recipe.name}! Ingredients have been logged and deducted.`, 'success');
    handleCloseModal();
  };
  
  // --- FILTER RECIPE LIST ---
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  // --- CALCULATE SUGGESTIONS ---
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i));

  // Pre-calculate all suggestions for the week
  const suggestions = useMemo(() => {
    const dailySuggestions: Record<string, { breakfast: Recipe, lunch: Recipe, dinner: Recipe }> = {};
    let lastProjectedInventory = inventory;
    
    for (const day of weekDays) {
        // Get projected inventory *up to* the start of this day
        const projectedInventory = getProjectedInventory(inventory, mealPlan, recipes, day);
        // Get a single best suggestion based on that projection
        const bestSuggestion = getBestSuggestion(projectedInventory, recipes, preferences);
        
        dailySuggestions[format(day, 'yyyy-MM-dd')] = {
            breakfast: bestSuggestion, // Simple: use same suggestion for all
            lunch: bestSuggestion,
            dinner: bestSuggestion
        };
    }
    return dailySuggestions;
  }, [inventory, mealPlan, recipes, preferences, currentDate]);
  

  return (
    <>
      {viewingRecipe && (
        <RecipeModal recipe={viewingRecipe} onClose={handleCloseModal} />
      )}
      {cookingRecipe && cookingContext && (
        <CookingModeModal
          recipe={cookingRecipe}
          initialServings={mealPlan[cookingContext.date]?.[cookingContext.meal]?.servings}
          onClose={handleCloseModal}
          onFinishCooking={handleFinishCooking}
        />
      )}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-6 overflow-hidden">
          <aside className="w-64 bg-white p-4 rounded-xl shadow-md flex-shrink-0">
            <h2 className="text-xl font-bold mb-4">Recipes</h2>
            {/* --- SEARCH BAR --- */}
            <div className="relative mb-4">
                <input 
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 pl-8 border rounded-md text-sm"
                />
                <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
            </div>

            <div className="h-[calc(100vh-220px)] overflow-y-auto pr-2">
              {filteredRecipes.map(recipe => (
                <DraggableRecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  onView={handleOpenViewModal} 
                />
              ))}
            </div>
          </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h1 className="text-3xl font-bold text-text-primary">Weekly Meal Planner</h1>
            <div className="flex items-center gap-4">
              <button onClick={goToPreviousWeek} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeft size={20}/></button>
              <h2 className="text-xl font-semibold">{format(weekStart, 'MMMM yyyy')}</h2>
              <button onClick={goToNextWeek} className="p-2 rounded-full hover:bg-gray-200"><ArrowRight size={20}/></button>
            </div>
          </div>

          <div className="space-y-1">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-1  font-bold text-center text-gray-500 uppercase">
              <div>Day</div>
              <div>Breakfast</div>
              <div>Lunch</div>
              <div>Dinner</div>
            </div>

            {/* Day Rows */}
            {weekDays.map(day => {
              const dateString = format(day, 'yyyy-MM-dd');
              const dayPlan = mealPlan[dateString];
              const daySuggestions = suggestions[dateString];
              return (
                <div key={dateString} className="grid grid-cols-4 gap-4 items-center bg-white/60 p-3 rounded-lg">
                  <div className="text-center">
                    <p className="font-bold">{format(day, 'EEE')}</p>
                    <p className="text-2xl font-bold text-accent-primary">{format(day, 'd')}</p>
                  </div>
                  <DroppableMealSlot date={dateString} meal="breakfast" mealPlan={dayPlan} onViewRecipe={handleOpenViewModal} suggestion={!dayPlan?.breakfast?.recipeId ? daySuggestions?.breakfast : undefined} />
                  <DroppableMealSlot date={dateString} meal="lunch" mealPlan={dayPlan} onViewRecipe={handleOpenViewModal} suggestion={!dayPlan?.lunch?.recipeId ? daySuggestions?.lunch : undefined} />
                  <DroppableMealSlot date={dateString} meal="dinner" mealPlan={dayPlan} onViewRecipe={handleOpenViewModal} suggestion={!dayPlan?.dinner?.recipeId ? daySuggestions?.dinner : undefined} />
                </div>
              );
            })}
          </div>
        </main>
      </div>
      <DragOverlay>
        {activeRecipe ? (
          <div className="p-2 bg-white border rounded-lg shadow-lg">
            {recipes.find(r => r.id === activeRecipe)?.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </>
  );
}