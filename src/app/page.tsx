"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { getDashboardStats, getExpiringSoonItems, getRecentlyAddedItems, getRecommendedRecipes } from '@/lib/dashboardGenerator';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { Card } from '@/components/ui/Card';
import { differenceInDays, format } from 'date-fns';
import Link from 'next/link';
import { Package, AlertTriangle, IndianRupee, BadgeCheck, ScanLine, Inbox, ChefHat, ShoppingCart, Clock, Plus, Flame, PlusCircle, History, Sparkles } from 'lucide-react';
import { RecipeCard } from '@/components/RecipeCard';
import WelcomeMessage from '@/components/dashboard/WelcomeMessage';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyStateIllustration } from '@/components/dashboard/EmptyStateIllustration';
import { calculateTrends } from '@/lib/trendUtils';

export default function DashboardPage() {
  const { inventory, weeklySnapshots, createWeeklySnapshot } = usePantryStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    createWeeklySnapshot();
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Simulate loading for 1.5 seconds
    return () => clearTimeout(timer);
  }, [createWeeklySnapshot]);

  const stats = useMemo(() => getDashboardStats(inventory), [inventory]);
  const trends = useMemo(() => calculateTrends(inventory, weeklySnapshots), [inventory, weeklySnapshots]);
  const expiringSoon = useMemo(() => getExpiringSoonItems(inventory, 3), [inventory]);
  const recentlyAdded = useMemo(() => getRecentlyAddedItems(inventory, 3), [inventory]);
  const recommendedRecipes = useMemo(() => getRecommendedRecipes(), [inventory]);

  const getDaysLabel = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days === 0) return { text: 'Today', color: 'bg-red-500' };
    if (days === 1) return { text: '1 day', color: 'bg-orange-500' };
    return { text: `${days} days`, color: 'bg-yellow-500' };
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (inventory.length === 0) {
    return (
      <div className="text-center">
        <WelcomeMessage />
        <div className="mt-12">
          <EmptyStateIllustration />
          <h2 className="mt-6 text-2xl font-semibold text-gray-700">Your Pantry is Empty</h2>
          <p className="mt-2 text-gray-500">
            Add your first item to get started!
          </p>
          <Link href="/scanner" className="mt-6 inline-block bg-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-primary/90 transition-all">
              Add Item
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeMessage />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats.totalItems} icon={<Package size={24} className="text-blue-500"/>} colorClass="bg-blue-100" trend={trends.totalItems} />
        <StatCard label="Expiring Soon" value={stats.expiringSoonCount} icon={<AlertTriangle size={24} className="text-orange-500"/>} colorClass="bg-orange-100" trend={trends.expiringSoon} />
        <StatCard label="Total Value" value={`₹${stats.totalValue.toFixed(2)}`} icon={<IndianRupee size={24} className="text-purple-500"/>} colorClass="bg-purple-100" trend={trends.totalValue}/>
        <StatCard label="Fresh Items" value={stats.freshItemsCount} icon={<BadgeCheck size={24} className="text-green-500"/>} colorClass="bg-green-100" trend={trends.freshItems}/>
      </div>

      <div>
        <h2 className="text-xl font-bold text-text-primary mb-3 flex items-center"><Sparkles size={20} className="text-primary mr-2"/>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionCard href="/scanner" label="Add Ingredients" description="Scan or manually add" icon={<ScanLine size={24} className="text-blue-800" />} colorClass="bg-blue-100" />
          <ActionCard href="/inventory" label="View Pantry" description="Manage your inventory" icon={<Inbox size={24} className="text-green-800" />} colorClass="bg-green-100" />
          <ActionCard href="/recipes" label="Find Recipes" description="Discover new meals" icon={<ChefHat size={24} className="text-red-800" />} colorClass="bg-red-100" />
          <ActionCard href="/shopping" label="Shopping List" description="Plan your next trip" icon={<ShoppingCart size={24} className="text-purple-800" />} colorClass="bg-purple-100" />
        </div>
      </div>
      
      {recommendedRecipes.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-3 flex items-center"><Flame size={20} className="text-red-500 mr-2"/>Use It Before You Lose It!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {recommendedRecipes.map(recipe => (
               <RecipeCard key={recipe.id} recipe={recipe} onView={() => {}} onCook={() => {}} onAddToPlan={() => {}} />
             ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-text-primary mb-3 flex items-center"><History size={20} className="text-orange-500 mr-2"/>Items Expiring Soon</h2>
          <div className="space-y-3">
            {expiringSoon.length > 0 ? expiringSoon.map(item => {
              const { text, color } = getDaysLabel(item.expiryDate);
              return (
                <div key={item.id} className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <Clock size={20} className="text-warning mr-4"/>
                  <div className="flex-grow">
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
          <h2 className="text-xl font-bold text-text-primary mb-3 flex items-center"><PlusCircle size={20} className="text-green-500 mr-2"/>Recently Added</h2>
          <div className="space-y-3">
            {recentlyAdded.length > 0 ? recentlyAdded.map(item => (
              <div key={item.id} className="flex items-center bg-gray-50 p-3 rounded-lg">
                <Plus size={20} className="text-accent mr-4"/>
                <div className="flex-grow">
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