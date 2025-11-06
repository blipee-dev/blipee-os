/**
 * Cached Data Fetching - Organizations
 *
 * Uses React cache() to deduplicate requests within a single render pass.
 */

import { cache } from 'react'
import { getUser } from './user'
import {
  getUserPrimaryOrganization,
  getUserOrganizations,
  type UserOrganization
} from '@/lib/db/organizations'

/**
 * Get the current user's organization
 *
 * This function is cached per-request, so multiple calls in the same
 * request will only execute once.
 *
 * @example
 * ```tsx
 * // In page.tsx
 * const org = await getOrganizationForUser()
 *
 * // In a nested component (same request)
 * const org = await getOrganizationForUser() // Uses cached result
 * ```
 */
export const getOrganizationForUser = cache(async (): Promise<UserOrganization | null> => {
  const user = await getUser()

  if (!user) {
    return null
  }

  return await getUserPrimaryOrganization(user.id)
})

/**
 * Get all organizations for the current user
 */
export const getOrganizationsForUser = cache(async (): Promise<UserOrganization[]> => {
  const user = await getUser()

  if (!user) {
    return []
  }

  return await getUserOrganizations(user.id)
})
