'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const ACCENT_COLORS = [
  { name: 'Niebieski', value: '#5b9bf5' },
  { name: 'Fioletowy', value: '#a78bfa' },
  { name: 'Różowy', value: '#f472b6' },
  { name: 'Czerwony', value: '#ef4444' },
  { name: 'Pomarańczowy', value: '#f97316' },
  { name: 'Żółty', value: '#facc15' },
  { name: 'Zielony', value: '#4ade80' },
  { name: 'Morski', value: '#2dd4bf' },
];

function applyAccentColor(color: string) {
  const root = document.documentElement;
  root.style.setProperty('--primary', color);
  root.style.setProperty('--accent', color);
  root.style.setProperty('--ring', color);
}

export function getStoredAccentColor(): string {
  if (typeof window === 'undefined') return '#5b9bf5';
  return localStorage.getItem('accent-color') || '#5b9bf5';
}

export function initAccentColor() {
  const color = getStoredAccentColor();
  if (color !== '#5b9bf5') {
    applyAccentColor(color);
  }
}

export function SettingsPage() {
  const [selectedColor, setSelectedColor] = useState('#5b9bf5');

  useEffect(() => {
    setSelectedColor(getStoredAccentColor());
  }, []);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    localStorage.setItem('accent-color', color);
    applyAccentColor(color);
  };

  return (
    <div className="p-4 lg:p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-[-0.02em]">Ustawienia</h1>
        <p className="text-[#5a5a62] text-sm mt-1">Dostosuj wygląd dashboardu</p>
      </div>

      <div className="figma-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Kolor akcentowy</h2>
          <p className="text-xs text-[#5a5a62] mt-0.5">Wpływa na główne elementy interfejsu</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {ACCENT_COLORS.map((color) => {
            const isSelected = selectedColor === color.value;
            return (
              <motion.button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className="group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-colors"
                style={{
                  background: isSelected ? `${color.value}10` : 'transparent',
                  border: `1px solid ${isSelected ? `${color.value}40` : 'rgba(255,255,255,0.06)'}`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="relative h-10 w-10 rounded-full shadow-lg"
                  style={{
                    background: color.value,
                    boxShadow: isSelected ? `0 0 20px ${color.value}50` : 'none',
                  }}
                >
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      <Check className="h-5 w-5 text-white drop-shadow-md" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
                <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-[#5a5a62]'}`}>
                  {color.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[#1a1a1d]">
          <p className="text-xs text-[#4a4a52]">
            Podgląd:
            <span className="ml-2 font-semibold" style={{ color: selectedColor }}>
              1 234 dostępnych biletów
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
