"use client";
import React, { useMemo } from 'react';
import { usePantryStore } from '@/store/pantryStore';
import { calculateAnalytics } from '@/lib/analyticsEngine';
import { Card } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, IndianRupee, AlertTriangle, CalendarCheck, ShieldCheck, BarChartHorizontal, Info} from 'lucide-react';
import { CategoriesTab } from '@/components/analytics/CategoriesTab';
import { TrendsTab } from '@/components/analytics/TrendsTab';
import { InsightsTab } from '@/components/analytics/InsightsTab';
import { EmptyState } from '@/components/ui/EmptyState';

const COLORS = {
    'Fresh': '#27AE60',
    'Expiring Soon': '#FFA500',
    'Expired': '#C41E3A',
};

type Tab = 'Overview' | 'Categories' | 'Trends' | 'Insights';

export default function AnalyticsPage() {
    const { inventory, consumptionLog, wasteLog, masterIngredientList } = usePantryStore();
    const [activeTab, setActiveTab] = React.useState<Tab>('Overview');

    // useMemo will prevent recalculating on every render, improving performance
    const analyticsData = useMemo(
        () => calculateAnalytics(inventory, consumptionLog, wasteLog, masterIngredientList),
        [inventory, consumptionLog, wasteLog, masterIngredientList]
    );

    const { summary, charts, categories, trends, insights } = analyticsData;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Categories':
                return <CategoriesTab data={categories.valueByCategory} inventory={inventory} />;
            case 'Trends':
                return <TrendsTab data={trends.monthlyTrend} />;
            case 'Insights':
                return <InsightsTab data={insights} />;
            case 'Overview':
            default:
                if (inventory.length === 0) {
                    return <EmptyState type="no-analytics" />;
                }
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Bar Chart */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Inventory by Category</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={charts.inventoryByCategory}>
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Pie Chart */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Expiry Status</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={charts.expiryStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {charts.expiryStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-2 py-1">
        <div className="flex items-center gap-3">
            <BarChartHorizontal className="text-primary" size={36} />
            <div>
                <h1 className="text-4xl font-bold text-text-primary tracking-tight">Analytics</h1>
                <div className="flex items-center gap-1.5">
                    <Info size={14} className="text-text-secondary" />
                    <p className="text-text-secondary font-medium">Insights on waste, spending, and usage</p>
                </div>
            </div>
        </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="flex items-center gap-4">
                    <Package className="text-blue-500" size={32}/>
                    <div>
                        <p className="text-text-secondary text-sm">Total Items</p>
                        <p className="text-2xl font-bold">{summary.totalItems}</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <IndianRupee className="text-green-500" size={32}/>
                    <div>
                        <p className="text-text-secondary text-sm">Total Value</p>
                        <p className="text-2xl font-bold">₹{summary.totalValue.toFixed(2)}</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <AlertTriangle className="text-red-500" size={32}/>
                    <div>
                        <p className="text-text-secondary text-sm">Food Waste</p>
                        <p className="text-2xl font-bold">{summary.foodWastePercentage.toFixed(1)}%</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <CalendarCheck className="text-purple-500" size={32}/>
                    <div>
                        <p className="text-text-secondary text-sm">Avg Shelf Life</p>
                        <p className="text-2xl font-bold">{Math.round(summary.avgShelfLife)} days</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <ShieldCheck className="text-teal-500" size={32}/>
                    <div>
                        <p className="text-text-secondary text-sm">Efficiency</p>
                        <p className="text-2xl font-bold">{summary.utilizationRate.toFixed(1)}%</p>
                    </div>
                </Card>
            </div>

            {/* Main Content Area with Tabs */}
            <Card className="p-6">
                <div className="flex border-b mb-6">
                    {(['Overview', 'Categories', 'Trends', 'Insights'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-semibold transition-colors ${
                                activeTab === tab 
                                    ? 'border-b-2 border-accent-primary text-accent-primary' 
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {renderTabContent()}
            </Card>
        </div>
    );
}