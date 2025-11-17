"use client";
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ScanLine, Inbox, ChefHat, ShoppingCart, Calendar, BarChart2, ChevronsLeft, ChevronsRight } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scanner', label: 'Scanner', icon: ScanLine },
  { href: '/inventory', label: 'Inventory', icon: Inbox },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
  { href: '/meal-plan', label: 'Meal Plan', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <aside className={`bg-card flex flex-col shadow-subtle transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-20 border-b relative">
        {!isCollapsed && <h1 className="text-2xl font-bold text-primary font-poppins">PantryVeda</h1>}
        <button onClick={toggleSidebar} className="absolute -right-3 top-1/2 -translate-y-1/2 bg-card border rounded-full p-1 shadow-subtle z-10">
          {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`flex items-center gap-4 px-4 py-3 my-1 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                  pathname === item.href
                    ? 'gradient-accent text-white'
                    : 'text-secondary hover:bg-primary/10 hover:text-primary'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon size={20} />
                {!isCollapsed && <span className="font-semibold font-inter">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};