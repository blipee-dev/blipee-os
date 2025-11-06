const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDashboardData() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  const startDate = '2025-01-01'
  const endDate = '2025-12-31'

  console.log('Fetching emissions data...\n')

  const { data: metricsData, error } = await supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      period_start,
      period_end,
      site:sites(id, name),
      metric:metrics_catalog(code, name)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', startDate)
    .lte('period_end', endDate)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Total metrics records: ${metricsData?.length || 0}\n`)

  // Filter GRI 305 emissions metrics
  const emissionsData = metricsData.filter((m) => {
    const code = m.metric?.code || ''
    return (
      code.startsWith('gri_305') ||
      code.startsWith('scope1_') ||
      code.startsWith('scope2_') ||
      code.startsWith('scope3_') // Include ALL scope 3 emissions (including waste-related)
    )
  })

  console.log(`Emissions records after filtering: ${emissionsData.length}\n`)

  // Build monthly trend map (same as gri.ts logic)
  const monthlyTrendMap = new Map()
  let scope1Total = 0
  let scope2Total = 0
  let scope3Total = 0

  emissionsData.forEach((metric) => {
    const metricCode = metric.metric?.code || ''
    const emissions = (metric.co2e_emissions || 0) / 1000 // Convert kg to tonnes
    const month = metric.period_start?.substring(0, 7) // 'YYYY-MM'

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
    if (month && scope) {
      if (!monthlyTrendMap.has(month)) {
        monthlyTrendMap.set(month, { scope1: 0, scope2: 0, scope3: 0 })
      }
      const monthData = monthlyTrendMap.get(month)
      if (scope === 'scope1') monthData.scope1 += emissions
      else if (scope === 'scope2') monthData.scope2 += emissions
      else if (scope === 'scope3') monthData.scope3 += emissions
    }
  })

  // Build monthly trend array
  const monthlyTrend = Array.from(monthlyTrendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      scope1: Math.round(data.scope1 * 100) / 100,
      scope2: Math.round(data.scope2 * 100) / 100,
      scope3: Math.round(data.scope3 * 100) / 100,
      total: Math.round((data.scope1 + data.scope2 + data.scope3) * 100) / 100,
    }))

  console.log('Monthly Trend Data:')
  console.log(JSON.stringify(monthlyTrend, null, 2))

  console.log('\nTotals:')
  console.log(`Scope 1: ${scope1Total.toFixed(2)} tonnes`)
  console.log(`Scope 2: ${scope2Total.toFixed(2)} tonnes`)
  console.log(`Scope 3: ${scope3Total.toFixed(2)} tonnes`)
  console.log(`Total: ${(scope1Total + scope2Total + scope3Total).toFixed(2)} tonnes`)
}

debugDashboardData()
