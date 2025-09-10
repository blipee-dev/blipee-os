export const locales = ['en', 'es', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

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