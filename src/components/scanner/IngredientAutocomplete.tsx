"use client";
import { MasterIngredient } from '@/store/pantryStore';
import { PlusCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface AutocompleteProps {
  masterList: MasterIngredient[];
  onSelect: (ingredient: MasterIngredient) => void;
  onAddNew: (newItemName: string) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const IngredientAutocomplete: React.FC<AutocompleteProps> = ({ masterList, onSelect, onAddNew, value, onChange, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredIngredients = useMemo(() => {
    if (!value) return [];
    return masterList.filter(item => 
      item.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 10);
  }, [value, masterList]);

  const handleSelect = (ingredient: MasterIngredient) => {
    onChange('');
    setShowSuggestions(false);
    onSelect(ingredient);
  };

  const handleAddNew = () => {
    onAddNew(value);
    onChange('');
    setShowSuggestions(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder || "Search your ingredients..."}
        className="w-full p-3 pl-10 border rounded-lg"
      />
      {showSuggestions && value && (
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
              Add &quot;{value}&quot; to database
            </li>
          )}
        </ul>
      )}
    </div>
  );
};