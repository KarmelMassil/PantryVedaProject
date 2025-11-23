"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ScanLine,
  Inbox,
  BookOpen,
  ShoppingCart,
  Calendar,
  BarChartHorizontal,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
  { href: "/inventory", label: "Inventory", icon: Inbox },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/meal-plan", label: "Meal Plan", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChartHorizontal },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <aside
      className={`bg-card shadow-subtle flex flex-col border-r transition-all duration-300 
      ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Header */}
      <div className="relative border-b px-4 py-5 flex items-center justify-center">
      {/* Full logo when expanded */}
      {!isCollapsed && (
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            <img 
              src="/images/logo.png" 
              alt="PantryVeda Logo" 
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold text-primary font-poppins">
              PantryVeda
            </span>
          </div>

          <span className="text-xs text-secondary font-inter tracking-widest mt-1">
            SMART KITCHEN ASSISTANT
          </span>
        </div>
      )}

      {/* Collapsed icon-only logo */}
      {isCollapsed && (
        <img 
          src="/images/logo.png"
          alt="PantryVeda"
          className="w-8 h-8"
        />
      )}

      <button 
        onClick={toggleSidebar} 
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-card border rounded-full p-1 shadow-subtle z-10"
      >
        {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>
    </div>


      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 
                  ${
                    active
                      ? "gradient-accent text-white shadow-sm"
                      : "text-secondary hover:bg-primary/10 hover:text-primary"
                  }
                  ${isCollapsed ? "justify-center" : ""}`}
                >
                  {/* Active indicator bar */}
                  {active && !isCollapsed && (
                    <span className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-md"></span>
                  )}

                  <item.icon size={20} />
                  {!isCollapsed && (
                    <span className="font-inter font-semibold">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
