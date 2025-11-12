'use server'

import { createClient } from '@/lib/supabase/v2/server'
import {
  mapOrganizationToSBTiSector,
  getAvailablePathways,
  getSectorDisplayName,
  suggestAlternativeSectors,
  type SBTiSector,
  type OrganizationSectorInfo,
} from '@/lib/sbti/sector-mapping'

interface ActionResult<T> {
  data?: T
  error?: string
}

/**
 * Get the recommended SBTi sector for the current organization
 */
export async function getOrganizationSBTiSector(): Promise<
  ActionResult<{
    sector: SBTiSector
    displayName: string
    confidence: 'high' | 'medium' | 'low'
    method: 'gri' | 'naics' | 'keyword' | 'default'
    availableScenarios: string[]
    yearRange: { from: number; to: number }
    alternatives?: Array<{ sector: SBTiSector; reason: string }>
  }>
> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!membership) {
      return { error: 'No organization found' }
    }

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select(
        `
        industry,
        industry_primary,
        industry_secondary,
        industry_sector,
        sector_category,
        gri_sector_code,
        industry_classifications (
          code
        )
      `
      )
      .eq('id', membership.organization_id)
      .single()

    if (orgError || !org) {
      return { error: 'Failed to fetch organization details' }
    }

    // Map to SBTi sector
    const orgInfo: OrganizationSectorInfo = {
      industry: org.industry,
      industry_primary: org.industry_primary,
      industry_secondary: org.industry_secondary,
      industry_sector: org.industry_sector,
      sector_category: org.sector_category,
      gri_sector_code: org.gri_sector_code,
      naics_code: org.industry_classifications?.code,
    }

    const mapping = mapOrganizationToSBTiSector(orgInfo)
    const pathways = await getAvailablePathways(mapping.sector)
    const displayName = getSectorDisplayName(mapping.sector)

    // Get alternative suggestions if confidence is low
    const alternatives =
      mapping.confidence === 'low' ? suggestAlternativeSectors(orgInfo) : undefined

    return {
      data: {
        sector: mapping.sector,
        displayName,
        confidence: mapping.confidence,
        method: mapping.method,
        availableScenarios: pathways.scenarios,
        yearRange: pathways.yearRange,
        alternatives,
      },
    }
  } catch (error) {
    console.error('Error determining SBTi sector:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get pathway data for organization's sector
 */
export async function getOrganizationPathway(input: {
  scenario: string
  baseYear: number
  targetYear: number
}): Promise<
  ActionResult<{
    sector: SBTiSector
    baseValue: number
    targetValue: number
    requiredReduction: number
    pathway: Array<{ year: number; value: number }>
  }>
> {
  try {
    // Get organization's sector
    const sectorResult = await getOrganizationSBTiSector()
    if (sectorResult.error || !sectorResult.data) {
      return { error: sectorResult.error || 'Failed to determine sector' }
    }

    const { sector } = sectorResult.data
    const supabase = await createClient()

    // Get pathway data from database
    const { data: pathwayData, error: pathwayError } = await supabase
      .from('sbti_pathways')
      .select('year, value')
      .eq('sector', sector)
      .eq('scenario', input.scenario)
      .gte('year', input.baseYear)
      .lte('year', input.targetYear)
      .order('year', { ascending: true })

    if (pathwayError || !pathwayData || pathwayData.length === 0) {
      return { error: 'Pathway data not available for this sector and scenario' }
    }

    const basePoint = pathwayData.find((p) => p.year === input.baseYear)
    const targetPoint = pathwayData.find((p) => p.year === input.targetYear)

    if (!basePoint || !targetPoint) {
      return { error: 'Missing pathway data for base or target year' }
    }

    const requiredReduction = ((basePoint.value - targetPoint.value) / basePoint.value) * 100

    return {
      data: {
        sector,
        baseValue: basePoint.value,
        targetValue: targetPoint.value,
        requiredReduction,
        pathway: pathwayData,
      },
    }
  } catch (error) {
    console.error('Error fetching pathway data:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update organization's sector classification
 * Useful if the automatic mapping is incorrect
 */
export async function updateOrganizationIndustry(input: {
  industry?: string
  industry_primary?: string
  gri_sector_code?: string
}): Promise<ActionResult<{ sector: SBTiSector }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!membership) {
      return { error: 'No organization found' }
    }

    // Check permissions
    const allowedRoles = ['account_owner', 'admin']
    if (!allowedRoles.includes(membership.role)) {
      return { error: 'Insufficient permissions' }
    }

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update(input)
      .eq('id', membership.organization_id)

    if (updateError) {
      return { error: updateError.message }
    }

    // Get new sector mapping
    const sectorResult = await getOrganizationSBTiSector()
    if (sectorResult.error || !sectorResult.data) {
      return { error: 'Failed to determine new sector' }
    }

    return { data: { sector: sectorResult.data.sector } }
  } catch (error) {
    console.error('Error updating organization industry:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
