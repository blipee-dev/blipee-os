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
  // Efficiency metrics
  efficiency: number | null
  efficiencyUnit: 'kWh/employee' | 'kWh/m²' | null
  employees: number | null
  area: number | null
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
  intensity: IntensityMetrics
  // YoY comparisons
  totalEnergyYoY: number | null
  renewableTotalYoY: number | null
  nonRenewableTotalYoY: number | null
  renewablePercentageYoY: number | null // Percentage point change, not percentage change
}

/**
 * Convert technical metric codes to user-friendly names
 */
function getEnergySourceFriendlyName(metricCode: string): string {
  const nameMap: Record<string, string> = {
    'scope2_electricity_grid': 'Grid Electricity',
    'scope2_purchased_heating': 'Purchased Heating',
    'scope2_purchased_cooling': 'Purchased Cooling',
    'scope2_ev_charging': 'EV Charging',
    'gri_302_1_electricity_consumption': 'Electricity Consumption',
    'gri_305_2_purchased_electricity': 'Purchased Electricity',
  }

  return nameMap[metricCode] || metricCode
}

/**
 * Check if a metric code represents purchased electricity from the grid
 * (excludes self-generated renewable energy like solar, wind)
 */
function isPurchasedElectricity(metricCode: string): boolean {
  const purchasedElectricityCodes = [
    'scope2_electricity_grid',
    'gri_302_1_electricity_consumption',
    'gri_305_2_purchased_electricity',
  ]

  // Check if it's explicitly in the purchased list
  if (purchasedElectricityCodes.includes(metricCode)) {
    return true
  }

  // Scope 2 purchased energy (electricity, heating, cooling) from the grid
  // In Portugal, purchased heating and cooling typically come from electricity grid
  if (metricCode.startsWith('scope2_purchased_')) {
    return true
  }

  // Or if it contains "electricity" but NOT self-generated types
  if (metricCode.includes('electricity')) {
    const selfGeneratedKeywords = ['solar', 'wind', 'renewable', 'self_generated']
    return !selfGeneratedKeywords.some(keyword => metricCode.includes(keyword))
  }

  return false
}

/**
 * Get Portugal grid mix reference data for a given date
 * Returns renewable percentage from the reference table
 */
async function getPortugalGridMixReference(date: string): Promise<number | null> {
  const supabase = await createClient()

  // Parse date (YYYY-MM-DD or YYYY-MM)
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1 // JavaScript months are 0-indexed

  // Try to find monthly data first
  const { data: monthlyData } = await supabase
    .from('portugal_grid_mix_reference')
    .select('renewable_percentage')
    .eq('year', year)
    .eq('month', month)
    .is('quarter', null)
    .maybeSingle()

  if (monthlyData) {
    return monthlyData.renewable_percentage
  }

  // Try quarterly data
  const quarter = Math.ceil(month / 3)
  const { data: quarterlyData } = await supabase
    .from('portugal_grid_mix_reference')
    .select('renewable_percentage')
    .eq('year', year)
    .eq('quarter', quarter)
    .is('month', null)
    .maybeSingle()

  if (quarterlyData) {
    return quarterlyData.renewable_percentage
  }

  // Try annual data
  const { data: annualData } = await supabase
    .from('portugal_grid_mix_reference')
    .select('renewable_percentage')
    .eq('year', year)
    .is('quarter', null)
    .is('month', null)
    .maybeSingle()

  if (annualData) {
    return annualData.renewable_percentage
  }

  return null
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
      intensity: {
        perEmployee: null,
        perRevenueMillion: null,
        perFloorAreaM2: null,
        perCustomer: null,
        employeeCount: null,
        revenue: null,
        floorArea: null,
        customers: null,
        perEmployeeYoY: null,
        perRevenueMillionYoY: null,
        perFloorAreaM2YoY: null,
        perCustomerYoY: null,
      },
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

  // Cache for previous year grid mix reference data
  const prevYearGridMixCache = new Map<string, number | null>()

  // Process previous year metrics with grid mix logic
  for (const metric of (prevYearMetrics || [])) {
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

      // Apply same grid mix logic as current year
      const gridMix = metric.metadata?.grid_mix
      let renewableValue = 0
      let nonRenewableValue = 0

      if (gridMix && typeof gridMix.renewable_kwh === 'number' && typeof gridMix.non_renewable_kwh === 'number') {
        // Use grid mix breakdown for electricity
        renewableValue = gridMix.renewable_kwh
        nonRenewableValue = gridMix.non_renewable_kwh
      } else if (isPurchasedElectricity(metricCode) && metric.period_start) {
        // For purchased grid electricity, use reference table
        const cacheKey = metric.period_start.substring(0, 7) // 'YYYY-MM'

        // Check cache first
        let renewablePercentage = prevYearGridMixCache.get(cacheKey)

        if (renewablePercentage === undefined) {
          // Not in cache, fetch from database
          renewablePercentage = await getPortugalGridMixReference(metric.period_start)
          prevYearGridMixCache.set(cacheKey, renewablePercentage)
        }

        if (renewablePercentage !== null) {
          // Calculate renewable and non-renewable portions
          renewableValue = (value * renewablePercentage) / 100
          nonRenewableValue = (value * (100 - renewablePercentage)) / 100
        } else {
          // No reference data available, treat as non-renewable
          renewableValue = 0
          nonRenewableValue = value
        }
      } else {
        // Fallback to binary renewable check for non-grid sources
        const isRenewable = metric.metric?.is_renewable === true || metric.metadata?.renewable === true || metricCode.includes('renewable')
        if (isRenewable) {
          renewableValue = value
          nonRenewableValue = 0
        } else {
          renewableValue = 0
          nonRenewableValue = value
        }
      }

      prevYearTotalEnergy += value
      prevYearRenewableTotal += renewableValue
      prevYearNonRenewableTotal += nonRenewableValue

      // Track by site for per-site YoY
      if (siteId) {
        prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + value)
      }
    }
  }

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

  // Source breakdown map (now tracks renewable and non-renewable separately)
  const sourceMap = new Map<string, { renewable: number; nonRenewable: number }>()

  // Cache for grid mix reference data to avoid duplicate queries
  const gridMixCache = new Map<string, number | null>()

  for (const metric of energyData) {
    const metricCode = metric.metric?.code || ''
    const value = metric.value || 0
    const month = metric.period_start?.substring(0, 7) // 'YYYY-MM'
    const siteName = metric.site?.name || 'Unknown Site'
    const siteId = metric.site?.id || 'unknown'

    // Check if this metric has grid mix data (for electricity from the grid)
    const gridMix = metric.metadata?.grid_mix
    let renewableValue = 0
    let nonRenewableValue = 0
    let isRenewable = false

    if (gridMix && typeof gridMix.renewable_kwh === 'number' && typeof gridMix.non_renewable_kwh === 'number') {
      // Use grid mix breakdown for electricity
      renewableValue = gridMix.renewable_kwh
      nonRenewableValue = gridMix.non_renewable_kwh
      isRenewable = renewableValue > nonRenewableValue // For type/source categorization
    } else if (isPurchasedElectricity(metricCode) && metric.period_start) {
      // For purchased grid electricity without grid_mix metadata, try reference table
      // Applies to: scope2_electricity_grid, gri_302_1_electricity_consumption, gri_305_2_purchased_electricity
      const cacheKey = metric.period_start.substring(0, 7) // 'YYYY-MM'

      // Check cache first to avoid duplicate database queries
      let renewablePercentage = gridMixCache.get(cacheKey)

      if (renewablePercentage === undefined) {
        // Not in cache, fetch from database
        renewablePercentage = await getPortugalGridMixReference(metric.period_start)
        gridMixCache.set(cacheKey, renewablePercentage)
      }

      if (renewablePercentage !== null) {
        // Calculate renewable and non-renewable portions from reference data
        renewableValue = (value * renewablePercentage) / 100
        nonRenewableValue = (value * (100 - renewablePercentage)) / 100
        isRenewable = renewablePercentage > 50
      } else {
        // No reference data available, treat as non-renewable
        renewableValue = 0
        nonRenewableValue = value
        isRenewable = false
      }
    } else {
      // Fallback to binary renewable check for non-grid sources (solar, wind, gas, etc.)
      isRenewable = metric.metric?.is_renewable === true || metric.metadata?.renewable === true || metricCode.includes('renewable')
      if (isRenewable) {
        renewableValue = value
        nonRenewableValue = 0
      } else {
        renewableValue = 0
        nonRenewableValue = value
      }
    }

    renewableTotal += renewableValue
    nonRenewableTotal += nonRenewableValue

    // Monthly trend
    if (month) {
      if (!monthlyTrendMap.has(month)) {
        monthlyTrendMap.set(month, { renewable: 0, nonRenewable: 0 })
      }
      const monthData = monthlyTrendMap.get(month)!
      monthData.renewable += renewableValue
      monthData.nonRenewable += nonRenewableValue
    }

    // Site breakdown
    if (!siteMap.has(siteId)) {
      siteMap.set(siteId, { site_name: siteName, renewable: 0, nonRenewable: 0 })
    }
    const siteData = siteMap.get(siteId)!
    siteData.renewable += renewableValue
    siteData.nonRenewable += nonRenewableValue

    // Type breakdown
    const energyType = metric.metadata?.energy_type || 'Other'
    if (!typeMap.has(energyType)) {
      typeMap.set(energyType, { value: 0, renewable: isRenewable })
    }
    typeMap.get(energyType)!.value += value

    // Source breakdown (track renewable and non-renewable separately)
    const source = metric.metadata?.source || metricCode || 'Other'
    if (!sourceMap.has(source)) {
      sourceMap.set(source, { renewable: 0, nonRenewable: 0 })
    }
    const sourceData = sourceMap.get(source)!
    sourceData.renewable += renewableValue
    sourceData.nonRenewable += nonRenewableValue
  }

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

  // Fetch site data for efficiency calculations
  let sitesEfficiencyQuery = supabase
    .from('sites')
    .select('id, total_employees, total_area_sqm')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (options.siteId) {
    sitesEfficiencyQuery = sitesEfficiencyQuery.eq('id', options.siteId)
  }

  const { data: sitesEfficiencyData } = await sitesEfficiencyQuery

  // Create a map of site data for efficient lookup
  const siteDataMap = new Map(
    sitesEfficiencyData?.map(site => [
      site.id,
      {
        employees: site.total_employees || 0,
        area: site.total_area_sqm || 0
      }
    ]) || []
  )

  // Build site breakdown with YoY comparisons and efficiency
  const bySite: EnergyBySite[] = Array.from(siteMap.entries())
    .map(([site_id, data]) => {
      const currentTotal = data.renewable + data.nonRenewable
      const prevYearTotal = prevYearSiteMap.get(site_id) || 0
      const totalYoY = prevYearTotal > 0
        ? Math.round(((currentTotal - prevYearTotal) / prevYearTotal) * 10000) / 100
        : null

      // Calculate efficiency (area-based only for performance comparison)
      const siteData = siteDataMap.get(site_id)
      const employees = siteData?.employees || null
      const area = siteData?.area || null
      let efficiency: number | null = null
      let efficiencyUnit: 'kWh/employee' | 'kWh/m²' | null = null

      if (currentTotal > 0 && area && area > 0) {
        efficiency = Math.round((currentTotal / area) * 100) / 100
        efficiencyUnit = 'kWh/m²'
      }

      return {
        site_id,
        site_name: data.site_name,
        renewable: Math.round(data.renewable),
        nonRenewable: Math.round(data.nonRenewable),
        total: Math.round(currentTotal),
        totalYoY,
        efficiency,
        efficiencyUnit,
        employees,
        area,
      }
    })
    .sort((a, b) => b.total - a.total)

  // Build source breakdown (total per source, with renewable percentage)
  const bySource: EnergyBySource[] = Array.from(sourceMap.entries())
    .map(([source, data]) => {
      const friendlyName = getEnergySourceFriendlyName(source)
      const totalValue = data.renewable + data.nonRenewable
      const renewablePercentageForSource = totalValue > 0 ? (data.renewable / totalValue) * 100 : 0

      return {
        source: friendlyName,
        value: Math.round(totalValue),
        percentage: totalEnergy > 0 ? Math.round((totalValue / totalEnergy) * 100) : 0,
        renewable: renewablePercentageForSource > 50, // Majority renewable?
      }
    })
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

  // Calculate intensity metrics (kWh per employee, revenue, floor area, customer)
  const intensity: IntensityMetrics = {
    perEmployee: null,
    perRevenueMillion: null,
    perFloorAreaM2: null,
    perCustomer: null,
    employeeCount: null,
    revenue: null,
    floorArea: null,
    customers: null,
    perEmployeeYoY: null,
    perRevenueMillionYoY: null,
    perFloorAreaM2YoY: null,
    perCustomerYoY: null,
  }

  // Fetch organization data for business metrics
  const { data: orgData } = await supabase
    .from('organizations')
    .select('annual_revenue, annual_customers')
    .eq('id', organizationId)
    .maybeSingle()

  // Calculate totals from the siteDataMap we already fetched
  const totalEmployees = Array.from(siteDataMap.values()).reduce((sum, site) => sum + site.employees, 0)
  const totalFloorArea = Array.from(siteDataMap.values()).reduce((sum, site) => sum + site.area, 0)

  intensity.employeeCount = totalEmployees
  intensity.floorArea = totalFloorArea
  intensity.revenue = orgData?.annual_revenue || null
  intensity.customers = orgData?.annual_customers || null

  // Fetch previous year data for YoY intensity comparison
  let prevYearIntensityQuery = supabase
    .from('metrics_data')
    .select('value, metric:metrics_catalog(code, is_renewable), metadata')
    .eq('organization_id', organizationId)
    .gte('period_start', prevYearStart.toISOString().split('T')[0])
    .lte('period_end', prevYearEnd.toISOString().split('T')[0])

  if (options.siteId) {
    prevYearIntensityQuery = prevYearIntensityQuery.eq('site_id', options.siteId)
  }

  const { data: prevYearIntensityMetrics } = await prevYearIntensityQuery

  // Calculate previous year intensity metrics
  let prevPerEmployee: number | null = null
  let prevPerRevenueMillion: number | null = null
  let prevPerFloorAreaM2: number | null = null
  let prevPerCustomer: number | null = null

  if (prevYearTotalEnergy > 0) {
    if (totalEmployees > 0) {
      prevPerEmployee = prevYearTotalEnergy / totalEmployees
    }
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      prevPerRevenueMillion = prevYearTotalEnergy / revenueMillion
    }
    if (totalFloorArea > 0) {
      prevPerFloorAreaM2 = prevYearTotalEnergy / totalFloorArea
    }
    if (orgData?.annual_customers && orgData.annual_customers > 0) {
      prevPerCustomer = prevYearTotalEnergy / orgData.annual_customers
    }
  }

  // Calculate current year intensity metrics
  if (totalEnergy > 0) {
    // Per employee (kWh / employee)
    if (totalEmployees > 0) {
      intensity.perEmployee = Math.round((totalEnergy / totalEmployees) * 100) / 100
      // Calculate YoY change
      if (prevPerEmployee !== null && prevPerEmployee > 0) {
        intensity.perEmployeeYoY = Math.round(((intensity.perEmployee - prevPerEmployee) / prevPerEmployee) * 10000) / 100
      }
    }

    // Per revenue million (kWh / $M revenue)
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      intensity.perRevenueMillion = Math.round((totalEnergy / revenueMillion) * 100) / 100
      // Calculate YoY change
      if (prevPerRevenueMillion !== null && prevPerRevenueMillion > 0) {
        intensity.perRevenueMillionYoY = Math.round(((intensity.perRevenueMillion - prevPerRevenueMillion) / prevPerRevenueMillion) * 10000) / 100
      }
    }

    // Per floor area (kWh / m²)
    if (totalFloorArea > 0) {
      intensity.perFloorAreaM2 = Math.round((totalEnergy / totalFloorArea) * 100) / 100
      // Calculate YoY change
      if (prevPerFloorAreaM2 !== null && prevPerFloorAreaM2 > 0) {
        intensity.perFloorAreaM2YoY = Math.round(((intensity.perFloorAreaM2 - prevPerFloorAreaM2) / prevPerFloorAreaM2) * 10000) / 100
      }
    }

    // Per customer (kWh / customer)
    if (orgData?.annual_customers && orgData.annual_customers > 0) {
      intensity.perCustomer = Math.round((totalEnergy / orgData.annual_customers) * 100) / 100
      // Calculate YoY change
      if (prevPerCustomer !== null && prevPerCustomer > 0) {
        intensity.perCustomerYoY = Math.round(((intensity.perCustomer - prevPerCustomer) / prevPerCustomer) * 10000) / 100
      }
    }
  }

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
    intensity,
    totalEnergyYoY,
    renewableTotalYoY,
    nonRenewableTotalYoY,
    renewablePercentageYoY,
  }
}

/**
 * GRI 303 Water Dashboard Data Types
 */
export interface WaterMonthlyTrend {
  month: string // 'YYYY-MM'
  withdrawal: number
  consumption: number
  discharge: number
}

export interface WaterBySource {
  source: string
  value: number
  percentage: number
}

export interface WaterBySite {
  site_id: string
  site_name: string
  withdrawal: number
  consumption: number
  discharge: number
  recycled: number
  // YoY percentage changes
  withdrawalYoY: number | null
}

export interface WaterIntensityMetrics {
  perEmployee: number | null
  perRevenueMillion: number | null
  perFloorAreaM2: number | null
  employeeCount: number | null
  revenue: number | null
  floorArea: number | null
  // YoY percentage changes
  perEmployeeYoY: number | null
  perRevenueMillionYoY: number | null
  perFloorAreaM2YoY: number | null
}

export interface WaterDashboardData {
  totalWithdrawal: number
  totalConsumption: number
  totalDischarge: number
  totalRecycled: number
  monthlyTrend: WaterMonthlyTrend[]
  bySite: WaterBySite[]
  bySource: WaterBySource[]
  year: number
  intensity: WaterIntensityMetrics
  // YoY percentage changes
  totalWithdrawalYoY: number | null
  totalConsumptionYoY: number | null
  totalDischargeYoY: number | null
  totalRecycledYoY: number | null
}

/**
 * Get GRI 303 Water Dashboard Data
 */
export async function getWaterDashboardData(
  organizationId: string,
  options: {
    startDate: string
    endDate: string
    siteId?: string
  }
): Promise<WaterDashboardData> {
  const supabase = await createClient()

  // Build query for GRI 303 metrics
  let query = supabase
    .from('metrics_data')
    .select(
      `
      id,
      value,
      unit,
      period_start,
      period_end,
      metadata,
      site:sites(id, name),
      metric:metrics_catalog(
        id,
        code,
        name,
        category
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
      totalWithdrawal: 0,
      totalConsumption: 0,
      totalDischarge: 0,
      totalRecycled: 0,
      monthlyTrend: [],
      bySite: [],
      bySource: [],
      year: new Date(options.startDate).getFullYear(),
      intensity: {
        perEmployee: null,
        perRevenueMillion: null,
        perFloorAreaM2: null,
        employeeCount: null,
        revenue: null,
        floorArea: null,
        perEmployeeYoY: null,
        perRevenueMillionYoY: null,
        perFloorAreaM2YoY: null,
      },
      totalWithdrawalYoY: null,
      totalConsumptionYoY: null,
      totalDischargeYoY: null,
      totalRecycledYoY: null,
    }
  }

  // Filter GRI 303 water metrics
  const waterData = metricsData.filter((m: any) => {
    const code = m.metric?.code || ''
    return code.startsWith('gri_303') || code.includes('water')
  })

  // Calculate totals
  let totalWithdrawal = 0
  let totalConsumption = 0
  let totalDischarge = 0
  let totalRecycled = 0

  // Monthly trend map
  const monthlyTrendMap = new Map<string, { withdrawal: number; consumption: number; discharge: number }>()

  // Site breakdown map
  const siteMap = new Map<
    string,
    { site_name: string; withdrawal: number; consumption: number; discharge: number; recycled: number }
  >()

  // Source breakdown map
  const sourceMap = new Map<string, number>()

  waterData.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const value = metric.value || 0
    const month = metric.period_start?.substring(0, 7) // 'YYYY-MM'
    const siteName = metric.site?.name || 'Unknown Site'
    const siteId = metric.site?.id || 'unknown'

    // Determine water type based on GRI 303 sub-categories
    // IMPORTANT: Only count _total metrics to avoid double-counting subcategories
    if (metricCode.includes('gri_303_3_withdrawal_total') ||
        (metricCode.includes('gri_303_3') && !metricCode.includes('_') && metricCode.length <= 9)) {
      totalWithdrawal += value
      if (month) {
        if (!monthlyTrendMap.has(month)) {
          monthlyTrendMap.set(month, { withdrawal: 0, consumption: 0, discharge: 0 })
        }
        monthlyTrendMap.get(month)!.withdrawal += value
      }
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { site_name: siteName, withdrawal: 0, consumption: 0, discharge: 0, recycled: 0 })
      }
      siteMap.get(siteId)!.withdrawal += value

      // Source breakdown - only count withdrawal
      const source = metric.metadata?.water_source || 'Other'
      sourceMap.set(source, (sourceMap.get(source) || 0) + value)
    } else if (metricCode.includes('gri_303_5_consumption_total') ||
               (metricCode.includes('gri_303_5') && !metricCode.includes('_') && metricCode.length <= 9)) {
      totalConsumption += value
      if (month) {
        if (!monthlyTrendMap.has(month)) {
          monthlyTrendMap.set(month, { withdrawal: 0, consumption: 0, discharge: 0 })
        }
        monthlyTrendMap.get(month)!.consumption += value
      }
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { site_name: siteName, withdrawal: 0, consumption: 0, discharge: 0, recycled: 0 })
      }
      siteMap.get(siteId)!.consumption += value
    } else if (metricCode.includes('gri_303_4_discharge_total') ||
               (metricCode.includes('gri_303_4') && !metricCode.includes('_') && metricCode.length <= 9)) {
      totalDischarge += value
      if (month) {
        if (!monthlyTrendMap.has(month)) {
          monthlyTrendMap.set(month, { withdrawal: 0, consumption: 0, discharge: 0 })
        }
        monthlyTrendMap.get(month)!.discharge += value
      }
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { site_name: siteName, withdrawal: 0, consumption: 0, discharge: 0, recycled: 0 })
      }
      siteMap.get(siteId)!.discharge += value
    } else if (metricCode === 'water_recycled_grey_water' ||
               (metricCode.includes('recycled') && !metricCode.includes('scope3') && !metricCode.includes('toilet'))) {
      // IMPORTANT: Only count main recycled water metric, not subcategories like scope3_water_recycled_toilet
      totalRecycled += value
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { site_name: siteName, withdrawal: 0, consumption: 0, discharge: 0, recycled: 0 })
      }
      siteMap.get(siteId)!.recycled += value
    }
  })

  // Build monthly trend array
  const monthlyTrend: WaterMonthlyTrend[] = Array.from(monthlyTrendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      withdrawal: Math.round(data.withdrawal),
      consumption: Math.round(data.consumption),
      discharge: Math.round(data.discharge),
    }))

  // Build source breakdown
  const bySource: WaterBySource[] = Array.from(sourceMap.entries())
    .map(([source, value]) => ({
      source,
      value: Math.round(value),
      percentage: totalWithdrawal > 0 ? Math.round((value / totalWithdrawal) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Fetch organization revenue
  const { data: orgData } = await supabase
    .from('organizations')
    .select('annual_revenue')
    .eq('id', organizationId)
    .single()

  // Fetch site data for employee count and floor area
  let sitesQuery = supabase
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (options.siteId) {
    sitesQuery = sitesQuery.eq('id', options.siteId)
  }

  const { data: sitesData } = await sitesQuery

  const totalEmployees = sitesData?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0
  const totalFloorArea = sitesData?.reduce((sum, site) => sum + (site.total_area_sqm || 0), 0) || 0

  // Calculate previous year for YoY
  const startDate = new Date(options.startDate)
  const endDate = new Date(options.endDate)
  const prevYearStart = new Date(startDate)
  prevYearStart.setFullYear(startDate.getFullYear() - 1)
  const prevYearEnd = new Date(endDate)
  prevYearEnd.setFullYear(endDate.getFullYear() - 1)

  let prevYearQuery = supabase
    .from('metrics_data')
    .select('value, site_id, metric:metrics_catalog(code)')
    .eq('organization_id', organizationId)
    .gte('period_start', prevYearStart.toISOString().split('T')[0])
    .lte('period_start', prevYearEnd.toISOString().split('T')[0])

  if (options.siteId) {
    prevYearQuery = prevYearQuery.eq('site_id', options.siteId)
  }

  const { data: prevYearMetrics } = await prevYearQuery

  let prevYearWithdrawal = 0
  let prevYearConsumption = 0
  let prevYearDischarge = 0
  let prevYearRecycled = 0
  const prevYearSiteMap = new Map<string, number>()

  prevYearMetrics?.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const value = metric.value || 0
    const siteId = metric.site_id

    // IMPORTANT: Only count _total metrics to avoid double-counting subcategories (same as main calculation)
    if (metricCode.includes('gri_303_3_withdrawal_total') ||
        (metricCode.includes('gri_303_3') && !metricCode.includes('_') && metricCode.length <= 9)) {
      prevYearWithdrawal += value
      if (siteId) {
        prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + value)
      }
    } else if (metricCode.includes('gri_303_5_consumption_total') ||
               (metricCode.includes('gri_303_5') && !metricCode.includes('_') && metricCode.length <= 9)) {
      prevYearConsumption += value
    } else if (metricCode.includes('gri_303_4_discharge_total') ||
               (metricCode.includes('gri_303_4') && !metricCode.includes('_') && metricCode.length <= 9)) {
      prevYearDischarge += value
    } else if (metricCode === 'water_recycled_grey_water' ||
               (metricCode.includes('recycled') && !metricCode.includes('scope3') && !metricCode.includes('toilet'))) {
      // IMPORTANT: Only count main recycled water metric, not subcategories like scope3_water_recycled_toilet
      prevYearRecycled += value
    }
  })

  // Build site breakdown with YoY
  const bySite: WaterBySite[] = Array.from(siteMap.entries())
    .map(([site_id, data]) => {
      const prevYearTotal = prevYearSiteMap.get(site_id) || 0
      const withdrawalYoY = prevYearTotal > 0
        ? Math.round(((data.withdrawal - prevYearTotal) / prevYearTotal) * 10000) / 100
        : null

      return {
        site_id,
        site_name: data.site_name,
        withdrawal: Math.round(data.withdrawal),
        consumption: Math.round(data.consumption),
        discharge: Math.round(data.discharge),
        recycled: Math.round(data.recycled),
        withdrawalYoY,
      }
    })
    .sort((a, b) => b.withdrawal - a.withdrawal)

  // Calculate intensity metrics
  const intensity: WaterIntensityMetrics = {
    perEmployee: null,
    perRevenueMillion: null,
    perFloorAreaM2: null,
    employeeCount: totalEmployees > 0 ? totalEmployees : null,
    revenue: orgData?.annual_revenue || null,
    floorArea: totalFloorArea > 0 ? totalFloorArea : null,
    perEmployeeYoY: null,
    perRevenueMillionYoY: null,
    perFloorAreaM2YoY: null,
  }

  let prevPerEmployee: number | null = null
  let prevPerRevenueMillion: number | null = null
  let prevPerFloorAreaM2: number | null = null

  if (prevYearWithdrawal > 0) {
    if (totalEmployees > 0) {
      prevPerEmployee = Math.round((prevYearWithdrawal / totalEmployees) * 100) / 100
    }
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      prevPerRevenueMillion = Math.round((prevYearWithdrawal / revenueMillion) * 100) / 100
    }
    if (totalFloorArea > 0) {
      prevPerFloorAreaM2 = Math.round((prevYearWithdrawal / totalFloorArea) * 100) / 100
    }
  }

  if (totalWithdrawal > 0) {
    if (totalEmployees > 0) {
      intensity.perEmployee = Math.round((totalWithdrawal / totalEmployees) * 100) / 100
      if (prevPerEmployee !== null && prevPerEmployee > 0) {
        intensity.perEmployeeYoY = Math.round(((intensity.perEmployee - prevPerEmployee) / prevPerEmployee) * 10000) / 100
      }
    }
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      intensity.perRevenueMillion = Math.round((totalWithdrawal / revenueMillion) * 100) / 100
      if (prevPerRevenueMillion !== null && prevPerRevenueMillion > 0) {
        intensity.perRevenueMillionYoY = Math.round(((intensity.perRevenueMillion - prevPerRevenueMillion) / prevPerRevenueMillion) * 10000) / 100
      }
    }
    if (totalFloorArea > 0) {
      intensity.perFloorAreaM2 = Math.round((totalWithdrawal / totalFloorArea) * 100) / 100
      if (prevPerFloorAreaM2 !== null && prevPerFloorAreaM2 > 0) {
        intensity.perFloorAreaM2YoY = Math.round(((intensity.perFloorAreaM2 - prevPerFloorAreaM2) / prevPerFloorAreaM2) * 10000) / 100
      }
    }
  }

  const totalWithdrawalYoY = prevYearWithdrawal > 0
    ? Math.round(((totalWithdrawal - prevYearWithdrawal) / prevYearWithdrawal) * 10000) / 100
    : null
  const totalConsumptionYoY = prevYearConsumption > 0
    ? Math.round(((totalConsumption - prevYearConsumption) / prevYearConsumption) * 10000) / 100
    : null
  const totalDischargeYoY = prevYearDischarge > 0
    ? Math.round(((totalDischarge - prevYearDischarge) / prevYearDischarge) * 10000) / 100
    : null
  const totalRecycledYoY = prevYearRecycled > 0
    ? Math.round(((totalRecycled - prevYearRecycled) / prevYearRecycled) * 10000) / 100
    : null

  return {
    totalWithdrawal: Math.round(totalWithdrawal),
    totalConsumption: Math.round(totalConsumption),
    totalDischarge: Math.round(totalDischarge),
    totalRecycled: Math.round(totalRecycled),
    monthlyTrend,
    bySite,
    bySource,
    year: new Date(options.startDate).getFullYear(),
    intensity,
    totalWithdrawalYoY,
    totalConsumptionYoY,
    totalDischargeYoY,
    totalRecycledYoY,
  }
}

/**
 * GRI 306 Waste Dashboard Data Types
 */
export interface WasteMonthlyTrend {
  month: string // 'YYYY-MM'
  generated: number
  diverted: number
  disposed: number
}

export interface WasteByType {
  type: string
  value: number
  percentage: number
  hazardous: boolean
}

export interface WasteBySite {
  site_id: string
  site_name: string
  generated: number
  diverted: number
  disposed: number
  recyclingRate: number
  // YoY percentage change
  generatedYoY: number | null
}

export interface WasteByTreatment {
  treatment: string
  value: number
  percentage: number
}

export interface WasteIntensityMetrics {
  perEmployee: number | null
  perRevenueMillion: number | null
  perFloorAreaM2: number | null
  employeeCount: number | null
  revenue: number | null
  floorArea: number | null
  // YoY percentage changes
  perEmployeeYoY: number | null
  perRevenueMillionYoY: number | null
  perFloorAreaM2YoY: number | null
}

export interface WasteDashboardData {
  totalGenerated: number
  totalDiverted: number
  totalDisposed: number
  recyclingRate: number
  monthlyTrend: WasteMonthlyTrend[]
  byType: WasteByType[]
  bySite: WasteBySite[]
  byTreatment: WasteByTreatment[]
  year: number
  intensity: WasteIntensityMetrics
  // YoY percentage changes
  totalGeneratedYoY: number | null
  totalDivertedYoY: number | null
  totalDisposedYoY: number | null
  recyclingRateYoY: number | null // Percentage point change
}

/**
 * Get GRI 306 Waste Dashboard Data
 */
export async function getWasteDashboardData(
  organizationId: string,
  options: {
    startDate: string
    endDate: string
    siteId?: string
  }
): Promise<WasteDashboardData> {
  const supabase = await createClient()

  // Build query for GRI 306 metrics
  let query = supabase
    .from('metrics_data')
    .select(
      `
      id,
      value,
      unit,
      period_start,
      period_end,
      metadata,
      site:sites(id, name),
      metric:metrics_catalog(
        id,
        code,
        name,
        category
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
      totalGenerated: 0,
      totalDiverted: 0,
      totalDisposed: 0,
      recyclingRate: 0,
      monthlyTrend: [],
      byType: [],
      bySite: [],
      byTreatment: [],
      year: new Date(options.startDate).getFullYear(),
      intensity: {
        perEmployee: null,
        perRevenueMillion: null,
        perFloorAreaM2: null,
        employeeCount: null,
        revenue: null,
        floorArea: null,
        perEmployeeYoY: null,
        perRevenueMillionYoY: null,
        perFloorAreaM2YoY: null,
      },
      totalGeneratedYoY: null,
      totalDivertedYoY: null,
      totalDisposedYoY: null,
      recyclingRateYoY: null,
    }
  }

  // Filter GRI 306 waste metrics
  const wasteData = metricsData.filter((m: any) => {
    const code = m.metric?.code || ''
    return code.startsWith('gri_306') || code.includes('waste')
  })

  // Calculate totals
  let totalGenerated = 0
  let totalDiverted = 0
  let totalDisposed = 0

  // Monthly trend map
  const monthlyTrendMap = new Map<string, { generated: number; diverted: number; disposed: number }>()

  // Site breakdown map
  const siteMap = new Map<
    string,
    { site_name: string; generated: number; diverted: number; disposed: number }
  >()

  // Type breakdown map
  const typeMap = new Map<string, { value: number; hazardous: boolean }>()

  // Treatment breakdown map
  const treatmentMap = new Map<string, number>()

  wasteData.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const value = metric.value || 0
    const month = metric.period_start?.substring(0, 7) // 'YYYY-MM'
    const siteName = metric.site?.name || 'Unknown Site'
    const siteId = metric.site?.id || 'unknown'

    // Map scope3_waste_* metrics to GRI 306 categories
    const isDiverted = metricCode.includes('scope3_waste_recycling') ||
                       metricCode.includes('scope3_waste_composting')
    const isDisposed = metricCode.includes('scope3_waste_landfill') ||
                       metricCode.includes('scope3_waste_incineration') ||
                       (metricCode.includes('scope3_waste_ewaste') && !metricCode.includes('recycl'))

    // Determine waste category based on GRI 306 sub-categories
    // IMPORTANT: Only count _total metrics to avoid double-counting subcategories
    // Also map scope3_waste_* metrics to appropriate GRI categories
    if (metricCode.includes('gri_306_3_waste_generated_total') ||
        metricCode.includes('gri_306_3_total') ||
        (metricCode.includes('gri_306_3') && !metricCode.includes('_') && metricCode.length <= 9)) {
      totalGenerated += value
      if (month) {
        if (!monthlyTrendMap.has(month)) {
          monthlyTrendMap.set(month, { generated: 0, diverted: 0, disposed: 0 })
        }
        monthlyTrendMap.get(month)!.generated += value
      }
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { site_name: siteName, generated: 0, diverted: 0, disposed: 0 })
      }
      siteMap.get(siteId)!.generated += value
    } else if (metricCode.includes('gri_306_4_diverted_total') ||
               metricCode.includes('gri_306_4_total') ||
               (metricCode.includes('gri_306_4') && !metricCode.includes('_') && metricCode.length <= 9) ||
               isDiverted) {
      totalDiverted += value
      totalGenerated += value // Diverted waste is also generated
      if (month) {
        if (!monthlyTrendMap.has(month)) {
          monthlyTrendMap.set(month, { generated: 0, diverted: 0, disposed: 0 })
        }
        monthlyTrendMap.get(month)!.diverted += value
        monthlyTrendMap.get(month)!.generated += value
      }
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { site_name: siteName, generated: 0, diverted: 0, disposed: 0 })
      }
      siteMap.get(siteId)!.diverted += value
      siteMap.get(siteId)!.generated += value
    } else if (metricCode.includes('gri_306_5_disposed_total') ||
               metricCode.includes('gri_306_5_total') ||
               (metricCode.includes('gri_306_5') && !metricCode.includes('_') && metricCode.length <= 9) ||
               isDisposed) {
      totalDisposed += value
      totalGenerated += value // Disposed waste is also generated
      if (month) {
        if (!monthlyTrendMap.has(month)) {
          monthlyTrendMap.set(month, { generated: 0, diverted: 0, disposed: 0 })
        }
        monthlyTrendMap.get(month)!.disposed += value
        monthlyTrendMap.get(month)!.generated += value
      }
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { site_name: siteName, generated: 0, diverted: 0, disposed: 0 })
      }
      siteMap.get(siteId)!.disposed += value
      siteMap.get(siteId)!.generated += value
    }

    // Type breakdown (hazardous vs non-hazardous)
    let wasteType = metric.metadata?.waste_type || 'Other'

    // Extract type from scope3_waste_* metric codes if metadata is missing
    if (wasteType === 'Other' && metricCode.includes('scope3_waste')) {
      if (metricCode.includes('_recycling_paper')) {
        wasteType = 'Paper'
      } else if (metricCode.includes('_recycling_plastic')) {
        wasteType = 'Plastic'
      } else if (metricCode.includes('_recycling_metal')) {
        wasteType = 'Metal'
      } else if (metricCode.includes('_recycling_glass')) {
        wasteType = 'Glass'
      } else if (metricCode.includes('_recycling_mixed')) {
        wasteType = 'Mixed Recycling'
      } else if (metricCode.includes('_composting_food')) {
        wasteType = 'Food Waste'
      } else if (metricCode.includes('_composting_garden')) {
        wasteType = 'Garden Waste'
      } else if (metricCode.includes('_landfill')) {
        wasteType = 'Landfill'
      } else if (metricCode.includes('_incineration')) {
        wasteType = 'Incineration'
      } else if (metricCode.includes('_ewaste')) {
        wasteType = 'E-Waste'
      }
    }

    const isHazardous = metric.metadata?.hazardous === true || metricCode.includes('hazardous')
    if (!typeMap.has(wasteType)) {
      typeMap.set(wasteType, { value: 0, hazardous: isHazardous })
    }
    typeMap.get(wasteType)!.value += value

    // Treatment breakdown
    let treatment = metric.metadata?.treatment_method || 'Other'

    // Extract treatment from scope3_waste_* metric codes if metadata is missing
    if (treatment === 'Other' && metricCode.includes('scope3_waste')) {
      if (metricCode.includes('_recycling_')) {
        treatment = 'Recycling'
      } else if (metricCode.includes('_composting_')) {
        treatment = 'Composting'
      } else if (metricCode.includes('_landfill')) {
        treatment = 'Landfill'
      } else if (metricCode.includes('_incineration')) {
        treatment = 'Incineration'
      } else if (metricCode.includes('_ewaste')) {
        treatment = 'E-Waste Disposal'
      }
    }

    treatmentMap.set(treatment, (treatmentMap.get(treatment) || 0) + value)
  })

  const recyclingRate = totalGenerated > 0 ? (totalDiverted / totalGenerated) * 100 : 0

  // Build monthly trend array
  const monthlyTrend: WasteMonthlyTrend[] = Array.from(monthlyTrendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      generated: Math.round(data.generated),
      diverted: Math.round(data.diverted),
      disposed: Math.round(data.disposed),
    }))

  // Build type breakdown
  const byType: WasteByType[] = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      value: Math.round(data.value),
      percentage: totalGenerated > 0 ? Math.round((data.value / totalGenerated) * 100) : 0,
      hazardous: data.hazardous,
    }))
    .sort((a, b) => b.value - a.value)

  // Build treatment breakdown
  const byTreatment: WasteByTreatment[] = Array.from(treatmentMap.entries())
    .map(([treatment, value]) => ({
      treatment,
      value: Math.round(value),
      percentage: totalGenerated > 0 ? Math.round((value / totalGenerated) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Fetch organization revenue
  const { data: orgData } = await supabase
    .from('organizations')
    .select('annual_revenue')
    .eq('id', organizationId)
    .single()

  // Fetch site data for employee count and floor area
  let sitesQuery = supabase
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (options.siteId) {
    sitesQuery = sitesQuery.eq('id', options.siteId)
  }

  const { data: sitesData } = await sitesQuery

  const totalEmployees = sitesData?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0
  const totalFloorArea = sitesData?.reduce((sum, site) => sum + (site.total_area_sqm || 0), 0) || 0

  // Calculate previous year for YoY
  const startDate = new Date(options.startDate)
  const endDate = new Date(options.endDate)
  const prevYearStart = new Date(startDate)
  prevYearStart.setFullYear(startDate.getFullYear() - 1)
  const prevYearEnd = new Date(endDate)
  prevYearEnd.setFullYear(endDate.getFullYear() - 1)

  let prevYearQuery = supabase
    .from('metrics_data')
    .select('value, site_id, metric:metrics_catalog(code)')
    .eq('organization_id', organizationId)
    .gte('period_start', prevYearStart.toISOString().split('T')[0])
    .lte('period_start', prevYearEnd.toISOString().split('T')[0])

  if (options.siteId) {
    prevYearQuery = prevYearQuery.eq('site_id', options.siteId)
  }

  const { data: prevYearMetrics } = await prevYearQuery

  let prevYearGenerated = 0
  let prevYearDiverted = 0
  let prevYearDisposed = 0
  const prevYearSiteMap = new Map<string, number>()

  prevYearMetrics?.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const value = metric.value || 0
    const siteId = metric.site_id

    // Map scope3_waste_* metrics to GRI 306 categories (same as main calculation)
    const isDiverted = metricCode.includes('scope3_waste_recycling') ||
                       metricCode.includes('scope3_waste_composting')
    const isDisposed = metricCode.includes('scope3_waste_landfill') ||
                       metricCode.includes('scope3_waste_incineration') ||
                       (metricCode.includes('scope3_waste_ewaste') && !metricCode.includes('recycl'))

    // IMPORTANT: Only count _total metrics to avoid double-counting subcategories (same as main calculation)
    if (metricCode.includes('gri_306_3_waste_generated_total') ||
        metricCode.includes('gri_306_3_total') ||
        (metricCode.includes('gri_306_3') && !metricCode.includes('_') && metricCode.length <= 9)) {
      prevYearGenerated += value
      if (siteId) {
        prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + value)
      }
    } else if (metricCode.includes('gri_306_4_diverted_total') ||
               metricCode.includes('gri_306_4_total') ||
               (metricCode.includes('gri_306_4') && !metricCode.includes('_') && metricCode.length <= 9) ||
               isDiverted) {
      prevYearDiverted += value
      prevYearGenerated += value // Diverted waste is also generated
      if (siteId) {
        prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + value)
      }
    } else if (metricCode.includes('gri_306_5_disposed_total') ||
               metricCode.includes('gri_306_5_total') ||
               (metricCode.includes('gri_306_5') && !metricCode.includes('_') && metricCode.length <= 9) ||
               isDisposed) {
      prevYearDisposed += value
      prevYearGenerated += value // Disposed waste is also generated
      if (siteId) {
        prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + value)
      }
    }
  })

  const prevYearRecyclingRate = prevYearGenerated > 0 ? (prevYearDiverted / prevYearGenerated) * 100 : 0

  // Build site breakdown with YoY
  const bySite: WasteBySite[] = Array.from(siteMap.entries())
    .map(([site_id, data]) => {
      const prevYearTotal = prevYearSiteMap.get(site_id) || 0
      const generatedYoY = prevYearTotal > 0
        ? Math.round(((data.generated - prevYearTotal) / prevYearTotal) * 10000) / 100
        : null
      const siteRecyclingRate = data.generated > 0 ? (data.diverted / data.generated) * 100 : 0

      return {
        site_id,
        site_name: data.site_name,
        generated: Math.round(data.generated),
        diverted: Math.round(data.diverted),
        disposed: Math.round(data.disposed),
        recyclingRate: Math.round(siteRecyclingRate * 10) / 10,
        generatedYoY,
      }
    })
    .sort((a, b) => b.generated - a.generated)

  // Calculate intensity metrics
  const intensity: WasteIntensityMetrics = {
    perEmployee: null,
    perRevenueMillion: null,
    perFloorAreaM2: null,
    employeeCount: totalEmployees > 0 ? totalEmployees : null,
    revenue: orgData?.annual_revenue || null,
    floorArea: totalFloorArea > 0 ? totalFloorArea : null,
    perEmployeeYoY: null,
    perRevenueMillionYoY: null,
    perFloorAreaM2YoY: null,
  }

  let prevPerEmployee: number | null = null
  let prevPerRevenueMillion: number | null = null
  let prevPerFloorAreaM2: number | null = null

  if (prevYearGenerated > 0) {
    if (totalEmployees > 0) {
      prevPerEmployee = Math.round((prevYearGenerated / totalEmployees) * 100) / 100
    }
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      prevPerRevenueMillion = Math.round((prevYearGenerated / revenueMillion) * 100) / 100
    }
    if (totalFloorArea > 0) {
      prevPerFloorAreaM2 = Math.round((prevYearGenerated / totalFloorArea) * 100) / 100
    }
  }

  if (totalGenerated > 0) {
    if (totalEmployees > 0) {
      intensity.perEmployee = Math.round((totalGenerated / totalEmployees) * 100) / 100
      if (prevPerEmployee !== null && prevPerEmployee > 0) {
        intensity.perEmployeeYoY = Math.round(((intensity.perEmployee - prevPerEmployee) / prevPerEmployee) * 10000) / 100
      }
    }
    if (orgData?.annual_revenue && orgData.annual_revenue > 0) {
      const revenueMillion = orgData.annual_revenue / 1000000
      intensity.perRevenueMillion = Math.round((totalGenerated / revenueMillion) * 100) / 100
      if (prevPerRevenueMillion !== null && prevPerRevenueMillion > 0) {
        intensity.perRevenueMillionYoY = Math.round(((intensity.perRevenueMillion - prevPerRevenueMillion) / prevPerRevenueMillion) * 10000) / 100
      }
    }
    if (totalFloorArea > 0) {
      intensity.perFloorAreaM2 = Math.round((totalGenerated / totalFloorArea) * 100) / 100
      if (prevPerFloorAreaM2 !== null && prevPerFloorAreaM2 > 0) {
        intensity.perFloorAreaM2YoY = Math.round(((intensity.perFloorAreaM2 - prevPerFloorAreaM2) / prevPerFloorAreaM2) * 10000) / 100
      }
    }
  }

  const totalGeneratedYoY = prevYearGenerated > 0
    ? Math.round(((totalGenerated - prevYearGenerated) / prevYearGenerated) * 10000) / 100
    : null
  const totalDivertedYoY = prevYearDiverted > 0
    ? Math.round(((totalDiverted - prevYearDiverted) / prevYearDiverted) * 10000) / 100
    : null
  const totalDisposedYoY = prevYearDisposed > 0
    ? Math.round(((totalDisposed - prevYearDisposed) / prevYearDisposed) * 10000) / 100
    : null
  const recyclingRateYoY = prevYearRecyclingRate > 0
    ? Math.round((recyclingRate - prevYearRecyclingRate) * 10) / 10
    : null

  return {
    totalGenerated: Math.round(totalGenerated),
    totalDiverted: Math.round(totalDiverted),
    totalDisposed: Math.round(totalDisposed),
    recyclingRate: Math.round(recyclingRate * 10) / 10,
    monthlyTrend,
    byType,
    bySite,
    byTreatment,
    year: new Date(options.startDate).getFullYear(),
    intensity,
    totalGeneratedYoY,
    totalDivertedYoY,
    totalDisposedYoY,
    recyclingRateYoY,
  }
}

// ============================================================================
// GRI GAP ANALYSIS & METRICS OPPORTUNITIES
// ============================================================================

export interface MetricOpportunity {
  code: string
  name: string
  description: string
  category: string
  subcategory: string | null
  unit: string
  gri_standard: string // e.g., "302", "305", "306"
  gri_disclosure: string | null // e.g., "302-1", "305-2"
  scope: 'scope_1' | 'scope_2' | 'scope_3'

  // Priorização
  priority: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  impact: 'high' | 'medium' | 'low'

  // Context
  peer_adoption_rate: number | null // % de peers tracking
  is_esrs_required: boolean
  is_sector_recommended: boolean

  // Quick wins
  is_quick_win: boolean // high priority + easy difficulty
}

// New interface for disclosure-level grouping
export interface DisclosureGroupOpportunity {
  disclosure: string // e.g., "302-1"
  disclosure_title: string // e.g., "Energy consumption within the organization"
  disclosure_description: string // Official GRI description
  gri_standard: string // e.g., "302"

  // Metrics within this disclosure
  total_metrics: number
  metrics_tracking: number
  metrics_available: MetricOpportunity[]

  // Aggregate scores for the disclosure
  avg_difficulty: 'easy' | 'medium' | 'hard'
  highest_priority: 'high' | 'medium' | 'low'
  has_quick_wins: boolean
  quick_win_count: number
}

export interface GRIStandardGapAnalysis {
  gri_standard: string // "302", "305", etc.
  standard_name: string // "Energy", "Emissions", etc.

  // Tracking status
  total_available_metrics: number
  metrics_tracking: number
  metrics_not_tracking: number
  coverage_percentage: number

  // Opportunities
  opportunities: MetricOpportunity[]
  quick_wins: MetricOpportunity[]
  strategic_priorities: MetricOpportunity[]

  // Peer comparison
  peer_avg_coverage: number | null
  is_above_peer_avg: boolean
}

export interface GapAnalysisDashboard {
  standards: GRIStandardGapAnalysis[]

  // NEW: Disclosure-level grouping
  disclosure_groups: DisclosureGroupOpportunity[]

  // Summary stats
  total_available_metrics: number
  total_tracking_metrics: number
  total_opportunities: number
  total_quick_wins: number
  total_disclosures: number // Total unique disclosures
  disclosures_with_gaps: number // Disclosures with untracked metrics

  // Categorized opportunities
  high_priority_opportunities: MetricOpportunity[]
  esrs_required_opportunities: MetricOpportunity[]
  sector_recommended_opportunities: MetricOpportunity[]

  organization_name: string
  industry_sector: string
}

/**
 * Map scope/category to GRI Standard
 */
function mapToGRIStandard(scope: string, category: string): { gri_standard: string; standard_name: string } | null {
  // GRI 301 - Materials
  if (category.includes('Materials') || category.includes('Packaging') || category.includes('Reclamation')) {
    return { gri_standard: '301', standard_name: 'Materials' }
  }

  // GRI 302 - Energy
  if (category.includes('Energy') || category.includes('Electricity')) {
    return { gri_standard: '302', standard_name: 'Energy' }
  }

  // GRI 303 - Water (all water-related categories)
  if (category.includes('Water')) {
    return { gri_standard: '303', standard_name: 'Water & Effluents' }
  }

  // GRI 304 - Biodiversity
  if (category.includes('Biodiversity')) {
    return { gri_standard: '304', standard_name: 'Biodiversity' }
  }

  // GRI 306 - Waste (check before GRI 305 to avoid conflicts)
  if (category.includes('Waste') || category.includes('End-of-Life')) {
    return { gri_standard: '306', standard_name: 'Waste' }
  }

  // GRI 308 - Supplier Assessment
  if (category.includes('Supplier')) {
    return { gri_standard: '308', standard_name: 'Supplier Environmental Assessment' }
  }

  // GRI 307 - Environmental Compliance
  if (category.includes('Compliance')) {
    return { gri_standard: '307', standard_name: 'Environmental Compliance' }
  }

  // GRI 305 - Emissions (most comprehensive - includes all scopes)
  // This covers:
  // - Scope 1: Stationary/Mobile Combustion, Fugitive Emissions, Process Emissions
  // - Scope 2: Already covered by Energy above, but map scope_2 here as fallback
  // - Scope 3: Business Travel, Employee Commuting, Transportation, Purchased Goods, etc.
  if (scope === 'scope_1' ||
      scope === 'scope_2' ||
      scope === 'scope_3' ||
      category.includes('Emissions') ||
      category.includes('Combustion') ||
      category.includes('Fugitive') ||
      category.includes('Process') ||
      category.includes('Travel') ||
      category.includes('Commuting') ||
      category.includes('Transportation') ||
      category.includes('Purchased Goods') ||
      category.includes('Capital Goods') ||
      category.includes('Fuel & Energy') ||
      category.includes('Leased Assets') ||
      category.includes('Franchises') ||
      category.includes('Investments') ||
      category.includes('Use of Sold Products') ||
      category.includes('Processing of Sold Products')) {
    return { gri_standard: '305', standard_name: 'Emissions' }
  }

  return null
}

/**
 * Calculate priority, difficulty, and impact for a metric
 */
function calculateMetricScores(
  metric: any,
  peerAdoptionRate: number | null,
  industrySector: string
): {
  priority: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  impact: 'high' | 'medium' | 'low'
  is_esrs_required: boolean
  is_sector_recommended: boolean
} {
  // Priority based on peer adoption, ESRS, and core ESG metrics
  let priority: 'high' | 'medium' | 'low' = 'medium'
  const is_esrs_required = false // TODO: Add ESRS mapping
  const is_sector_recommended = (peerAdoptionRate || 0) > 60

  // Core ESG metrics that are typically high priority
  const isCoreESGMetric =
    metric.category.includes('Electricity') ||
    metric.category.includes('Stationary Combustion') ||
    metric.category.includes('Mobile Combustion') ||
    metric.category.includes('Water Withdrawal') ||
    metric.category.includes('Water Consumption') ||
    metric.category.includes('Waste') ||
    metric.category.includes('Fugitive Emissions') ||
    metric.category.includes('Business Travel') ||
    metric.category.includes('Employee Commuting')

  if (is_esrs_required || (peerAdoptionRate || 0) > 75 || isCoreESGMetric) {
    priority = 'high'
  } else if ((peerAdoptionRate || 0) < 30 && !isCoreESGMetric) {
    priority = 'low'
  }

  // Difficulty based on data availability and complexity
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium'

  // Easy metrics: direct measurements and readily available data
  if (metric.category.includes('Electricity') ||
      metric.category.includes('Water') ||
      metric.category.includes('Waste') ||
      metric.category.includes('Stationary Combustion') ||
      metric.category.includes('Mobile Combustion') ||
      metric.category.includes('Fugitive Emissions') ||
      metric.category.includes('Business Travel') ||
      metric.category.includes('Employee Commuting')) {
    difficulty = 'easy'
  }

  // Hard metrics: require supply chain data or complex calculations
  if (metric.scope === 'scope_3' &&
      (metric.category.includes('Supplier') ||
       metric.category.includes('Upstream Transportation') ||
       metric.category.includes('Downstream Transportation') ||
       metric.category.includes('Use of Sold Products') ||
       metric.category.includes('Capital Goods') ||
       metric.category.includes('Purchased Goods & Services') ||
       metric.category.includes('End-of-Life'))) {
    difficulty = 'hard'
  }

  // Impact based on typical materiality
  let impact: 'high' | 'medium' | 'low' = 'medium'

  // High impact categories
  if (metric.category.includes('Emissions') ||
      metric.category.includes('Energy') ||
      metric.category.includes('Water') ||
      metric.category.includes('Waste')) {
    impact = 'high'
  }

  return {
    priority,
    difficulty,
    impact,
    is_esrs_required,
    is_sector_recommended,
  }
}

/**
 * Get GRI Gap Analysis Dashboard Data
 */
export async function getGRIGapAnalysis(
  organizationId: string,
  options?: {
    siteId?: string
  }
): Promise<GapAnalysisDashboard> {
  const supabase = await createClient()

  // Get organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('name, industry_sector')
    .eq('id', organizationId)
    .single()

  if (!org) {
    throw new Error('Organization not found')
  }

  const industrySector = org.industry_sector || 'Professional Services'

  // Get all available metrics from catalog (including calculated/derived info + disclosure grouping)
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('code, name, description, scope, category, subcategory, unit, is_calculated, parent_metric_id, parent:parent_metric_id(code), gri_disclosure, gri_disclosure_title, gri_disclosure_description')
    .eq('is_active', true)
    .order('gri_disclosure')
    .order('code')

  // Get unique metric codes being tracked by this org
  // Use RPC call to get distinct codes efficiently
  const { data: trackedCodes } = await supabase
    .rpc('get_tracked_metric_codes', {
      org_id: organizationId,
      site_filter: options?.siteId || null
    })

  // Fallback: if RPC doesn't exist, fetch all and deduplicate client-side
  let trackedMetricIds: any[] = []

  if (!trackedCodes) {
    // Fetch with pagination (Supabase max is 1000 records per request)
    const limit = 1000
    let allData: any[] = []
    let page = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('metrics_data')
        .select('metric:metrics_catalog!inner(code)')
        .eq('organization_id', organizationId)
        .not('metric_id', 'is', null)
        .range(page * limit, (page + 1) * limit - 1)

      if (options?.siteId) {
        query = query.eq('site_id', options.siteId)
      }

      const { data } = await query

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allData.push(...data)
        // Continue if we got a full page (there might be more)
        if (data.length < limit) {
          hasMore = false
        }
        page++
      }
    }

    trackedMetricIds = allData
  }

  // Extract the codes
  const trackedMetricSet = trackedCodes
    ? new Set(trackedCodes.map((row: any) => row.code))
    : new Set(
        (trackedMetricIds || [])
          .map((m: any) => m.metric?.code)
          .filter((code: string | undefined) => code !== undefined)
      )

  // Get industry benchmarks (peer adoption rates)
  const { data: industryMetrics } = await supabase
    .from('industry_metrics')
    .select('metric_code, adoption_rate')
    .eq('industry_sector', industrySector)

  const peerAdoptionMap = new Map<string, number>()
  if (industryMetrics) {
    industryMetrics.forEach((im: any) => {
      peerAdoptionMap.set(im.metric_code, im.adoption_rate || 0)
    })
  }

  // Group metrics by GRI Standard
  const standardsMap = new Map<string, {
    gri_standard: string
    standard_name: string
    all_metrics: any[]
    tracked_metrics: any[]
    opportunities: MetricOpportunity[]
  }>()

  allMetrics?.forEach((metric: any) => {
    const griMapping = mapToGRIStandard(metric.scope, metric.category)
    if (!griMapping) return

    const { gri_standard, standard_name } = griMapping

    if (!standardsMap.has(gri_standard)) {
      standardsMap.set(gri_standard, {
        gri_standard,
        standard_name,
        all_metrics: [],
        tracked_metrics: [],
        opportunities: [],
      })
    }

    const standard = standardsMap.get(gri_standard)!
    standard.all_metrics.push(metric)

    const isTracked = trackedMetricSet.has(metric.code)

    // Check if this is a calculated/derived metric whose parent is already tracked
    // e.g., GRI 305-2 emissions calculated from electricity consumption
    const isCalculatedWithTrackedParent =
      metric.is_calculated &&
      metric.parent?.code &&
      trackedMetricSet.has(metric.parent.code)

    if (isTracked || isCalculatedWithTrackedParent) {
      standard.tracked_metrics.push(metric)
    } else {
      // This is an opportunity!
      const peerAdoptionRate = peerAdoptionMap.get(metric.code) || null
      const scores = calculateMetricScores(metric, peerAdoptionRate, industrySector)

      const opportunity: MetricOpportunity = {
        code: metric.code,
        name: metric.name,
        description: metric.description || '',
        category: metric.category,
        subcategory: metric.subcategory,
        unit: metric.unit,
        gri_standard,
        gri_disclosure: metric.gri_disclosure || null,
        scope: metric.scope,
        priority: scores.priority,
        difficulty: scores.difficulty,
        impact: scores.impact,
        peer_adoption_rate: peerAdoptionRate,
        is_esrs_required: scores.is_esrs_required,
        is_sector_recommended: scores.is_sector_recommended,
        is_quick_win: scores.priority === 'high' && scores.difficulty === 'easy',
      }

      standard.opportunities.push(opportunity)
    }
  })

  // Build GRIStandardGapAnalysis for each standard
  const standards: GRIStandardGapAnalysis[] = Array.from(standardsMap.values()).map((standard) => {
    const total_available = standard.all_metrics.length
    const metrics_tracking = standard.tracked_metrics.length
    const metrics_not_tracking = standard.opportunities.length
    const coverage_percentage = total_available > 0 ? (metrics_tracking / total_available) * 100 : 0

    const quick_wins = standard.opportunities.filter((o) => o.is_quick_win)
    const strategic_priorities = standard.opportunities.filter(
      (o) => o.priority === 'high' && o.difficulty === 'hard'
    )

    return {
      gri_standard: standard.gri_standard,
      standard_name: standard.standard_name,
      total_available_metrics: total_available,
      metrics_tracking,
      metrics_not_tracking,
      coverage_percentage: Math.round(coverage_percentage),
      opportunities: standard.opportunities.sort((a, b) => {
        // Sort by priority, then difficulty
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        const difficultyOrder = { easy: 0, medium: 1, hard: 2 }

        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      }),
      quick_wins,
      strategic_priorities,
      peer_avg_coverage: null, // TODO: Calculate from industry_metrics
      is_above_peer_avg: false,
    }
  }).sort((a, b) => parseInt(a.gri_standard) - parseInt(b.gri_standard))

  // Calculate summary stats
  const total_available_metrics = standards.reduce((sum, s) => sum + s.total_available_metrics, 0)
  const total_tracking_metrics = standards.reduce((sum, s) => sum + s.metrics_tracking, 0)
  const all_opportunities = standards.flatMap((s) => s.opportunities)
  const total_opportunities = all_opportunities.length
  const total_quick_wins = all_opportunities.filter((o) => o.is_quick_win).length

  const high_priority_opportunities = all_opportunities
    .filter((o) => o.priority === 'high')
    .slice(0, 10) // Top 10

  const esrs_required_opportunities = all_opportunities.filter((o) => o.is_esrs_required)
  const sector_recommended_opportunities = all_opportunities.filter((o) => o.is_sector_recommended)

  // Build disclosure-level groups
  const disclosureMap = new Map<string, {
    disclosure_title: string
    disclosure_description: string
    gri_standard: string
    all_metrics: any[]
    tracked_metrics: any[]
    opportunities: MetricOpportunity[]
  }>()

  allMetrics?.forEach((metric: any) => {
    if (!metric.gri_disclosure) return // Skip metrics without disclosure mapping

    const disclosure = metric.gri_disclosure

    if (!disclosureMap.has(disclosure)) {
      const griMapping = mapToGRIStandard(metric.scope, metric.category)
      disclosureMap.set(disclosure, {
        disclosure_title: metric.gri_disclosure_title || '',
        disclosure_description: metric.gri_disclosure_description || '',
        gri_standard: griMapping?.gri_standard || '',
        all_metrics: [],
        tracked_metrics: [],
        opportunities: [],
      })
    }

    const disclosureGroup = disclosureMap.get(disclosure)!
    disclosureGroup.all_metrics.push(metric)

    const isTracked = trackedMetricSet.has(metric.code)
    const isCalculatedWithTrackedParent =
      metric.is_calculated &&
      metric.parent?.code &&
      trackedMetricSet.has(metric.parent.code)

    if (isTracked || isCalculatedWithTrackedParent) {
      disclosureGroup.tracked_metrics.push(metric)
    } else {
      // Find the corresponding opportunity
      const opportunity = all_opportunities.find(o => o.code === metric.code)
      if (opportunity) {
        disclosureGroup.opportunities.push(opportunity)
      }
    }
  })

  // Build DisclosureGroupOpportunity array
  const disclosure_groups: DisclosureGroupOpportunity[] = Array.from(disclosureMap.entries())
    .map(([disclosure, data]) => {
      const total_metrics = data.all_metrics.length
      const metrics_tracking = data.tracked_metrics.length
      const metrics_available = data.opportunities

      // Calculate aggregate difficulty (most common)
      const difficultyCount = metrics_available.reduce((acc, m) => {
        acc[m.difficulty] = (acc[m.difficulty] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const avg_difficulty = (Object.entries(difficultyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium') as 'easy' | 'medium' | 'hard'

      // Calculate highest priority
      const hasHigh = metrics_available.some(m => m.priority === 'high')
      const hasMedium = metrics_available.some(m => m.priority === 'medium')
      const highest_priority = hasHigh ? 'high' : hasMedium ? 'medium' : 'low'

      // Count quick wins
      const quick_win_count = metrics_available.filter(m => m.is_quick_win).length
      const has_quick_wins = quick_win_count > 0

      return {
        disclosure,
        disclosure_title: data.disclosure_title,
        disclosure_description: data.disclosure_description,
        gri_standard: data.gri_standard,
        total_metrics,
        metrics_tracking,
        metrics_available,
        avg_difficulty,
        highest_priority,
        has_quick_wins,
        quick_win_count,
      }
    })
    .filter(d => d.metrics_available.length > 0) // Only show disclosures with opportunities
    .sort((a, b) => {
      // Sort by disclosure code (e.g., "302-1" < "305-2")
      return a.disclosure.localeCompare(b.disclosure)
    })

  const total_disclosures = disclosureMap.size
  const disclosures_with_gaps = disclosure_groups.length

  return {
    standards,
    disclosure_groups,
    total_available_metrics,
    total_tracking_metrics,
    total_opportunities,
    total_quick_wins,
    total_disclosures,
    disclosures_with_gaps,
    high_priority_opportunities,
    esrs_required_opportunities,
    sector_recommended_opportunities,
    organization_name: org.name,
    industry_sector: industrySector,
  }
}
