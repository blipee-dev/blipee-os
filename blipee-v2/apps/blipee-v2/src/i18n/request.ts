/**
 * i18n Request Configuration
 *
 * This file is used by next-intl to load messages for each locale
 * Based on: https://next-intl-docs.vercel.app/docs/getting-started/app-router
 */

import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

/**
 * Get the locale from the request headers or default
 */
async function getLocale(): Promise<Locale> {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = 'q=1.0'] = lang.trim().split(';')
      return {
        code: code.trim(),
        quality: parseFloat(q.replace('q=', ''))
      }
    })
    .sort((a, b) => b.quality - a.quality)

  // Match with supported locales
  for (const lang of languages) {
    const code = lang.code.toLowerCase()

    // Exact match
    if (locales.includes(code as Locale)) {
      return code as Locale
    }

    // Language code match (e.g., 'en' matches 'en-US')
    const langCode = code.split('-')[0]
    const match = locales.find(locale => locale.toLowerCase().startsWith(langCode))
    if (match) {
      return match
    }
  }

  return defaultLocale
}

export default getRequestConfig(async () => {
  const locale = await getLocale()

  return {
    locale,
    messages: {
      // Load all translation files
      auth: (await import(`./locales/${locale}/auth.json`)).default,
      common: (await import(`./locales/${locale}/common.json`)).default,
      dashboard: (await import(`./locales/${locale}/dashboard.json`)).default,
      profile: (await import(`./locales/${locale}/profile.json`)).default,
      settings: (await import(`./locales/${locale}/settings.json`)).default,
    }
  }
})
