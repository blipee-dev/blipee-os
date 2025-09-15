"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Import all translation files
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';
import ptMessages from '@/messages/pt.json';

// Supported locales as const for type safety
export const SUPPORTED_LOCALES = ['en', 'es', 'pt'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

// Translation messages type
type Messages = typeof enMessages;

interface LanguageSettings {
  locale: Locale;
  autoDetect: boolean;
}

interface LanguageContextType {
  settings: LanguageSettings;
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  toggleAutoDetect: () => void;
  t: (key: string) => string;
  resetSettings: () => void;
}

const defaultSettings: LanguageSettings = {
  locale: "en",
  autoDetect: true,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Message bundles
const messageBundles: Record<Locale, Messages> = {
  en: enMessages,
  es: esMessages,
  pt: ptMessages,
};

// Detect browser language
function detectBrowserLanguage(): Locale {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LOCALES.includes(browserLang as Locale) 
    ? (browserLang as Locale) 
    : 'en';
}

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  } catch {
    return path;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<LanguageSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Get current messages based on locale
  const messages = messageBundles[settings.locale] || messageBundles.en;

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("languageSettings");
    let loadedSettings = defaultSettings;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        loadedSettings = { ...defaultSettings, ...parsed };
      } catch (error) {
        console.error("Failed to parse language settings:", error);
      }
    }

    // Auto-detect browser language if enabled and no stored preference
    if (loadedSettings.autoDetect && (!stored || !JSON.parse(stored || '{}').locale)) {
      const browserLocale = detectBrowserLanguage();
      loadedSettings.locale = browserLocale;
      console.log('Language auto-detection:', browserLocale);
    }

    setSettings(loadedSettings);
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("languageSettings", JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  // Translation function with dot notation support and interpolation
  const t = (key: string, params?: Record<string, any>): string => {
    let value = getNestedValue(messages, key);
    
    // Handle interpolation
    if (params && typeof value === 'string') {
      Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
      });
    }
    
    return value;
  };

  const setLocale = (locale: Locale) => {
    setSettings(prev => ({ 
      ...prev, 
      locale,
      autoDetect: false // Disable auto-detect when user manually selects
    }));
  };

  const toggleAutoDetect = () => {
    setSettings(prev => {
      const newAutoDetect = !prev.autoDetect;
      return {
        ...prev,
        autoDetect: newAutoDetect,
        // If enabling auto-detect, immediately apply browser language
        locale: newAutoDetect ? detectBrowserLanguage() : prev.locale
      };
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        settings, 
        locale: settings.locale,
        messages,
        setLocale, 
        toggleAutoDetect,
        t, 
        resetSettings 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Helper hook for specific translation sections
export function useTranslations(section: string) {
  const { t } = useLanguage();
  
  return (key: string, params?: Record<string, any>) => t(`${section}.${key}`, params);
}

// Helper to get locale display info
export function getLocaleInfo(locale: Locale) {
  const localeInfo: Record<Locale, { name: string; flag: string; nativeName: string }> = {
    en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
    es: { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
    pt: { name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  };
  
  return localeInfo[locale];
}