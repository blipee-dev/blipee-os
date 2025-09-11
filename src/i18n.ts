import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'pt', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Enhanced locale metadata
export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português', 
  es: 'Español'
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  pt: '🇵🇹',
  es: '🇪🇸'
};

export const localeNativeName: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español'
};

export const localeRegions: Record<Locale, string> = {
  en: 'US',
  pt: 'PT', 
  es: 'ES'
};

// RTL languages support
export const rtlLocales: Locale[] = [];

export const isRtlLocale = (locale: Locale): boolean => {
  return rtlLocales.includes(locale);
};

// Currency and number formatting per locale
export const localeCurrencies: Record<Locale, string> = {
  en: 'USD',
  pt: 'EUR',
  es: 'EUR'
};

export const localeTimezones: Record<Locale, string> = {
  en: 'America/New_York',
  pt: 'Europe/Lisbon',
  es: 'Europe/Madrid'
};

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  try {
    // Dynamic import with error handling for better UX
    const messages = (await import(`./messages/${locale}.json`)).default;
    
    return {
      messages,
      timeZone: localeTimezones[locale as Locale],
      now: new Date(),
      // Enable rich text formatting
      formats: {
        dateTime: {
          short: {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          },
          long: {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
          }
        },
        number: {
          precise: {
            maximumFractionDigits: 5
          },
          currency: {
            style: 'currency',
            currency: localeCurrencies[locale as Locale]
          }
        }
      }
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fallback to default locale messages
    if (locale !== defaultLocale) {
      const fallbackMessages = (await import(`./messages/${defaultLocale}.json`)).default;
      return {
        messages: fallbackMessages,
        timeZone: localeTimezones[defaultLocale],
        now: new Date()
      };
    }
    notFound();
  }
});