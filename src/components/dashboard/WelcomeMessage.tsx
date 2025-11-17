"use client";
import React, { useEffect, useState } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { getDashboardStats } from '@/lib/dashboardGenerator';

const WelcomeMessage = () => {
  const [timeOfDay, setTimeOfDay] = useState('');
  const { inventory } = usePantryStore();
  const stats = getDashboardStats(inventory);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeOfDay('Morning');
    } else if (hour < 18) {
      setTimeOfDay('Afternoon');
    } else {
      setTimeOfDay('Evening');
    }
  }, []);

  return (
    <div className="p-6 rounded-lg bg-gradient-orange-to-pink text-white shadow-lg">
      <h1 className="text-4xl font-bold flex items-center">
        Good {timeOfDay}! <span className="ml-2">👋</span>
      </h1>
      <p className="mt-2">
        You have {stats.totalItems} items in your pantry. {stats.expiringSoonCount > 0 && `${stats.expiringSoonCount} item expiring soon!`}
      </p>
    </div>
  );
};

export default WelcomeMessage;
