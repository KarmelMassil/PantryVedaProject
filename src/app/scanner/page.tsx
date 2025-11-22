"use client";
import React, { useState } from 'react';
import { CameraScanner } from '@/components/scanner/CameraScanner';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { usePantryStore, MasterIngredient } from '@/store/pantryStore';
import { Ingredient } from '@/types';
import { format, formatISO, addDays } from 'date-fns';
import { PackagePlus, Trash2, PlusCircle, ScanLine, Info } from 'lucide-react';
import { mapLabelToDbName } from '@/lib/labelMapper';
import { AddIngredientModal } from '@/components/AddIngredientModal';

type ScannedItem = Omit<Ingredient, 'id'>;

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function ScannerPage() {
  const { addIngredient, masterIngredientList, addMasterIngredient, addToast } = usePantryStore();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<Omit<Ingredient, 'id'>> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');

  const handleSaveNewIngredient = (ingredient: MasterIngredient) => {
    const formattedName = toTitleCase(ingredient.name.trim());
    if (!formattedName) {
      addToast("Ingredient name cannot be empty.", 'error');
      return;
    }
    const isDuplicate = masterIngredientList.some(
      item => item.name.toLowerCase() === formattedName.toLowerCase()
    );
    if (isDuplicate) {
      addToast(`'${formattedName}' already exists in your ingredient database!`, 'info');
      return;
    }
    addMasterIngredient({ ...ingredient, name: formattedName });
    addToast(`'${formattedName}' has been added to your master ingredient database!`, 'success');
    handleSelectItem({ ...ingredient, name: formattedName });
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
    addToast(`${scannedItems.length} item(s) saved to your pantry!`, 'success');
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
    addToast("Could not recognize a known ingredient. Please try adding it manually.", 'error');
  };

return (
  <>
    <AddIngredientModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewIngredient}
        />
    <div className="space-y-2 py-1">
        <div className="flex items-center gap-3">
            <ScanLine className="text-primary" size={36} />
            <div>
                <h1 className="text-4xl font-bold text-text-primary tracking-tight">Camera Scanner</h1>
                <div className="flex items-center gap-1.5">
                    <Info size={14} className="text-text-secondary" />
                    <p className="text-text-secondary font-medium">Scan ingredients or add them manually</p>
                </div>
            </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Side: Input Methods */}
        <div className="lg:col-span-2 space-y-6">
          {/* Camera Scanner */}
          <div className="bg-white rounded-xl shadow-md p-3">
            <h2 className="text-xl font-bold mb-2">Camera Scanner</h2>
            <CameraScanner onRecognize={handleRecognition}/>
          </div>
          
          {/* Manual Search */}
          <div className="bg-white rounded-xl shadow-md p-3">
             <h2 className="text-xl font-bold">Manual Search</h2>
            <p className="text-sm text-text-secondary mb-2">Search and select an ingredient to add it to your list.</p>
            <IngredientAutocomplete 
              masterList={masterIngredientList}
              value={autocompleteQuery}
              onChange={setAutocompleteQuery}
              onSelect={(ingredient) => {
                handleSelectItem(ingredient);
                setAutocompleteQuery('');
              }}
              onAddNew={() => setIsModalOpen(true)}
            />
          </div>
        </div>

        {/* Right Side: Items List with Inline Editing */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-md p-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Items to Add ({scannedItems.length})</h2>
            <button
              onClick={handleSaveToPantry}
              disabled={scannedItems.length === 0}
              className={`font-bold px-6 py-3 rounded-lg transition-all duration-300 text-white shadow-md transform hover:scale-105 ${scannedItems.length > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              Save All to Pantry
            </button>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {scannedItems.length > 0 ? scannedItems.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg border border-gray-100 p-4 transition-all">
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
                      value={item.value ?? '0'}
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
                      className="w-full text-red-500 hover:bg-red-100 p-3 rounded-lg transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
                      title="Remove item"
                    >
                      <Trash2 size={28} />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col justify-center items-center h-full">
                <PackagePlus size={52} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-gray-700 font-bold text-lg">Your list is empty!</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">Use the scanner or manual search to add items. They&apos;ll appear here, ready to be saved to your pantry.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}