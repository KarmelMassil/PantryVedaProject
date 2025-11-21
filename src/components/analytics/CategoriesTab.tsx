import React from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

interface CategoriesTabProps {
  data: { name: string; totalValue: number }[];
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ data }) => {
  const hasData = data.some(category => category.totalValue > 0);

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Category Analysis</h3>
      <p className="text-text-secondary mb-4">Value distribution across ingredient categories.</p>
      {hasData ? (
        <div className="space-y-3">
          {data.filter(c => c.totalValue > 0).map((category, index) => (
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