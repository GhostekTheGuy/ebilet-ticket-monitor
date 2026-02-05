'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  ShoppingCart,
  Settings,
  X
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
];

interface SidebarProps {
  activeSection?: string;
  onNavigate?: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeSection = 'overview', onNavigate, isOpen = false, onClose }: SidebarProps) {
  const handleNavigate = (id: string) => {
    onNavigate?.(id);
    onClose?.();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 flex flex-col bg-[#0c0c0e] border-r border-[#1a1a1d] transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:w-56",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between gap-3 px-4 border-b border-[#1a1a1d]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1e] cursor-pointer shrink-0">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">eBilet Monitor</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#5a5a62] hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex items-center gap-3 h-11 px-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-[#4a4a52] hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
          <div className="flex-1" />
        </nav>

        {/* Bottom */}
        <div className="py-3 px-2 border-t border-[#1a1a1d] flex flex-col gap-0.5">
          {bottomItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex items-center gap-3 h-11 px-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-[#4a4a52] hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
