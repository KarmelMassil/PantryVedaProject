"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore, ShoppingListItem } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { Trash2, Plus, Share2, Download, Lightbulb } from 'lucide-react';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { Ingredient } from '@/types';
import { getSmartSuggestions } from '@/lib/suggestionOrchestrator';

export default function ShoppingListPage() {
  const { 
    shoppingList, 
    inventory,
    consumptionLog,
    wasteLog,
    mealPlan,
    recipes,
    updateShoppingListItem, 
    removeShoppingListItem, 
    addItemsToShoppingList 
  } = usePantryStore();

  type DbIngredient = Omit<Ingredient, 'id' | 'quantity' | 'purchaseDate' | 'expiryDate' | 'value'>;
  const [selectedItem, setSelectedItem] = useState<DbIngredient | null>(null);
  const [itemQuantity, setItemQuantity] = useState('1');

  const handleAddSelectedItem = () => {
    if (!selectedItem) return;

    const itemToAdd: Omit<ShoppingListItem, 'id' | 'checked'> = {
      name: selectedItem.name,
      category: selectedItem.category,
      quantity: parseFloat(itemQuantity) || 1,
      unit: selectedItem.unit,
    };
    
    addItemsToShoppingList([itemToAdd]);
    setSelectedItem(null);
    setItemQuantity('1');
  };

  const categorizedList = useMemo(() => {
    return shoppingList.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);
  }, [shoppingList]);

  const handleGetSmartSuggestions = async () => {
    const finalSuggestions = await getSmartSuggestions(inventory, consumptionLog, wasteLog, mealPlan, recipes);
    
    if (finalSuggestions.length > 0) {
      addItemsToShoppingList(finalSuggestions);
      alert(`Added ${finalSuggestions.length} smart suggestion(s) to your list!`);
    } else {
      alert("No smart suggestions right now. Cook more meals to generate data!");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-grow space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Smart Shopping List</h1>
          <div>
             <button className="bg-white border p-2 rounded-lg mr-2 hover:bg-gray-100"><Share2 size={20}/></button>
             <button className="bg-white border p-2 rounded-lg hover:bg-gray-100"><Download size={20}/></button>
          </div>
        </div>

        {/* AutoComplete Form */}
        <Card>
          <h3 className="font-bold mb-2">Add Ingredient from Database</h3>
          <div className="space-y-2">
            <IngredientAutocomplete onSelect={(ingredient) => setSelectedItem(ingredient)} />
            {selectedItem && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="font-semibold flex-grow">{selectedItem.name}</span>
                <input 
                  type="number" 
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-20 p-2 border border-gray-300 rounded-md"
                  placeholder="Qty"
                />
                <span className="text-sm text-gray-500">{selectedItem.unit}</span>
                <button onClick={handleAddSelectedItem} className="bg-accent-primary text-white p-2 rounded-lg hover:bg-orange-700">
                  <Plus size={24} />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* List */}
        <div className="space-y-4">
          {Object.entries(categorizedList).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-text-primary mb-2">{category} ({items.length})</h2>
              <Card className="p-0">
                <ul className="divide-y divide-gray-200">
                  {items.map(item => (
                    <li key={item.id} className={`flex flex-col gap-1 p-4 ${item.checked ? 'bg-gray-100' : ''}`}>
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox" 
                          checked={item.checked}
                          onChange={(e) => updateShoppingListItem(item.id, { checked: e.target.checked })}
                          className="h-5 w-5 rounded border-gray-300 text-accent-secondary focus:ring-accent-secondary"
                        />
                        <div className={`flex-grow ${item.checked ? 'line-through text-gray-500' : ''}`}>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm">{item.quantity} {item.unit}</p>
                        </div>
                        <button onClick={() => removeShoppingListItem(item.id)} className="text-gray-400 hover:text-chili-red">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                      {/* Display reason and priority */}
                      {(item.reason || item.priority) && (
                        <div className="flex justify-between text-xs text-gray-500 mt-1 ml-7">
                          <span>{item.reason || ''}</span>
                          <span className="font-semibold">{item.priority || ''}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-80 flex-shrink-0 space-y-6">
        <Card>
            <h3 className="font-bold text-lg mb-2">Budget Summary</h3>
            <div className="text-center bg-gray-50 p-4 rounded-lg">
                <p className="text-text-secondary">Estimated Total</p>
                <p className="text-3xl font-bold text-accent-primary">₹0.00</p>
                <p className="text-xs text-text-secondary mt-1">(Price estimation coming soon)</p>
            </div>
        </Card>
         <Card className="bg-yellow-50 border-yellow-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Lightbulb size={20} className="text-yellow-500"/> Smart Tips</h3>
             <button onClick={handleGetSmartSuggestions} className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 border mb-2">
                <p className="font-semibold">Get Smart Suggestions</p>
                <p className="text-xs text-text-secondary">Based on your consumption habits.</p>
            </button>
            <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                <li>Check expiry dates, especially for dairy.</li>
                <li>Bring your own bags for eco-friendly shopping.</li>
            </ul>
        </Card>
      </div>
    </div>
  );
}
