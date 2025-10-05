"use client";
import React, { useState } from 'react';
import { CameraScanner } from '@/components/scanner/CameraScanner';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { usePantryStore } from '@/store/pantryStore';
import { Ingredient } from '@/types';
import { format, formatISO } from 'date-fns';
import { calculateDefaultExpiry } from '@/lib/dateUtils';
import { PackagePlus, Trash2 } from 'lucide-react';
import { indianIngredientsDatabase } from '@/data/ingredients';

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

  const handleSimulatedRecognition = () => {
    const randomIngredient = indianIngredientsDatabase[Math.floor(Math.random() * indianIngredientsDatabase.length)];
    const purchaseDate = new Date();
    
    const newScannedItem: ScannedItem = {
      name: randomIngredient.name,
      category: randomIngredient.category,
      unit: randomIngredient.unit,
      quantity: 1, // Default quantity
      value: Math.floor(Math.random() * 100) + 20, // Random value
      purchaseDate: formatISO(purchaseDate),
      expiryDate: calculateDefaultExpiry(purchaseDate, randomIngredient.category),
    };

    setScannedItems(prev => [...prev, newScannedItem]);
  };

  /*
  const handleRecognition = (detectedLabels: string[]) => {
    const newItems: ScannedItem[] = [];
    const purchaseDate = new Date();

    detectedLabels.forEach(label => {
      // Find the full ingredient details from our database
      const ingredientInfo = indianIngredientsDatabase.find(
        item => item.name.toLowerCase() === label.toLowerCase()
      );

      if (ingredientInfo) {
        newItems.push({
          name: ingredientInfo.name,
          category: ingredientInfo.category,
          unit: ingredientInfo.unit,
          quantity: 1, // Default quantity
          value: Math.floor(Math.random() * 100) + 20, // Random value for now
          purchaseDate: formatISO(purchaseDate),
          expiryDate: calculateDefaultExpiry(purchaseDate, ingredientInfo.category),
        });
      }
    });

    if (newItems.length > 0) {
      setScannedItems(prev => [...prev, ...newItems]);
    } else {
      console.log("No known ingredients were detected.");
    }
  };
  */

  const handleRecognition = (detectedLabels: string[]) => {
    // --- START OF DEBUGGING CODE ---
    // Log the labels exactly as the model predicted them.
    console.log("Labels received from model:", detectedLabels);
    
    // Log all the known ingredient names from our database for comparison.
    const knownIngredientNames = indianIngredientsDatabase.map(i => i.name.toLowerCase());
    console.log("Known ingredients in database:", knownIngredientNames);
    // --- END OF DEBUGGING CODE ---

    const newItems: ScannedItem[] = [];
    const purchaseDate = new Date();

    detectedLabels.forEach(label => {
      // Proactive Fix: Use .trim() to remove whitespace from the model's prediction.
      const cleanedLabel = label.trim().toLowerCase();
      
      const ingredientInfo = indianIngredientsDatabase.find(
        item => item.name.toLowerCase() === cleanedLabel
      );

      if (ingredientInfo) {
        // This part is working, but the 'if' condition is never met.
        newItems.push({
          name: ingredientInfo.name,
          category: ingredientInfo.category,
          unit: ingredientInfo.unit,
          quantity: 1,
          value: Math.floor(Math.random() * 100) + 20,
          purchaseDate: formatISO(purchaseDate),
          expiryDate: calculateDefaultExpiry(purchaseDate, ingredientInfo.category),
        });
      } else {
        // This log will now tell you exactly which label is failing.
        console.warn(`'${label}' not found in the ingredient database.`);
      }
    });

    if (newItems.length > 0) {
      setScannedItems(prev => [...prev, ...newItems]);
    } else {
      console.log("No known ingredients were detected."); // This is the message you are currently seeing.
    }
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
            <CameraScanner onRecognize={handleRecognition}/>
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