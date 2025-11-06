/**
 * GRI 305: Emissions Service
 * Automated emission calculations using Climatiq API
 * Target: 90% automation
 */

import { calculateEmissions, getEmissionFactor } from '../apis/climatiq'
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

export interface Scope1Activity {
  type: 'stationary_combustion' | 'mobile_combustion' | 'process_emissions' | 'fugitive_emissions'
  fuel_type?: string // 'natural_gas', 'diesel', 'gasoline', 'lpg', etc.
  amount: number
  unit: string // 'kWh', 'liters', 'kg', etc.
  equipment?: string
  vehicle_id?: string
}

export interface Scope2Activity {
  method: 'location_based' | 'market_based'
  electricity_kwh: number
  grid_region?: string // Default to site location
  supplier?: string
  renewable_certificates?: boolean
}

export interface Scope3Activity {
  category:
    | 'business_travel'
    | 'employee_commuting'
    | 'upstream_transport'
    | 'waste_disposal'
    | 'purchased_goods'
  travel_type?: 'flight' | 'train' | 'car' | 'hotel'
  distance_km?: number
  waste_kg?: number
  waste_type?: string
  disposal_method?: string
}

export interface EmissionRecord {
  organization_id: string
  site_id?: string | null
  period_start: Date
  period_end: Date
  scope: 'scope_1' | 'scope_2' | 'scope_3'
  activity: Scope1Activity | Scope2Activity | Scope3Activity
  metadata?: Record<string, any>
}

export interface EmissionResult {
  metric_id: string
  co2e_kg: number
  co2e_tonnes: number
  emission_factor_used: {
    id: string
    value: number
    unit: string
    source: string
    year: number
  }
  data_quality: 'measured' | 'calculated' | 'estimated'
}

// ============================================================================
// SCOPE 1: DIRECT EMISSIONS
// ============================================================================

/**
 * Record Scope 1 emissions from stationary combustion (boilers, generators)
 */
export async function recordStationaryCombustion(
  record: EmissionRecord & { activity: Scope1Activity }
): Promise<EmissionResult | null> {
  try {
    const activity = record.activity as Scope1Activity

    // Get metric ID from catalog
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_305_1_stationary_combustion')
      .single()

    if (!metric) throw new Error('GRI 305-1 metric not found in catalog')

    // Calculate emissions using Climatiq
    const emissionResult = await calculateEmissions(
      activity.fuel_type || 'natural gas',
      activity.amount,
      record.site_id ? await getSiteRegion(record.site_id) : 'GLOBAL'
    )

    if (!emissionResult) {
      throw new Error(`Failed to calculate emissions for ${activity.fuel_type}`)
    }

    // Insert into metrics_data
    const { error } = await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: record.organization_id,
      site_id: record.site_id,
      period_start: record.period_start.toISOString(),
      period_end: record.period_end.toISOString(),
      value: activity.amount,
      unit: activity.unit,
      co2e_emissions: emissionResult.co2e_kg,
      metadata: {
        scope: 'scope_1',
        activity_type: activity.type,
        fuel_type: activity.fuel_type,
        equipment: activity.equipment,
        emission_factor_id: emissionResult.factor_id,
        emission_factor_value: emissionResult.factor_value,
        emission_factor_source: emissionResult.source,
        emission_factor_year: emissionResult.source_year,
        cached: emissionResult.cached,
        gas_breakdown: emissionResult.gas_breakdown,
        ...record.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    if (error) throw error

    return {
      metric_id: metric.id,
      co2e_kg: emissionResult.co2e_kg,
      co2e_tonnes: emissionResult.co2e_tonnes,
      emission_factor_used: {
        id: emissionResult.factor_id,
        value: emissionResult.factor_value,
        unit: emissionResult.factor_unit,
        source: emissionResult.source,
        year: emissionResult.source_year,
      },
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording stationary combustion:', error)
    return null
  }
}

/**
 * Record Scope 1 emissions from mobile combustion (company vehicles)
 */
export async function recordMobileCombustion(
  record: EmissionRecord & { activity: Scope1Activity }
): Promise<EmissionResult | null> {
  try {
    const activity = record.activity as Scope1Activity

    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_305_1_mobile_combustion')
      .single()

    if (!metric) throw new Error('GRI 305-1 mobile combustion metric not found')

    // Calculate emissions
    const emissionResult = await calculateEmissions(
      activity.fuel_type || 'diesel fuel',
      activity.amount,
      record.site_id ? await getSiteRegion(record.site_id) : 'GLOBAL'
    )

    if (!emissionResult) {
      throw new Error(`Failed to calculate emissions for ${activity.fuel_type}`)
    }

    // Insert into metrics_data
    const { error } = await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: record.organization_id,
      site_id: record.site_id,
      period_start: record.period_start.toISOString(),
      period_end: record.period_end.toISOString(),
      value: activity.amount,
      unit: activity.unit,
      co2e_emissions: emissionResult.co2e_kg,
      metadata: {
        scope: 'scope_1',
        activity_type: activity.type,
        fuel_type: activity.fuel_type,
        vehicle_id: activity.vehicle_id,
        emission_factor_id: emissionResult.factor_id,
        emission_factor_value: emissionResult.factor_value,
        emission_factor_source: emissionResult.source,
        emission_factor_year: emissionResult.source_year,
        cached: emissionResult.cached,
        gas_breakdown: emissionResult.gas_breakdown,
        ...record.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    if (error) throw error

    return {
      metric_id: metric.id,
      co2e_kg: emissionResult.co2e_kg,
      co2e_tonnes: emissionResult.co2e_tonnes,
      emission_factor_used: {
        id: emissionResult.factor_id,
        value: emissionResult.factor_value,
        unit: emissionResult.factor_unit,
        source: emissionResult.source,
        year: emissionResult.source_year,
      },
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording mobile combustion:', error)
    return null
  }
}

// ============================================================================
// SCOPE 2: ENERGY INDIRECT EMISSIONS
// ============================================================================

/**
 * Record Scope 2 emissions from purchased electricity (location-based method)
 */
export async function recordScope2Electricity(
  record: EmissionRecord & { activity: Scope2Activity }
): Promise<EmissionResult | null> {
  try {
    const activity = record.activity as Scope2Activity

    // Get metric ID based on method
    const metricCode =
      activity.method === 'location_based' ? 'gri_305_2_location_based' : 'gri_305_2_market_based'

    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', metricCode)
      .single()

    if (!metric) throw new Error(`GRI 305-2 ${activity.method} metric not found`)

    // Get grid region (from site or fallback)
    const gridRegion = activity.grid_region || (record.site_id ? await getSiteRegion(record.site_id) : 'GLOBAL')

    // Calculate emissions using cached grid factor
    const emissionResult = await calculateEmissions('electricity grid', activity.electricity_kwh, gridRegion)

    if (!emissionResult) {
      throw new Error(`Failed to calculate emissions for electricity in ${gridRegion}`)
    }

    // Insert into metrics_data
    const { error } = await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: record.organization_id,
      site_id: record.site_id,
      period_start: record.period_start.toISOString(),
      period_end: record.period_end.toISOString(),
      value: activity.electricity_kwh,
      unit: 'kWh',
      co2e_emissions: emissionResult.co2e_kg,
      metadata: {
        scope: 'scope_2',
        method: activity.method,
        grid_region: gridRegion,
        electricity_source: 'grid',
        supplier: activity.supplier,
        renewable_certificates: activity.renewable_certificates || false,
        emission_factor_id: emissionResult.factor_id,
        emission_factor_value: emissionResult.factor_value,
        emission_factor_source: emissionResult.source,
        emission_factor_year: emissionResult.source_year,
        cached: emissionResult.cached,
        ...record.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    if (error) throw error

    return {
      metric_id: metric.id,
      co2e_kg: emissionResult.co2e_kg,
      co2e_tonnes: emissionResult.co2e_tonnes,
      emission_factor_used: {
        id: emissionResult.factor_id,
        value: emissionResult.factor_value,
        unit: emissionResult.factor_unit,
        source: emissionResult.source,
        year: emissionResult.source_year,
      },
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording Scope 2 electricity:', error)
    return null
  }
}

// ============================================================================
// SCOPE 3: OTHER INDIRECT EMISSIONS
// ============================================================================

/**
 * Record Scope 3 emissions from business travel
 */
export async function recordBusinessTravel(
  record: EmissionRecord & { activity: Scope3Activity }
): Promise<EmissionResult | null> {
  try {
    const activity = record.activity as Scope3Activity

    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_305_3_business_travel')
      .single()

    if (!metric) throw new Error('GRI 305-3 business travel metric not found')

    // Map travel type to Climatiq activity
    const activityMap: Record<string, string> = {
      flight: 'commercial flight',
      train: 'passenger train',
      car: 'passenger vehicle',
      hotel: 'hotel accommodation',
    }

    const climatiqActivity = activityMap[activity.travel_type || 'flight']

    // Calculate emissions
    const emissionResult = await calculateEmissions(
      climatiqActivity,
      activity.distance_km || 0,
      'GLOBAL' // Travel usually uses global factors
    )

    if (!emissionResult) {
      throw new Error(`Failed to calculate emissions for ${activity.travel_type}`)
    }

    // Insert into metrics_data
    const { error } = await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: record.organization_id,
      site_id: record.site_id,
      period_start: record.period_start.toISOString(),
      period_end: record.period_end.toISOString(),
      value: activity.distance_km || 0,
      unit: 'km',
      co2e_emissions: emissionResult.co2e_kg,
      metadata: {
        scope: 'scope_3',
        category: activity.category,
        travel_type: activity.travel_type,
        emission_factor_id: emissionResult.factor_id,
        emission_factor_value: emissionResult.factor_value,
        emission_factor_source: emissionResult.source,
        emission_factor_year: emissionResult.source_year,
        cached: emissionResult.cached,
        ...record.metadata,
      },
      data_quality: 'calculated',
      verification_status: 'pending',
    })

    if (error) throw error

    return {
      metric_id: metric.id,
      co2e_kg: emissionResult.co2e_kg,
      co2e_tonnes: emissionResult.co2e_tonnes,
      emission_factor_used: {
        id: emissionResult.factor_id,
        value: emissionResult.factor_value,
        unit: emissionResult.factor_unit,
        source: emissionResult.source,
        year: emissionResult.source_year,
      },
      data_quality: 'calculated',
    }
  } catch (error) {
    console.error('Error recording business travel:', error)
    return null
  }
}

// ============================================================================
// AGGREGATION & REPORTING
// ============================================================================

/**
 * Get total emissions by scope for an organization
 */
export async function getEmissionsByScope(
  organizationId: string,
  year: number
): Promise<{
  scope_1: number
  scope_2: number
  scope_3: number
  total: number
} | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('co2e_emissions, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    const scope1 = data
      .filter((d) => d.metadata?.scope === 'scope_1')
      .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0)

    const scope2 = data
      .filter((d) => d.metadata?.scope === 'scope_2')
      .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0)

    const scope3 = data
      .filter((d) => d.metadata?.scope === 'scope_3')
      .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0)

    return {
      scope_1: scope1 / 1000, // Convert to tonnes
      scope_2: scope2 / 1000,
      scope_3: scope3 / 1000,
      total: (scope1 + scope2 + scope3) / 1000,
    }
  } catch (error) {
    console.error('Error getting emissions by scope:', error)
    return null
  }
}

/**
 * Calculate emission intensity (GRI 305-4)
 */
export async function calculateEmissionIntensity(
  organizationId: string,
  year: number,
  normalizer: { type: 'revenue' | 'employees' | 'units'; value: number }
): Promise<number | null> {
  try {
    const emissions = await getEmissionsByScope(organizationId, year)
    if (!emissions) return null

    return emissions.total / normalizer.value
  } catch (error) {
    console.error('Error calculating emission intensity:', error)
    return null
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get region code from site
 */
async function getSiteRegion(siteId: string): Promise<string> {
  try {
    const { data } = await getSupabase().from('sites').select('country').eq('id', siteId).single()

    return data?.country || 'GLOBAL'
  } catch (error) {
    console.error('Error getting site region:', error)
    return 'GLOBAL'
  }
}
