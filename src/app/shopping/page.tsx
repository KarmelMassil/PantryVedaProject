"use client";
import React, { useMemo, useState } from 'react';
import { usePantryStore, ShoppingListItem, MasterIngredient } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { Trash2, Plus, Share2, Download, Lightbulb, PackagePlus, PlusCircle, RefreshCw, Loader2, Search, Sparkles, ShoppingCart, Tag, Leaf, Fish, Beef, Wheat, Carrot, Apple } from 'lucide-react';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { getSmartSuggestions } from '@/lib/suggestionOrchestrator';
import { format, formatISO } from 'date-fns';
import { AddIngredientModal } from '@/components/AddIngredientModal';
import { getApproximateWeightDisplay } from '@/lib/unitConverter';
import { error } from 'console';
import { ShoppingListItem as ShoppingListItemComponent } from '@/components/shopping-list/ShoppingListItem';

// Helper function to format ingredient names to Title Case
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Define the type for our suggestions
type Suggestion = Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'> & { reason: string, priority: 'high' | 'medium' | 'low', emoji?: string };

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
  const [searchOrAddQuery, setSearchOrAddQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [originalItem, setOriginalItem] = useState<ShoppingListItem | null>(null);

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

  const handleEditStart = (item: ShoppingListItem) => {
    setEditingItemId(item.id);
    setOriginalItem(item); // Save the original state
  };

  const handleEditCancel = () => {
    if (originalItem) {
      updateShoppingListItem(originalItem.id, originalItem); // Restore original state
    }
    setEditingItemId(null);
    setOriginalItem(null);
  };

  const handleEditSave = (id: string) => {
    setEditingItemId(null);
    setOriginalItem(null);
    addToast('Item updated successfully!', 'success');
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

  const filteredList = shoppingList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const categorizedList = filteredList.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const categoryIcons: Record<string, React.ReactElement> = {
    'Produce': <Carrot />,
    'Dairy': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="M12 22v-2"/><path d="M14 18H8"/><path d="M12 18v4"/><path d="M12 4V2"/></svg>, // Custom milk icon
    'Meat': <Beef />,
    'Bakery': <Wheat />,
    'Seafood': <Fish />,
    'Pantry Staples': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="5" width="10" height="14" rx="2"/><path d="M10 5v14"/><path d="M14 5v14"/></svg>, // Custom can icon
    'Fruit': <Apple />,
    'Vegetable': <Leaf />,
    'Other': <ShoppingCart />,
  };

  const budgetSummary = shoppingList.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    const itemTotal = (item.quantity || 0) * (item.price || 0);
    acc[category].total += itemTotal;
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const checkedItemsCount = shoppingList.filter(item => item.checked).length;
  const estimatedTotal = Object.values(budgetSummary).reduce((total, category) => total + category.total, 0);

  return (
    <div className="space-y-6">
      <AddIngredientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewIngredient}
      />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShoppingCart size={32} className="text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Smart Shopping List</h1>
            <p className="text-text-secondary mt-1">
              Plan your grocery runs, manage your budget, and never forget an item again.
            </p>
          </div>
        </div>
        <button
          onClick={handleRestock}
          disabled={checkedItemsCount === 0}
          className={`flex items-center justify-center gap-2 text-white font-semibold px-4 py-3 rounded-lg transition-all text-base shadow-md hover:shadow-lg ${
            checkedItemsCount > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <PackagePlus size={20} />
          Restock ({checkedItemsCount})
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Search and Add */}
          <div className="relative">
            <IngredientAutocomplete
              masterList={masterIngredientList}
              onSelect={(ingredient) => {
                const itemToAdd: Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'> = {
                  name: ingredient.name,
                  category: ingredient.category,
                  quantity: 1,
                  unit: ingredient.unit,
                  defaultExpiryDays: ingredient.defaultExpiryDays || 14,
                };
                addItemsToShoppingList([itemToAdd]);
                setSearchOrAddQuery('');
              }}
              onAddNew={() => setIsModalOpen(true)}
              value={searchOrAddQuery}
              onChange={(value) => {
                setSearchOrAddQuery(value);
                setSearchQuery(value);
              }}
              placeholder="Type to search or add..."
              className="w-full pl-10"
            />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Smart Suggestions */}
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl flex items-center gap-3 text-gray-800">
                    <Sparkles size={24} className="text-purple-600" />
                    <span>Smart Suggestions</span>
                </h3>
                <div className="flex items-center gap-2">
                    {proposedSuggestions.length > 0 && (
                      <>
                        <button onClick={handleAcceptAll} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm">Accept All</button>
                        <button onClick={() => setProposedSuggestions([])} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200">Hide</button>
                      </>
                    )}
                    <button onClick={handleGetSmartSuggestions} disabled={isSuggesting} className="p-2 text-gray-500 hover:text-black disabled:opacity-50 rounded-full hover:bg-gray-200 transition-colors">
                        {isSuggesting ? <Loader2 className="animate-spin" size={20}/> : <RefreshCw size={20}/>}
                    </button>
                </div>
            </div>
            {isSuggesting ? (
                <div className="text-center py-8 text-gray-600">
                    <Loader2 className="animate-spin inline-block mr-2" />
                    Analyzing your habits...
                </div>
            ) : proposedSuggestions.length > 0 ? (
                <div className="flex overflow-x-auto gap-4 pb-4">
                    {proposedSuggestions.map((suggestion, index) => {
                        const existingItem = findItemInList(suggestion.name);
                        return (
                            <div key={index} className="min-w-[250px] max-w-[250px] bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-purple-100 shadow-md flex flex-col justify-between transition-transform hover:scale-105">
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">{suggestion.name}</p>
                                            <p className="font-semibold text-primary text-sm">{suggestion.quantity} {suggestion.unit}</p>
                                        </div>
                                        {existingItem && (
                                            <div className="group relative">
                                                <PlusCircle size={18} className="text-blue-500"/>
                                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Will be added to existing item
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 italic mb-3">{suggestion.reason}</p>
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => handleAcceptSuggestion(suggestion)} className="flex-1 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-md hover:bg-green-600 transition-all">Accept</button>
                                    <button onClick={() => handleDismissSuggestion(suggestion.name)} className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-md hover:bg-gray-200 transition-all">Dismiss</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p>Click the refresh button to get smart suggestions based on your pantry and habits.</p>
                </div>
            )}
          </div>

          {/* Shopping List Items */}
          <div className="space-y-6">
            {shoppingList.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                  <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700">Your Shopping List is Empty</h3>
                  <p className="mt-1">Add items using the search bar or get smart suggestions!</p>
              </div>
            ) : Object.keys(categorizedList).length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                  <Search size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold">No items match your search.</h3>
              </div>
            ) : (
              Object.entries(categorizedList).map(([category, items]) => (
                <div key={category} className="p-5 rounded-xl border shadow-sm bg-white">
                  <h2 className="text-xl font-bold text-text-primary mb-4">{category} ({items.length})</h2>
                  <ul className="space-y-3">
                      {items.map(item => (
                          <ShoppingListItemComponent
                              key={item.id}
                              item={item}
                              onUpdate={updateShoppingListItem}
                              onDelete={removeShoppingListItem}
                              isEditing={editingItemId === item.id}
                              onEditStart={handleEditStart}
                              onEditCancel={handleEditCancel}
                              onEditSave={handleEditSave}
                          />
                      ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            {/* Budget Summary */}
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Tag size={20} /> Budget Summary
                </h3>
              </div>
              <div className="space-y-4">
                  <div className="text-center bg-gray-50 p-4 rounded-lg border">
                      <p className="text-sm text-text-secondary">Estimated Total ({shoppingList.length} items)</p>
                      <p className="text-3xl font-bold text-primary">₹{estimatedTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-3">
                      <p className="font-semibold mb-1">Breakdown by Category:</p>
                      {Object.entries(budgetSummary).length > 0 ? Object.entries(budgetSummary).map(([category, data]) => (
                          <div key={category}>
                            <div className="flex justify-between items-center font-medium">
                                <span className="flex items-center gap-2">
                                  {React.cloneElement(categoryIcons[category] || <Tag/>, {size: 16, className: "text-gray-500"})}
                                  {category} ({data.count})
                                </span>
                                <span>₹{data.total.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${estimatedTotal > 0 ? ((data.total / estimatedTotal) * 100).toFixed(0) : 0}%` }}
                              ></div>
                            </div>
                          </div>
                      )) : <p className="text-center text-gray-500 py-3">No items with prices yet.</p>}
                  </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
