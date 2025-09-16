"use client";
import React, { useMemo } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { getDashboardStats, getExpiringSoonItems, getRecentlyAddedItems, getRecommendedRecipes } from '@/lib/dashboardGenerator';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { Card } from '@/components/ui/Card';
import { differenceInDays, format } from 'date-fns';
import Link from 'next/link';
import { Package, AlertTriangle, IndianRupee, BadgeCheck, ScanLine, Inbox, ChefHat, ShoppingCart } from 'lucide-react';
import { RecipeCard } from '@/components/RecipeCard';

export default function DashboardPage() {
  const { inventory } = usePantryStore();

  const stats = useMemo(() => getDashboardStats(inventory), [inventory]);
  const expiringSoon = useMemo(() => getExpiringSoonItems(inventory, 3), [inventory]);
  const recentlyAdded = useMemo(() => getRecentlyAddedItems(inventory, 3), [inventory]);
  const recommendedRecipes = useMemo(() => getRecommendedRecipes(), [inventory]);

  const getDaysLabel = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days === 0) return { text: 'Today', color: 'bg-red-500' };
    if (days === 1) return { text: '1 day', color: 'bg-orange-500' };
    return { text: `${days} days`, color: 'bg-yellow-500' };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats.totalItems} icon={<Package size={24} className="text-blue-800"/>} colorClass="bg-blue-200" />
        <StatCard label="Expiring Soon" value={stats.expiringSoonCount} icon={<AlertTriangle size={24} className="text-orange-800"/>} colorClass="bg-orange-200" />
        <StatCard label="Total Value" value={`₹${stats.totalValue.toFixed(2)}`} icon={<IndianRupee size={24} className="text-purple-800"/>} colorClass="bg-purple-200" />
        <StatCard label="Fresh Items" value={stats.freshItemsCount} icon={<BadgeCheck size={24} className="text-green-800"/>} colorClass="bg-green-200" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-text-primary mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionCard href="/scanner" label="Add Ingredients" description="Scan or manually add" icon={<ScanLine size={24} className="text-blue-800" />} colorClass="bg-blue-100" />
          <ActionCard href="/inventory" label="View Pantry" description="Manage your inventory" icon={<Inbox size={24} className="text-green-800" />} colorClass="bg-green-100" />
          <ActionCard href="/recipes" label="Find Recipes" description="Discover new meals" icon={<ChefHat size={24} className="text-red-800" />} colorClass="bg-red-100" />
          <ActionCard href="/shopping" label="Shopping List" description="Plan your next trip" icon={<ShoppingCart size={24} className="text-purple-800" />} colorClass="bg-purple-100" />
        </div>
      </div>
      
      {recommendedRecipes.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-3">Use It Before You Lose It!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {recommendedRecipes.map(recipe => (
               <RecipeCard key={recipe.id} recipe={recipe} />
             ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-text-primary mb-3">Items Expiring Soon</h2>
          <div className="space-y-3">
            {expiringSoon.length > 0 ? expiringSoon.map(item => {
              const { text, color } = getDaysLabel(item.expiryDate);
              return (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-text-secondary">{item.quantity} {item.unit}</p>
                  </div>
                  <span className={`text-xs font-bold text-white px-2 py-1 rounded-full ${color}`}>{text}</span>
                </div>
              );
            }) : <p className="text-text-secondary">No items are expiring soon. Great job!</p>}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-text-primary mb-3">Recently Added</h2>
          <div className="space-y-3">
            {recentlyAdded.length > 0 ? recentlyAdded.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-text-secondary">{item.quantity} {item.unit}</p>
                </div>
                <span className="text-sm text-text-secondary">{format(new Date(item.purchaseDate), 'MMM dd')}</span>
              </div>
            )) : <p className="text-text-secondary">No items added recently.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}