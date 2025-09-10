import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { locales, type Locale, localeTimezones, localeCurrencies, isRtlLocale } from '@/i18n';
import type { TranslationValues, FormatOptions } from '@/types/translations';

// Enhanced translation hook with formatting
export function useEnhancedTranslations(namespace?: string) {
  const t = useTranslations(namespace);
  const locale = useLocale() as Locale;
  const format = useFormatter();

  // Rich text formatting with interpolation
  const tRich = (key: string, values?: TranslationValues, options?: FormatOptions) => {
    if (!values) return t(key);
    
    // Handle date formatting
    if (values.date && options?.dateTime) {
      const dateFormat = options.dateTime.format || 'short';
      values.date = format.dateTime(values.date as Date, {
        dateStyle: dateFormat === 'short' ? 'short' : 'long',
        timeZone: options.dateTime.timeZone || localeTimezones[locale]
      });
    }

    // Handle number formatting
    if (values.number && options?.number) {
      const numFormat = options.number.format || 'precise';
      if (numFormat === 'currency') {
        values.number = format.number(values.number as number, {
          style: 'currency',
          currency: options.number.currency || localeCurrencies[locale],
          minimumFractionDigits: options.number.minimumFractionDigits || 2,
          maximumFractionDigits: options.number.maximumFractionDigits || 2
        });
      } else if (numFormat === 'percent') {
        values.number = format.number(values.number as number, {
          style: 'percent',
          minimumFractionDigits: options.number.minimumFractionDigits || 1,
          maximumFractionDigits: options.number.maximumFractionDigits || 2
        });
      }
    }

    return t(key, values);
  };

  // Pluralization helper
  const tPlural = (key: string, count: number, values?: TranslationValues) => {
    return t(key, { count, ...values });
  };

  // List formatting helper
  const tList = (items: string[], options?: FormatOptions) => {
    return format.list(items, {
      type: options?.list?.type || 'conjunction'
    });
  };

  return {
    t,
    tRich,
    tPlural,
    tList,
    locale,
    format,
    isRtl: isRtlLocale(locale)
  };
}

// Locale utilities
export const localeUtils = {
  // Get browser locale with fallback
  getBrowserLocale(): Locale {
    if (typeof navigator === 'undefined') return 'en';
    
    const browserLocale = navigator.language.split('-')[0] as Locale;
    return locales.includes(browserLocale) ? browserLocale : 'en';
  },

  // Get user's timezone
  getUserTimezone(): string {
    if (typeof Intl === 'undefined') return 'UTC';
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  // Get currency for locale
  getCurrencyForLocale(locale: Locale): string {
    return localeCurrencies[locale] || 'USD';
  },

  // Get timezone for locale
  getTimezoneForLocale(locale: Locale): string {
    return localeTimezones[locale] || 'UTC';
  },

  // Check if locale is RTL
  isRtlLocale(locale: Locale): boolean {
    return isRtlLocale(locale);
  },

  // Format number for locale
  formatNumber(
    number: number, 
    locale: Locale, 
    options?: Intl.NumberFormatOptions
  ): string {
    return new Intl.NumberFormat(locale, options).format(number);
  },

  // Format date for locale
  formatDate(
    date: Date, 
    locale: Locale, 
    options?: Intl.DateTimeFormatOptions
  ): string {
    return new Intl.DateTimeFormat(locale, {
      timeZone: localeTimezones[locale],
      ...options
    }).format(date);
  },

  // Format currency for locale
  formatCurrency(
    amount: number, 
    locale: Locale, 
    currency?: string
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || localeCurrencies[locale]
    }).format(amount);
  },

  // Format relative time
  formatRelativeTime(
    date: Date, 
    locale: Locale, 
    baseDate: Date = new Date()
  ): string {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diffInMs = date.getTime() - baseDate.getTime();
    
    const units = [
      { unit: 'year', ms: 31536000000 },
      { unit: 'month', ms: 2628000000 },
      { unit: 'week', ms: 604800000 },
      { unit: 'day', ms: 86400000 },
      { unit: 'hour', ms: 3600000 },
      { unit: 'minute', ms: 60000 },
      { unit: 'second', ms: 1000 }
    ] as const;

    for (const { unit, ms } of units) {
      const diff = Math.round(diffInMs / ms);
      if (Math.abs(diff) >= 1) {
        return rtf.format(diff, unit);
      }
    }

    return rtf.format(0, 'second');
  }
};

// Translation validation utilities
export const translationUtils = {
  // Validate translation completeness
  validateTranslations(translations: Record<string, any>, baseTranslations: Record<string, any>): {
    missing: string[];
    extra: string[];
    complete: boolean;
  } {
    const missing: string[] = [];
    const extra: string[] = [];

    const checkKeys = (obj: any, baseObj: any, path = '') => {
      for (const key in baseObj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj)) {
          missing.push(currentPath);
        } else if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
          checkKeys(obj[key], baseObj[key], currentPath);
        }
      }

      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        if (!(key in baseObj)) {
          extra.push(currentPath);
        }
      }
    };

    checkKeys(translations, baseTranslations);

    return {
      missing,
      extra,
      complete: missing.length === 0
    };
  },

  // Get nested translation key value
  getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  },

  // Set nested translation key value
  setNestedValue(obj: any, path: string, value: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
};

// Performance optimizations
export const translationCache = new Map<string, any>();

export function getCachedTranslation(locale: Locale, key: string): any {
  const cacheKey = `${locale}:${key}`;
  return translationCache.get(cacheKey);
}

export function setCachedTranslation(locale: Locale, key: string, value: any): void {
  const cacheKey = `${locale}:${key}`;
  translationCache.set(cacheKey, value);
}

export function clearTranslationCache(): void {
  translationCache.clear();
}