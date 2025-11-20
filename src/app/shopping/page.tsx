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

  const categoryIcons: Record<string, React.ReactNode> = {
    'Produce': <span className="text-2xl">🥕</span>,
    'Dairy': <span className="text-2xl">🥛</span>,
    'Meat': <span className="text-2xl">🥩</span>,
    'Bakery': <span className="text-2xl">🍞</span>,
    'Seafood': <span className="text-2xl">🐟</span>,
    'Pantry Staples': <span className="text-2xl">🥫</span>,
    'Fruit': <span className="text-2xl">🍎</span>,
    'Vegetable': <span className="text-2xl">🥬</span>,
    'Other': <span className="text-2xl">🛒</span>,
  };

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
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
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
        </div>

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
            placeholder="Search or scan barcode..."
            className="pl-10"
          />
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div
          className="rounded-xl shadow-lg"
          style={{
            background: 'linear-gradient(145deg, #F9FAFB 0%, #E9D8FF 100%)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                <Sparkles size={22} className="text-purple-600" />
                Smart Suggestions ({proposedSuggestions.length})
              </h3>
              <div className="flex items-center gap-4">
                  <button onClick={handleAcceptAll} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors">Accept All</button>
                  <button onClick={() => setProposedSuggestions([])} className="text-sm font-semibold text-gray-600 hover:text-gray-800">Hide</button>
                  <button onClick={handleGetSmartSuggestions} disabled={isSuggesting} className="p-1 text-gray-500 hover:text-black disabled:opacity-50">
                    {isSuggesting ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                  </button>
              </div>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {isSuggesting && <p className="text-sm text-center text-gray-600 py-4">Analyzing your habits...</p>}
              {!isSuggesting && proposedSuggestions.length === 0 && (
                <p className="text-sm text-center text-gray-600 py-4">Click the refresh button to get smart suggestions.</p>
              )}
              {proposedSuggestions.length > 0 && (
                <ul className="space-y-2">
                  {proposedSuggestions.map((suggestion, index) => (
                    <li key={index} className="bg-white/70 p-3 rounded-lg border border-purple-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-2xl">
                            {suggestion.emoji || '🛒'}
                          </div>
                        <div>
                          <p className="font-semibold text-gray-800">{suggestion.name} - {suggestion.quantity} {suggestion.unit}</p>
                          <p className="text-xs text-gray-500 italic">{suggestion.reason}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptSuggestion(suggestion)} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-md hover:bg-green-600">Accept</button>
                        <button onClick={() => handleDismissSuggestion(suggestion.name)} className="px-3 py-1 bg-transparent text-gray-600 text-xs font-bold rounded-md hover:bg-gray-100">Dismiss</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {shoppingList.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                  <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold">Your Shopping List is Empty</h3>
                  <p>Add items using the search bar above or get smart suggestions!</p>
              </div>
          ) : Object.keys(categorizedList).length === 0 ? (
              <p className="text-center py-16 text-gray-500">No items match your search.</p>
          ) : (
              Object.entries(categorizedList).map(([category, items]) => (
                  <Card key={category} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {categoryIcons[category] || <Tag size={20} className="text-gray-400" />}
                      <h2 className="text-xl font-bold text-text-primary">{category} ({items.length})</h2>
                    </div>
                    <ul className="space-y-2">
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
              ))
          )}
        </div>
      </div>

      <div className="col-span-1 space-y-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Budget Summary</h3>
            <button
              onClick={handleRestock}
              disabled={checkedItemsCount === 0}
              className={`flex items-center gap-2 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-sm ${
                checkedItemsCount > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <PackagePlus size={18} />
              Restock ({checkedItemsCount})
            </button>
          </div>
          <div className="space-y-3">
              <div className="text-center bg-gray-50 p-4 rounded-lg">
                  <p className="text-text-secondary">Estimated Total ({shoppingList.length} items)</p>
                  <p className="text-3xl font-bold text-primary">₹{estimatedTotal.toFixed(2)}</p>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                  <p className="font-semibold mb-1">Breakdown by Category:</p>
                  {Object.entries(budgetSummary).map(([category, data]) => (
                      <div key={category}>
                        <div className="flex justify-between items-center font-medium">
                            <span>{category} ({data.count})</span>
                            <span>₹{data.total.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${estimatedTotal > 0 ? ((data.total / estimatedTotal) * 100).toFixed(0) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                  ))}
              </div>
          </div>
        </Card>
      </div>
    </div>
    </>
  );
}
