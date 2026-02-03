'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  Ticket,
  ShoppingCart,
  Settings,
  HelpCircle
} from 'lucide-react';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  id: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Przegląd', id: 'overview' },
  { icon: BarChart3, label: 'Wykresy', id: 'charts' },
  { icon: Ticket, label: 'Sektory', id: 'sectors' },
  { icon: ShoppingCart, label: 'AleBilet', id: 'alebilet' },
];

const bottomItems: NavItem[] = [
  { icon: Settings, label: 'Ustawienia', id: 'settings' },
  { icon: HelpCircle, label: 'Pomoc', id: 'help' },
];

interface SidebarProps {
  activeSection?: string;
  onNavigate?: (id: string) => void;
}

export function Sidebar({ activeSection = 'overview', onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 lg:w-56 flex flex-col bg-[#0a0a0c] border-r border-white/5">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <Ticket className="h-4 w-4 text-white" />
        </div>
        <span className="hidden lg:block font-semibold text-sm">eBilet Monitor</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate?.(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-600/20 text-violet-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:block">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="py-4 px-2 border-t border-white/5">
        <ul className="space-y-1">
          {bottomItems.map((item) => (
            <li key={item.id}>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
