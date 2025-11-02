/**
 * Cached Data Fetching - User
 *
 * Uses React cache() to deduplicate requests within a single render pass.
 * This prevents multiple components from fetching the same data multiple times.
 *
 * Note: cache() is per-request, not across requests. For cross-request caching,
 * use unstable_cache from Next.js.
 */

import { cache } from 'react'
import { createClient } from '@/lib/supabase/v2/server'
import type { User } from '@supabase/supabase-js'

/**
 * Get the current authenticated user
 *
 * This function is cached per-request, so multiple calls in the same
 * request will only execute once.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * const user = await getUser()
 *
 * // In a nested component (same request)
 * const user = await getUser() // Uses cached result
 * ```
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
})

/**
 * Get user profile information
 *
 * Fetches additional profile data from the database.
 * This is separate from getUser() because not all pages need profile data.
 */
export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
})

/**
 * Get user preferences
 *
 * Fetches user settings and preferences from the database.
 */
export const getUserPreferences = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user preferences:', error)
    return null
  }

  return data
})

/**
 * Check if user has completed onboarding
 *
 * This is useful for redirecting new users to onboarding flows.
 */
export const hasCompletedOnboarding = cache(async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId)
  return profile?.onboarding_completed || false
})
