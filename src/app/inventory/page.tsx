"use client";
import React, { useState } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { differenceInDays, format } from 'date-fns';
import { Utensils, Package, AlertTriangle, BadgeCheck, IndianRupee } from 'lucide-react';

export default function InventoryPage() {
  const { inventory, removeIngredient } = usePantryStore();
  
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">My Pantry</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4"><Package className="text-blue-500" size={32}/><div><p className="text-text-secondary">Total Items</p><p className="text-2xl font-bold">{totalItems}</p></div></Card>
        <Card className="flex items-center gap-4"><BadgeCheck className="text-green-500" size={32}/><div><p className="text-text-secondary">Fresh Items</p><p className="text-2xl font-bold">{freshItems}</p></div></Card>
        <Card className="flex items-center gap-4"><AlertTriangle className="text-orange-500" size={32}/><div><p className="text-text-secondary">Expiring Soon</p><p className="text-2xl font-bold">{expiringSoonCount}</p></div></Card>
        <Card className="flex items-center gap-4"><IndianRupee className="text-purple-500" size={32}/><div><p className="text-text-secondary">Total Value</p><p className="text-2xl font-bold">₹{totalValue.toFixed(2)}</p></div></Card>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {inventory.map(item => {
          const status = getExpiryStatus(item.expiryDate);
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}