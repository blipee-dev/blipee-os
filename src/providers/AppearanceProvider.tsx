"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  density: "compact" | "comfortable" | "spacious";
  reduceMotion: boolean;
  highContrast: boolean;
  sidebarAutoCollapse: boolean;
}

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateSetting: <K extends keyof AppearanceSettings>(
    key: K, 
    value: AppearanceSettings[K]
  ) => void;
  resetSettings: () => void;
}

const defaultSettings: AppearanceSettings = {
  theme: "system",
  accentColor: "purple",
  fontSize: "medium",
  density: "comfortable",
  reduceMotion: false,
  highContrast: false,
  sidebarAutoCollapse: false,
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

// Accent color mapping to Tailwind classes
const accentColorMap: Record<string, { 
  primary: string; 
  gradient: string; 
  ring: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  hoverBg: string;
}> = {
  purple: {
    primary: "purple-500",
    gradient: "from-purple-500 to-pink-500",
    ring: "ring-purple-500",
    bgGradient: "bg-gradient-to-r from-purple-500 to-pink-500",
    borderColor: "border-purple-500",
    textColor: "text-purple-600 dark:text-purple-400",
    hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-900/20"
  },
  blue: {
    primary: "blue-500",
    gradient: "from-blue-500 to-cyan-500",
    ring: "ring-blue-500",
    bgGradient: "bg-gradient-to-r from-blue-500 to-cyan-500",
    borderColor: "border-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-900/20"
  },
  green: {
    primary: "green-500",
    gradient: "from-green-500 to-emerald-500",
    ring: "ring-green-500",
    bgGradient: "bg-gradient-to-r from-green-500 to-emerald-500",
    borderColor: "border-green-500",
    textColor: "text-green-600 dark:text-green-400",
    hoverBg: "hover:bg-green-50 dark:hover:bg-green-900/20"
  },
  orange: {
    primary: "orange-500",
    gradient: "from-orange-500 to-red-500",
    ring: "ring-orange-500",
    bgGradient: "bg-gradient-to-r from-orange-500 to-red-500",
    borderColor: "border-orange-500",
    textColor: "text-orange-600 dark:text-orange-400",
    hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-900/20"
  },
  pink: {
    primary: "pink-500",
    gradient: "from-pink-500 to-rose-500",
    ring: "ring-pink-500",
    bgGradient: "bg-gradient-to-r from-pink-500 to-rose-500",
    borderColor: "border-pink-500",
    textColor: "text-pink-600 dark:text-pink-400",
    hoverBg: "hover:bg-pink-50 dark:hover:bg-pink-900/20"
  },
  indigo: {
    primary: "indigo-500",
    gradient: "from-indigo-500 to-purple-500",
    ring: "ring-indigo-500",
    bgGradient: "bg-gradient-to-r from-indigo-500 to-purple-500",
    borderColor: "border-indigo-500",
    textColor: "text-indigo-600 dark:text-indigo-400",
    hoverBg: "hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
  },
};

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  const applySettings = (settings: AppearanceSettings) => {
    const root = document.documentElement;
    
    // Apply theme
    if (settings.theme === 'system') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('System theme detection:', prefersDark ? 'dark' : 'light');
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    }
    
    // Apply font size
    const fontSizeMap = {
      small: { base: "14px", scale: 0.875 },
      medium: { base: "16px", scale: 1 },
      large: { base: "18px", scale: 1.125 },
    };
    const fontSize = fontSizeMap[settings.fontSize];
    root.style.setProperty("--font-size-base", fontSize.base);
    root.style.setProperty("--font-scale", fontSize.scale.toString());
    
    // Apply density (spacing)
    const densityMap = {
      compact: { spacing: "0.75", padding: "0.5rem" },
      comfortable: { spacing: "1", padding: "0.75rem" },
      spacious: { spacing: "1.25", padding: "1rem" },
    };
    const density = densityMap[settings.density];
    root.style.setProperty("--spacing-scale", density.spacing);
    root.style.setProperty("--padding-base", density.padding);
    
    // Apply accent color CSS variables with actual RGB values
    const accentColorRGB = {
      purple: { primary: "168, 85, 247", secondary: "236, 72, 153" },
      blue: { primary: "59, 130, 246", secondary: "6, 182, 212" },
      green: { primary: "34, 197, 94", secondary: "16, 185, 129" },
      orange: { primary: "249, 115, 22", secondary: "239, 68, 68" },
      pink: { primary: "236, 72, 153", secondary: "244, 63, 94" },
      indigo: { primary: "99, 102, 241", secondary: "168, 85, 247" },
    };
    const colors = accentColorRGB[settings.accentColor] || accentColorRGB.purple;
    root.style.setProperty("--accent-primary-rgb", colors.primary);
    root.style.setProperty("--accent-secondary-rgb", colors.secondary);
    
    // Apply reduce motion
    if (settings.reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    
    // Apply sidebar auto-collapse
    if (settings.sidebarAutoCollapse) {
      root.classList.add("sidebar-auto-collapse");
    } else {
      root.classList.remove("sidebar-auto-collapse");
    }
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("appearanceSettings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const loadedSettings = { ...defaultSettings, ...parsed };
        setSettings(loadedSettings);
        // Apply settings immediately on load
        applySettings(loadedSettings);
      } catch (error) {
        console.error("Failed to parse appearance settings:", error);
        // Apply default settings if parse fails
        applySettings(defaultSettings);
      }
    } else {
      // Apply default settings if nothing stored
      applySettings(defaultSettings);
    }
    setIsLoaded(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        applySettings(settings);
      };
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } 
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [settings.theme, settings]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("appearanceSettings", JSON.stringify(settings));
      applySettings(settings);
    }
  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
}

// Helper hook to get accent color classes
export function useAccentColor() {
  const { settings } = useAppearance();
  return accentColorMap[settings.accentColor] || accentColorMap.purple;
}