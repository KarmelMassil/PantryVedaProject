"use client";
import React, { useState } from 'react';
import { usePantryStore, MasterIngredient } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { AddIngredientModal } from '@/components/AddIngredientModal';
import { differenceInDays, format } from 'date-fns';
import { Utensils, Package, AlertTriangle, BadgeCheck, IndianRupee, Trash2, PlusCircle } from 'lucide-react';
import { WasteEvent } from '@/types';

export default function InventoryPage() {
  const { inventory, logWaste, removeIngredient, addMasterIngredient, masterIngredientList } = usePantryStore();
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);

  const toTitleCase = (str: string): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleSaveNewIngredient = (ingredient: MasterIngredient) => {
    const formattedName = toTitleCase(ingredient.name.trim());
    if (!formattedName) {
      alert("Ingredient name cannot be empty.");
      return;
    }
    const isDuplicate = masterIngredientList.some(
        item => item.name.toLowerCase() === formattedName.toLowerCase()
    );
    if (isDuplicate) {
        alert(`'${formattedName}' already exists in your ingredient database!`);
        return; // Stop the function
    }

    // Call the Zustand action to permanently save the ingredient
    addMasterIngredient({ ...ingredient, name: formattedName });
    alert(`'${formattedName}' has been added to your master ingredient database!`);
  };

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
    
    alert(`${item.name} marked as wasted and removed from pantry.`);
  };


  return (
    <>
      <AddIngredientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewIngredient}
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">My Pantry</h1>
          {/* --- This is the button to open the modal --- */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-accent-secondary text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusCircle size={20} />
            Add New Database Ingredient
          </button>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4"><Package className="text-blue-500" size={32}/><div><p className="text-text-secondary">Total Items</p><p className="text-2xl font-bold">{totalItems}</p></div></Card>
        <Card className="flex items-center gap-4"><BadgeCheck className="text-green-500" size={32}/><div><p className="text-text-secondary">Fresh Items</p><p className="text-2xl font-bold">{freshItems}</p></div></Card>
        <Card className="flex items-center gap-4"><AlertTriangle className="text-orange-500" size={32}/><div><p className="text-text-secondary">Expiring Soon</p><p className="text-2xl font-bold">{expiringSoonCount}</p></div></Card>
        <Card className="flex items-center gap-4"><IndianRupee className="text-purple-500" size={32}/><div><p className="text-text-secondary">Total Value</p><p className="text-2xl font-bold">₹{totalValue.toFixed(2)}</p></div></Card>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {inventory.map(item => {
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