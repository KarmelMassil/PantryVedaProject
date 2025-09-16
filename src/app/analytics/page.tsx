"use client";
import React, { useMemo } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { Card } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { generateCategoryData, generateExpiryData, calculateTotalValue, calculateFoodWaste } from '@/lib/analyticsGenerator';
import { Package, IndianRupee, Trash2, Sprout } from 'lucide-react';

const COLORS = {
  Fresh: '#27AE60',
  'Expiring Soon': '#E67E22',
  Expired: '#C41E3A',
};

export default function AnalyticsPage() {
  const { inventory } = usePantryStore();

  const categoryData = useMemo(() => generateCategoryData(inventory), [inventory]);
  const expiryData = useMemo(() => generateExpiryData(inventory), [inventory]);
  const totalValue = useMemo(() => calculateTotalValue(inventory), [inventory]);
  const wasteStats = useMemo(() => calculateFoodWaste(inventory), [inventory]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Kitchen Analytics</h1>
      <p className="text-text-secondary">Insights into your pantry management and food usage.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4"><Package className="text-blue-500" size={32}/><div><p className="text-text-secondary">Total Items</p><p className="text-2xl font-bold">{inventory.length}</p></div></Card>
        <Card className="flex items-center gap-4"><IndianRupee className="text-purple-500" size={32}/><div><p className="text-text-secondary">Total Value</p><p className="text-2xl font-bold">₹{totalValue.toFixed(2)}</p></div></Card>
        <Card className="flex items-center gap-4"><Trash2 className="text-chili-red" size={32}/><div><p className="text-text-secondary">Food Waste</p><p className="text-2xl font-bold">₹{wasteStats.value.toFixed(2)}</p><p className="text-xs">{wasteStats.percentage.toFixed(1)}% of total</p></div></Card>
        <Card className="flex items-center gap-4"><Sprout className="text-curry-green" size={32}/><div><p className="text-text-secondary">Efficiency</p><p className="text-2xl font-bold">{(100 - wasteStats.percentage).toFixed(1)}%</p><p className="text-xs">utilization rate</p></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 h-96">
          <h2 className="text-xl font-bold mb-4">Inventory by Category</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{fill: 'rgba(245, 245, 245, 0.5)'}} />
              <Bar dataKey="count" fill="#E67E22" name="Item Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        <Card className="lg:col-span-2 h-96">
           <h2 className="text-xl font-bold mb-4">Expiry Status</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expiryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {expiryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}