'use server'

/**
 * Server Actions for SBTi Targets
 * Handles CRUD operations and calculations for Science Based Targets
 */

import { createClient } from '@/lib/supabase/v2/server'
import { getOrganizationForUser } from '@/lib/data/organizations'
import {
  validateTarget,
  calculatePathway,
  checkSectorRequirements,
  calculateScope3Coverage,
  generateTargetSummary,
  type TargetInput,
  type ValidationResult,
  type PathwayCalculation,
  type SectorRequirements,
  type EmissionsInventory
} from '@/lib/sbti/calculator'

// ============================================================================
// TYPES
// ============================================================================

export type ActionResult<T = any> = {
  data?: T
  error?: string
}

// ============================================================================
// TARGET VALIDATION
// ============================================================================

export async function validateSBTITarget(input: TargetInput): Promise<ActionResult<ValidationResult>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    // Validate target against SBTi criteria
    const validation = await validateTarget(input)

    return { data: validation }
  } catch (error) {
    console.error('Error validating SBTi target:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

// ============================================================================
// PATHWAY CALCULATION
// ============================================================================

export async function calculateSBTIPathway(input: TargetInput): Promise<ActionResult<PathwayCalculation>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    // Calculate reduction pathway
    const calculation = await calculatePathway(input)

    return { data: calculation }
  } catch (error) {
    console.error('Error calculating SBTi pathway:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

// ============================================================================
// SECTOR REQUIREMENTS
// ============================================================================

export async function getSectorRequirements(inventory: EmissionsInventory): Promise<ActionResult<SectorRequirements>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const requirements = await checkSectorRequirements(inventory)

    return { data: requirements }
  } catch (error) {
    console.error('Error checking sector requirements:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

// ============================================================================
// TARGET MANAGEMENT
// ============================================================================

/**
 * Create a new SBTi target
 */
export async function createSBTITarget(input: TargetInput): Promise<ActionResult<{ id: string }>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    // First validate the target
    const validation = await validateTarget(input)
    if (!validation.isValid) {
      return { error: `Target validation failed: ${validation.errors.join(', ')}` }
    }

    // Calculate pathway
    const calculation = await calculatePathway(input)

    // Prepare data for insertion
    const targetData = {
      organization_id: org.id,
      target_type: input.targetType,
      scope: input.scope,
      method: input.method,
      base_year: input.baseYear,
      target_year: input.targetYear,
      ambition_level: input.ambition,
      sector_pathway: input.sector || 'cross_sector',

      // Coverage
      coverage_scope1_2_pct: input.coverage.scope1_2_pct,
      coverage_scope3_pct: input.coverage.scope3_pct,

      // Base year emissions
      base_year_scope1: input.baseYearEmissions.scope1,
      base_year_scope2_location: input.baseYearEmissions.scope2_location,
      base_year_scope2_market: input.baseYearEmissions.scope2_market,
      base_year_scope3: input.baseYearEmissions.scope3,
      base_year_biogenic_net: input.baseYearEmissions.biogenic_net,

      // Target year emissions (calculated)
      target_year_scope1: input.scope !== 'scope3' ? calculation.targetYearEmissions : null,
      target_year_scope2: input.scope !== 'scope3' ? calculation.targetYearEmissions : null,
      target_year_scope3: input.scope === 'scope3' || input.scope === 'scope1_2_3' ? calculation.targetYearEmissions : null,

      // Reduction metrics (auto-calculated by trigger)
      reduction_percentage: calculation.requiredReductionPercentage,
      annual_reduction_rate: calculation.annualReductionRate,
      reduction_method: 'linear',

      // Activity data (if applicable)
      activity_metric: input.activityData?.metric,
      activity_unit: input.activityData?.unit,
      base_year_activity: input.activityData?.baseYear,
      target_year_activity: input.activityData?.targetYear,

      // Scope 3 categories
      scope3_categories: input.baseYearEmissions.scope3_categories || {},

      // Neutralization (for long-term targets)
      residual_emissions: input.neutralizationPlan?.residualEmissions,
      neutralization_method: input.neutralizationPlan?.method,
      neutralization_volume: input.neutralizationPlan?.volume,
      neutralization_permanence: input.neutralizationPlan?.permanence,

      // Validation results
      validation_results: Object.fromEntries(
        validation.criteriaResults.map(c => [c.code, c.status])
      ),
      validation_errors: validation.errors,
      validation_warnings: validation.warnings,

      validation_status: 'draft'
    }

    const { data, error } = await supabase
      .from('sbti_targets')
      .insert(targetData)
      .select('id')
      .single()

    if (error) {
      console.error('Database error:', error)
      return { error: `Failed to create target: ${error.message}` }
    }

    return { data: { id: data.id } }
  } catch (error) {
    console.error('Error creating SBTi target:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

/**
 * Get all targets for the current organization
 */
export async function getSBTITargets(): Promise<ActionResult<any[]>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sbti_targets')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Error fetching SBTi targets:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

/**
 * Get a single target by ID
 */
export async function getSBTITarget(targetId: string): Promise<ActionResult<any>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sbti_targets')
      .select('*')
      .eq('id', targetId)
      .eq('organization_id', org.id)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    console.error('Error fetching SBTi target:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

/**
 * Update an existing target
 */
export async function updateSBTITarget(targetId: string, updates: Partial<any>): Promise<ActionResult<void>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('sbti_targets')
      .update(updates)
      .eq('id', targetId)
      .eq('organization_id', org.id)

    if (error) {
      return { error: error.message }
    }

    return { data: undefined }
  } catch (error) {
    console.error('Error updating SBTi target:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

/**
 * Delete a draft target
 */
export async function deleteSBTITarget(targetId: string): Promise<ActionResult<void>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    // Only allow deletion of draft targets
    const { error } = await supabase
      .from('sbti_targets')
      .delete()
      .eq('id', targetId)
      .eq('organization_id', org.id)
      .eq('validation_status', 'draft')

    if (error) {
      return { error: error.message }
    }

    return { data: undefined }
  } catch (error) {
    console.error('Error deleting SBTi target:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Get progress tracking data for a target
 */
export async function getSBTIProgress(targetId: string): Promise<ActionResult<any[]>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sbti_progress')
      .select('*')
      .eq('target_id', targetId)
      .order('reporting_year', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Error fetching SBTi progress:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

/**
 * Add progress data for a specific year
 */
export async function addSBTIProgress(
  targetId: string,
  year: number,
  emissions: {
    scope1?: number
    scope2?: number
    scope3?: number
    biogenic_net?: number
  },
  notes?: string
): Promise<ActionResult<void>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    // Get target to calculate trajectory
    const { data: target, error: targetError } = await supabase
      .from('sbti_targets')
      .select('*')
      .eq('id', targetId)
      .single()

    if (targetError || !target) {
      return { error: 'Target not found' }
    }

    // Calculate actual total
    const actualTotal = (emissions.scope1 || 0) + (emissions.scope2 || 0) + (emissions.scope3 || 0)

    // Calculate expected trajectory value for this year
    const yearsSinceBase = year - target.base_year
    const totalYears = target.target_year - target.base_year
    const yearlyReduction = (target.base_year_total - target.target_year_total) / totalYears
    const targetTrajectory = target.base_year_total - (yearlyReduction * yearsSinceBase)

    // Calculate variance
    const variance = actualTotal - targetTrajectory
    const variancePct = (variance / targetTrajectory) * 100
    const onTrack = Math.abs(variancePct) <= 5  // ±5% tolerance

    // Calculate progress percentage
    const totalReduction = target.base_year_total - target.target_year_total
    const actualReduction = target.base_year_total - actualTotal
    const progressPct = (actualReduction / totalReduction) * 100

    const progressData = {
      target_id: targetId,
      reporting_year: year,
      actual_scope1: emissions.scope1,
      actual_scope2: emissions.scope2,
      actual_scope3: emissions.scope3,
      actual_total: actualTotal,
      actual_biogenic_net: emissions.biogenic_net,
      target_trajectory: targetTrajectory,
      variance,
      variance_percentage: variancePct,
      on_track: onTrack,
      progress_percentage: progressPct,
      notes
    }

    const { error } = await supabase
      .from('sbti_progress')
      .upsert(progressData, {
        onConflict: 'target_id,reporting_year'
      })

    if (error) {
      return { error: error.message }
    }

    return { data: undefined }
  } catch (error) {
    console.error('Error adding SBTi progress:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

// ============================================================================
// SUMMARY / DASHBOARD
// ============================================================================

/**
 * Get SBTi summary for organization dashboard
 */
export async function getSBTISummary(): Promise<ActionResult<any>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    // Use the database function
    const { data, error } = await supabase
      .rpc('get_sbti_summary', { p_organization_id: org.id })
      .single()

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    console.error('Error fetching SBTi summary:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

// ============================================================================
// GRI INTEGRATION
// ============================================================================

/**
 * Prefill SBTi target wizard from existing GRI emissions data
 */
export async function prefillFromGRI(baseYear: number): Promise<ActionResult<Partial<TargetInput>>> {
  try {
    const org = await getOrganizationForUser()
    if (!org) {
      return { error: 'Organization not found' }
    }

    const supabase = await createClient()

    // Fetch GRI emissions data for the base year
    // Note: This assumes GRI data is stored in a specific format
    // Adjust the query based on actual GRI data structure

    const { data: griData, error: griError } = await supabase
      .from('metrics')
      .select('metric_code, value')
      .eq('organization_id', org.id)
      .eq('year', baseYear)
      .in('metric_code', [
        '305-1',  // Direct (Scope 1) GHG emissions
        '305-2',  // Energy indirect (Scope 2) GHG emissions
        '305-3',  // Other indirect (Scope 3) GHG emissions
      ])

    if (griError) {
      return { error: griError.message }
    }

    // Convert GRI data to SBTi format
    const scope1 = griData?.find(d => d.metric_code === '305-1')?.value || 0
    const scope2 = griData?.find(d => d.metric_code === '305-2')?.value || 0
    const scope3 = griData?.find(d => d.metric_code === '305-3')?.value || 0

    const prefillData: Partial<TargetInput> = {
      baseYear,
      baseYearEmissions: {
        scope1: scope1 as number,
        scope2_location: scope2 as number,
        scope2_market: scope2 as number,
        scope3: scope3 as number,
        biogenic_net: 0  // TODO: Get from GRI if tracked
      }
    }

    return { data: prefillData }
  } catch (error) {
    console.error('Error prefilling from GRI:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}
