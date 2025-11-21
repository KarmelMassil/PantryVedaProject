"use client";
import React from 'react';
import { usePantryStore } from '@/store/pantryStore';

const WelcomeMessage = () => {
  const { inventory } = usePantryStore();
  const totalItems = inventory.length;

  return (
    <div className="p-6 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg">
      <h1 className="text-3xl font-bold flex items-center">
        Welcome to PantryVeda <span className="ml-2">👋</span>
      </h1>
      <p className="mt-2 text-white/90">
        Let's build your zero-waste pantry.
      </p>
      <div className="mt-4 text-sm font-semibold">
        {totalItems} {totalItems === 1 ? 'item' : 'items'} in your pantry
      </div>
    </div>
  );
};

export default WelcomeMessage;