"use client";
import { indianIngredientsDatabase } from '@/data/ingredients';
import { Ingredient } from '@/types';
import React, { useState, useMemo } from 'react';

interface AutocompleteProps {
  onSelect: (ingredient: Omit<Ingredient, 'id' | 'quantity' | 'purchaseDate' | 'expiryDate' | 'value'>) => void;
}

export const IngredientAutocomplete: React.FC<AutocompleteProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredIngredients = useMemo(() => {
    if (!query) return [];
    return indianIngredientsDatabase.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions
  }, [query]);

  const handleSelect = (ingredient: Omit<Ingredient, 'id' | 'quantity' | 'purchaseDate' | 'expiryDate' | 'value'>) => {
    setQuery(ingredient.name);
    setShowSuggestions(false);
    onSelect(ingredient);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
        placeholder="Search Indian ingredients..."
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      {showSuggestions && filteredIngredients.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredIngredients.map((item, index) => (
            <li 
              key={index} 
              onMouseDown={() => handleSelect(item)} // onMouseDown fires before onBlur
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {item.name} <span className="text-xs text-gray-500">- {item.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};