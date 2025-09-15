"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ScanLine, Inbox, Utensils, ShoppingCart, Calendar, BarChart2 } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scanner', label: 'Scanner', icon: ScanLine },
  { href: '/inventory', label: 'Inventory', icon: Inbox },
  { href: '/recipes', label: 'Recipes', icon: Utensils },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
  { href: '/meal-plan', label: 'Meal Plan', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white flex flex-col shadow-lg">
      <div className="flex items-center justify-center h-20 border-b">
        <h1 className="text-2xl font-bold text-accent-primary">PantryVeda</h1>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`flex items-center gap-4 px-4 py-3 my-1 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-accent-primary text-white'
                    : 'text-text-secondary hover:bg-accent-primary/10 hover:text-accent-primary'
                }`}
              >
                <item.icon size={20} />
                <span className="font-semibold">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};