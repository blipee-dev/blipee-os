/**
 * Database queries for sites/facilities
 */

import { createClient } from '@/lib/supabase/v2/server'

export interface Site {
  id: string
  name: string
  type: string | null
  city: string | null
  country: string | null
  address: any
  total_area_sqm: number | null
  total_employees: number | null
  status: string | null
  organization_id: string
  created_at: string
}

/**
 * Get all sites for an organization
 */
export async function getOrganizationSites(orgId: string): Promise<Site[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', orgId)
    .order('name')

  if (error) {
    console.error('Error fetching organization sites:', error)
    return []
  }

  return data || []
}

/**
 * Get site by ID
 */
export async function getSiteById(siteId: string): Promise<Site | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single()

  if (error) {
    console.error('Error fetching site:', error)
    return null
  }

  return data
}

/**
 * Count sites for an organization
 */
export async function countOrganizationSites(orgId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  if (error) {
    console.error('Error counting sites:', error)
    return 0
  }

  return count || 0
}
