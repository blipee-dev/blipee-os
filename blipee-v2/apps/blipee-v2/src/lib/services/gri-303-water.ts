/**
 * GRI 303: Water and Effluents Service
 * Water withdrawal, discharge, and consumption tracking
 * Target: 30-50% automation (with IoT sensors in future)
 */

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

export interface WaterWithdrawal {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Sources (GRI 303-3)
  surface_water_m3?: number // Rivers, lakes
  groundwater_m3?: number // Wells, aquifers
  seawater_m3?: number
  produced_water_m3?: number // From oil/gas operations
  third_party_water_m3?: number // Municipal supply

  // Water quality
  freshwater_m3?: number // TDS ≤1000 mg/L
  other_water_m3?: number // TDS >1000 mg/L

  // Water stress
  water_stress_area?: boolean
  baseline_water_stress?: 'low' | 'low_medium' | 'medium_high' | 'high' | 'extremely_high'

  // Metadata
  data_source?: 'meter' | 'utility_bill' | 'manual' | 'iot_sensor'
  metadata?: Record<string, any>
}

export interface WaterDischarge {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Destinations (GRI 303-4)
  surface_water_m3?: number
  groundwater_m3?: number
  seawater_m3?: number
  third_party_water_m3?: number // To wastewater treatment

  // Treatment level
  treatment_level?: 'no_treatment' | 'primary' | 'secondary' | 'tertiary'

  // Water quality
  freshwater_m3?: number
  other_water_m3?: number

  // Metadata
  discharge_permit?: string
  water_quality_parameters?: Record<string, number> // pH, BOD, COD, etc.
  metadata?: Record<string, any>
}

export interface WaterConsumption {
  total_withdrawal_m3: number
  total_discharge_m3: number
  total_consumption_m3: number // Withdrawal - Discharge
  water_stress_consumption_m3?: number
}

// ============================================================================
// GRI 303-3: WATER WITHDRAWAL
// ============================================================================

/**
 * Record water withdrawal by source (GRI 303-3)
 */
export async function recordWaterWithdrawal(withdrawal: WaterWithdrawal): Promise<WaterConsumption | null> {
  try {
    let totalWithdrawalM3 = 0

    // ========================================================================
    // SURFACE WATER
    // ========================================================================
    if (withdrawal.surface_water_m3) {
      await recordMetricData({
        metric_code: 'gri_303_3_surface_water',
        organization_id: withdrawal.organization_id,
        site_id: withdrawal.site_id,
        period_start: withdrawal.period_start,
        period_end: withdrawal.period_end,
        value: withdrawal.surface_water_m3,
        unit: 'm3',
        co2e_emissions: 0,
        metadata: {
          source_type: 'surface_water',
          water_quality: withdrawal.freshwater_m3 ? 'freshwater' : 'other',
          water_stress_area: withdrawal.water_stress_area,
          baseline_water_stress: withdrawal.baseline_water_stress,
          data_source: withdrawal.data_source,
          ...withdrawal.metadata,
        },
      })
      totalWithdrawalM3 += withdrawal.surface_water_m3
    }

    // ========================================================================
    // GROUNDWATER
    // ========================================================================
    if (withdrawal.groundwater_m3) {
      await recordMetricData({
        metric_code: 'gri_303_3_groundwater',
        organization_id: withdrawal.organization_id,
        site_id: withdrawal.site_id,
        period_start: withdrawal.period_start,
        period_end: withdrawal.period_end,
        value: withdrawal.groundwater_m3,
        unit: 'm3',
        co2e_emissions: 0,
        metadata: {
          source_type: 'groundwater',
          water_quality: withdrawal.freshwater_m3 ? 'freshwater' : 'other',
          water_stress_area: withdrawal.water_stress_area,
          baseline_water_stress: withdrawal.baseline_water_stress,
          data_source: withdrawal.data_source,
          ...withdrawal.metadata,
        },
      })
      totalWithdrawalM3 += withdrawal.groundwater_m3
    }

    // ========================================================================
    // THIRD-PARTY WATER (Municipal supply)
    // ========================================================================
    if (withdrawal.third_party_water_m3) {
      await recordMetricData({
        metric_code: 'gri_303_3_third_party_water',
        organization_id: withdrawal.organization_id,
        site_id: withdrawal.site_id,
        period_start: withdrawal.period_start,
        period_end: withdrawal.period_end,
        value: withdrawal.third_party_water_m3,
        unit: 'm3',
        co2e_emissions: 0,
        metadata: {
          source_type: 'third_party',
          supplier: 'municipal_supply',
          water_quality: 'freshwater', // Usually freshwater
          water_stress_area: withdrawal.water_stress_area,
          baseline_water_stress: withdrawal.baseline_water_stress,
          data_source: withdrawal.data_source,
          ...withdrawal.metadata,
        },
      })
      totalWithdrawalM3 += withdrawal.third_party_water_m3
    }

    // ========================================================================
    // SEAWATER
    // ========================================================================
    if (withdrawal.seawater_m3) {
      await recordMetricData({
        metric_code: 'gri_303_3_water_withdrawal',
        organization_id: withdrawal.organization_id,
        site_id: withdrawal.site_id,
        period_start: withdrawal.period_start,
        period_end: withdrawal.period_end,
        value: withdrawal.seawater_m3,
        unit: 'm3',
        co2e_emissions: 0,
        metadata: {
          source_type: 'seawater',
          water_quality: 'other', // Seawater is not freshwater
          data_source: withdrawal.data_source,
          ...withdrawal.metadata,
        },
      })
      totalWithdrawalM3 += withdrawal.seawater_m3
    }

    // ========================================================================
    // TOTAL WITHDRAWAL (GRI 303-3)
    // ========================================================================
    await recordMetricData({
      metric_code: 'gri_303_3_water_withdrawal',
      organization_id: withdrawal.organization_id,
      site_id: withdrawal.site_id,
      period_start: withdrawal.period_start,
      period_end: withdrawal.period_end,
      value: totalWithdrawalM3,
      unit: 'm3',
      co2e_emissions: 0,
      metadata: {
        breakdown: {
          surface_water: withdrawal.surface_water_m3 || 0,
          groundwater: withdrawal.groundwater_m3 || 0,
          seawater: withdrawal.seawater_m3 || 0,
          third_party: withdrawal.third_party_water_m3 || 0,
        },
        freshwater_percentage:
          withdrawal.freshwater_m3 ? (withdrawal.freshwater_m3 / totalWithdrawalM3) * 100 : null,
        water_stress_area: withdrawal.water_stress_area,
        baseline_water_stress: withdrawal.baseline_water_stress,
        ...withdrawal.metadata,
      },
    })

    return {
      total_withdrawal_m3: totalWithdrawalM3,
      total_discharge_m3: 0,
      total_consumption_m3: totalWithdrawalM3,
      water_stress_consumption_m3: withdrawal.water_stress_area ? totalWithdrawalM3 : 0,
    }
  } catch (error) {
    console.error('Error recording water withdrawal:', error)
    return null
  }
}

// ============================================================================
// GRI 303-4: WATER DISCHARGE
// ============================================================================

/**
 * Record water discharge by destination (GRI 303-4)
 */
export async function recordWaterDischarge(discharge: WaterDischarge): Promise<number> {
  try {
    let totalDischargeM3 = 0

    // Surface water discharge
    if (discharge.surface_water_m3) {
      await recordMetricData({
        metric_code: 'gri_303_4_water_discharge',
        organization_id: discharge.organization_id,
        site_id: discharge.site_id,
        period_start: discharge.period_start,
        period_end: discharge.period_end,
        value: discharge.surface_water_m3,
        unit: 'm3',
        co2e_emissions: 0,
        metadata: {
          destination_type: 'surface_water',
          treatment_level: discharge.treatment_level,
          discharge_permit: discharge.discharge_permit,
          water_quality_parameters: discharge.water_quality_parameters,
          ...discharge.metadata,
        },
      })
      totalDischargeM3 += discharge.surface_water_m3
    }

    // Third-party discharge (to wastewater treatment)
    if (discharge.third_party_water_m3) {
      await recordMetricData({
        metric_code: 'gri_303_4_water_discharge',
        organization_id: discharge.organization_id,
        site_id: discharge.site_id,
        period_start: discharge.period_start,
        period_end: discharge.period_end,
        value: discharge.third_party_water_m3,
        unit: 'm3',
        co2e_emissions: 0,
        metadata: {
          destination_type: 'third_party_wastewater_treatment',
          treatment_level: discharge.treatment_level,
          ...discharge.metadata,
        },
      })
      totalDischargeM3 += discharge.third_party_water_m3
    }

    // Total discharge
    await recordMetricData({
      metric_code: 'gri_303_4_water_discharge',
      organization_id: discharge.organization_id,
      site_id: discharge.site_id,
      period_start: discharge.period_start,
      period_end: discharge.period_end,
      value: totalDischargeM3,
      unit: 'm3',
      co2e_emissions: 0,
      metadata: {
        breakdown: {
          surface_water: discharge.surface_water_m3 || 0,
          groundwater: discharge.groundwater_m3 || 0,
          third_party: discharge.third_party_water_m3 || 0,
        },
        treatment_level: discharge.treatment_level,
        ...discharge.metadata,
      },
    })

    return totalDischargeM3
  } catch (error) {
    console.error('Error recording water discharge:', error)
    return 0
  }
}

// ============================================================================
// GRI 303-5: WATER CONSUMPTION
// ============================================================================

/**
 * Calculate water consumption (GRI 303-5)
 * Consumption = Withdrawal - Discharge
 */
export async function calculateWaterConsumption(
  organizationId: string,
  siteId: string,
  year: number
): Promise<WaterConsumption | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, metadata')
      .eq('organization_id', organizationId)
      .eq('site_id', siteId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Sum withdrawal
    const totalWithdrawal = data
      .filter((d) => d.metadata?.source_type)
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Sum discharge
    const totalDischarge = data
      .filter((d) => d.metadata?.destination_type)
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Calculate consumption
    const totalConsumption = totalWithdrawal - totalDischarge

    // Water stress consumption
    const waterStressConsumption = data
      .filter((d) => d.metadata?.source_type && d.metadata?.water_stress_area === true)
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Record consumption metric
    await recordMetricData({
      metric_code: 'gri_303_5_water_consumption',
      organization_id: organizationId,
      site_id: siteId,
      period_start: new Date(`${year}-01-01`),
      period_end: new Date(`${year}-12-31`),
      value: totalConsumption,
      unit: 'm3',
      co2e_emissions: 0,
      metadata: {
        total_withdrawal_m3: totalWithdrawal,
        total_discharge_m3: totalDischarge,
        total_consumption_m3: totalConsumption,
        water_stress_consumption_m3: waterStressConsumption,
      },
    })

    return {
      total_withdrawal_m3: totalWithdrawal,
      total_discharge_m3: totalDischarge,
      total_consumption_m3: totalConsumption,
      water_stress_consumption_m3: waterStressConsumption,
    }
  } catch (error) {
    console.error('Error calculating water consumption:', error)
    return null
  }
}

// ============================================================================
// WATER STRESS ANALYSIS (Future: WRI Aqueduct API)
// ============================================================================

/**
 * Get water stress level for a site location
 * Future: Integrate with WRI Aqueduct API
 */
export async function getWaterStressLevel(
  latitude: number,
  longitude: number
): Promise<{
  level: 'low' | 'low_medium' | 'medium_high' | 'high' | 'extremely_high'
  score: number
} | null> {
  // TODO: Integrate with WRI Aqueduct API
  // For now, return placeholder
  return {
    level: 'medium_high',
    score: 3.5,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function recordMetricData(params: {
  metric_code: string
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date
  value: number
  unit: string
  co2e_emissions: number
  metadata?: Record<string, any>
}) {
  const { data: metric } = await getSupabase()
    .from('metrics_catalog')
    .select('id')
    .eq('code', params.metric_code)
    .single()

  if (!metric) throw new Error(`Metric ${params.metric_code} not found in catalog`)

  await getSupabase().from('metrics_data').insert({
    metric_id: metric.id,
    organization_id: params.organization_id,
    site_id: params.site_id,
    period_start: params.period_start.toISOString(),
    period_end: params.period_end.toISOString(),
    value: params.value,
    unit: params.unit,
    co2e_emissions: params.co2e_emissions,
    metadata: params.metadata,
    data_quality: 'measured',
    verification_status: 'pending',
  })
}
