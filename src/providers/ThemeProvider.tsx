'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AccentColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'cyan';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accentColor, setAccentColorState] = useState<AccentColor>('green');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const savedAccent = localStorage.getItem('accentColor') as AccentColor;

    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    if (savedAccent) {
      setAccentColorState(savedAccent);
    }
  }, []);

  // Apply theme class to document root
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      if (isDarkMode) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }

      // Save preference
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, mounted]);

  // Apply accent color CSS variables
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;

      // Set CSS variables for the accent color
      root.style.setProperty('--accent-color', accentColor);

      // Save preference
      localStorage.setItem('accentColor', accentColor);
    }
  }, [accentColor, mounted]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}