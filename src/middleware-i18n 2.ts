import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export const i18nMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Always use a prefix for routing (/en, /pt, /es)
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|pt|es)/:path*']
};