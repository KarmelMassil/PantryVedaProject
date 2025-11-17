import { WeeklySnapshot } from '@/store/pantryStore';
import { getDashboardStats } from './dashboardGenerator';
import { Ingredient } from '@/types';

export const calculateTrends = (inventory: Ingredient[], weeklySnapshots: WeeklySnapshot[]) => {
  const currentStats = getDashboardStats(inventory);

  if (weeklySnapshots.length === 0) {
    // First week of using the app
    return {
      totalItems: {
        value: `+${currentStats.totalItems} this week`,
        direction: 'up' as const,
      },
      totalValue: {
        value: `+₹${currentStats.totalValue.toFixed(0)} this week`,
        direction: 'up' as const,
      },
      freshItems: {
        value: `${currentStats.freshItemsCount > 0 ? (currentStats.freshItemsCount / currentStats.totalItems * 100).toFixed(0) : 0}% fresh`,
        direction: 'up' as const,
      },
      expiringSoon: {
          value: 'Plan meals now',
          direction: 'down' as const,
      }
    };
  }

  const lastWeekStats = weeklySnapshots[weeklySnapshots.length - 1];

  const totalItemsChange = currentStats.totalItems - lastWeekStats.totalItems;
  const totalValueChange = currentStats.totalValue - lastWeekStats.totalValue;
  const freshItemsChange = currentStats.freshItemsCount - lastWeekStats.freshItems;

  return {
    totalItems: {
      value: `${totalItemsChange >= 0 ? '+' : ''}${totalItemsChange} this week`,
      direction: totalItemsChange >= 0 ? 'up' as const : 'down' as const,
    },
    totalValue: {
      value: `₹${Math.abs(totalValueChange).toFixed(0)} ${totalValueChange >= 0 ? 'added' : 'reduced'}`,
      direction: totalValueChange >= 0 ? 'up' as const : 'down' as const,
    },
    freshItems: {
        value: `${currentStats.freshItemsCount > 0 ? (currentStats.freshItemsCount / currentStats.totalItems * 100).toFixed(0) : 0}% fresh`,
        direction: freshItemsChange >= 0 ? 'up' as const : 'down' as const,
    },
    expiringSoon: {
        value: 'Plan meals now',
        direction: 'down' as const,
    }
  };
};