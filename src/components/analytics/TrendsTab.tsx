import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface TrendsTabProps {
  data: { name: string; added: number; used: number }[];
}

export const TrendsTab: React.FC<TrendsTabProps> = ({ data }) => {
  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-xl font-bold">Monthly Trend</h3>
                <p className="text-text-secondary">Items added vs. items used over the last 30 days.</p>
            </div>
            <p className="text-sm text-text-secondary font-medium">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip wrapperClassName="!bg-white !border-gray-200 !rounded-md !shadow-lg" />
                <Legend />
                <Line type="monotone" dataKey="added" name="Items Added" stroke="#C41E3A" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="used" name="Items Used" stroke="#27AE60" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};