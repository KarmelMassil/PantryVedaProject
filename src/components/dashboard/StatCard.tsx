import React from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  }
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass, trend }) => {
  return (
    <Card className="p-4 bg-white shadow-subtle">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-full ${colorClass}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-xs ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-secondary">{value}</p>
        <p className="text-sm text-secondary">{label}</p>
        {trend && (
            <p className="text-xs text-gray-500">{trend.value}</p>
        )}
      </div>
    </Card>
  );
};