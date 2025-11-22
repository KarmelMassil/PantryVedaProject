"use client";
import { Recipe } from '@/types';
import { X, CalendarPlus, Minus, Plus, Users } from 'lucide-react';
import React, { useState } from 'react';
import { format } from 'date-fns';
import { usePantryStore } from '@/store/pantryStore';

interface AddToMealPlanModalProps {
  recipe: Recipe;
  onClose: () => void;
  onSave: (recipeId: string, date: string, meal: 'breakfast' | 'lunch' | 'dinner', servings: number) => void;
}

export const AddToMealPlanModal: React.FC<AddToMealPlanModalProps> = ({ recipe, onClose, onSave }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner'>('dinner');
  const [desiredServings, setDesiredServings] = useState(recipe.baseServings);
  const addToast = usePantryStore((state) => state.addToast);

  const handleSave = () => {
    if (!selectedDate) {
      addToast("Please select a date.");
      return;
    }
    onSave(recipe.id, selectedDate, selectedMeal, desiredServings);
    onClose();
  };

  const handleServingsChange = (amount: number) => {
    setDesiredServings(prev => Math.max(1, prev + amount));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4">Add &quot;{recipe.name}&quot; to Meal Plan</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Meal</label>
            <select 
              value={selectedMeal} 
              onChange={(e) => setSelectedMeal(e.target.value as any)} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Servings</label>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => handleServingsChange(-1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={14}/></button>
              <span className="flex items-center gap-1"><Users size={16} /> {desiredServings}</span>
              <button onClick={() => handleServingsChange(1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={14}/></button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="bg-accent-secondary text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
            <CalendarPlus size={18} /> Add to Plan
          </button>
        </div>
      </div>
    </div>
  );
};