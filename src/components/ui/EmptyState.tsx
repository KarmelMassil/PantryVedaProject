import React from 'react';
import { PackageSearch, Inbox } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-inventory' | 'no-results';
}

const illustrations = {
  'no-inventory': {
    icon: <Inbox size={64} className="text-gray-400" />,
    title: "Your pantry is empty!",
    message: "Add your first ingredient to get started. Use the scanner or add items manually.",
  },
  'no-results': {
    icon: <PackageSearch size={64} className="text-gray-400" />,
    title: "No items found",
    message: "Try adjusting your search or filters to find what you're looking for.",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const { icon, title, message } = illustrations[type];

  return (
    <div className="text-center py-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">{message}</p>
    </div>
  );
};
