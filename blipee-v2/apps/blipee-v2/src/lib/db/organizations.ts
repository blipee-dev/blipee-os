/**
 * Database queries for organizations
 * Uses real data from organization_members and organizations tables
 */

import { createClient } from '@/lib/supabase/v2/server'

export interface UserOrganization {
  id: string
  name: string
  industry: string | null
  company_size: string | null
  employees: number | null
  role: string
  is_owner: boolean
}

export interface OrganizationMember {
  id: string
  role: string
  is_owner: boolean
  user: {
    id: string
    full_name: string
    email: string
    job_title: string | null
  }
}

/**
 * Get user's organizations with their role
 */
export async function getUserOrganizations(userId: string): Promise<UserOrganization[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      is_owner,
      organizations (
        id,
        name,
        industry,
        company_size,
        employees
      )
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching user organizations:', error)
    return []
  }

  // Transform the data
  return data
    .filter(item => item.organizations)
    .map(item => ({
      id: item.organizations.id,
      name: item.organizations.name,
      industry: item.organizations.industry,
      company_size: item.organizations.company_size,
      employees: item.organizations.employees,
      role: item.role,
      is_owner: item.is_owner,
    }))
}

/**
 * Get user's primary organization (first one)
 */
export async function getUserPrimaryOrganization(userId: string): Promise<UserOrganization | null> {
  const orgs = await getUserOrganizations(userId)
  return orgs[0] || null
}

/**
 * Get organization details by ID
 */
export async function getOrganizationById(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return data
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      is_owner,
      user_profiles!organization_members_user_id_fkey (
        id,
        full_name,
        email,
        job_title
      )
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching organization members:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    role: item.role,
    is_owner: item.is_owner,
    user: {
      id: item.user_profiles.id,
      full_name: item.user_profiles.full_name,
      email: item.user_profiles.email,
      job_title: item.user_profiles.job_title,
    }
  }))
}

/**
 * Get user's role in organization
 */
export async function getUserRoleInOrg(userId: string, orgId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching user role:', error)
    return null
  }

  return data?.role || null
}

/**
 * Check if user is owner of organization
 */
export async function isUserOrgOwner(userId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select('is_owner')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single()

  if (error) {
    return false
  }

  return data?.is_owner || false
}
