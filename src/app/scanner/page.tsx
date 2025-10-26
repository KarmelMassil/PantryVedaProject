"use client";
import React, { useState } from 'react';
import { CameraScanner } from '@/components/scanner/CameraScanner';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { usePantryStore, MasterIngredient } from '@/store/pantryStore';
import { Ingredient } from '@/types';
import { format, formatISO, addDays } from 'date-fns';
import { PackagePlus, Trash2, PlusCircle } from 'lucide-react';
import { mapLabelToDbName } from '@/lib/labelMapper';
import { AddIngredientModal } from '@/components/AddIngredientModal';

type ScannedItem = Omit<Ingredient, 'id'>;

// Helper function to format ingredient names to Title Case
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function ScannerPage() {
  const { addIngredient, masterIngredientList, addMasterIngredient } = usePantryStore();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<Omit<Ingredient, 'id'>> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveNewIngredient = (ingredient: MasterIngredient) => {
    const formattedName = toTitleCase(ingredient.name.trim());
    if (!formattedName) {
      alert("Ingredient name cannot be empty.");
      return;
    }
    const isDuplicate = masterIngredientList.some(
      item => item.name.toLowerCase() === formattedName.toLowerCase()
    );
    if (isDuplicate) {
      alert(`'${formattedName}' already exists in your ingredient database!`);
      return;
    }
    addMasterIngredient({ ...ingredient, name: formattedName });
    alert(`'${formattedName}' has been added to your master ingredient database!`);
  }

  const handleSelectItem = (ingredient: MasterIngredient) => {
    const purchaseDate = new Date();
    const newItem = {
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      purchaseDate: formatISO(purchaseDate),
      expiryDate: formatISO(addDays(purchaseDate, ingredient.defaultExpiryDays)),
      quantity: 1,
      value: 0
    };
    setScannedItems(prev => [...prev, newItem as ScannedItem]);
  };

  const handleUpdateItem = (index: number, field: keyof ScannedItem, value: any) => {
    setScannedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };
  
  const handleSaveToPantry = () => {
    if (scannedItems.length === 0) return;
    scannedItems.forEach(item => addIngredient(item));
    setScannedItems([]);
    alert(`${scannedItems.length} item(s) saved to your pantry!`);
  };

  const handleRecognition = (detectedLabels: string[]) => {
    if (detectedLabels.length === 0) {
      console.log("No labels were detected by the model.");
      return;
    }
    for (const label of detectedLabels) {
      const dbName = mapLabelToDbName(label);

      if (dbName) {
        const ingredientInfo = masterIngredientList.find(
          item => item.name === dbName
        );

        if (ingredientInfo) {
          console.log(`Recognized: '${label}' -> Mapped to: '${dbName}'`);
          handleSelectItem(ingredientInfo);
          return; 
        }
      }
    }
    console.warn("Detected labels could not be mapped to any known ingredient:", detectedLabels);
    alert("Could not recognize a known ingredient. Please try adding it manually.");
  };

return (
  <>
    <AddIngredientModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewIngredient}
        />
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Smart Scanner</h1>
      <p className="text-text-secondary">Scan items with your camera or search manually, then edit details and add to your list.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Input Methods */}
        <div className="space-y-6">
          {/* Camera Scanner */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Camera Scanner</h2>
            <CameraScanner onRecognize={handleRecognition}/>
          </div>
          
          {/* Manual Search */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Manual Search</h2>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm flex items-center gap-1 text-accent-secondary font-semibold hover:underline"
                  >
                    <PlusCircle size={16} />
                    New to Database?
                  </button>
              </div>
            <p className="text-sm text-text-secondary mb-4">Search and select an ingredient to add it to your list.</p>
            <IngredientAutocomplete 
              masterList={masterIngredientList}
              onSelect={handleSelectItem} 
            />
          </div>
        </div>

        {/* Right Side: Items List with Inline Editing */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Items to Add ({scannedItems.length})</h2>
            <button
              onClick={handleSaveToPantry}
              disabled={scannedItems.length === 0}
              className="bg-dal-orange text-white font-bold px-6 py-2.5 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors shadow-sm"
            >
              Save All to Pantry
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {scannedItems.length > 0 ? scannedItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 p-4 transition-all hover:shadow-sm">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <p className="font-bold text-base text-text-primary mb-0.5">{item.name}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">{item.category}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Quantity</label>
                    <input 
                      type="number" 
                      value={item.quantity || ''} 
                      onChange={e => handleUpdateItem(index, 'quantity', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md text-center font-semibold focus:ring-2 focus:ring-accent-secondary focus:border-transparent" 
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Unit</label>
                    <div className="py-2 px-2 text-center text-sm font-medium text-gray-700">
                      {item.unit}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Price (₹)</label>
                    <input 
                      type="number" 
                      value={item.value || ''} 
                      onChange={e => handleUpdateItem(index, 'value', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md text-center font-semibold focus:ring-2 focus:ring-accent-secondary focus:border-transparent" 
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Expiry Date</label>
                    <input 
                      type="date" 
                      value={item.expiryDate ? format(new Date(item.expiryDate), 'yyyy-MM-dd') : ''} 
                      onChange={e => handleUpdateItem(index, 'expiryDate', formatISO(e.target.valueAsDate!))}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-accent-secondary focus:border-transparent" 
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-medium text-transparent block mb-1">Del</label>
                    <button 
                      onClick={() => setScannedItems(prev => prev.filter((_, i) => i !== index))}
                      className="w-full text-chili-red hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <PackagePlus size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">No items yet</p>
                <p className="text-sm text-gray-500 mt-1">Scan or search for items to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}