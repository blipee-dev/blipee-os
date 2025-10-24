'use client';

/**
 * Accent Color Switcher Component
 *
 * Allows users to switch between different accent colors for the dashboard.
 * All UI elements will dynamically update to use the selected accent color.
 */

import React from 'react';
import { useTheme, type AccentColor } from '@/providers/ThemeProvider';
import { Palette } from 'lucide-react';

const accentColors: { value: AccentColor; label: string; hex: string }[] = [
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'purple', label: 'Purple', hex: '#a855f7' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
];

export function AccentColorSwitcher() {
  const { accentColor, setAccentColor } = useTheme();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white dark:bg-[#2A2A2A] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Accent Color
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => setAccentColor(color.value)}
              className={`
                relative w-10 h-10 rounded-lg transition-all
                ${accentColor === color.value
                  ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110'
                  : 'hover:scale-105'
                }
              `}
              style={{ backgroundColor: color.hex }}
              title={color.label}
            >
              {accentColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          All icons adapt to your choice
        </p>
      </div>
    </div>
  );
}
