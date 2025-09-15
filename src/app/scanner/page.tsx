"use client";
import React, { useState } from 'react';
import { CameraScanner } from '@/components/scanner/CameraScanner';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { usePantryStore } from '@/store/pantryStore';
import { Ingredient } from '@/types';
import { format, formatISO } from 'date-fns';
import { calculateDefaultExpiry } from '@/lib/dateUtils';
import { PackagePlus, Trash2 } from 'lucide-react';

type ScannedItem = Omit<Ingredient, 'id'>;

export default function ScannerPage() {
  const { addIngredient } = usePantryStore();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<ScannedItem>>({});

  const handleSelectIngredient = (ingredient: Omit<ScannedItem, 'quantity' | 'purchaseDate' | 'expiryDate' | 'value'>) => {
    const purchaseDate = new Date();
    setCurrentItem({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      purchaseDate: formatISO(purchaseDate),
      expiryDate: calculateDefaultExpiry(purchaseDate, ingredient.category),
      quantity: 1,
      value: 0
    });
  };

  const handleAddItem = () => {
    if (currentItem.name && currentItem.quantity && currentItem.quantity > 0) {
      setScannedItems(prev => [...prev, currentItem as ScannedItem]);
      setCurrentItem({}); // Reset form
    } else {
      alert("Please select an ingredient and enter a valid quantity.");
    }
  };
  
  const handleSaveToPantry = () => {
    if (scannedItems.length === 0) return;
    scannedItems.forEach(item => addIngredient(item));
    setScannedItems([]);
    alert(`${scannedItems.length} item(s) saved to your pantry!`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Smart Scanner</h1>
      <p className="text-text-secondary">Add ingredients using AI recognition or manual entry.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Camera and Manual Entry */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Camera Scanner</h2>
            <CameraScanner />
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Ingredient Database</h2>
             <div className="space-y-3">
                <IngredientAutocomplete onSelect={handleSelectIngredient} />
                {currentItem.name && (
                    <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                        <h3 className="col-span-2 text-lg font-semibold">{currentItem.name}</h3>
                        <div>
                            <label className="text-sm font-medium">Quantity</label>
                            <input type="number" value={currentItem.quantity || ''} onChange={e => setCurrentItem(p => ({...p, quantity: parseFloat(e.target.value)}))} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Unit</label>
                            <input type="text" value={currentItem.unit || ''} readOnly className="w-full p-2 border bg-gray-100 border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Cost (₹)</label>
                            <input type="number" value={currentItem.value || ''} onChange={e => setCurrentItem(p => ({...p, value: parseFloat(e.target.value)}))} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                         <div>
                            <label className="text-sm font-medium">Expiry Date</label>
                            <input type="date" value={currentItem.expiryDate ? format(new Date(currentItem.expiryDate), 'yyyy-MM-dd') : ''} onChange={e => setCurrentItem(p => ({...p, expiryDate: formatISO(e.target.valueAsDate!)}))} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="col-span-2">
                            <button onClick={handleAddItem} className="w-full bg-accent-secondary text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
                                <PackagePlus size={20} /> Add Item
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Right Side: Scanned Items List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Scanned Items ({scannedItems.length})</h2>
            <button
              onClick={handleSaveToPantry}
              disabled={scannedItems.length === 0}
              className="bg-dal-orange text-white font-bold px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
            >
              Save All to Pantry
            </button>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {scannedItems.length > 0 ? scannedItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                <div>
                    <p className="font-bold text-text-primary">{item.name}</p>
                    <p className="text-sm text-text-secondary">{item.quantity} {item.unit} • Expires on {format(new Date(item.expiryDate), 'dd MMM yyyy')}</p>
                </div>
                 <button 
                    onClick={() => setScannedItems(prev => prev.filter((_, i) => i !== index))}
                    className="text-chili-red hover:bg-red-100 p-2 rounded-full"
                  >
                    <Trash2 size={18} />
                </button>
              </div>
            )) : (
              <div className="text-center py-10">
                <p className="text-text-secondary">No items scanned yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}