/**
 * Energy Data Layer for V2
 * Uses existing V1 database tables (metrics_catalog + metrics_data)
 * Server-side data fetching with Supabase
 */

import { createClient } from '@/lib/supabase/v2/server'

// Types based on V1 schema
export interface EnergySource {
  name: string
  type: string
  consumption: number
  unit: string
  emissions: number // in tCO2e
  cost: number
  renewable: boolean
  percentage?: number
}

export interface EnergyDashboardData {
  // Summary metrics
  totalConsumption: number // MWh
  totalEmissions: number // tCO2e
  totalCost: number // EUR
  renewablePercentage: number

  // Sources breakdown
  sources: EnergySource[]

  // Monthly trends
  monthlyTrend: Array<{
    month: string
    consumption: number
    emissions: number
    cost: number
  }>

  // Energy types breakdown
  energyTypes: Array<{
    name: string
    type: string
    value: number
  }>

  // Year-over-Year comparison
  yoyComparison?: {
    consumption: {
      current: number
      previous: number
      change: number // percentage
    }
    emissions: {
      current: number
      previous: number
      change: number // percentage
    }
    cost: {
      current: number
      previous: number
      change: number // percentage
    }
    renewable: {
      current: number
      previous: number
      change: number // percentage points
    }
  }
}

/**
 * Fetch energy dashboard data for an organization
 */
export async function getEnergyDashboardData(
  organizationId: string,
  options?: {
    startDate?: string
    endDate?: string
    siteId?: string
  }
): Promise<EnergyDashboardData> {
    const supabase = await createClient()

    // 1. Get energy metrics from catalog
    const { data: energyMetrics } = await supabase
      .from('metrics_catalog')
      .select('id, code, name, unit, is_renewable, energy_type, cost_per_ton')
      .in('category', ['Purchased Energy', 'Electricity'])
      .eq('is_active', true)

    if (!energyMetrics || energyMetrics.length === 0) {
      return {
        totalConsumption: 0,
        totalEmissions: 0,
        totalCost: 0,
        renewablePercentage: 0,
        sources: [],
        monthlyTrend: [],
        energyTypes: [],
      }
    }

    const metricIds = energyMetrics.map((m) => m.id)

    // 2. Build query for metrics_data
    let query = supabase
      .from('metrics_data')
      .select('metric_id, value, co2e_emissions, period_start, unit, metadata')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)

    // Apply filters
    if (options?.startDate) {
      query = query.gte('period_start', options.startDate)
    }
    if (options?.endDate) {
      // Don't include future months
      const now = new Date()
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const requestedEnd = new Date(options.endDate)
      const effectiveEnd = requestedEnd <= currentMonthEnd ? options.endDate : currentMonthEnd.toISOString().split('T')[0]
      query = query.lte('period_start', effectiveEnd)
    }
    if (options?.siteId) {
      query = query.eq('site_id', options.siteId)
    }

    const { data: energyData } = await query.order('period_start', { ascending: false })

    if (!energyData || energyData.length === 0) {
      return {
        totalConsumption: 0,
        totalEmissions: 0,
        totalCost: 0,
        renewablePercentage: 0,
        sources: [],
        monthlyTrend: [],
        energyTypes: [],
      }
    }

    // 3. Process sources breakdown
    const sourcesByType = energyData.reduce<Record<string, EnergySource>>((acc, record) => {
      const metric = energyMetrics.find((m) => m.id === record.metric_id)
      if (!metric) return acc

      // Map metric codes to display names
      const typeMapping: Record<string, { name: string; type: string }> = {
        scope2_electricity_grid: { name: 'Grid Electricity', type: 'grid_electricity' },
        scope2_electricity_renewable: { name: 'Renewable Electricity', type: 'renewable_electricity' },
        scope2_electricity_solar: { name: 'Solar Power', type: 'solar' },
        scope2_electricity_wind: { name: 'Wind Power', type: 'wind' },
        scope2_ev_charging: { name: 'EV Charging', type: 'ev_charging' },
        scope2_purchased_heating: { name: 'Purchased Heating', type: 'purchased_heating' },
        scope2_purchased_cooling: { name: 'Purchased Cooling', type: 'purchased_cooling' },
        scope2_purchased_steam: { name: 'Steam', type: 'steam' },
        scope2_district_heating: { name: 'District Heating', type: 'district_heating' },
        scope2_district_cooling: { name: 'District Cooling', type: 'district_cooling' },
      }

      const sourceInfo = typeMapping[metric.code] || { name: metric.name, type: 'other' }

      if (!acc[sourceInfo.type]) {
        acc[sourceInfo.type] = {
          name: sourceInfo.name,
          type: sourceInfo.type,
          consumption: 0,
          unit: metric.unit || 'kWh',
          emissions: 0,
          cost: 0,
          renewable: metric.is_renewable || false,
        }
      }

      // Add consumption (kWh)
      acc[sourceInfo.type].consumption += parseFloat(String(record.value)) || 0

      // Convert emissions from kgCO2e to tCO2e
      acc[sourceInfo.type].emissions += (parseFloat(String(record.co2e_emissions)) || 0) / 1000

      // Calculate cost
      if (metric.cost_per_ton) {
        const emissionsTons = (parseFloat(String(record.co2e_emissions)) || 0) / 1000
        acc[sourceInfo.type].cost += emissionsTons * metric.cost_per_ton
      }

      return acc
    }, {} as Record<string, EnergySource>)

    const sources = Object.values(sourcesByType) as EnergySource[]

    // 4. Calculate totals
    const totalConsumption = sources.reduce((sum, s) => sum + s.consumption, 0) / 1000 // Convert to MWh
    const totalEmissions = sources.reduce((sum, s) => sum + s.emissions, 0)
    const totalCost = sources.reduce((sum, s) => sum + s.cost, 0)

    // Calculate renewable percentage including grid mix data
    // Total renewable = pure renewable sources (solar, wind) + renewable portion of grid electricity
    const pureRenewableConsumption = sources
      .filter((s) => s.renewable)
      .reduce((sum, s) => sum + s.consumption, 0)

    // Add renewable portion from grid electricity (from metadata.grid_mix)
    let totalRenewableFromGrid = 0
    energyData.forEach((record) => {
      const gridMix = record.metadata?.grid_mix
      if (gridMix && gridMix.renewable_kwh) {
        totalRenewableFromGrid += parseFloat(String(gridMix.renewable_kwh)) || 0
      }
    })

    const totalRenewableEnergy = pureRenewableConsumption + totalRenewableFromGrid
    const renewablePercentage = totalConsumption > 0
      ? (totalRenewableEnergy / (totalConsumption * 1000)) * 100
      : 0

    // Add percentage to each source
    sources.forEach((source) => {
      source.percentage = totalConsumption > 0 ? (source.consumption / (totalConsumption * 1000)) * 100 : 0
    })

    // 5. Calculate monthly trend
    const monthlyData = energyData.reduce((acc: Record<string, { consumption: number; emissions: number; cost: number }>, record) => {
      const month = record.period_start.substring(0, 7) // YYYY-MM
      const metric = energyMetrics.find((m) => m.id === record.metric_id)

      if (!acc[month]) {
        acc[month] = { consumption: 0, emissions: 0, cost: 0 }
      }

      acc[month].consumption += parseFloat(String(record.value)) || 0
      acc[month].emissions += (parseFloat(String(record.co2e_emissions)) || 0) / 1000

      if (metric?.cost_per_ton) {
        const emissionsTons = (parseFloat(String(record.co2e_emissions)) || 0) / 1000
        acc[month].cost += emissionsTons * metric.cost_per_ton
      }

      return acc
    }, {})

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]: [string, { consumption: number; emissions: number; cost: number }]) => ({
        month,
        consumption: data.consumption / 1000, // Convert to MWh
        emissions: data.emissions,
        cost: data.cost,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // 6. Energy types breakdown
    const energyTypeData = energyData.reduce((acc: Record<string, number>, record) => {
      const metric = energyMetrics.find((m) => m.id === record.metric_id)
      const energyType = metric?.energy_type || 'electricity'

      if (!acc[energyType]) {
        acc[energyType] = 0
      }

      acc[energyType] += parseFloat(String(record.value)) || 0
      return acc
    }, {})

    const energyTypes = Object.entries(energyTypeData).map(([type, value]: [string, number]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      value: value / 1000, // Convert to MWh
    }))

    // 7. Calculate Year-over-Year comparison if we have year data
    let yoyComparison = undefined

    if (options?.startDate && options?.endDate) {
      // Parse the year from startDate
      const currentYear = parseInt(options.startDate.substring(0, 4), 10)
      const previousYear = currentYear - 1

      // Build query for previous year data
      const prevStartDate = `${previousYear}-01-01`
      const prevEndDate = `${previousYear}-12-31`

      let prevQuery = supabase
        .from('metrics_data')
        .select('metric_id, value, co2e_emissions')
        .eq('organization_id', organizationId)
        .in('metric_id', metricIds)
        .gte('period_start', prevStartDate)
        .lte('period_start', prevEndDate)

      if (options?.siteId) {
        prevQuery = prevQuery.eq('site_id', options.siteId)
      }

      const { data: prevYearData } = await prevQuery

      if (prevYearData && prevYearData.length > 0) {
        // Calculate previous year totals
        const prevTotalConsumption = prevYearData.reduce((sum, record) =>
          sum + (parseFloat(String(record.value)) || 0), 0) / 1000 // Convert to MWh

        const prevTotalEmissions = prevYearData.reduce((sum, record) =>
          sum + (parseFloat(String(record.co2e_emissions)) || 0) / 1000, 0) // Convert to tCO2e

        // Calculate previous year cost
        let prevTotalCost = 0
        prevYearData.forEach((record) => {
          const metric = energyMetrics.find((m) => m.id === record.metric_id)
          if (metric?.cost_per_ton) {
            const emissionsTons = (parseFloat(String(record.co2e_emissions)) || 0) / 1000
            prevTotalCost += emissionsTons * metric.cost_per_ton
          }
        })

        // Calculate previous year renewable percentage
        const prevSourcesByType = prevYearData.reduce<Record<string, { consumption: number; renewable: boolean }>>((acc, record) => {
          const metric = energyMetrics.find((m) => m.id === record.metric_id)
          if (!metric) return acc

          const typeMapping: Record<string, { name: string; type: string }> = {
            scope2_electricity_grid: { name: 'Grid Electricity', type: 'grid_electricity' },
            scope2_electricity_renewable: { name: 'Renewable Electricity', type: 'renewable_electricity' },
            scope2_electricity_solar: { name: 'Solar Power', type: 'solar' },
            scope2_electricity_wind: { name: 'Wind Power', type: 'wind' },
            scope2_ev_charging: { name: 'EV Charging', type: 'ev_charging' },
            scope2_purchased_heating: { name: 'Purchased Heating', type: 'purchased_heating' },
            scope2_purchased_cooling: { name: 'Purchased Cooling', type: 'purchased_cooling' },
            scope2_purchased_steam: { name: 'Steam', type: 'steam' },
            scope2_district_heating: { name: 'District Heating', type: 'district_heating' },
            scope2_district_cooling: { name: 'District Cooling', type: 'district_cooling' },
          }

          const sourceInfo = typeMapping[metric.code] || { name: metric.name, type: 'other' }

          if (!acc[sourceInfo.type]) {
            acc[sourceInfo.type] = { consumption: 0, renewable: metric.is_renewable || false }
          }

          acc[sourceInfo.type].consumption += parseFloat(String(record.value)) || 0

          return acc
        }, {})

        const prevSources = Object.values(prevSourcesByType)
        const prevRenewableConsumption = prevSources
          .filter((s) => s.renewable)
          .reduce((sum, s) => sum + s.consumption, 0)
        const prevRenewablePercentage = prevTotalConsumption > 0
          ? (prevRenewableConsumption / (prevTotalConsumption * 1000)) * 100
          : 0

        // Calculate percentage changes
        const consumptionChange = prevTotalConsumption > 0
          ? ((totalConsumption - prevTotalConsumption) / prevTotalConsumption) * 100
          : 0

        const emissionsChange = prevTotalEmissions > 0
          ? ((totalEmissions - prevTotalEmissions) / prevTotalEmissions) * 100
          : 0

        const costChange = prevTotalCost > 0
          ? ((totalCost - prevTotalCost) / prevTotalCost) * 100
          : 0

        const renewableChange = renewablePercentage - prevRenewablePercentage // percentage points

        yoyComparison = {
          consumption: {
            current: totalConsumption,
            previous: prevTotalConsumption,
            change: consumptionChange,
          },
          emissions: {
            current: totalEmissions,
            previous: prevTotalEmissions,
            change: emissionsChange,
          },
          cost: {
            current: totalCost,
            previous: prevTotalCost,
            change: costChange,
          },
          renewable: {
            current: renewablePercentage,
            previous: prevRenewablePercentage,
            change: renewableChange,
          },
        }
      }
    }

    return {
      totalConsumption,
      totalEmissions,
      totalCost,
      renewablePercentage,
      sources,
      monthlyTrend,
      energyTypes,
      yoyComparison,
    }
}

/**
 * Get current user's organization ID
 */
export async function getUserOrganizationId(): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  return membership?.organization_id || null
}

/**
 * Get user sites for an organization
 */
export async function getUserSites(organizationId: string) {
  const supabase = await createClient()

  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, location')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  return sites || []
}
