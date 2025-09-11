import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './config';

export const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Disable locale prefix for default locale
  localePrefix: 'as-needed'
});