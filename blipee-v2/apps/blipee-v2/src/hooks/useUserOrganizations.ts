/**
 * Hook to get all organizations the user has access to
 * For super admins: returns ALL organizations in the system
 * For regular users: returns only organizations they are members of
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'
import { useIsSuperAdmin } from './useIsSuperAdmin'

export interface Organization {
  id: string
  name: string
  legal_name: string | null
  slug: string
  industry: string | null
  industry_primary: string | null
  industry_secondary: string | null
  company_size: string | null
  employees: number | null
  website: string | null
  public_company: boolean | null
  stock_ticker: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  region: string | null
  base_year: number | null
  consolidation_approach: string | null
  annual_revenue: number | null
  annual_customers: number | null
  annual_operating_hours: number | null
  gri_sector_code: string | null
  status: 'setup' | 'active' | 'inactive' | null
  role?: string // Only present for regular users (from organization_members)
  is_owner?: boolean // Only present for regular users (from organization_members)
  created_at: string
}

async function fetchUserOrganizations(isSuperAdmin: boolean): Promise<Organization[]> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Super admin: Get ALL organizations
  if (isSuperAdmin) {
    const { data, error} = await supabase
      .from('organizations')
      .select(`
        id, name, legal_name, slug, industry, industry_primary, industry_secondary,
        company_size, employees, website, public_company, stock_ticker,
        primary_contact_email, primary_contact_phone, region, base_year,
        consolidation_approach, annual_revenue, annual_customers,
        annual_operating_hours, gri_sector_code, status, created_at
      `)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) {
      console.error('[useUserOrganizations] Super admin error:', error)
      throw error
    }

    return data || []
  }

  // Regular user: Get organizations they are members of
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      is_owner,
      organizations (
        id, name, legal_name, slug, industry, industry_primary, industry_secondary,
        company_size, employees, website, public_company, stock_ticker,
        primary_contact_email, primary_contact_phone, region, base_year,
        consolidation_approach, annual_revenue, annual_customers,
        annual_operating_hours, gri_sector_code, status, created_at
      )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('organizations(name)', { ascending: true })

  if (error) {
    console.error('[useUserOrganizations] Regular user error:', error)
    throw error
  }

  if (!data) {
    return []
  }

  // Transform the data to match Organization interface
  return data
    .filter((item) => item.organizations !== null)
    .map((item) => ({
      id: item.organizations!.id,
      name: item.organizations!.name,
      legal_name: item.organizations!.legal_name,
      slug: item.organizations!.slug,
      industry: item.organizations!.industry,
      industry_primary: item.organizations!.industry_primary,
      industry_secondary: item.organizations!.industry_secondary,
      company_size: item.organizations!.company_size,
      employees: item.organizations!.employees,
      website: item.organizations!.website,
      public_company: item.organizations!.public_company,
      stock_ticker: item.organizations!.stock_ticker,
      primary_contact_email: item.organizations!.primary_contact_email,
      primary_contact_phone: item.organizations!.primary_contact_phone,
      region: item.organizations!.region,
      base_year: item.organizations!.base_year,
      consolidation_approach: item.organizations!.consolidation_approach,
      annual_revenue: item.organizations!.annual_revenue,
      annual_customers: item.organizations!.annual_customers,
      annual_operating_hours: item.organizations!.annual_operating_hours,
      gri_sector_code: item.organizations!.gri_sector_code,
      status: item.organizations!.status,
      created_at: item.organizations!.created_at,
      role: item.role,
      is_owner: item.is_owner,
    }))
}

export function useUserOrganizations() {
  const { isSuperAdmin, loading: superAdminLoading } = useIsSuperAdmin()

  const query = useQuery({
    queryKey: ['user-organizations', isSuperAdmin],
    queryFn: () => fetchUserOrganizations(isSuperAdmin),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !superAdminLoading, // Wait for super admin check to complete
  })

  return {
    organizations: query.data ?? [],
    loading: query.isLoading || superAdminLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    isSuperAdmin,
  }
}
