/**
 * i18n Request Configuration
 *
 * This file is used by next-intl to load messages for each locale
 * Based on: https://next-intl-docs.vercel.app/docs/getting-started/app-router
 */

import { getRequestConfig } from 'next-intl/server'
import { headers, cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { defaultLocale, locales, type Locale } from './config'

/**
 * Get the locale from user preferences, request headers, or default
 */
async function getLocale(): Promise<Locale> {
  // 1. Try to get locale from authenticated user's preferences
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op in request config
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single()

      if (data?.preferred_language) {
        let locale = data.preferred_language as string

        // Map old locale codes to new ones for backward compatibility
        if (locale === 'pt') locale = 'pt-PT'
        if (locale === 'en') locale = 'en-US'
        if (locale === 'es') locale = 'es-ES'

        if (locales.includes(locale as Locale)) {
          return locale as Locale
        }
      }
    }
  } catch (error) {
    // Silently fail and fall back to browser language
    console.log('[i18n] Could not get user language preference, using browser default')
  }

  // 2. Fall back to Accept-Language header
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
      landing: (await import(`./locales/${locale}/landing.json`)).default,
      marketing: (await import(`./locales/${locale}/marketing.json`)).default,
      gri: (await import(`./locales/${locale}/gri.json`)).default,
    }
  }
})
