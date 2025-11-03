"use client";
import React, { useState, useMemo } from 'react'
import Link from 'next/link';
import { usePantryStore, MasterIngredient } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { differenceInDays, format } from 'date-fns';
import { Utensils, Package, AlertTriangle, BadgeCheck, IndianRupee, Trash2, PlusCircle } from 'lucide-react';
import { WasteEvent } from '@/types';

const toTitleCase = (str: string): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

export default function InventoryPage() {
  const { inventory, logWaste, removeIngredient, addMasterIngredient, masterIngredientList, addToast } = usePantryStore();
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('expiry-asc');
  const expiringSoonCount = inventory.filter(item => {
    const days = differenceInDays(new Date(item.expiryDate), new Date());
    return days <= 3 && days >= 0;
  }).length;
  const freshItems = inventory.filter(item => differenceInDays(new Date(item.expiryDate), new Date()) > 3).length;
  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { text: `Expired ${Math.abs(days)} days ago`, color: 'text-chili-red' };
    if (days <= 3) return { text: `Expires in ${days} days`, color: 'text-dal-orange' };
    return { text: `Expires on ${format(new Date(expiryDate), 'MMM dd')}`, color: 'text-curry-green' };
  };

  const handleMarkAsWasted = (item: typeof inventory[0]) => {
    // 1. Create the waste event
    const wasteEvent: WasteEvent = {
      ingredientName: item.name,
      quantityWasted: item.quantity,
      unit: item.unit,
      timestamp: new Date().toISOString(),
      reason: 'expired'
    };
    // 2. Log the event
    logWaste(wasteEvent);
    // 3. Remove the item from inventory
    removeIngredient(item.id);
    
    addToast(`${item.name} marked as wasted and removed from pantry.`, 'success');
  };

  const processedInventory = useMemo(() => {
    let items = [...inventory];

    // 1. Filter by search query
    if (searchQuery) {
      items = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // 2. Filter by status
    if (filterBy !== 'all') {
      items = items.filter(item => {
        const days = differenceInDays(new Date(item.expiryDate), new Date());
        if (filterBy === 'expired') return days < 0;
        if (filterBy === 'expiring-soon') return days >= 0 && days <= 3;
        if (filterBy === 'fresh') return days > 3;
        return true;
      });
    }
    // 3. Sort the results
    items.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      // Default: sort by expiry date, ascending
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    return items;
  }, [inventory, searchQuery, filterBy, sortBy]);


  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">My Pantry</h1>
          <Link 
            href="/scanner"
            className="flex items-center gap-2 bg-accent-secondary text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusCircle size={20} />
            Add New Ingredient
          </Link>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4"><Package className="text-blue-500" size={32}/><div><p className="text-text-secondary">Total Items</p><p className="text-2xl font-bold">{totalItems}</p></div></Card>
        <Card className="flex items-center gap-4"><BadgeCheck className="text-green-500" size={32}/><div><p className="text-text-secondary">Fresh Items</p><p className="text-2xl font-bold">{freshItems}</p></div></Card>
        <Card className="flex items-center gap-4"><AlertTriangle className="text-orange-500" size={32}/><div><p className="text-text-secondary">Expiring Soon</p><p className="text-2xl font-bold">{expiringSoonCount}</p></div></Card>
        <Card className="flex items-center gap-4"><IndianRupee className="text-purple-500" size={32}/><div><p className="text-text-secondary">Total Value</p><p className="text-2xl font-bold">₹{totalValue.toFixed(2)}</p></div></Card>
      </div>

      <Card className="p-4 space-y-4">
            <input 
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded-md"
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setFilterBy('all')} className={`px-3 py-1 text-sm rounded-full ${filterBy === 'all' ? 'bg-accent-primary text-white' : 'bg-gray-200'}`}>All</button>
                    <button onClick={() => setFilterBy('fresh')} className={`px-3 py-1 text-sm rounded-full ${filterBy === 'fresh' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Fresh</button>
                    <button onClick={() => setFilterBy('expiring-soon')} className={`px-3 py-1 text-sm rounded-full ${filterBy === 'expiring-soon' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}>Expiring Soon</button>
                    <button onClick={() => setFilterBy('expired')} className={`px-3 py-1 text-sm rounded-full ${filterBy === 'expired' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Expired</button>
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 border rounded-md text-sm">
                    <option value="expiry-asc">Sort by Expiry Date</option>
                    <option value="name-asc">Sort by Name (A-Z)</option>
                </select>
            </div>
        </Card>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {processedInventory.map(item => {
          const status = getExpiryStatus(item.expiryDate);
          const daysUntilExpiry = differenceInDays(new Date(item.expiryDate), new Date());
          
          return (
            <Card key={item.id} className="flex flex-col justify-between">
              <div>
                <p className="text-xs text-text-secondary">{item.category}</p>
                <h3 className="text-lg font-bold text-text-primary">{item.name}</h3>
                <p className="text-md text-text-secondary">{item.quantity} {item.unit}</p>
                <p className="text-sm font-semibold">Value: ₹{item.value.toFixed(2)}</p>
              </div>
              <div className={`mt-4 text-sm font-semibold ${status.color}`}>
                {status.text}
              </div>
              {daysUntilExpiry < 0 && (
                  <button 
                    onClick={() => handleMarkAsWasted(item)}
                    className="mt-2 w-full text-sm bg-chili-red/10 text-chili-red font-semibold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-chili-red/20 transition-colors"
                  >
                    <Trash2 size={14} />
                    Mark as Wasted
                  </button>
                )}
            </Card>
          );
        })}
      </div>
    </div>
    </>
  );
}