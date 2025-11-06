/**
 * GRI Dashboard Data Fetching
 * Follows the same pattern as energy.ts
 */

import { createClient } from '@/lib/supabase/v2/server'

export interface GRIStandardData {
  standard_code: string // '301', '302', etc.
  standard_name: string
  total_metrics: number
  metrics_recorded: number
  completion_percentage: number
  status: 'full' | 'partial' | 'none' // GRI compliance status
  total_records: number // Total data points (for depth indicator)
  data_quality: 'high' | 'medium' | 'low' // Based on granularity
  last_updated: string | null
  key_metric_value?: number
  key_metric_unit?: string
  key_metric_yoy?: number | null // YoY change for key metric
}

export interface GRIDashboardData {
  standards: GRIStandardData[]
  total_emissions_tonnes: number
  total_energy_kwh: number
  total_water_m3: number
  total_waste_kg: number
  compliance_incidents: number
  high_risk_suppliers: number
  year: number
  intensity: IntensityMetrics
  // YoY percentage changes
  total_emissions_yoy: number | null
  total_energy_yoy: number | null
  total_water_yoy: number | null
  total_waste_yoy: number | null
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

  // Get user's primary organization from memberships
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  return membership?.organization_id || null
}

/**
 * Get user's sites for filtering
 */
export async function getUserSites(organizationId: string) {
  const supabase = await createClient()

  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, location, country')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('name')

  return sites || []
}

/**
 * Get GRI Dashboard Data
 */
export async function getGRIDashboardData(
  organizationId: string,
  options: {
    startDate: string
    endDate: string
    siteId?: string
  }
): Promise<GRIDashboardData> {
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('metrics_data')
    .select(
      `
      id,
      value,
      unit,
      co2e_emissions,
      period_start,
      period_end,
      metadata,
      metric:metrics_catalog(
        id,
        code,
        name,
        category,
        is_renewable
      )
    `
    )
    .eq('organization_id', organizationId)
    .gte('period_start', options.startDate)
    .lte('period_end', options.endDate)

  if (options.siteId) {
    query = query.eq('site_id', options.siteId)
  }

  const { data: metricsData } = await query

  if (!metricsData) {
    return {
      standards: [],
      total_emissions_tonnes: 0,
      total_energy_kwh: 0,
      total_water_m3: 0,
      total_waste_kg: 0,
      compliance_incidents: 0,
      high_risk_suppliers: 0,
      year: new Date(options.startDate).getFullYear(),
      intensity: {
        perEmployee: null,
        perRevenueMillion: null,
        perFloorAreaM2: null,
        perCustomer: null,
        employeeCount: null,
        revenue: null,
        floorArea: null,
        customers: null,
      },
    }
  }

  // Group metrics by GRI standard
  const standardsMap = new Map<string, GRIStandardData>()

  // Initialize all 8 GRI standards
  const griStandards = [
    { code: '301', name: 'Materials' },
    { code: '302', name: 'Energy' },
    { code: '303', name: 'Water' },
    { code: '304', name: 'Biodiversity' },
    { code: '305', name: 'Emissions' },
    { code: '306', name: 'Waste' },
    { code: '307', name: 'Compliance' },
    { code: '308', name: 'Suppliers' },
  ]

  griStandards.forEach((standard) => {
    standardsMap.set(standard.code, {
      standard_code: standard.code,
      standard_name: standard.name,
      total_metrics: 0,
      metrics_recorded: 0,
      completion_percentage: 0,
      status: 'none',
      total_records: 0,
      data_quality: 'low',
      last_updated: null,
    })
  })

  // Track unique metrics per standard (to avoid counting duplicates)
  const uniqueMetricsPerStandard = new Map<string, Set<string>>()
  griStandards.forEach((standard) => {
    uniqueMetricsPerStandard.set(standard.code, new Set<string>())
  })

  // Calculate metrics for each standard
  metricsData.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    let standardCode = ''

    // Map metric codes to GRI standards
    if (metricCode.startsWith('gri_')) {
      // Extract standard code from 'gri_303_4_...' -> '303'
      const parts = metricCode.split('_')
      if (parts.length >= 2) {
        standardCode = parts[1]
      }
    } else if (metricCode.startsWith('scope1_') || metricCode.startsWith('scope2_') || metricCode.startsWith('scope3_')) {
      // Map scope emissions to GRI standards
      if (metricCode.startsWith('scope2_')) {
        standardCode = '302' // Energy-related scope 2
      } else {
        standardCode = '305' // All scope 1 and scope 3 emissions (including waste-related)
      }
    } else if (metricCode.includes('water')) {
      standardCode = '303' // Water-related
    } else if (metricCode.includes('waste')) {
      standardCode = '306' // Waste-related
    } else if (metricCode.includes('energy') || metricCode.includes('electricity')) {
      standardCode = '302' // Energy-related
    }

    if (standardCode && standardsMap.has(standardCode)) {
      const standard = standardsMap.get(standardCode)!

      // Add to unique metrics set (duplicates are automatically ignored)
      uniqueMetricsPerStandard.get(standardCode)!.add(metricCode)

      // Count total records for depth indicator
      standard.total_records++

      // Update last_updated
      if (!standard.last_updated || metric.period_end > standard.last_updated) {
        standard.last_updated = metric.period_end
      }

      // Set key metric value for each standard
      if (standardCode === '305') {
        // GRI 305 - Emissions
        standard.key_metric_value = (standard.key_metric_value || 0) + (metric.co2e_emissions || 0) / 1000
        standard.key_metric_unit = 'tonnes CO2e'
      } else if (standardCode === '302') {
        // GRI 302 - Energy
        standard.key_metric_value = (standard.key_metric_value || 0) + (metric.value || 0)
        standard.key_metric_unit = 'kWh'
      } else if (standardCode === '303') {
        // GRI 303 - Water (consumption or discharge)
        standard.key_metric_value = (standard.key_metric_value || 0) + (metric.value || 0)
        standard.key_metric_unit = 'm³'
      } else if (standardCode === '306') {
        // GRI 306 - Waste
        standard.key_metric_value = (standard.key_metric_value || 0) + (metric.value || 0)
        standard.key_metric_unit = 'kg'
      }
    }
  })

  // Set metrics_recorded to count of unique metrics (not total records)
  uniqueMetricsPerStandard.forEach((metricsSet, standardCode) => {
    if (standardsMap.has(standardCode)) {
      standardsMap.get(standardCode)!.metrics_recorded = metricsSet.size
    }
  })

  // Get total metrics per standard from catalog
  const { data: catalogCounts } = await supabase
    .from('metrics_catalog')
    .select('code')
    .like('code', 'gri_%')

  catalogCounts?.forEach((metric) => {
    const standardCode = metric.code.split('_')[1]
    if (standardCode && standardsMap.has(standardCode)) {
      standardsMap.get(standardCode)!.total_metrics++
    }
  })

  // Calculate completion percentage, status, and data quality
  standardsMap.forEach((standard) => {
    if (standard.total_metrics > 0) {
      standard.completion_percentage = Math.round((standard.metrics_recorded / standard.total_metrics) * 100)

      // Calculate GRI compliance status based on coverage
      if (standard.completion_percentage >= 75) {
        standard.status = 'full'
      } else if (standard.completion_percentage >= 25) {
        standard.status = 'partial'
      } else {
        standard.status = 'none'
      }

      // Calculate data quality based on granularity (records per metric)
      if (standard.metrics_recorded > 0) {
        const recordsPerMetric = standard.total_records / standard.metrics_recorded
        if (recordsPerMetric >= 10) {
          standard.data_quality = 'high' // Monthly data across sites
        } else if (recordsPerMetric >= 3) {
          standard.data_quality = 'medium' // Quarterly or multi-site
        } else {
          standard.data_quality = 'low' // Annual aggregated only
        }
      }
    }
  })

  // Calculate totals
  let totalEmissionsTonnes = 0
  let totalEnergyKwh = 0
  let totalWaterM3 = 0
  let totalWasteKg = 0
  let complianceIncidents = 0
  let highRiskSuppliers = 0

  metricsData.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''

    // Total emissions (GRI 305 + Scope 1/2/3)
    if (
      metricCode.startsWith('gri_305') ||
      metricCode.startsWith('scope1_') ||
      metricCode.startsWith('scope2_') ||
      metricCode.startsWith('scope3_') // Include ALL scope 3 emissions (including waste-related)
    ) {
      totalEmissionsTonnes += (metric.co2e_emissions || 0) / 1000
    }

    // Total energy (GRI 302 + Scope 2 electricity)
    if (
      metricCode.startsWith('gri_302') ||
      metricCode.startsWith('scope2_')
    ) {
      totalEnergyKwh += metric.value || 0
    }

    // Total water (GRI 303 - withdrawal, discharge, consumption)
    if (
      metricCode.startsWith('gri_303_3_') || // withdrawal
      metricCode.startsWith('gri_303_4_') || // discharge
      metricCode.startsWith('gri_303_5_')    // consumption
    ) {
      totalWaterM3 += metric.value || 0
    }

    // Total waste (GRI 306 + Scope 3 waste)
    if (
      metricCode.startsWith('gri_306') ||
      metricCode.includes('scope3_waste')
    ) {
      totalWasteKg += metric.value || 0
    }

    // Compliance incidents (GRI 307)
    if (metricCode.includes('gri_307') && metric.metadata?.incident_type) {
      complianceIncidents++
    }

    // High risk suppliers (GRI 308)
    if (metricCode.includes('gri_308') && metric.metadata?.high_risk === true) {
      highRiskSuppliers++
    }
  })

  // Fetch organization revenue and customers (always from organization level)
  const { data: orgData } = await supabase
    .from('organizations')
    .select('annual_revenue, annual_customers')
    .eq('id', organizationId)
    .single()

  // Fetch site data for employee count and floor area
  let sitesQuery = supabase
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  // If filtering by specific site, only get that site's data
  if (options.siteId) {
    sitesQuery = sitesQuery.eq('id', options.siteId)
  }

  const { data: sitesData } = await sitesQuery

  // Sum employees and floor area from sites
  const totalEmployees = sitesData?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0
  const totalFloorArea = sitesData?.reduce((sum, site) => sum + (site.total_area_sqm || 0), 0) || 0

  // Find the actual last date with current year data to ensure fair YoY comparison
  const lastDataDate = metricsData && metricsData.length > 0
    ? metricsData.reduce((latest: string, metric: any) => {
        const periodEnd = metric.period_end || ''
        return periodEnd > latest ? periodEnd : latest
      }, '1970-01-01')
    : options.endDate

  // Calculate previous year date range for YoY comparison (same actual period)
  const startDate = new Date(options.startDate)
  const endDate = new Date(lastDataDate) // Use actual last date, not requested end date
  const prevYearStart = new Date(startDate)
  prevYearStart.setFullYear(startDate.getFullYear() - 1)
  const prevYearEnd = new Date(endDate)
  prevYearEnd.setFullYear(endDate.getFullYear() - 1)

  // Fetch previous year metrics for YoY comparison
  let prevYearQuery = supabase
    .from('metrics_data')
    .select('co2e_emissions, value, site_id, metric:metrics_catalog(code)')
    .eq('organization_id', organizationId)
    .gte('period_start', prevYearStart.toISOString().split('T')[0])
    .lte('period_end', prevYearEnd.toISOString().split('T')[0])

  if (options.siteId) {
    prevYearQuery = prevYearQuery.eq('site_id', options.siteId)
  }

  const { data: prevYearMetrics } = await prevYearQuery

  // Calculate previous year totals for all metrics
  let prevYearEmissionsTonnes = 0
  let prevYearScope1 = 0
  let prevYearScope2 = 0
  let prevYearScope3 = 0
  let prevYearEnergyKwh = 0
  let prevYearWaterM3 = 0
  let prevYearWasteKg = 0

  // Track previous year emissions by site for per-site YoY
  const prevYearSiteMap = new Map<string, number>()

  prevYearMetrics?.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const emissions = (metric.co2e_emissions || 0) / 1000 // Convert to tonnes
    const siteId = metric.site_id

    // Total emissions (GRI 305 + Scope 1/2/3)
    if (metricCode.startsWith('scope1_')) {
      prevYearScope1 += emissions
      prevYearEmissionsTonnes += emissions
    } else if (metricCode.startsWith('scope2_')) {
      prevYearScope2 += emissions
      prevYearEmissionsTonnes += emissions
    } else if (metricCode.startsWith('scope3_')) { // Include ALL scope 3 emissions (including waste-related)
      prevYearScope3 += emissions
      prevYearEmissionsTonnes += emissions
    } else if (metricCode.startsWith('gri_305')) {
      prevYearEmissionsTonnes += emissions
    }

    // Total energy (GRI 302 + Scope 2 electricity)
    if (metricCode.startsWith('gri_302') || metricCode.startsWith('scope2_')) {
      prevYearEnergyKwh += metric.value || 0
    }

    // Total water (GRI 303 - withdrawal, discharge, consumption)
    if (
      metricCode.startsWith('gri_303_3_') || // withdrawal
      metricCode.startsWith('gri_303_4_') || // discharge
      metricCode.startsWith('gri_303_5_')    // consumption
    ) {
      prevYearWaterM3 += metric.value || 0
    }

    // Total waste (GRI 306 + Scope 3 waste)
    if (metricCode.startsWith('gri_306') || metricCode.includes('scope3_waste')) {
      prevYearWasteKg += metric.value || 0
    }

    // Track by site for per-site YoY
    if (siteId && (metricCode.startsWith('scope1_') || metricCode.startsWith('scope2_') || metricCode.startsWith('scope3_'))) {
      prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + emissions)
    }
  })

  // Calculate intensity metrics (GRI 305-4: Emissions Intensity)
  const intensity: IntensityMetrics = {
    perEmployee: null,
    perRevenueMillion: null,
    perFloorAreaM2: null,
    perCustomer: null,
    employeeCount: totalEmployees > 0 ? totalEmployees : null,
    revenue: orgData?.annual_revenue || null,
    floorArea: totalFloorArea > 0 ? totalFloorArea : null,
    customers: orgData?.annual_customers || null,
    perEmployeeYoY: null,
    perRevenueMillionYoY: null,
    perFloorAreaM2YoY: null,
    perCustomerYoY: null,
  }

  // Calculate previous year intensity metrics for comparison
  let prevPerEmployee: number | null = null
  let prevPerRevenueMillion: number | null = null
  let prevPerFloorAreaM2: number | null = null
  let prevPerCustomer: number | null = null

  if (prevYearEmissionsTonnes > 0) {
    if (totalEmployees > 0) {
      prevPerEmployee = Math.round((prevYearEmissionsTonnes / totalEmployees) * 100) / 100
    }
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      prevPerRevenueMillion = Math.round((prevYearEmissionsTonnes / revenueMillion) * 100) / 100
    }
    if (totalFloorArea > 0) {
      prevPerFloorAreaM2 = Math.round((prevYearEmissionsTonnes * 1000 / totalFloorArea) * 100) / 100
    }
    if (orgData?.annual_customers && orgData.annual_customers > 0) {
      prevPerCustomer = Math.round((prevYearEmissionsTonnes * 1000 / orgData.annual_customers) * 100) / 100
    }
  }

  if (totalEmissionsTonnes > 0) {
    // Per employee (tonnes CO2e / employee)
    if (totalEmployees > 0) {
      intensity.perEmployee = Math.round((totalEmissionsTonnes / totalEmployees) * 100) / 100
      // Calculate YoY change
      if (prevPerEmployee !== null && prevPerEmployee > 0) {
        intensity.perEmployeeYoY = Math.round(((intensity.perEmployee - prevPerEmployee) / prevPerEmployee) * 10000) / 100
      }
    }

    // Per revenue million (tonnes CO2e / $M revenue)
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      intensity.perRevenueMillion = Math.round((totalEmissionsTonnes / revenueMillion) * 100) / 100
      // Calculate YoY change
      if (prevPerRevenueMillion !== null && prevPerRevenueMillion > 0) {
        intensity.perRevenueMillionYoY = Math.round(((intensity.perRevenueMillion - prevPerRevenueMillion) / prevPerRevenueMillion) * 10000) / 100
      }
    }

    // Per floor area (kg CO2e / m²)
    if (totalFloorArea > 0) {
      intensity.perFloorAreaM2 = Math.round((totalEmissionsTonnes * 1000 / totalFloorArea) * 100) / 100
      // Calculate YoY change
      if (prevPerFloorAreaM2 !== null && prevPerFloorAreaM2 > 0) {
        intensity.perFloorAreaM2YoY = Math.round(((intensity.perFloorAreaM2 - prevPerFloorAreaM2) / prevPerFloorAreaM2) * 10000) / 100
      }
    }

    // Per customer (kg CO2e / customer)
    if (orgData?.annual_customers && orgData.annual_customers > 0) {
      intensity.perCustomer = Math.round((totalEmissionsTonnes * 1000 / orgData.annual_customers) * 100) / 100
      // Calculate YoY change
      if (prevPerCustomer !== null && prevPerCustomer > 0) {
        intensity.perCustomerYoY = Math.round(((intensity.perCustomer - prevPerCustomer) / prevPerCustomer) * 10000) / 100
      }
    }
  }

  // Calculate YoY percentages for main metrics
  const total_emissions_yoy = prevYearEmissionsTonnes > 0
    ? Math.round(((totalEmissionsTonnes - prevYearEmissionsTonnes) / prevYearEmissionsTonnes) * 10000) / 100
    : null
  const total_energy_yoy = prevYearEnergyKwh > 0
    ? Math.round(((totalEnergyKwh - prevYearEnergyKwh) / prevYearEnergyKwh) * 10000) / 100
    : null
  const total_water_yoy = prevYearWaterM3 > 0
    ? Math.round(((totalWaterM3 - prevYearWaterM3) / prevYearWaterM3) * 10000) / 100
    : null
  const total_waste_yoy = prevYearWasteKg > 0
    ? Math.round(((totalWasteKg - prevYearWasteKg) / prevYearWasteKg) * 10000) / 100
    : null

  // Map YoY values to corresponding GRI standards
  if (standardsMap.has('302')) {
    standardsMap.get('302')!.key_metric_yoy = total_energy_yoy
  }
  if (standardsMap.has('303')) {
    standardsMap.get('303')!.key_metric_yoy = total_water_yoy
  }
  if (standardsMap.has('305')) {
    standardsMap.get('305')!.key_metric_yoy = total_emissions_yoy
  }
  if (standardsMap.has('306')) {
    standardsMap.get('306')!.key_metric_yoy = total_waste_yoy
  }

  return {
    standards: Array.from(standardsMap.values()),
    total_emissions_tonnes: Math.round(totalEmissionsTonnes * 100) / 100,
    total_energy_kwh: Math.round(totalEnergyKwh),
    total_water_m3: Math.round(totalWaterM3),
    total_waste_kg: Math.round(totalWasteKg),
    compliance_incidents: complianceIncidents,
    high_risk_suppliers: highRiskSuppliers,
    year: new Date(options.startDate).getFullYear(),
    intensity,
    total_emissions_yoy,
    total_energy_yoy,
    total_water_yoy,
    total_waste_yoy,
  }
}

/**
 * GRI 305 Emissions Dashboard Data Types
 */
export interface EmissionsMonthlyTrend {
  month: string // 'YYYY-MM'
  scope1: number
  scope2: number
  scope3: number
  total: number
}

export interface EmissionsByScope {
  scope: string
  value: number
  percentage: number
}

export interface EmissionsBySite {
  site_id: string
  site_name: string
  scope1: number
  scope2: number
  scope3: number
  total: number
  // YoY percentage changes per site
  totalYoY: number | null
}

export interface EmissionsBySource {
  source: string
  category: string
  value: number
  percentage: number
}

export interface IntensityMetrics {
  perEmployee: number | null
  perRevenueMillion: number | null
  perFloorAreaM2: number | null
  perCustomer: number | null
  employeeCount: number | null
  revenue: number | null
  floorArea: number | null
  customers: number | null
  // YoY percentage changes (negative = improvement/reduction)
  perEmployeeYoY: number | null
  perRevenueMillionYoY: number | null
  perFloorAreaM2YoY: number | null
  perCustomerYoY: number | null
}

export interface EmissionsDashboardData {
  totalEmissions: number
  scope1Total: number
  scope2Total: number
  scope3Total: number
  monthlyTrend: EmissionsMonthlyTrend[]
  byScope: EmissionsByScope[]
  bySite: EmissionsBySite[]
  bySource: EmissionsBySource[]
  year: number
  intensity: IntensityMetrics
  // YoY percentage changes
  totalEmissionsYoY: number | null
  scope1YoY: number | null
  scope2YoY: number | null
  scope3YoY: number | null
}

/**
 * Get GRI 305 Emissions Dashboard Data
 */
export async function getEmissionsDashboardData(
  organizationId: string,
  options: {
    startDate: string
    endDate: string
    siteId?: string
  }
): Promise<EmissionsDashboardData> {
  const supabase = await createClient()

  // Build query for GRI 305 metrics
  let query = supabase
    .from('metrics_data')
    .select(
      `
      id,
      value,
      unit,
      co2e_emissions,
      period_start,
      period_end,
      metadata,
      site:sites(id, name),
      metric:metrics_catalog(
        id,
        code,
        name,
        category,
        is_renewable
      )
    `
    )
    .eq('organization_id', organizationId)
    .gte('period_start', options.startDate)
    .lte('period_end', options.endDate)

  if (options.siteId) {
    query = query.eq('site_id', options.siteId)
  }

  const { data: metricsData } = await query

  if (!metricsData || metricsData.length === 0) {
    return {
      totalEmissions: 0,
      scope1Total: 0,
      scope2Total: 0,
      scope3Total: 0,
      monthlyTrend: [],
      byScope: [
        { scope: 'Scope 1', value: 0, percentage: 0 },
        { scope: 'Scope 2', value: 0, percentage: 0 },
        { scope: 'Scope 3', value: 0, percentage: 0 },
      ],
      bySite: [],
      bySource: [],
      year: new Date(options.startDate).getFullYear(),
      intensity: {
        perEmployee: null,
        perRevenueMillion: null,
        perFloorAreaM2: null,
        perCustomer: null,
        employeeCount: null,
        revenue: null,
        floorArea: null,
        customers: null,
      },
    }
  }

  // Filter GRI 305 emissions metrics (includes gri_305_* and scope1/2/3_*)
  const emissionsData = metricsData.filter((m: any) => {
    const code = m.metric?.code || ''
    return (
      code.startsWith('gri_305') ||
      code.startsWith('scope1_') ||
      code.startsWith('scope2_') ||
      code.startsWith('scope3_') // Include ALL scope 3 emissions (including waste-related)
    )
  })

  // Calculate totals by scope
  let scope1Total = 0
  let scope2Total = 0
  let scope3Total = 0

  // Monthly trend map
  const monthlyTrendMap = new Map<string, { scope1: number; scope2: number; scope3: number }>()

  // Site breakdown map
  const siteMap = new Map<
    string,
    { site_name: string; scope1: number; scope2: number; scope3: number }
  >()

  // Source breakdown map
  const sourceMap = new Map<string, { category: string; value: number }>()

  emissionsData.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const emissions = (metric.co2e_emissions || 0) / 1000 // Convert kg to tonnes
    const month = metric.period_start?.substring(0, 7) // 'YYYY-MM'
    const siteName = metric.site?.name || 'Unknown Site'
    const siteId = metric.site?.id || 'unknown'

    // Determine scope
    let scope = ''
    if (metricCode.startsWith('scope1_') || metricCode.includes('gri_305_1') || metricCode.includes('direct_emissions')) {
      scope = 'scope1'
      scope1Total += emissions
    } else if (metricCode.startsWith('scope2_') || metricCode.includes('gri_305_2') || metricCode.includes('indirect_emissions_energy')) {
      scope = 'scope2'
      scope2Total += emissions
    } else if (metricCode.startsWith('scope3_') || metricCode.includes('gri_305_3') || metricCode.includes('indirect_emissions_value_chain')) {
      scope = 'scope3'
      scope3Total += emissions
    }

    // Monthly trend
    if (month) {
      if (!monthlyTrendMap.has(month)) {
        monthlyTrendMap.set(month, { scope1: 0, scope2: 0, scope3: 0 })
      }
      const monthData = monthlyTrendMap.get(month)!
      if (scope === 'scope1') monthData.scope1 += emissions
      else if (scope === 'scope2') monthData.scope2 += emissions
      else if (scope === 'scope3') monthData.scope3 += emissions
    }

    // Site breakdown
    if (!siteMap.has(siteId)) {
      siteMap.set(siteId, { site_name: siteName, scope1: 0, scope2: 0, scope3: 0 })
    }
    const siteData = siteMap.get(siteId)!
    if (scope === 'scope1') siteData.scope1 += emissions
    else if (scope === 'scope2') siteData.scope2 += emissions
    else if (scope === 'scope3') siteData.scope3 += emissions

    // Source breakdown - use metric name as source
    const source = metric.metric?.name || metric.metadata?.source || metric.metadata?.emission_source || 'Other'
    const category = metric.metadata?.category || scope
    if (!sourceMap.has(source)) {
      sourceMap.set(source, { category, value: 0 })
    }
    sourceMap.get(source)!.value += emissions
  })

  const totalEmissions = scope1Total + scope2Total + scope3Total

  // Build monthly trend array
  const monthlyTrend: EmissionsMonthlyTrend[] = Array.from(monthlyTrendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      scope1: Math.round(data.scope1 * 100) / 100,
      scope2: Math.round(data.scope2 * 100) / 100,
      scope3: Math.round(data.scope3 * 100) / 100,
      total: Math.round((data.scope1 + data.scope2 + data.scope3) * 100) / 100,
    }))

  // Build scope breakdown
  const byScope: EmissionsByScope[] = [
    {
      scope: 'Scope 1',
      value: Math.round(scope1Total * 100) / 100,
      percentage: totalEmissions > 0 ? Math.round((scope1Total / totalEmissions) * 100) : 0,
    },
    {
      scope: 'Scope 2',
      value: Math.round(scope2Total * 100) / 100,
      percentage: totalEmissions > 0 ? Math.round((scope2Total / totalEmissions) * 100) : 0,
    },
    {
      scope: 'Scope 3',
      value: Math.round(scope3Total * 100) / 100,
      percentage: totalEmissions > 0 ? Math.round((scope3Total / totalEmissions) * 100) : 0,
    },
  ]

  // Build source breakdown
  const bySource: EmissionsBySource[] = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      category: data.category,
      value: Math.round(data.value * 100) / 100,
      percentage: totalEmissions > 0 ? Math.round((data.value / totalEmissions) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10 sources

  // Fetch organization revenue and customers (always from organization level)
  const { data: orgData } = await supabase
    .from('organizations')
    .select('annual_revenue, annual_customers')
    .eq('id', organizationId)
    .single()

  // Fetch site data for employee count and floor area
  let sitesQuery = supabase
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  // If filtering by specific site, only get that site's data
  if (options.siteId) {
    sitesQuery = sitesQuery.eq('id', options.siteId)
  }

  const { data: sitesData } = await sitesQuery

  // Sum employees and floor area from sites
  const totalEmployees = sitesData?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0
  const totalFloorArea = sitesData?.reduce((sum, site) => sum + (site.total_area_sqm || 0), 0) || 0

  // Find the actual last date with current year data to ensure fair YoY comparison
  const lastDataDate = metricsData && metricsData.length > 0
    ? metricsData.reduce((latest: string, metric: any) => {
        const periodEnd = metric.period_end || ''
        return periodEnd > latest ? periodEnd : latest
      }, '1970-01-01')
    : options.endDate

  // Calculate previous year date range for YoY comparison (same actual period)
  const startDate = new Date(options.startDate)
  const endDate = new Date(lastDataDate) // Use actual last date, not requested end date
  const prevYearStart = new Date(startDate)
  prevYearStart.setFullYear(startDate.getFullYear() - 1)
  const prevYearEnd = new Date(endDate)
  prevYearEnd.setFullYear(endDate.getFullYear() - 1)

  // Fetch previous year emissions for YoY comparison
  let prevYearQuery = supabase
    .from('metrics_data')
    .select('co2e_emissions, site_id, metric:metrics_catalog(code)')
    .eq('organization_id', organizationId)
    .gte('period_start', prevYearStart.toISOString().split('T')[0])
    .lte('period_end', prevYearEnd.toISOString().split('T')[0])

  if (options.siteId) {
    prevYearQuery = prevYearQuery.eq('site_id', options.siteId)
  }

  const { data: prevYearMetrics } = await prevYearQuery

  // Calculate previous year total emissions and scope breakdowns
  let prevYearEmissionsTonnes = 0
  let prevYearScope1 = 0
  let prevYearScope2 = 0
  let prevYearScope3 = 0

  // Track previous year emissions by site for per-site YoY
  const prevYearSiteMap = new Map<string, number>()

  prevYearMetrics?.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const emissions = (metric.co2e_emissions || 0) / 1000 // Convert to tonnes
    const siteId = metric.site_id

    if (metricCode.startsWith('scope1_')) {
      prevYearScope1 += emissions
      prevYearEmissionsTonnes += emissions
    } else if (metricCode.startsWith('scope2_')) {
      prevYearScope2 += emissions
      prevYearEmissionsTonnes += emissions
    } else if (metricCode.startsWith('scope3_')) { // Include ALL scope 3 emissions (including waste-related)
      prevYearScope3 += emissions
      prevYearEmissionsTonnes += emissions
    } else if (metricCode.startsWith('gri_305')) {
      prevYearEmissionsTonnes += emissions
    }

    // Track by site for per-site YoY
    if (siteId && (metricCode.startsWith('scope1_') || metricCode.startsWith('scope2_') || metricCode.startsWith('scope3_'))) {
      prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + emissions)
    }
  })

  // Build site breakdown with YoY comparisons
  const bySite: EmissionsBySite[] = Array.from(siteMap.entries())
    .map(([site_id, data]) => {
      const currentTotal = data.scope1 + data.scope2 + data.scope3
      const prevYearTotal = prevYearSiteMap.get(site_id) || 0
      const totalYoY = prevYearTotal > 0
        ? Math.round(((currentTotal - prevYearTotal) / prevYearTotal) * 10000) / 100
        : null

      return {
        site_id,
        site_name: data.site_name,
        scope1: Math.round(data.scope1 * 100) / 100,
        scope2: Math.round(data.scope2 * 100) / 100,
        scope3: Math.round(data.scope3 * 100) / 100,
        total: Math.round(currentTotal * 100) / 100,
        totalYoY,
      }
    })
    .sort((a, b) => b.total - a.total)

  // Calculate intensity metrics (GRI 305-4: Emissions Intensity)
  const intensity: IntensityMetrics = {
    perEmployee: null,
    perRevenueMillion: null,
    perFloorAreaM2: null,
    perCustomer: null,
    employeeCount: totalEmployees > 0 ? totalEmployees : null,
    revenue: orgData?.annual_revenue || null,
    floorArea: totalFloorArea > 0 ? totalFloorArea : null,
    customers: orgData?.annual_customers || null,
    perEmployeeYoY: null,
    perRevenueMillionYoY: null,
    perFloorAreaM2YoY: null,
    perCustomerYoY: null,
  }

  // Calculate previous year intensity metrics for comparison
  let prevPerEmployee: number | null = null
  let prevPerRevenueMillion: number | null = null
  let prevPerFloorAreaM2: number | null = null
  let prevPerCustomer: number | null = null

  if (prevYearEmissionsTonnes > 0) {
    if (totalEmployees > 0) {
      prevPerEmployee = Math.round((prevYearEmissionsTonnes / totalEmployees) * 100) / 100
    }
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      prevPerRevenueMillion = Math.round((prevYearEmissionsTonnes / revenueMillion) * 100) / 100
    }
    if (totalFloorArea > 0) {
      prevPerFloorAreaM2 = Math.round((prevYearEmissionsTonnes * 1000 / totalFloorArea) * 100) / 100
    }
    if (orgData?.annual_customers && orgData.annual_customers > 0) {
      prevPerCustomer = Math.round((prevYearEmissionsTonnes * 1000 / orgData.annual_customers) * 100) / 100
    }
  }

  if (totalEmissions > 0) {
    // Per employee (tonnes CO2e / employee)
    if (totalEmployees > 0) {
      intensity.perEmployee = Math.round((totalEmissions / totalEmployees) * 100) / 100
      // Calculate YoY change
      if (prevPerEmployee !== null && prevPerEmployee > 0) {
        intensity.perEmployeeYoY = Math.round(((intensity.perEmployee - prevPerEmployee) / prevPerEmployee) * 10000) / 100
      }
    }

    // Per revenue million (tonnes CO2e / $M revenue)
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      intensity.perRevenueMillion = Math.round((totalEmissions / revenueMillion) * 100) / 100
      // Calculate YoY change
      if (prevPerRevenueMillion !== null && prevPerRevenueMillion > 0) {
        intensity.perRevenueMillionYoY = Math.round(((intensity.perRevenueMillion - prevPerRevenueMillion) / prevPerRevenueMillion) * 10000) / 100
      }
    }

    // Per floor area (kg CO2e / m²)
    if (totalFloorArea > 0) {
      intensity.perFloorAreaM2 = Math.round((totalEmissions * 1000 / totalFloorArea) * 100) / 100
      // Calculate YoY change
      if (prevPerFloorAreaM2 !== null && prevPerFloorAreaM2 > 0) {
        intensity.perFloorAreaM2YoY = Math.round(((intensity.perFloorAreaM2 - prevPerFloorAreaM2) / prevPerFloorAreaM2) * 10000) / 100
      }
    }

    // Per customer (kg CO2e / customer)
    if (orgData?.annual_customers && orgData.annual_customers > 0) {
      intensity.perCustomer = Math.round((totalEmissions * 1000 / orgData.annual_customers) * 100) / 100
      // Calculate YoY change
      if (prevPerCustomer !== null && prevPerCustomer > 0) {
        intensity.perCustomerYoY = Math.round(((intensity.perCustomer - prevPerCustomer) / prevPerCustomer) * 10000) / 100
      }
    }
  }

  // Calculate YoY percentages for main emissions metrics
  const totalEmissionsYoY = prevYearEmissionsTonnes > 0
    ? Math.round(((totalEmissions - prevYearEmissionsTonnes) / prevYearEmissionsTonnes) * 10000) / 100
    : null
  const scope1YoY = prevYearScope1 > 0
    ? Math.round(((scope1Total - prevYearScope1) / prevYearScope1) * 10000) / 100
    : null
  const scope2YoY = prevYearScope2 > 0
    ? Math.round(((scope2Total - prevYearScope2) / prevYearScope2) * 10000) / 100
    : null
  const scope3YoY = prevYearScope3 > 0
    ? Math.round(((scope3Total - prevYearScope3) / prevYearScope3) * 10000) / 100
    : null

  return {
    totalEmissions: Math.round(totalEmissions * 100) / 100,
    scope1Total: Math.round(scope1Total * 100) / 100,
    scope2Total: Math.round(scope2Total * 100) / 100,
    scope3Total: Math.round(scope3Total * 100) / 100,
    monthlyTrend,
    byScope,
    bySite,
    bySource,
    year: new Date(options.startDate).getFullYear(),
    intensity,
    totalEmissionsYoY,
    scope1YoY,
    scope2YoY,
    scope3YoY,
  }
}

/**
 * GRI 302 Energy Dashboard Data Types
 */
export interface EnergyMonthlyTrend {
  month: string // 'YYYY-MM'
  renewable: number
  nonRenewable: number
  total: number
}

export interface EnergyByType {
  type: string
  value: number
  percentage: number
  renewable: boolean
}

export interface EnergyBySite {
  site_id: string
  site_name: string
  renewable: number
  nonRenewable: number
  total: number
  // YoY percentage change for total energy
  totalYoY: number | null
}

export interface EnergyBySource {
  source: string
  value: number
  percentage: number
  renewable: boolean
}

export interface EnergyDashboardDataGRI {
  totalEnergy: number
  renewableTotal: number
  nonRenewableTotal: number
  renewablePercentage: number
  monthlyTrend: EnergyMonthlyTrend[]
  byType: EnergyByType[]
  bySite: EnergyBySite[]
  bySource: EnergyBySource[]
  year: number
  // YoY comparisons
  totalEnergyYoY: number | null
  renewableTotalYoY: number | null
  nonRenewableTotalYoY: number | null
  renewablePercentageYoY: number | null // Percentage point change, not percentage change
}

/**
 * Get GRI 302 Energy Dashboard Data
 */
export async function getEnergyDashboardDataGRI(
  organizationId: string,
  options: {
    startDate: string
    endDate: string
    siteId?: string
  }
): Promise<EnergyDashboardDataGRI> {
  const supabase = await createClient()

  // Build query for GRI 302 metrics
  let query = supabase
    .from('metrics_data')
    .select(
      `
      id,
      value,
      unit,
      co2e_emissions,
      period_start,
      period_end,
      metadata,
      site:sites(id, name),
      metric:metrics_catalog(
        id,
        code,
        name,
        category,
        is_renewable
      )
    `
    )
    .eq('organization_id', organizationId)
    .gte('period_start', options.startDate)
    .lte('period_end', options.endDate)

  if (options.siteId) {
    query = query.eq('site_id', options.siteId)
  }

  const { data: metricsData } = await query

  if (!metricsData || metricsData.length === 0) {
    return {
      totalEnergy: 0,
      renewableTotal: 0,
      nonRenewableTotal: 0,
      renewablePercentage: 0,
      monthlyTrend: [],
      byType: [],
      bySite: [],
      bySource: [],
      year: new Date(options.startDate).getFullYear(),
      totalEnergyYoY: null,
      renewableTotalYoY: null,
      nonRenewableTotalYoY: null,
      renewablePercentageYoY: null,
    }
  }

  // Find the actual last date with current year data for fair YoY comparison
  const lastDataDate = metricsData && metricsData.length > 0
    ? metricsData.reduce((latest: string, metric: any) => {
        const periodEnd = metric.period_end || ''
        return periodEnd > latest ? periodEnd : latest
      }, '1970-01-01')
    : options.endDate

  // Calculate previous year date range for YoY comparison (same actual period)
  const startDate = new Date(options.startDate)
  const endDate = new Date(lastDataDate)
  const prevYearStart = new Date(startDate)
  prevYearStart.setFullYear(startDate.getFullYear() - 1)
  const prevYearEnd = new Date(endDate)
  prevYearEnd.setFullYear(endDate.getFullYear() - 1)

  // Fetch previous year energy data for YoY comparison
  let prevYearQuery = supabase
    .from('metrics_data')
    .select('value, site_id, metric:metrics_catalog(code, is_renewable), metadata')
    .eq('organization_id', organizationId)
    .gte('period_start', prevYearStart.toISOString().split('T')[0])
    .lte('period_end', prevYearEnd.toISOString().split('T')[0])

  if (options.siteId) {
    prevYearQuery = prevYearQuery.eq('site_id', options.siteId)
  }

  const { data: prevYearMetrics } = await prevYearQuery

  // Calculate previous year totals
  let prevYearTotalEnergy = 0
  let prevYearRenewableTotal = 0
  let prevYearNonRenewableTotal = 0
  const prevYearSiteMap = new Map<string, number>()

  prevYearMetrics?.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    // Filter for energy metrics only
    if (
      metricCode.startsWith('gri_302') ||
      metricCode.startsWith('scope2_') ||
      metricCode.includes('energy') ||
      metricCode.includes('electricity')
    ) {
      const value = metric.value || 0
      const siteId = metric.site_id
      const isRenewable = metric.metric?.is_renewable === true || metric.metadata?.renewable === true || metricCode.includes('renewable')

      prevYearTotalEnergy += value
      if (isRenewable) {
        prevYearRenewableTotal += value
      } else {
        prevYearNonRenewableTotal += value
      }

      // Track by site for per-site YoY
      if (siteId) {
        prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + value)
      }
    }
  })

  const prevYearRenewablePercentage = prevYearTotalEnergy > 0 ? (prevYearRenewableTotal / prevYearTotalEnergy) * 100 : 0

  // Filter GRI 302 energy metrics (includes gri_302_* and scope2_*)
  const energyData = metricsData.filter((m: any) => {
    const code = m.metric?.code || ''
    return (
      code.startsWith('gri_302') ||
      code.startsWith('scope2_') ||
      code.includes('energy') ||
      code.includes('electricity')
    )
  })

  // Calculate totals
  let renewableTotal = 0
  let nonRenewableTotal = 0

  // Monthly trend map
  const monthlyTrendMap = new Map<string, { renewable: number; nonRenewable: number }>()

  // Site breakdown map
  const siteMap = new Map<string, { site_name: string; renewable: number; nonRenewable: number }>()

  // Type breakdown map
  const typeMap = new Map<string, { value: number; renewable: boolean }>()

  // Source breakdown map
  const sourceMap = new Map<string, { value: number; renewable: boolean }>()

  energyData.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const value = metric.value || 0
    const month = metric.period_start?.substring(0, 7) // 'YYYY-MM'
    const siteName = metric.site?.name || 'Unknown Site'
    const siteId = metric.site?.id || 'unknown'

    // Determine if renewable (check metric catalog first, then metadata, then code)
    const isRenewable = metric.metric?.is_renewable === true || metric.metadata?.renewable === true || metricCode.includes('renewable')

    if (isRenewable) {
      renewableTotal += value
    } else {
      nonRenewableTotal += value
    }

    // Monthly trend
    if (month) {
      if (!monthlyTrendMap.has(month)) {
        monthlyTrendMap.set(month, { renewable: 0, nonRenewable: 0 })
      }
      const monthData = monthlyTrendMap.get(month)!
      if (isRenewable) monthData.renewable += value
      else monthData.nonRenewable += value
    }

    // Site breakdown
    if (!siteMap.has(siteId)) {
      siteMap.set(siteId, { site_name: siteName, renewable: 0, nonRenewable: 0 })
    }
    const siteData = siteMap.get(siteId)!
    if (isRenewable) siteData.renewable += value
    else siteData.nonRenewable += value

    // Type breakdown
    const energyType = metric.metadata?.energy_type || 'Other'
    if (!typeMap.has(energyType)) {
      typeMap.set(energyType, { value: 0, renewable: isRenewable })
    }
    typeMap.get(energyType)!.value += value

    // Source breakdown
    const source = metric.metadata?.source || 'Other'
    if (!sourceMap.has(source)) {
      sourceMap.set(source, { value: 0, renewable: isRenewable })
    }
    sourceMap.get(source)!.value += value
  })

  const totalEnergy = renewableTotal + nonRenewableTotal
  const renewablePercentage = totalEnergy > 0 ? (renewableTotal / totalEnergy) * 100 : 0

  // Build monthly trend array
  const monthlyTrend: EnergyMonthlyTrend[] = Array.from(monthlyTrendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      renewable: Math.round(data.renewable),
      nonRenewable: Math.round(data.nonRenewable),
      total: Math.round(data.renewable + data.nonRenewable),
    }))

  // Build type breakdown
  const byType: EnergyByType[] = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      value: Math.round(data.value),
      percentage: totalEnergy > 0 ? Math.round((data.value / totalEnergy) * 100) : 0,
      renewable: data.renewable,
    }))
    .sort((a, b) => b.value - a.value)

  // Build site breakdown with YoY comparisons
  const bySite: EnergyBySite[] = Array.from(siteMap.entries())
    .map(([site_id, data]) => {
      const currentTotal = data.renewable + data.nonRenewable
      const prevYearTotal = prevYearSiteMap.get(site_id) || 0
      const totalYoY = prevYearTotal > 0
        ? Math.round(((currentTotal - prevYearTotal) / prevYearTotal) * 10000) / 100
        : null

      return {
        site_id,
        site_name: data.site_name,
        renewable: Math.round(data.renewable),
        nonRenewable: Math.round(data.nonRenewable),
        total: Math.round(currentTotal),
        totalYoY,
      }
    })
    .sort((a, b) => b.total - a.total)

  // Build source breakdown
  const bySource: EnergyBySource[] = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      value: Math.round(data.value),
      percentage: totalEnergy > 0 ? Math.round((data.value / totalEnergy) * 100) : 0,
      renewable: data.renewable,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10 sources

  // Calculate YoY percentages
  const totalEnergyYoY = prevYearTotalEnergy > 0
    ? Math.round(((totalEnergy - prevYearTotalEnergy) / prevYearTotalEnergy) * 10000) / 100
    : null
  const renewableTotalYoY = prevYearRenewableTotal > 0
    ? Math.round(((renewableTotal - prevYearRenewableTotal) / prevYearRenewableTotal) * 10000) / 100
    : null
  const nonRenewableTotalYoY = prevYearNonRenewableTotal > 0
    ? Math.round(((nonRenewableTotal - prevYearNonRenewableTotal) / prevYearNonRenewableTotal) * 10000) / 100
    : null
  // For renewable percentage YoY, we use percentage point change (not percentage change)
  const renewablePercentageYoY = prevYearRenewablePercentage > 0
    ? Math.round((renewablePercentage - prevYearRenewablePercentage) * 10) / 10
    : null

  return {
    totalEnergy: Math.round(totalEnergy),
    renewableTotal: Math.round(renewableTotal),
    nonRenewableTotal: Math.round(nonRenewableTotal),
    renewablePercentage: Math.round(renewablePercentage * 10) / 10,
    monthlyTrend,
    byType,
    bySite,
    bySource,
    year: new Date(options.startDate).getFullYear(),
    totalEnergyYoY,
    renewableTotalYoY,
    nonRenewableTotalYoY,
    renewablePercentageYoY,
  }
}
