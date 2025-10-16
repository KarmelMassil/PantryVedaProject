"use client";
import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { usePantryStore, DayPlan } from '@/store/pantryStore';
import { DraggableRecipeCard } from '@/components/meal-plan/DraggableRecipeCard';
import { DroppableMealSlot } from '@/components/meal-plan/DroppableMealSlot';
import { format, addDays, startOfWeek, subDays, endOfWeek } from 'date-fns';
import { ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MealPlannerPage() {
  const { recipes, mealPlan, inventory, assignRecipeToMeal, addItemsToShoppingList } = usePantryStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeRecipe, setActiveRecipe] = useState<string | null>(null);
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    setActiveRecipe(null); 
    if (over && over.data.current && active.data.current) {
      const recipeId = active.data.current.recipeId as string;
      const { date, meal } = over.data.current as { date: string; meal: keyof DayPlan };
      assignRecipeToMeal(date, meal, recipeId);
    }
  };

  const weekStartsOn = 1;
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const goToPreviousWeek = () => setCurrentDate(subDays(currentDate, 7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={(event) => {
        if (event.active.data.current?.recipeId) {
          setActiveRecipe(event.active.data.current.recipeId);
        }
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveRecipe(null)}>
      <div className="flex h-full gap-6">
        <aside className="w-64 bg-white p-4 rounded-xl shadow-md flex-shrink-0">
          <h2 className="text-xl font-bold mb-4">Recipes</h2>
          <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2">
            {recipes.map(recipe => (
              <DraggableRecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-text-primary">Weekly Meal Planner</h1>
            <div className="flex items-center gap-4">
              <button onClick={goToPreviousWeek} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeft size={20}/></button>
              <h2 className="text-xl font-semibold">{format(weekStart, 'MMMM yyyy')}</h2>
              <button onClick={goToNextWeek} className="p-2 rounded-full hover:bg-gray-200"><ArrowRight size={20}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {weekDays.map(day => {
              const dateString = format(day, 'yyyy-MM-dd');
              return (
                <div key={dateString} className="bg-white/60 p-3 rounded-lg space-y-3">
                  <p className="font-bold text-center">{format(day, 'EEE')}</p>
                  <p className="text-2xl font-bold text-center text-accent-primary">{format(day, 'd')}</p>
                  <DroppableMealSlot date={dateString} meal="breakfast" />
                  <DroppableMealSlot date={dateString} meal="lunch" />
                  <DroppableMealSlot date={dateString} meal="dinner" />
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
  );
}