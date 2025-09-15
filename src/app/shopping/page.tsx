"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore, ShoppingListItem } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { findCategory, generateLowStockSuggestions } from '@/lib/shoppingListGenerator';
import { Trash2, Plus, Share2, Download, Lightbulb } from 'lucide-react';

export default function ShoppingListPage() {
  const { 
    shoppingList, 
    inventory,
    updateShoppingListItem, 
    removeShoppingListItem, 
    addItemsToShoppingList 
  } = usePantryStore();

  const [customItem, setCustomItem] = useState({ name: '', quantity: '1' });

  const handleAddCustomItem = () => {
    if (!customItem.name) return;
    const item: Omit<ShoppingListItem, 'id' | 'checked'> = {
      name: customItem.name,
      quantity: parseFloat(customItem.quantity),
      unit: 'pcs', // Default unit for custom items
      category: findCategory(customItem.name) || 'Other',
    };
    addItemsToShoppingList([item]);
    setCustomItem({ name: '', quantity: '1' }); // Reset form
  };

  const handleAddLowStock = () => {
    const lowStockItems = generateLowStockSuggestions(inventory);
    if (lowStockItems.length > 0) {
      addItemsToShoppingList(lowStockItems);
      alert(`Added ${lowStockItems.length} low-stock item(s) to your list!`);
    } else {
      alert("No staple items are running low right now.");
    }
  };

  const categorizedList = useMemo(() => {
    return shoppingList.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);
  }, [shoppingList]);

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

        {/* Manual Add Form */}
        <Card className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Add Custom Item (e.g., Paper Towels)"
            value={customItem.name}
            onChange={(e) => setCustomItem({...customItem, name: e.target.value})}
            className="flex-grow p-2 border border-gray-300 rounded-md"
          />
          <input 
            type="number" 
            value={customItem.quantity}
            onChange={(e) => setCustomItem({...customItem, quantity: e.target.value})}
            className="w-20 p-2 border border-gray-300 rounded-md"
          />
          <button onClick={handleAddCustomItem} className="bg-accent-primary text-white p-2 rounded-lg hover:bg-orange-700">
            <Plus size={24} />
          </button>
        </Card>

        {/* List */}
        <div className="space-y-4">
          {Object.entries(categorizedList).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-text-primary mb-2">{category} ({items.length})</h2>
              <Card className="p-0">
                <ul className="divide-y divide-gray-200">
                  {items.map(item => (
                    <li key={item.id} className={`flex items-center gap-4 p-4 ${item.checked ? 'bg-gray-100' : ''}`}>
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
             <button onClick={handleAddLowStock} className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 border mb-2">
                <p className="font-semibold">Add Low-Stock Staples</p>
                <p className="text-xs text-text-secondary">Restock essentials like onions, rice, etc.</p>
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