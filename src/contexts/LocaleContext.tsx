'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { locales, defaultLocale, type Locale } from '@/i18n';
import { localeUtils } from '@/lib/i18n/utils';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isLoading: boolean;
  messages: Record<string, any>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Record<string, any>>({});

  // Load messages for current locale
  const loadMessages = async (targetLocale: Locale) => {
    try {
      setIsLoading(true);
      
      // Dynamic import of messages
      const messagesModule = await import(`../messages/${targetLocale}.json`);
      setMessages(messagesModule.default);
      
      // Update document language attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = targetLocale;
        document.documentElement.dir = localeUtils.isRtlLocale(targetLocale) ? 'rtl' : 'ltr';
      }
      
    } catch (error) {
      console.error(`Failed to load messages for locale: ${targetLocale}`, error);
      
      // Fallback to default locale if not already trying it
      if (targetLocale !== defaultLocale) {
        await loadMessages(defaultLocale);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize locale on mount
  useEffect(() => {
    const initializeLocale = async () => {
      let initialLoc = locale;

      if (typeof window !== 'undefined') {
        // Priority 1: Check localStorage
        const storedLocale = localStorage.getItem('preferred-locale') as Locale;
        
        // Priority 2: Check cookie (fallback)
        const cookieLocale = document.cookie
          .split('; ')
          .find(row => row.startsWith('preferred-locale='))
          ?.split('=')[1] as Locale;

        if (storedLocale && locales.includes(storedLocale)) {
          initialLoc = storedLocale;
        } else if (cookieLocale && locales.includes(cookieLocale)) {
          initialLoc = cookieLocale;
        } else if (!initialLocale) {
          // Priority 3: Detect from browser language
          const browserLocale = localeUtils.getBrowserLocale();
          initialLoc = browserLocale;
          
          // Save detected language to localStorage
          localStorage.setItem('preferred-locale', browserLocale);
        }
      }

      if (initialLoc !== locale) {
        setLocaleState(initialLoc);
      }
      
      await loadMessages(initialLoc);
    };

    initializeLocale();
  }, []);

  // Change locale function
  const setLocale = async (newLocale: Locale) => {
    if (newLocale === locale) return;

    setLocaleState(newLocale);
    
    // Save preference to both localStorage and cookie
    if (typeof window !== 'undefined') {
      // Primary storage: localStorage
      localStorage.setItem('preferred-locale', newLocale);
      
      // Fallback storage: cookie
      document.cookie = `preferred-locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }

    // Load new messages
    await loadMessages(newLocale);

    // Trigger a re-render of the entire app by reloading
    // This ensures all components get the new locale context
    if (typeof window !== 'undefined') {
      // Small delay to ensure storage is set
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const contextValue: LocaleContextType = {
    locale,
    setLocale,
    isLoading,
    messages
  };

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
}