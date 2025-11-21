import React from 'react';
import { Card } from '@/components/ui/Card';
import React from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Ingredient } from '@/types';

interface CategoriesTabProps {
  data: { name: string; totalValue: number }[];
  inventory: Ingredient[];
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ data, inventory }) => {
  // We need to check if there are any categories that have items, even if value is 0
  const categoriesWithItems = new Set(inventory.map(item => item.category));
  const dataToShow = data.filter(category => categoriesWithItems.has(category.name));

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Category Analysis</h3>
      <p className="text-text-secondary mb-4">Value distribution across ingredient categories.</p>
      {inventory.length > 0 ? (
        <div className="space-y-3">
          {dataToShow.map((category, index) => (
            <Card key={category.name} className="flex items-center justify-between p-4 bg-yellow-50/50">
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary font-bold">{index + 1}</span>
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-sm text-text-secondary">Category</p>
                </div>
              </div>
              <p className="text-lg font-bold text-text-primary">₹{category.totalValue.toFixed(2)}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState type="no-analytics" />
      )}
    </div>
  );
};