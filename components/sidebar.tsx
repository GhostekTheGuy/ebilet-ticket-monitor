'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 lg:w-56 flex flex-col bg-[#0c0c0e] border-r border-[#1a1a1d]">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center lg:justify-start gap-3 px-2 lg:px-4 border-b border-[#1a1a1d]">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a1e] cursor-pointer shrink-0">
          <Ticket className="h-4 w-4 text-white" />
        </div>
        <span className="hidden lg:block font-semibold text-sm text-white truncate">eBilet Monitor</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-3 h-10 lg:h-10 px-2 lg:px-3 rounded-lg transition-colors",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-[#4a4a52] hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              <span className="hidden lg:block text-sm font-medium truncate">{item.label}</span>
            </button>
          );
        })}
        <div className="flex-1" />
      </nav>

      {/* Bottom */}
      <div className="py-4 px-2 border-t border-[#1a1a1d] flex flex-col gap-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            className="flex items-center justify-center lg:justify-start gap-3 h-10 lg:h-10 px-2 lg:px-3 rounded-lg text-[#4a4a52] hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            <span className="hidden lg:block text-sm font-medium truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
