"use client";
import { MasterIngredient } from '@/store/pantryStore';
import { PlusCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface AutocompleteProps {
  masterList: MasterIngredient[];
  onSelect: (ingredient: MasterIngredient) => void;
  onAddNew: (newItemName: string) => void;
}

export const IngredientAutocomplete: React.FC<AutocompleteProps> = ({ masterList, onSelect, onAddNew }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredIngredients = useMemo(() => {
    if (!query) return [];
    return masterList.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
  }, [query, masterList]);

  const handleSelect = (ingredient: MasterIngredient) => {
    setQuery('');
    setShowSuggestions(false);
    onSelect(ingredient);
  };

  const handleAddNew = () => {
    onAddNew(query);
    setQuery('');
    setShowSuggestions(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Search your ingredients..."
        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
      />
      {showSuggestions && query && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredIngredients.map((item) => (
            <li 
              key={item.name}
              onMouseDown={() => handleSelect(item)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-text-primary"
            >
              {item.name} <span className="text-xs text-gray-500">- {item.category}</span>
            </li>
          ))}
          {filteredIngredients.length === 0 && (
            <li
              onMouseDown={handleAddNew}
              className="px-4 py-3 flex items-center hover:bg-green-50 text-green-600 font-semibold cursor-pointer"
            >
              <PlusCircle size={18} className="mr-2.5" />
              Add &quot;{query}&quot; to database
            </li>
          )}
        </ul>
      )}
    </div>
  );
};