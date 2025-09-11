"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  accentGradient: string;
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
  accentGradient: "from-purple-500 to-pink-500",
  fontSize: "medium",
  density: "comfortable",
  reduceMotion: false,
  highContrast: false,
  sidebarAutoCollapse: false,
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

// Gradient configurations with their RGB values
const gradientConfigs: Record<string, { 
  from: string;
  to: string;
  fromRGB: string;
  toRGB: string;
}> = {
  "from-purple-500 to-pink-500": {
    from: "#8b5cf6",
    to: "#ec4899",
    fromRGB: "139, 92, 246",
    toRGB: "236, 72, 153"
  },
  "from-blue-500 to-cyan-500": {
    from: "#3b82f6",
    to: "#06b6d4",
    fromRGB: "59, 130, 246",
    toRGB: "6, 182, 212"
  },
  "from-green-500 to-emerald-500": {
    from: "#10b981",
    to: "#34d399",
    fromRGB: "16, 185, 129",
    toRGB: "52, 211, 153"
  },
  "from-orange-500 to-red-500": {
    from: "#f59e0b",
    to: "#ef4444",
    fromRGB: "245, 158, 11",
    toRGB: "239, 68, 68"
  },
  "from-pink-500 to-rose-500": {
    from: "#ec4899",
    to: "#f43f5e",
    fromRGB: "236, 72, 153",
    toRGB: "244, 63, 94"
  },
  "from-indigo-500 to-purple-500": {
    from: "#6366f1",
    to: "#8b5cf6",
    fromRGB: "99, 102, 241",
    toRGB: "139, 92, 246"
  },
  "from-teal-500 to-cyan-500": {
    from: "#14b8a6",
    to: "#06b6d4",
    fromRGB: "20, 184, 166",
    toRGB: "6, 182, 212"
  },
  "from-amber-500 to-fuchsia-500": {
    from: "#f59e0b",
    to: "#d946ef",
    fromRGB: "245, 158, 11",
    toRGB: "217, 70, 239"
  },
  "from-blue-500 to-teal-500": {
    from: "#3b82f6",
    to: "#14b8a6",
    fromRGB: "59, 130, 246",
    toRGB: "20, 184, 166"
  },
  "from-red-500 to-yellow-500": {
    from: "#ef4444",
    to: "#eab308",
    fromRGB: "239, 68, 68",
    toRGB: "234, 179, 8"
  },
  "from-slate-500 to-gray-500": {
    from: "#64748b",
    to: "#6b7280",
    fromRGB: "100, 116, 139",
    toRGB: "107, 114, 128"
  },
  "from-lime-500 to-green-500": {
    from: "#84cc16",
    to: "#22c55e",
    fromRGB: "132, 204, 22",
    toRGB: "34, 197, 94"
  }
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
    
    // Apply accent gradient CSS variables
    const gradientConfig = gradientConfigs[settings.accentGradient] || gradientConfigs["from-purple-500 to-pink-500"];
    root.style.setProperty("--accent-primary-rgb", gradientConfig.fromRGB);
    root.style.setProperty("--accent-secondary-rgb", gradientConfig.toRGB);
    root.style.setProperty("--accent-gradient", settings.accentGradient);
    root.style.setProperty("--accent-from", gradientConfig.from);
    root.style.setProperty("--accent-to", gradientConfig.to);
    
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

// Helper hook to get accent gradient configuration
export function useAccentGradient() {
  const { settings } = useAppearance();
  const config = gradientConfigs[settings.accentGradient] || gradientConfigs["from-purple-500 to-pink-500"];
  return {
    gradient: settings.accentGradient,
    from: config.from,
    to: config.to,
    fromRGB: config.fromRGB,
    toRGB: config.toRGB,
    bgGradient: `bg-gradient-to-r ${settings.accentGradient}`
  };
}