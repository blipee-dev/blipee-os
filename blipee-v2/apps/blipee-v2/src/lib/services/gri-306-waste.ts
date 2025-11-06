/**
 * GRI 306: Waste Service
 * Waste generation, diversion, and disposal tracking with emission calculations
 * Target: 50% automation (via Climatiq for disposal emissions)
 */

import { calculateEmissions } from '../apis/climatiq'
import { createClient } from '@supabase/supabase-js'

// Lazy Supabase initialization
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseClient
}

// ============================================================================
// TYPES
// ============================================================================

export interface WasteGeneration {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Waste classification (GRI 306-3)
  waste_type: 'hazardous' | 'non_hazardous'
  waste_composition:
    | 'mixed_municipal_waste'
    | 'paper_cardboard'
    | 'plastic'
    | 'glass'
    | 'metal'
    | 'organic_food_waste'
    | 'construction_debris'
    | 'electronic_waste'
    | 'chemical_waste'
    | 'medical_waste'
    | 'other'

  // Amount
  weight_kg: number

  // Metadata
  waste_audit_date?: Date
  waste_contractor?: string
  metadata?: Record<string, any>
}

export interface WasteDiverted {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Diversion method (GRI 306-4)
  diversion_method: 'recycling' | 'composting' | 'reuse' | 'anaerobic_digestion' | 'other_recovery'

  // Waste details
  waste_type: 'hazardous' | 'non_hazardous'
  waste_composition: string
  weight_kg: number

  // Destination
  recovery_facility?: string
  recovery_location?: string

  // Metadata
  avoided_emissions?: boolean // Track if we calculate avoided emissions
  metadata?: Record<string, any>
}

export interface WasteDisposal {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Disposal method (GRI 306-5)
  disposal_method: 'landfill' | 'incineration_with_energy_recovery' | 'incineration_without_energy_recovery' | 'other_disposal'

  // Waste details
  waste_type: 'hazardous' | 'non_hazardous'
  waste_composition: string
  weight_kg: number

  // Destination
  disposal_facility?: string
  disposal_location?: string
  disposal_permit?: string

  // Metadata
  metadata?: Record<string, any>
}

export interface WasteResult {
  metric_id: string
  waste_kg: number
  waste_tonnes: number
  co2e_emissions_kg: number
  co2e_emissions_tonnes: number
  data_quality: 'measured' | 'calculated' | 'estimated'
}

export interface WasteSummary {
  total_generated_kg: number
  total_diverted_kg: number
  total_disposed_kg: number
  diversion_rate_pct: number
  disposal_emissions_kg: number
  avoided_emissions_kg: number
  net_emissions_kg: number
}

// ============================================================================
// GRI 306-3: WASTE GENERATED
// ============================================================================

/**
 * Record waste generation (GRI 306-3)
 */
export async function recordWasteGeneration(waste: WasteGeneration): Promise<WasteResult | null> {
  try {
    const metricCode =
      waste.waste_type === 'hazardous' ? 'gri_306_3_hazardous_waste' : 'gri_306_3_non_hazardous_waste'

    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', metricCode)
      .single()

    if (!metric) throw new Error(`Metric ${metricCode} not found in catalog`)

    // Record waste generation (no emissions for generation itself)
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: waste.organization_id,
      site_id: waste.site_id,
      period_start: waste.period_start.toISOString(),
      period_end: waste.period_end.toISOString(),
      value: waste.weight_kg,
      unit: 'kg',
      co2e_emissions: 0, // Generation itself has no emissions
      metadata: {
        waste_type: waste.waste_type,
        waste_composition: waste.waste_composition,
        waste_audit_date: waste.waste_audit_date?.toISOString(),
        waste_contractor: waste.waste_contractor,
        ...waste.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    // Also record to total waste generated metric
    const { data: totalMetric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_306_3_waste_generated')
      .single()

    if (totalMetric) {
      await getSupabase().from('metrics_data').insert({
        metric_id: totalMetric.id,
        organization_id: waste.organization_id,
        site_id: waste.site_id,
        period_start: waste.period_start.toISOString(),
        period_end: waste.period_end.toISOString(),
        value: waste.weight_kg,
        unit: 'kg',
        co2e_emissions: 0,
        metadata: {
          waste_type: waste.waste_type,
          waste_composition: waste.waste_composition,
          ...waste.metadata,
        },
        data_quality: 'measured',
        verification_status: 'pending',
      })
    }

    return {
      metric_id: metric.id,
      waste_kg: waste.weight_kg,
      waste_tonnes: waste.weight_kg / 1000,
      co2e_emissions_kg: 0,
      co2e_emissions_tonnes: 0,
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording waste generation:', error)
    return null
  }
}

// ============================================================================
// GRI 306-4: WASTE DIVERTED FROM DISPOSAL
// ============================================================================

/**
 * Record waste diverted from disposal (GRI 306-4)
 * Includes avoided emissions calculation for recycling
 */
export async function recordWasteDiverted(waste: WasteDiverted): Promise<WasteResult | null> {
  try {
    // Get specific diversion metric
    const metricCodeMap: Record<string, string> = {
      recycling: 'gri_306_4_recycling',
      composting: 'gri_306_4_composting',
      reuse: 'gri_306_4_waste_diverted',
      anaerobic_digestion: 'gri_306_4_waste_diverted',
      other_recovery: 'gri_306_4_waste_diverted',
    }

    const metricCode = metricCodeMap[waste.diversion_method] || 'gri_306_4_waste_diverted'

    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', metricCode)
      .single()

    if (!metric) throw new Error(`Metric ${metricCode} not found in catalog`)

    // Calculate avoided emissions for recycling
    let avoidedEmissionsKg = 0
    let emissionFactorUsed = null

    if (waste.diversion_method === 'recycling' || waste.diversion_method === 'composting') {
      // Try to get avoided emissions from Climatiq
      // Note: This is a negative emission (benefit)
      const climatiqActivity = getClimatiqWasteActivity(waste.waste_composition, waste.diversion_method)
      if (climatiqActivity) {
        const emissionResult = await calculateEmissions(climatiqActivity, waste.weight_kg, 'GLOBAL')
        if (emissionResult) {
          // For recycling, we typically save emissions compared to virgin production
          // Climatiq may return positive emissions for the process, but we want to track avoided emissions
          // Typical avoided emissions: Paper ~1.5 kg CO2e/kg, Plastic ~2.0 kg CO2e/kg, Glass ~0.5 kg CO2e/kg
          avoidedEmissionsKg = -Math.abs(emissionResult.co2e_kg) * 0.7 // 70% avoided emissions estimate
          emissionFactorUsed = {
            id: emissionResult.factor_id,
            value: emissionResult.factor_value,
            source: emissionResult.source,
          }
        }
      }
    }

    // Record diverted waste
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: waste.organization_id,
      site_id: waste.site_id,
      period_start: waste.period_start.toISOString(),
      period_end: waste.period_end.toISOString(),
      value: waste.weight_kg,
      unit: 'kg',
      co2e_emissions: avoidedEmissionsKg, // Negative = avoided emissions
      metadata: {
        diversion_method: waste.diversion_method,
        waste_type: waste.waste_type,
        waste_composition: waste.waste_composition,
        recovery_facility: waste.recovery_facility,
        recovery_location: waste.recovery_location,
        avoided_emissions: avoidedEmissionsKg < 0,
        avoided_emissions_kg: Math.abs(avoidedEmissionsKg),
        emission_factor_used: emissionFactorUsed,
        ...waste.metadata,
      },
      data_quality: avoidedEmissionsKg !== 0 ? 'calculated' : 'measured',
      verification_status: 'pending',
    })

    return {
      metric_id: metric.id,
      waste_kg: waste.weight_kg,
      waste_tonnes: waste.weight_kg / 1000,
      co2e_emissions_kg: avoidedEmissionsKg,
      co2e_emissions_tonnes: avoidedEmissionsKg / 1000,
      data_quality: avoidedEmissionsKg !== 0 ? 'calculated' : 'measured',
    }
  } catch (error) {
    console.error('Error recording waste diverted:', error)
    return null
  }
}

// ============================================================================
// GRI 306-5: WASTE DIRECTED TO DISPOSAL
// ============================================================================

/**
 * Record waste directed to disposal (GRI 306-5)
 * Includes emission calculations for disposal methods
 */
export async function recordWasteDisposal(waste: WasteDisposal): Promise<WasteResult | null> {
  try {
    // Get specific disposal metric
    const metricCodeMap: Record<string, string> = {
      landfill: 'gri_306_5_landfill',
      incineration_with_energy_recovery: 'gri_306_5_incineration',
      incineration_without_energy_recovery: 'gri_306_5_incineration',
      other_disposal: 'gri_306_5_waste_disposal',
    }

    const metricCode = metricCodeMap[waste.disposal_method] || 'gri_306_5_waste_disposal'

    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', metricCode)
      .single()

    if (!metric) throw new Error(`Metric ${metricCode} not found in catalog`)

    // Calculate disposal emissions using Climatiq
    let disposalEmissionsKg = 0
    let emissionFactorUsed = null

    const climatiqActivity = getClimatiqWasteActivity(waste.waste_composition, waste.disposal_method)
    if (climatiqActivity) {
      const emissionResult = await calculateEmissions(climatiqActivity, waste.weight_kg, 'GLOBAL')
      if (emissionResult) {
        disposalEmissionsKg = emissionResult.co2e_kg
        emissionFactorUsed = {
          id: emissionResult.factor_id,
          value: emissionResult.factor_value,
          unit: emissionResult.factor_unit,
          source: emissionResult.source,
          year: emissionResult.source_year,
        }
      }
    } else {
      // Fallback emission factors if Climatiq doesn't have specific activity
      // Typical landfill emissions: 0.5-1.0 kg CO2e/kg waste
      // Incineration: 0.3-0.8 kg CO2e/kg waste
      const fallbackFactors: Record<string, number> = {
        landfill: 0.75, // kg CO2e/kg waste
        incineration_with_energy_recovery: 0.4,
        incineration_without_energy_recovery: 0.6,
        other_disposal: 0.5,
      }
      disposalEmissionsKg = waste.weight_kg * (fallbackFactors[waste.disposal_method] || 0.5)
    }

    // Record disposal waste
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: waste.organization_id,
      site_id: waste.site_id,
      period_start: waste.period_start.toISOString(),
      period_end: waste.period_end.toISOString(),
      value: waste.weight_kg,
      unit: 'kg',
      co2e_emissions: disposalEmissionsKg,
      metadata: {
        disposal_method: waste.disposal_method,
        waste_type: waste.waste_type,
        waste_composition: waste.waste_composition,
        disposal_facility: waste.disposal_facility,
        disposal_location: waste.disposal_location,
        disposal_permit: waste.disposal_permit,
        emission_factor_used: emissionFactorUsed,
        fallback_factor_used: emissionFactorUsed === null,
        ...waste.metadata,
      },
      data_quality: emissionFactorUsed ? 'calculated' : 'estimated',
      verification_status: 'pending',
    })

    return {
      metric_id: metric.id,
      waste_kg: waste.weight_kg,
      waste_tonnes: waste.weight_kg / 1000,
      co2e_emissions_kg: disposalEmissionsKg,
      co2e_emissions_tonnes: disposalEmissionsKg / 1000,
      data_quality: emissionFactorUsed ? 'calculated' : 'estimated',
    }
  } catch (error) {
    console.error('Error recording waste disposal:', error)
    return null
  }
}

// ============================================================================
// WASTE SUMMARY & CIRCULAR ECONOMY METRICS
// ============================================================================

/**
 * Calculate waste summary and diversion rate (circular economy metric)
 */
export async function calculateWasteSummary(
  organizationId: string,
  siteId: string,
  year: number
): Promise<WasteSummary | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, co2e_emissions, metadata')
      .eq('organization_id', organizationId)
      .eq('site_id', siteId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Sum waste generated
    const totalGenerated = data
      .filter((d) => d.metadata?.waste_type && !d.metadata?.diversion_method && !d.metadata?.disposal_method)
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Sum waste diverted
    const totalDiverted = data
      .filter((d) => d.metadata?.diversion_method)
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Sum waste disposed
    const totalDisposed = data
      .filter((d) => d.metadata?.disposal_method)
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Calculate diversion rate (circular economy KPI)
    const diversionRate = totalGenerated > 0 ? (totalDiverted / totalGenerated) * 100 : 0

    // Sum disposal emissions (positive)
    const disposalEmissions = data
      .filter((d) => d.metadata?.disposal_method && (d.co2e_emissions || 0) > 0)
      .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0)

    // Sum avoided emissions (negative/benefit from recycling)
    const avoidedEmissions = Math.abs(
      data
        .filter((d) => d.metadata?.diversion_method && (d.co2e_emissions || 0) < 0)
        .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0)
    )

    // Net emissions = disposal emissions - avoided emissions
    const netEmissions = disposalEmissions - avoidedEmissions

    return {
      total_generated_kg: totalGenerated,
      total_diverted_kg: totalDiverted,
      total_disposed_kg: totalDisposed,
      diversion_rate_pct: diversionRate,
      disposal_emissions_kg: disposalEmissions,
      avoided_emissions_kg: avoidedEmissions,
      net_emissions_kg: netEmissions,
    }
  } catch (error) {
    console.error('Error calculating waste summary:', error)
    return null
  }
}

/**
 * Get waste breakdown by composition
 */
export async function getWasteBreakdownByComposition(
  organizationId: string,
  year: number
): Promise<Record<string, { weight_kg: number; percentage: number }> | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Group by waste composition
    const breakdown: Record<string, number> = {}
    let total = 0

    data
      .filter((d) => d.metadata?.waste_composition)
      .forEach((d) => {
        const composition = d.metadata.waste_composition
        breakdown[composition] = (breakdown[composition] || 0) + (d.value || 0)
        total += d.value || 0
      })

    // Calculate percentages
    const result: Record<string, { weight_kg: number; percentage: number }> = {}
    Object.entries(breakdown).forEach(([composition, weight]) => {
      result[composition] = {
        weight_kg: weight,
        percentage: total > 0 ? (weight / total) * 100 : 0,
      }
    })

    return result
  } catch (error) {
    console.error('Error getting waste breakdown:', error)
    return null
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map waste composition + method to Climatiq activity
 */
function getClimatiqWasteActivity(
  composition: string,
  method: string
): string | null {
  // Climatiq activity mapping
  // Format: "waste_type_{type}-disposal_method_{method}"

  const methodMap: Record<string, string> = {
    landfill: 'landfill',
    incineration_with_energy_recovery: 'incineration_with_energy_recovery',
    incineration_without_energy_recovery: 'incineration',
    recycling: 'recycling',
    composting: 'composting',
  }

  const compositionMap: Record<string, string> = {
    mixed_municipal_waste: 'waste_type_mixed_municipal_waste',
    paper_cardboard: 'waste_type_paper',
    plastic: 'waste_type_plastic',
    glass: 'waste_type_glass',
    metal: 'waste_type_metal',
    organic_food_waste: 'waste_type_organic',
    electronic_waste: 'waste_type_electronics',
  }

  const wasteType = compositionMap[composition]
  const disposalMethod = methodMap[method]

  if (!wasteType || !disposalMethod) return null

  return `${wasteType}-disposal_method_${disposalMethod}`
}
