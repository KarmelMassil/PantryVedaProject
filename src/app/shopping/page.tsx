"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore, ShoppingListItem, MasterIngredient } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { Trash2, Plus, Share2, Download, Lightbulb, PackagePlus, PlusCircle, RefreshCw, Loader2, Search } from 'lucide-react';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { getSmartSuggestions } from '@/lib/suggestionOrchestrator';
import { format, formatISO } from 'date-fns';
import { AddIngredientModal } from '@/components/AddIngredientModal';
import { getApproximateWeightDisplay } from '@/lib/unitConverter';
import { error } from 'console';

// Helper function to format ingredient names to Title Case
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Define the type for our suggestions
type Suggestion = Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'> & { reason: string, priority: 'high' | 'medium' | 'low' };

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
    restockCheckedItems,
    addMasterIngredient,
    addToast 
  } = usePantryStore();

  const [selectedItem, setSelectedItem] = useState<MasterIngredient | null>(null);
  const [itemQuantity, setItemQuantity] = useState('1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposedSuggestions, setProposedSuggestions] = useState<Suggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSaveNewIngredient = (ingredient: MasterIngredient) => {
    const formattedName = toTitleCase(ingredient.name.trim());
    if (!formattedName) return addToast("Ingredient name cannot be empty.", "error");
    
    const isDuplicate = masterIngredientList.some(item => item.name.toLowerCase() === formattedName.toLowerCase());
    if (isDuplicate) return addToast(`'${formattedName}' already exists in your database!`, "info");

    addMasterIngredient({ ...ingredient, name: formattedName });
    addToast(`'${formattedName}' has been added to your master database and to shopping list.`, "success");
    // Optionally, select it in the form
    setSelectedItem({ ...ingredient, name: formattedName });
  };

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

  const handleGetSmartSuggestions = async () => {
    setIsSuggesting(true);
    setProposedSuggestions([]); // Clear old suggestions
    const finalSuggestions = await getSmartSuggestions(inventory, consumptionLog, wasteLog, mealPlan, recipes, masterIngredientList);
    setProposedSuggestions(finalSuggestions);
    setIsSuggesting(false);
  };

  const handleAcceptSuggestion = (suggestion: Suggestion) => {
    addItemsToShoppingList([suggestion]);
    setProposedSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
  };

  const handleDismissSuggestion = (suggestionName: string) => {
    setProposedSuggestions(prev => prev.filter(s => s.name !== suggestionName));
  };
  
  const handleAcceptAll = () => {
    addItemsToShoppingList(proposedSuggestions);
    setProposedSuggestions([]);
  };

  const findItemInList = (name: string) => shoppingList.find(item => item.name === name);

  const handleRestock = () => {
    if (window.confirm("Are you sure you want to add all checked items to your pantry and remove them from this list?")) {
        restockCheckedItems();
    }
 };

  const categorizedList = useMemo(() => {
    const filteredList = shoppingList.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filteredList.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);
  }, [shoppingList, searchQuery]); 

  return (
    <>
      <AddIngredientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewIngredient}
      />
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
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold mb-2">Add Ingredient from Database</h3>
            <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm flex items-center gap-1 text-accent-secondary font-semibold hover:underline"
                >
                  <PlusCircle size={16} />
                  New to Database?
            </button>
          </div>
          <div className="space-y-2">
            <IngredientAutocomplete 
              masterList={masterIngredientList}
              onSelect={(ingredient) => setSelectedItem(ingredient)} 
              onAddNew={() => setIsModalOpen(true)}
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

        {/* Search Bar */}
        <div className="relative">
            <input
              type="text"
              placeholder="Search your shopping list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 border rounded-lg"
            />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>


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
                        <span className="text-sm text-gray-500 w-24 text-left">{item.unit}{getApproximateWeightDisplay(item.quantity, item.name)}</span>
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
          {/* Show message if list is empty due to search */}
          {shoppingList.length > 0 && Object.keys(categorizedList).length === 0 && (
            <p className="text-center text-gray-500">No items match your search.</p>
          )}

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
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2"><Lightbulb size={20} className="text-yellow-500"/> Smart Suggestions</h3>
                <button onClick={handleGetSmartSuggestions} disabled={isSuggesting} className="p-1 text-gray-500 hover:text-black disabled:opacity-50">
                  {isSuggesting ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                </button>
              </div>
              
              {/* This is where the proposals will be rendered */}
              <div className="space-y-3">
                {isSuggesting && <p className="text-sm text-center text-gray-600">Analyzing your habits...</p>}
                
                {proposedSuggestions.length > 0 && (
                  <>
                    <button onClick={handleAcceptAll} className="w-full bg-accent-secondary text-white font-semibold py-1.5 rounded-md text-sm">Accept All</button>
                    {proposedSuggestions.map((suggestion, index) => {
                      const existingItem = findItemInList(suggestion.name);
                      return (
                        <div key={index} className="bg-white p-3 rounded-lg border border-yellow-300 shadow-sm">
                          <p className="font-semibold">{suggestion.name}</p>
                          <p className="text-xs text-gray-500 mb-2 italic">{suggestion.reason}</p>
                          
                          {existingItem ? (
                            <p className="text-sm">Update quantity from {existingItem.quantity} to {suggestion.quantity} {suggestion.unit}</p>
                          ) : (
                            <p className="text-sm">Add {suggestion.quantity} {suggestion.unit} to your list</p>
                          )}
                          
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleAcceptSuggestion(suggestion)} className="flex-1 bg-green-600 text-white text-xs font-bold py-1 rounded">Accept</button>
                            <button onClick={() => handleDismissSuggestion(suggestion.name)} className="flex-1 bg-gray-200 text-gray-700 text-xs font-bold py-1 rounded">Dismiss</button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                
                {!isSuggesting && proposedSuggestions.length === 0 && (
                  <p className="text-sm text-center text-gray-600">Click the refresh button to get smart suggestions based on your pantry and meal plan.</p>
                )}
              </div>
          </Card>
      </div>
    </div>
    </>
  );
}
