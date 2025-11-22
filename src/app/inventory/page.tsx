"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link';
import { usePantryStore } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { differenceInDays, format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
    Utensils, Package, AlertTriangle, BadgeCheck, IndianRupee, Trash2, PlusCircle,
    ArrowDown, ArrowUp, Folder, Clock, Sparkles, ChevronDown, Inbox, Info
} from 'lucide-react';
import { WasteEvent } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';

const sortOptions = [
    { group: 'By Expiry', value: 'expiry-asc', label: 'Expiry Date (Soonest First)', icon: ArrowDown },
    { group: 'By Expiry', value: 'expiry-desc', label: 'Expiry Date (Latest First)', icon: ArrowUp },
    { group: 'By Name', value: 'name-asc', label: 'Name (A-Z)', icon: ArrowDown },
    { group: 'By Name', value: 'name-za', label: 'Name (Z-A)', icon: ArrowUp },
    { group: 'By Date Added', value: 'recently-added', label: 'Recently Added', icon: Sparkles },
    { group: 'By Date Added', value: 'oldest-first', label: 'Oldest First', icon: Clock },
    { group: 'By Value', value: 'value-desc', label: 'Value (High to Low)', icon: ArrowDown },
    { group: 'By Value', value: 'value-asc', label: 'Value (Low to High)', icon: ArrowUp },
    { group: 'Other', value: 'category', label: 'Category', icon: Folder },
];

export default function InventoryPage() {
  const { inventory, logWaste, removeIngredient, setRecipeIngredientFilter } = usePantryStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('expiry-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);

  const categoryCounts = useMemo(() => {
    return inventory.reduce((acc, item) => {
        const days = differenceInDays(new Date(item.expiryDate), new Date());
        if (days < 0) acc.expired += 1;
        else if (days <= 3) acc.expiringSoon += 1;
        else acc.fresh += 1;
        return acc;
    }, { fresh: 0, expiringSoon: 0, expired: 0 });
  }, [inventory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { text: `Expired ${Math.abs(days)} days ago`, color: 'text-red-500 font-bold' };
    if (days <= 3) return { text: `Expires in ${days} days`, color: 'text-orange-500 font-bold' };
    return { text: `Expires on ${format(new Date(expiryDate), 'MMM dd')}`, color: 'text-green-500' };
  };

  const handleMarkAsWasted = (item: typeof inventory[0]) => {
    logWaste({
      ingredientName: item.name,
      quantityWasted: item.quantity,
      unit: item.unit,
      timestamp: new Date().toISOString(),
      reason: 'expired'
    });
    removeIngredient(item.id);
  };

  const processedInventory = useMemo(() => {
    let items = [...inventory];

    if (searchQuery) {
      items = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filterBy !== 'all') {
      items = items.filter(item => {
        const days = differenceInDays(new Date(item.expiryDate), new Date());
        if (filterBy === 'expired') return days < 0;
        if (filterBy === 'expiring-soon') return days >= 0 && days <= 3;
        if (filterBy === 'fresh') return days > 3;
        return true;
      });
    }

    items.sort((a, b) => {
        switch (sortBy) {
            case 'expiry-desc': return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-za': return b.name.localeCompare(a.name);
            case 'value-desc': return b.value - a.value;
            case 'value-asc': return a.value - b.value;
            case 'recently-added': return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
            case 'oldest-first': return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
            case 'category': return a.category.localeCompare(b.category);
            default: return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
    });

    return items;
  }, [inventory, searchQuery, filterBy, sortBy]);

  const renderSortOption = (option: typeof sortOptions[0]) => {
    const Icon = option.icon;
    return (
        <li
            key={option.value}
            className={`px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${sortBy === option.value ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}`}
            onMouseDown={() => { setSortBy(option.value); setIsSortOpen(false); }}
        >
            <Icon size={16} className={sortBy === option.value ? 'text-white' : 'text-gray-500'}/>
            {option.label}
        </li>
    );
  };

  return (
    <div className="space-y-2 py-1">
    <div className="flex items-center justify-between">
      
      <div className="flex items-center gap-3">
        <Inbox className="text-primary" size={36} />
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">
            Inventory
          </h1>
          <div className="flex items-center gap-1.5">
            <Info size={14} className="text-text-secondary" />
            <p className="text-text-secondary font-medium">
              All your ingredients in one place
            </p>
          </div>
        </div>
      </div>

      <Link 
        href="/scanner"
        className="flex items-center gap-2 bg-green-500 text-white font-semibold px-4 py-2 rounded-lg 
                  hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-md"
      >
        <PlusCircle size={20} /> 
        Add Ingredient
      </Link>
    </div>


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4"><Package className="text-blue-500" size={32}/><div><p className="text-text-secondary">Total Items</p><p className="text-2xl font-bold">{totalItems}</p></div></Card>
        <Card className="flex items-center gap-4"><BadgeCheck className="text-green-500" size={32}/><div><p className="text-text-secondary">Fresh Items</p><p className="text-2xl font-bold">{categoryCounts.fresh}</p></div></Card>
        <Card className="flex items-center gap-4"><AlertTriangle className="text-orange-500" size={32}/><div><p className="text-text-secondary">Expiring Soon</p><p className="text-2xl font-bold">{categoryCounts.expiringSoon}</p></div></Card>
        <Card className="flex items-center gap-4"><IndianRupee className="text-purple-500" size={32}/><div><p className="text-text-secondary">Total Value</p><p className="text-2xl font-bold">₹{totalValue.toFixed(2)}</p></div></Card>
      </div>

      <Card className="p-4 space-y-4">
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Search ingredients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow p-2 border rounded-md"
                />
                <div className="relative" ref={sortRef} data-testid="sort-dropdown">
                    <button onClick={() => setIsSortOpen(!isSortOpen)} className="p-2 border rounded-md text-sm w-56 flex items-center justify-between">
                        {sortOptions.find(opt => opt.value === sortBy)?.label}
                        <ChevronDown size={16} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isSortOpen && (
                        <ul data-testid="sort-options" className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-80 overflow-auto">
                            {sortOptions.reduce((acc, option, index) => {
                                const prevOption = index > 0 ? sortOptions[index - 1] : null;
                                if (!prevOption || prevOption.group !== option.group) {
                                    acc.push(<li key={option.group} className="px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50">{option.group}</li>);
                                }
                                acc.push(renderSortOption(option));
                                return acc;
                            }, [] as React.ReactNode[])}
                        </ul>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setFilterBy('all')} className={`px-3 py-1 text-sm rounded-full ${filterBy === 'all' ? 'bg-primary text-white' : 'bg-gray-200'}`}>All <span className={filterBy === 'all' ? 'text-white' : 'text-primary font-bold'}>({totalItems})</span></button>
                    <button onClick={() => setFilterBy('fresh')} className={`px-3 py-1 text-sm rounded-full ${filterBy === 'fresh' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Fresh <span className={filterBy === 'fresh' ? 'text-white' : 'text-green-500 font-bold'}>({categoryCounts.fresh})</span></button>
                    <button onClick={() => setFilterBy('expiring-soon')} className={`px-3 py-1 text-sm rounded-full ${filterBy === 'expiring-soon' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}>Expiring Soon <span className={filterBy === 'expiring-soon' ? 'text-white' : 'text-orange-500 font-bold'}>({categoryCounts.expiringSoon})</span></button>
                    <button onClick={() => setFilterBy('expired')} className={`px-3 py-1 text-sm rounded-full ${filterBy === 'expired' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Expired <span className={filterBy === 'expired' ? 'text-white' : 'text-red-500 font-bold'}>({categoryCounts.expired})</span></button>
                </div>
            </div>
        </Card>
      
        {inventory.length === 0 ? (
            <EmptyState type="no-inventory" />
        ) : processedInventory.length === 0 ? (
            <EmptyState type="no-results" />
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {processedInventory.map(item => {
                    const status = getExpiryStatus(item.expiryDate);
                    const daysUntilExpiry = differenceInDays(new Date(item.expiryDate), new Date());
                    const borderClass = daysUntilExpiry < 0 ? 'border-red-500' : daysUntilExpiry <= 3 ? 'border-orange-500' : 'border-green-500';

                    return (
                        <Card key={item.id} className={`flex flex-col justify-between border-l-4 ${borderClass}`}>
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-text-secondary">{item.category}</p>
                                    <h3 className="text-lg font-bold text-text-primary">{item.name}</h3>
                                </div>
                                <p className="text-xs text-gray-500">{format(new Date(item.purchaseDate), 'MMM dd')}</p>
                            </div>
                            <p className="text-md text-text-secondary">{item.quantity} {item.unit}</p>
                            <p className="text-sm font-semibold">Value: ₹{item.value.toFixed(2)}</p>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className={`text-sm font-semibold ${status.color}`}>{status.text}</div>
                            {daysUntilExpiry < 0 ? (
                                <button
                                    onClick={() => handleMarkAsWasted(item)}
                                    className="w-full text-sm bg-red-500/10 text-red-500 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 size={14} /> Mark as Wasted
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setRecipeIngredientFilter(item.name); router.push('/recipes'); }}
                                    className="w-full text-sm bg-green-500/10 text-green-500 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors"
                                >
                                    <Utensils size={14} /> Use in Recipe
                                </button>
                            )}
                        </div>
                        </Card>
                    );
                })}
            </div>
        )}
    </div>
  );
}