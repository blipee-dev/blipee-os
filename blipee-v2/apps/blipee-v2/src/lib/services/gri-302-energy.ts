/**
 * GRI 302: Energy Service
 * Automated energy tracking with emission calculations
 * Target: 80% automation
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

export interface EnergyConsumption {
  organization_id: string
  site_id?: string | null
  period_start: Date
  period_end: Date

  // Fuel consumption (non-renewable)
  natural_gas_kwh?: number
  diesel_liters?: number
  gasoline_liters?: number
  lpg_kg?: number
  coal_kg?: number
  fuel_oil_liters?: number

  // Fuel consumption (renewable)
  biogas_kwh?: number
  biodiesel_liters?: number
  biomass_kg?: number

  // Electricity
  electricity_purchased_kwh?: number
  electricity_renewable_kwh?: number
  electricity_generated_kwh?: number // Solar, wind, etc.

  // Heating/Cooling/Steam
  heating_purchased_kwh?: number
  cooling_purchased_kwh?: number
  steam_purchased_kg?: number

  // Metadata
  data_source?: 'utility_bill' | 'smart_meter' | 'manual' | 'estimated'
  grid_region?: string
  metadata?: Record<string, any>
}

export interface EnergyResult {
  total_energy_consumption_kwh: number
  total_co2e_kg: number
  total_co2e_tonnes: number
  breakdown: {
    non_renewable_fuel_kwh: number
    renewable_fuel_kwh: number
    electricity_kwh: number
    heating_cooling_steam_kwh: number
  }
  emissions_breakdown: {
    fuel_emissions_kg: number
    electricity_emissions_kg: number
  }
}

// ============================================================================
// GRI 302-1: ENERGY CONSUMPTION WITHIN ORGANIZATION
// ============================================================================

/**
 * Record comprehensive energy consumption (GRI 302-1)
 * Automatically calculates emissions for all energy sources
 */
export async function recordEnergyConsumption(
  consumption: EnergyConsumption
): Promise<EnergyResult | null> {
  try {
    const gridRegion = consumption.grid_region ||
      (consumption.site_id ? await getSiteRegion(consumption.site_id) : 'GLOBAL')

    let totalEnergyKwh = 0
    let totalCo2eKg = 0
    let nonRenewableFuelKwh = 0
    let renewableFuelKwh = 0
    let electricityKwh = 0
    let heatingCoolingSteamKwh = 0
    let fuelEmissionsKg = 0
    let electricityEmissionsKg = 0

    // ========================================================================
    // NON-RENEWABLE FUELS
    // ========================================================================

    // Natural gas
    if (consumption.natural_gas_kwh) {
      const emissions = await calculateEmissions(
        'natural gas',
        consumption.natural_gas_kwh,
        gridRegion
      )
      if (emissions) {
        await recordMetricData({
          metric_code: 'gri_302_1_fuel_non_renewable',
          organization_id: consumption.organization_id,
          site_id: consumption.site_id,
          period_start: consumption.period_start,
          period_end: consumption.period_end,
          value: consumption.natural_gas_kwh,
          unit: 'kWh',
          co2e_emissions: emissions.co2e_kg,
          metadata: {
            fuel_type: 'natural_gas',
            fuel_category: 'non_renewable',
            emission_factor_id: emissions.factor_id,
            ...consumption.metadata,
          },
        })
        nonRenewableFuelKwh += consumption.natural_gas_kwh
        fuelEmissionsKg += emissions.co2e_kg
        totalCo2eKg += emissions.co2e_kg
      }
    }

    // Diesel
    if (consumption.diesel_liters) {
      // Convert liters to kWh (diesel: ~10 kWh/liter)
      const dieselKwh = consumption.diesel_liters * 10
      const emissions = await calculateEmissions('diesel fuel', consumption.diesel_liters, gridRegion)
      if (emissions) {
        await recordMetricData({
          metric_code: 'gri_302_1_fuel_non_renewable',
          organization_id: consumption.organization_id,
          site_id: consumption.site_id,
          period_start: consumption.period_start,
          period_end: consumption.period_end,
          value: dieselKwh,
          unit: 'kWh',
          co2e_emissions: emissions.co2e_kg,
          metadata: {
            fuel_type: 'diesel',
            fuel_category: 'non_renewable',
            original_value: consumption.diesel_liters,
            original_unit: 'liters',
            emission_factor_id: emissions.factor_id,
            ...consumption.metadata,
          },
        })
        nonRenewableFuelKwh += dieselKwh
        fuelEmissionsKg += emissions.co2e_kg
        totalCo2eKg += emissions.co2e_kg
      }
    }

    // Gasoline
    if (consumption.gasoline_liters) {
      const gasolineKwh = consumption.gasoline_liters * 9 // ~9 kWh/liter
      const emissions = await calculateEmissions('gasoline', consumption.gasoline_liters, gridRegion)
      if (emissions) {
        await recordMetricData({
          metric_code: 'gri_302_1_fuel_non_renewable',
          organization_id: consumption.organization_id,
          site_id: consumption.site_id,
          period_start: consumption.period_start,
          period_end: consumption.period_end,
          value: gasolineKwh,
          unit: 'kWh',
          co2e_emissions: emissions.co2e_kg,
          metadata: {
            fuel_type: 'gasoline',
            fuel_category: 'non_renewable',
            original_value: consumption.gasoline_liters,
            original_unit: 'liters',
            emission_factor_id: emissions.factor_id,
            ...consumption.metadata,
          },
        })
        nonRenewableFuelKwh += gasolineKwh
        fuelEmissionsKg += emissions.co2e_kg
        totalCo2eKg += emissions.co2e_kg
      }
    }

    // ========================================================================
    // RENEWABLE FUELS
    // ========================================================================

    if (consumption.biogas_kwh) {
      renewableFuelKwh += consumption.biogas_kwh
      // Biogas has lower emissions - calculate if factor available
      const emissions = await calculateEmissions('biogas', consumption.biogas_kwh, gridRegion)
      if (emissions) {
        await recordMetricData({
          metric_code: 'gri_302_1_fuel_renewable',
          organization_id: consumption.organization_id,
          site_id: consumption.site_id,
          period_start: consumption.period_start,
          period_end: consumption.period_end,
          value: consumption.biogas_kwh,
          unit: 'kWh',
          co2e_emissions: emissions.co2e_kg,
          metadata: {
            fuel_type: 'biogas',
            fuel_category: 'renewable',
            emission_factor_id: emissions.factor_id,
            ...consumption.metadata,
          },
        })
        fuelEmissionsKg += emissions.co2e_kg
        totalCo2eKg += emissions.co2e_kg
      }
    }

    // ========================================================================
    // ELECTRICITY
    // ========================================================================

    if (consumption.electricity_purchased_kwh) {
      const emissions = await calculateEmissions(
        'electricity grid',
        consumption.electricity_purchased_kwh,
        gridRegion
      )
      if (emissions) {
        await recordMetricData({
          metric_code: 'gri_302_1_electricity_purchased',
          organization_id: consumption.organization_id,
          site_id: consumption.site_id,
          period_start: consumption.period_start,
          period_end: consumption.period_end,
          value: consumption.electricity_purchased_kwh,
          unit: 'kWh',
          co2e_emissions: emissions.co2e_kg,
          metadata: {
            grid_region: gridRegion,
            emission_factor_id: emissions.factor_id,
            emission_factor_value: emissions.factor_value,
            data_source: consumption.data_source,
            ...consumption.metadata,
          },
        })
        electricityKwh += consumption.electricity_purchased_kwh
        electricityEmissionsKg += emissions.co2e_kg
        totalCo2eKg += emissions.co2e_kg
      }
    }

    // Renewable electricity (solar, wind) - zero or low emissions
    if (consumption.electricity_renewable_kwh) {
      await recordMetricData({
        metric_code: 'gri_302_1_electricity_purchased',
        organization_id: consumption.organization_id,
        site_id: consumption.site_id,
        period_start: consumption.period_start,
        period_end: consumption.period_end,
        value: consumption.electricity_renewable_kwh,
        unit: 'kWh',
        co2e_emissions: 0, // Renewable = zero emissions
        metadata: {
          electricity_type: 'renewable',
          renewable_source: 'green_certificates',
          ...consumption.metadata,
        },
      })
      electricityKwh += consumption.electricity_renewable_kwh
    }

    // Self-generated electricity (e.g., solar panels)
    if (consumption.electricity_generated_kwh) {
      await recordMetricData({
        metric_code: 'gri_302_1_electricity_purchased',
        organization_id: consumption.organization_id,
        site_id: consumption.site_id,
        period_start: consumption.period_start,
        period_end: consumption.period_end,
        value: consumption.electricity_generated_kwh,
        unit: 'kWh',
        co2e_emissions: 0, // Self-generated renewable = zero
        metadata: {
          electricity_type: 'self_generated',
          generation_source: 'solar_panels',
          ...consumption.metadata,
        },
      })
      electricityKwh += consumption.electricity_generated_kwh
    }

    // ========================================================================
    // HEATING/COOLING/STEAM
    // ========================================================================

    if (consumption.heating_purchased_kwh) {
      heatingCoolingSteamKwh += consumption.heating_purchased_kwh
      await recordMetricData({
        metric_code: 'gri_302_1_heating_cooling_steam',
        organization_id: consumption.organization_id,
        site_id: consumption.site_id,
        period_start: consumption.period_start,
        period_end: consumption.period_end,
        value: consumption.heating_purchased_kwh,
        unit: 'kWh',
        co2e_emissions: 0, // Would need specific emission factor
        metadata: {
          type: 'heating',
          ...consumption.metadata,
        },
      })
    }

    if (consumption.cooling_purchased_kwh) {
      heatingCoolingSteamKwh += consumption.cooling_purchased_kwh
      await recordMetricData({
        metric_code: 'gri_302_1_heating_cooling_steam',
        organization_id: consumption.organization_id,
        site_id: consumption.site_id,
        period_start: consumption.period_start,
        period_end: consumption.period_end,
        value: consumption.cooling_purchased_kwh,
        unit: 'kWh',
        co2e_emissions: 0,
        metadata: {
          type: 'cooling',
          ...consumption.metadata,
        },
      })
    }

    // ========================================================================
    // TOTAL ENERGY CONSUMPTION (GRI 302-1)
    // ========================================================================

    totalEnergyKwh = nonRenewableFuelKwh + renewableFuelKwh + electricityKwh + heatingCoolingSteamKwh

    await recordMetricData({
      metric_code: 'gri_302_1_energy_consumption',
      organization_id: consumption.organization_id,
      site_id: consumption.site_id,
      period_start: consumption.period_start,
      period_end: consumption.period_end,
      value: totalEnergyKwh,
      unit: 'kWh',
      co2e_emissions: totalCo2eKg,
      metadata: {
        breakdown: {
          non_renewable_fuel_kwh: nonRenewableFuelKwh,
          renewable_fuel_kwh: renewableFuelKwh,
          electricity_kwh: electricityKwh,
          heating_cooling_steam_kwh: heatingCoolingSteamKwh,
        },
        emissions_breakdown: {
          fuel_emissions_kg: fuelEmissionsKg,
          electricity_emissions_kg: electricityEmissionsKg,
        },
        ...consumption.metadata,
      },
    })

    return {
      total_energy_consumption_kwh: totalEnergyKwh,
      total_co2e_kg: totalCo2eKg,
      total_co2e_tonnes: totalCo2eKg / 1000,
      breakdown: {
        non_renewable_fuel_kwh: nonRenewableFuelKwh,
        renewable_fuel_kwh: renewableFuelKwh,
        electricity_kwh: electricityKwh,
        heating_cooling_steam_kwh: heatingCoolingSteamKwh,
      },
      emissions_breakdown: {
        fuel_emissions_kg: fuelEmissionsKg,
        electricity_emissions_kg: electricityEmissionsKg,
      },
    }
  } catch (error) {
    console.error('Error recording energy consumption:', error)
    return null
  }
}

// ============================================================================
// GRI 302-3: ENERGY INTENSITY
// ============================================================================

/**
 * Calculate energy intensity (GRI 302-3)
 */
export async function calculateEnergyIntensity(
  organizationId: string,
  year: number,
  normalizer: { type: 'revenue' | 'employees' | 'production' | 'floor_area'; value: number }
): Promise<number | null> {
  try {
    // Get total energy consumption for the year
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Filter for energy consumption metrics
    const totalEnergyKwh = data
      .filter((d) => d.metadata?.metric_type === 'energy_consumption')
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Calculate intensity
    const intensity = totalEnergyKwh / normalizer.value

    // Record intensity metric
    await recordMetricData({
      metric_code: 'gri_302_3_energy_intensity',
      organization_id: organizationId,
      site_id: null,
      period_start: new Date(`${year}-01-01`),
      period_end: new Date(`${year}-12-31`),
      value: intensity,
      unit: `kWh/${normalizer.type}`,
      co2e_emissions: 0,
      metadata: {
        normalizer_type: normalizer.type,
        normalizer_value: normalizer.value,
        total_energy_kwh: totalEnergyKwh,
      },
    })

    return intensity
  } catch (error) {
    console.error('Error calculating energy intensity:', error)
    return null
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function recordMetricData(params: {
  metric_code: string
  organization_id: string
  site_id?: string | null
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

async function getSiteRegion(siteId: string): Promise<string> {
  try {
    const { data } = await getSupabase().from('sites').select('country').eq('id', siteId).single()
    return data?.country || 'GLOBAL'
  } catch (error) {
    return 'GLOBAL'
  }
}
