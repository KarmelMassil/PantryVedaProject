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
import { ShoppingListItem as ShoppingListItemComponent } from '@/components/shopping-list/ShoppingListItem';

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

  const { budgetSummary, checkedItemsCount } = useMemo(() => {
    const summary = shoppingList.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      const itemTotal = (item.quantity || 0) * (item.price || 0);
      acc[category].total += itemTotal;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const checkedCount = shoppingList.filter(item => item.checked).length;

    return { budgetSummary: summary, checkedItemsCount: checkedCount };
  }, [shoppingList]);

  const estimatedTotal = useMemo(() => {
      return Object.values(budgetSummary).reduce((total, category) => total + category.total, 0);
  }, [budgetSummary]);

  return (
    <>
      <AddIngredientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewIngredient}
      />
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Smart Shopping List</h1>
          <p className="text-text-secondary mt-1">
            Plan your grocery runs, manage your budget, and never forget an item again.
          </p>
        </div>
        <button
          onClick={handleRestock}
          disabled={checkedItemsCount === 0}
          className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <PackagePlus size={20} />
          Restock ({checkedItemsCount})
        </button>
      </div>

      <div className="relative">
        <IngredientAutocomplete
          masterList={masterIngredientList}
          onSelect={(ingredient) => {
            const itemToAdd: Omit<ShoppingListItem, 'id' | 'checked' | 'price' | 'expiryDate'> = {
              name: ingredient.name,
              category: ingredient.category,
              quantity: 1, // Default quantity
              unit: ingredient.unit,
              defaultExpiryDays: ingredient.defaultExpiryDays || 14,
            };
            addItemsToShoppingList([itemToAdd]);
            setSearchOrAddQuery(''); // Clear after adding
          }}
          onAddNew={() => setIsModalOpen(true)}
          value={searchOrAddQuery}
          onChange={(value) => {
            setSearchOrAddQuery(value);
            setSearchQuery(value); // Also filter the list as user types
          }}
          placeholder="Search to add or filter your list..."
        />
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* List */}
          <div className="space-y-4">
            {shoppingList.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <h3 className="text-xl font-semibold">Your Shopping List is Empty</h3>
                    <p>Add items using the search bar above or get smart suggestions!</p>
                </div>
            ) : Object.keys(categorizedList).length === 0 ? (
                <p className="text-center py-16 text-gray-500">No items match your search.</p>
            ) : (
                Object.entries(categorizedList).map(([category, items]) => (
                    <div key={category}>
                        <h2 className="text-xl font-bold text-text-primary mb-2">{category} ({items.length})</h2>
                        <Card className="p-0">
                            <ul className="divide-y divide-gray-200">
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
                        </Card>
                    </div>
                ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
              <h3 className="font-bold text-lg mb-2">Budget Summary</h3>
              <div className="space-y-3">
                  <div className="text-center bg-gray-50 p-4 rounded-lg">
                      <p className="text-text-secondary">Estimated Total ({shoppingList.length} items)</p>
                      <p className="text-3xl font-bold text-primary">₹{estimatedTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-semibold mb-1">Breakdown by Category:</p>
                      {Object.entries(budgetSummary).map(([category, data]) => (
                          <div key={category} className="flex justify-between items-center">
                              <span>{category} ({data.count})</span>
                              <span>₹{data.total.toFixed(2)} ({estimatedTotal > 0 ? ((data.total / estimatedTotal) * 100).toFixed(0) : 0}%)</span>
                          </div>
                      ))}
                  </div>
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
    </div>
    </>
  );
}
