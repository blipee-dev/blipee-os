/**
 * Database queries for organization members
 */

import { createClient } from '@/lib/supabase/v2/server'

export interface Member {
  id: string
  user_id: string
  organization_id: string
  role: string
  is_owner: boolean
  invitation_status: string
  joined_at: string | null
  full_name: string
  email: string
  job_title: string | null
  last_active_at: string | null
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(orgId: string): Promise<Member[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      organization_id,
      role,
      is_owner,
      invitation_status,
      joined_at,
      user_profiles!organization_members_user_id_fkey (
        full_name,
        email,
        job_title,
        last_active_at
      )
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('is_owner', { ascending: false })
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching organization members:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    user_id: item.user_id,
    organization_id: item.organization_id,
    role: item.role,
    is_owner: item.is_owner,
    invitation_status: item.invitation_status,
    joined_at: item.joined_at,
    full_name: item.user_profiles.full_name,
    email: item.user_profiles.email,
    job_title: item.user_profiles.job_title,
    last_active_at: item.user_profiles.last_active_at,
  }))
}

/**
 * Count members in an organization
 */
export async function countOrganizationMembers(orgId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  if (error) {
    console.error('Error counting members:', error)
    return 0
  }

  return count || 0
}
