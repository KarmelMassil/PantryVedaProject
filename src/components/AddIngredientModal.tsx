"use client";
import { useState } from 'react';
import { MasterIngredient } from '@/store/pantryStore';
import { X } from 'lucide-react';
import { usePantryStore } from '@/store/pantryStore';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ingredient: MasterIngredient) => void;
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MasterIngredient['category']>('Vegetables');
  const [expiry, setExpiry] = useState(7);
  const [unit, setUnit] = useState<MasterIngredient['unit']>('pcs');
  const addToast = usePantryStore((state) => state.addToast);

  const handleSave = () => {
    if (!name || expiry <= 0) {
      addToast("Please fill in all fields correctly.", 'error');
      return;
    }
    onSave({ name, category, defaultExpiryDays: expiry, unit });
    onClose(); // Close the modal after saving
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Add a New Ingredient</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ingredient Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="e.g., Fenugreek Seeds" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option>Vegetables</option>
              <option>Fruits</option>
              <option>Spices</option>
              <option>Grains</option>
              <option>Dairy</option>
              <option>Meats</option>
              <option>Herbs</option>
              <option>Other</option>
            </select>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Default Shelf Life (in days)</label>
            <input type="number" value={expiry} onChange={(e) => setExpiry(parseInt(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Default Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option value="pcs">pcs</option>
              <option value="bunches">bunches</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-2 bg-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">Save to Database</button>
        </div>
      </div>
    </div>
  );
};