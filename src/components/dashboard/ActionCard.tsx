import Link from 'next/link';
import React from 'react';

interface ActionCardProps {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({ href, label, description, icon, colorClass }) => {
  return (
    <Link href={href}>
      <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer h-full">
        <div className={`p-2 inline-block rounded-lg mb-3 ${colorClass}`}>
          {icon}
        </div>
        <h3 className="font-bold text-text-primary">{label}</h3>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
    </Link>
  );
};