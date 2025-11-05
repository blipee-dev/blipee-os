/**
 * i18n Configuration
 *
 * Supported locales:
 * - en-US: English (United States) - Default
 * - es-ES: Spanish (European)
 * - pt-PT: Portuguese (European)
 */

export const locales = ['en-US', 'es-ES', 'pt-PT'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en-US'

export const localeNames: Record<Locale, string> = {
  'en-US': 'English',
  'es-ES': 'Español',
  'pt-PT': 'Português',
}

export const localeFlags: Record<Locale, string> = {
  'en-US': '🇺🇸',
  'es-ES': '🇪🇸',
  'pt-PT': '🇵🇹',
}
