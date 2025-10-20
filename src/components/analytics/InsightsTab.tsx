import React from 'react';
import { TrendingUp, ShoppingBasket, AlertTriangle } from 'lucide-react';

const insightIcons = {
    efficiency: <TrendingUp className="text-blue-500" />,
    shopping: <ShoppingBasket className="text-green-500" />,
    expiry: <AlertTriangle className="text-yellow-600" />,
};

const insightColors = {
    efficiency: 'bg-blue-50 border-blue-200',
    shopping: 'bg-green-50 border-green-200',
    expiry: 'bg-yellow-50 border-yellow-200',
};

interface InsightsTabProps {
  data: { 
    type: 'efficiency' | 'shopping' | 'expiry'; 
    title: string; 
    message: string;
  }[];
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ data }) => {
  return (
    <div>
        <h3 className="text-xl font-bold mb-4">Smart Insights</h3>
        {data.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <p>Great job! No critical insights at the moment.</p>
            <p className="text-sm mt-2">Keep managing your pantry efficiently!</p>
          </div>
        ) : (
          <div className="space-y-4">
              {data.map((insight, index) => (
                  <div key={index} className={`flex items-start gap-4 p-4 rounded-lg border ${insightColors[insight.type]}`}>
                      <div className="flex-shrink-0">{insightIcons[insight.type]}</div>
                      <div>
                          <p className="font-semibold">{insight.title}</p>
                          <p className="text-sm text-text-secondary">{insight.message}</p>
                      </div>
                  </div>
              ))}
          </div>
        )}
    </div>
  );
};