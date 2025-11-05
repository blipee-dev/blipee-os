/**
 * Email i18n Utilities
 * Locale detection and management for emails
 */

import { createClient, createAdminClient } from '@/lib/supabase/v2/server'
import type { Locale } from './templates'

/**
 * Detect browser locale from Accept-Language header
 * Used during signup to set initial locale preference
 */
export async function detectBrowserLocale(): Promise<Locale> {
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const acceptLanguage = headersList.get('accept-language') || ''

    // Parse Accept-Language header
    // Format: en-US,en;q=0.9,pt-PT;q=0.8,pt;q=0.7
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [locale, q = 'q=1.0'] = lang.trim().split(';')
        return {
          locale: locale.toLowerCase(),
          quality: parseFloat(q.replace('q=', '')),
        }
      })
      .sort((a, b) => b.quality - a.quality)

    // Check for exact matches first
    for (const { locale } of languages) {
      if (locale === 'pt-pt' || locale === 'pt') return 'pt-PT'
      if (locale === 'es-es' || locale === 'es') return 'es-ES'
      if (locale === 'en-us' || locale === 'en') return 'en-US'
    }

    // Default to en-US
    return 'en-US'
  } catch (error) {
    console.error('[LOCALE] Error detecting browser locale:', error)
    return 'en-US'
  }
}

/**
 * Detect locale from email domain
 * Used as fallback for invitation emails
 */
export function detectEmailDomainLocale(email: string): Locale | null {
  try {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return null

    // Portuguese domains
    if (domain.endsWith('.pt')) return 'pt-PT'

    // Spanish domains
    if (domain.endsWith('.es')) return 'es-ES'

    // Common Portuguese email providers
    if (domain.includes('sapo.pt') || domain.includes('gmail.pt')) return 'pt-PT'

    // Common Spanish email providers
    if (domain.includes('gmail.es') || domain.includes('hotmail.es')) return 'es-ES'

    return null
  } catch (error) {
    console.error('[LOCALE] Error detecting email domain locale:', error)
    return null
  }
}

/**
 * Context for locale detection
 */
export interface LocaleContext {
  organizationId?: string
  inviterId?: string
  email?: string
}

/**
 * Get user's preferred locale with priority-based fallback
 *
 * Priority:
 * 1. user_profiles.preferred_locale (manual choice) 👑
 * 2. user_metadata.preferred_locale (backup)
 * 3. Context (organization, inviter)
 * 4. Email domain inference
 * 5. Default: en-US
 */
export async function getUserLocale(
  userId: string,
  context?: LocaleContext
): Promise<Locale> {
  try {
    const supabase = await createClient()

    // PRIORITY 1: Manual choice in user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferred_locale')
      .eq('id', userId)
      .single()

    if (profile?.preferred_locale) {
      const locale = profile.preferred_locale as Locale
      console.log(`[LOCALE] User ${userId} - Using profile preference: ${locale}`)
      return locale
    }

    // PRIORITY 2: User metadata
    const adminClient = createAdminClient()
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId)

    if (authUser?.user?.user_metadata?.preferred_locale) {
      const locale = authUser.user.user_metadata.preferred_locale as Locale
      console.log(`[LOCALE] User ${userId} - Using user_metadata: ${locale}`)
      return locale
    }

    // PRIORITY 3: Context - Organization locale
    if (context?.organizationId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('preferred_locale')
        .eq('id', context.organizationId)
        .single()

      if (org?.preferred_locale) {
        const locale = org.preferred_locale as Locale
        console.log(
          `[LOCALE] User ${userId} - Using organization locale: ${locale}`
        )
        return locale
      }
    }

    // PRIORITY 4: Context - Inviter locale
    if (context?.inviterId) {
      const inviterLocale = await getUserLocale(context.inviterId)
      console.log(`[LOCALE] User ${userId} - Using inviter locale: ${inviterLocale}`)
      return inviterLocale
    }

    // PRIORITY 5: Email domain inference
    if (context?.email) {
      const emailLocale = detectEmailDomainLocale(context.email)
      if (emailLocale) {
        console.log(`[LOCALE] User ${userId} - Using email domain: ${emailLocale}`)
        return emailLocale
      }
    }

    // PRIORITY 6: Default
    console.log(`[LOCALE] User ${userId} - Using default: en-US`)
    return 'en-US'
  } catch (error) {
    console.error(`[LOCALE] Error getting user locale for ${userId}:`, error)
    return 'en-US'
  }
}

/**
 * Detect locale for new user invitation
 * Used when sending invitation emails to users who don't exist yet
 */
export async function detectInvitationLocale(
  inviterId: string,
  organizationId: string,
  email: string
): Promise<Locale> {
  try {
    const supabase = await createClient()

    // PRIORITY 1: Organization locale
    const { data: org } = await supabase
      .from('organizations')
      .select('preferred_locale')
      .eq('id', organizationId)
      .single()

    if (org?.preferred_locale) {
      const locale = org.preferred_locale as Locale
      console.log(
        `[LOCALE] Invitation to ${email} - Using organization locale: ${locale}`
      )
      return locale
    }

    // PRIORITY 2: Inviter locale
    const inviterLocale = await getUserLocale(inviterId)
    console.log(
      `[LOCALE] Invitation to ${email} - Using inviter locale: ${inviterLocale}`
    )
    return inviterLocale

    // Note: Email domain detection is handled in getUserLocale fallback
  } catch (error) {
    console.error('[LOCALE] Error detecting invitation locale:', error)
    return 'en-US'
  }
}

/**
 * Validate locale string
 */
export function isValidLocale(locale: string): locale is Locale {
  return ['en-US', 'es-ES', 'pt-PT'].includes(locale)
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    'en-US': '🇺🇸 English (United States)',
    'es-ES': '🇪🇸 Español (Europa)',
    'pt-PT': '🇵🇹 Português (Portugal)',
  }
  return names[locale]
}
