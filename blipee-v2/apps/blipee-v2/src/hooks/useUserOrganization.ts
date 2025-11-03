/**
 * Hook to get current user's organization data
 * Uses React Query (no useEffect)
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'

export interface UserOrganization {
  id: string
  name: string
  industry: string | null
  company_size: string | null
  employees: number | null
  role: string
  is_owner: boolean
}

async function fetchUserOrganization(): Promise<UserOrganization | null> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Get user's organization from organization_members
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
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .limit(1)
    .single()

  if (error) {
    console.error('[useUserOrganization] Error loading organization:', error)
    return null
  }

  if (!data || !data.organizations) {
    return null
  }

  return {
    id: data.organizations.id,
    name: data.organizations.name,
    industry: data.organizations.industry,
    company_size: data.organizations.company_size,
    employees: data.organizations.employees,
    role: data.role,
    is_owner: data.is_owner,
  }
}

export function useUserOrganization() {
  const query = useQuery({
    queryKey: ['user-organization'],
    queryFn: fetchUserOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    organization: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  }
}
