"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore, ShoppingListItem, MasterIngredient } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { Trash2, Plus, Share2, Download, Lightbulb, PackagePlus } from 'lucide-react';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { getSmartSuggestions } from '@/lib/suggestionOrchestrator';
import { format, formatISO } from 'date-fns';

export default function ShoppingListPage() {
  const { 
    shoppingList, 
    inventory,
    consumptionLog,
    wasteLog,
    mealPlan,
    recipes,
    masterIngredientList,
    updateShoppingListItem, 
    removeShoppingListItem, 
    addItemsToShoppingList,
    restockCheckedItems 
  } = usePantryStore();

  const [selectedItem, setSelectedItem] = useState<MasterIngredient | null>(null);
  const [itemQuantity, setItemQuantity] = useState('1');

  const handleAddSelectedItem = () => {
    if (!selectedItem) return;
    const itemToAdd: Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'> = {
      name: selectedItem.name,
      category: selectedItem.category,
      quantity: parseFloat(itemQuantity) || 1,
      unit: selectedItem.unit,
      defaultExpiryDays: selectedItem.defaultExpiryDays || 14,
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
    const finalSuggestions = await getSmartSuggestions(inventory, consumptionLog, wasteLog, mealPlan, recipes, masterIngredientList);
    if (finalSuggestions.length > 0) {
      addItemsToShoppingList(finalSuggestions);
      alert(`Added ${finalSuggestions.length} smart suggestion(s) to your list!`);
    } else {
      alert("No smart suggestions right now. Cook more meals to generate data!");
    }
  };

  const handleRestock = () => {
    if (window.confirm("Are you sure you want to add all checked items to your pantry and remove them from this list?")) {
        restockCheckedItems();
    }
 };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-grow space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Smart Shopping List</h1>
          <div>
             <button
                onClick={handleRestock}
                className="flex items-center gap-2 bg-accent-secondary text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <PackagePlus size={20} />
                Restock Checked Items
              </button>
          </div>
        </div>

        {/* AutoComplete Form */}
        <Card>
          <h3 className="font-bold mb-2">Add Ingredient from Database</h3>
          <div className="space-y-2">
            <IngredientAutocomplete 
              masterList={masterIngredientList}
              onSelect={(ingredient) => setSelectedItem(ingredient)} 
            />
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
                    <li key={item.id} className={`flex items-center gap-4 p-3 ${item.checked ? 'bg-gray-100/50' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={item.checked}
                        onChange={(e) => updateShoppingListItem(item.id, { checked: e.target.checked })}
                        className="h-5 w-5 rounded border-gray-300 text-accent-secondary focus:ring-accent-secondary flex-shrink-0"
                      />
                      <div className={`flex-grow ${item.checked ? 'text-gray-400' : ''}`}>
                        <p className={`font-semibold ${item.checked ? 'line-through' : ''}`}>{item.name}</p>
                        <span className="text-xs text-text-secondary">{item.category}</span>
                      </div>
                      
                      {/* --- INLINE EDITING FIELDS --- */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateShoppingListItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-16 p-1 border rounded-md text-sm text-right"
                        />
                        <span className="text-sm text-gray-500 w-12">{item.unit}</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateShoppingListItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          className="w-20 p-1 border rounded-md text-sm text-right"
                          placeholder="₹ price"
                        />
                        <input
                          type="date"
                          value={format(new Date(item.expiryDate), 'yyyy-MM-dd')}
                          onChange={(e) => updateShoppingListItem(item.id, { expiryDate: formatISO(e.target.valueAsDate!) })}
                          className="w-32 p-1 border rounded-md text-sm"
                        />
                        <button onClick={() => removeShoppingListItem(item.id)} className="text-gray-400 hover:text-chili-red">
                          <Trash2 size={18}/>
                        </button>
                      </div>
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
