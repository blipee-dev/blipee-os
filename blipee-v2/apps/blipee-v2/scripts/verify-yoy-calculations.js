const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyYoY() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  // Current period: Jan-Oct 2025
  const currentStart = '2025-01-01'
  const currentEnd = '2025-10-31'

  // Previous year same period: Jan-Oct 2024
  const prevStart = '2024-01-01'
  const prevEnd = '2024-10-31'

  console.log('Verifying YoY Calculations...\n')
  console.log(`Current Period: ${currentStart} to ${currentEnd}`)
  console.log(`Previous Period: ${prevStart} to ${prevEnd}\n`)

  // Fetch 2025 data
  const { data: current2025 } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, metric:metrics_catalog(code)')
    .eq('organization_id', organizationId)
    .gte('period_start', currentStart)
    .lte('period_end', currentEnd)

  // Fetch 2024 data
  const { data: previous2024 } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, metric:metrics_catalog(code)')
    .eq('organization_id', organizationId)
    .gte('period_start', prevStart)
    .lte('period_end', prevEnd)

  console.log(`2025 Records: ${current2025?.length || 0}`)
  console.log(`2024 Records: ${previous2024?.length || 0}\n`)

  if (!previous2024 || previous2024.length === 0) {
    console.log('⚠️  NO 2024 DATA FOUND - YoY calculations will show null\n')
    return
  }

  // Calculate 2025 totals
  let current2025Total = 0
  let current2025Scope1 = 0
  let current2025Scope2 = 0
  let current2025Scope3 = 0

  current2025?.forEach(m => {
    const code = m.metric?.code || ''
    if (!(code.startsWith('scope1_') || code.startsWith('scope2_') || code.startsWith('scope3_'))) return

    const emissions = (m.co2e_emissions || 0) / 1000 // tonnes

    if (code.startsWith('scope1_')) {
      current2025Scope1 += emissions
    } else if (code.startsWith('scope2_')) {
      current2025Scope2 += emissions
    } else if (code.startsWith('scope3_')) {
      current2025Scope3 += emissions
    }
    current2025Total += emissions
  })

  // Calculate 2024 totals
  let previous2024Total = 0
  let previous2024Scope1 = 0
  let previous2024Scope2 = 0
  let previous2024Scope3 = 0

  previous2024?.forEach(m => {
    const code = m.metric?.code || ''
    if (!(code.startsWith('scope1_') || code.startsWith('scope2_') || code.startsWith('scope3_'))) return

    const emissions = (m.co2e_emissions || 0) / 1000 // tonnes

    if (code.startsWith('scope1_')) {
      previous2024Scope1 += emissions
    } else if (code.startsWith('scope2_')) {
      previous2024Scope2 += emissions
    } else if (code.startsWith('scope3_')) {
      previous2024Scope3 += emissions
    }
    previous2024Total += emissions
  })

  console.log('=== 2025 YTD (Jan-Oct) ===')
  console.log(`Total: ${current2025Total.toFixed(2)} tonnes`)
  console.log(`Scope 1: ${current2025Scope1.toFixed(2)} tonnes`)
  console.log(`Scope 2: ${current2025Scope2.toFixed(2)} tonnes`)
  console.log(`Scope 3: ${current2025Scope3.toFixed(2)} tonnes\n`)

  console.log('=== 2024 Same Period (Jan-Oct) ===')
  console.log(`Total: ${previous2024Total.toFixed(2)} tonnes`)
  console.log(`Scope 1: ${previous2024Scope1.toFixed(2)} tonnes`)
  console.log(`Scope 2: ${previous2024Scope2.toFixed(2)} tonnes`)
  console.log(`Scope 3: ${previous2024Scope3.toFixed(2)} tonnes\n`)

  // Calculate YoY percentages
  const totalYoY = previous2024Total > 0
    ? ((current2025Total - previous2024Total) / previous2024Total) * 100
    : null
  const scope1YoY = previous2024Scope1 > 0
    ? ((current2025Scope1 - previous2024Scope1) / previous2024Scope1) * 100
    : null
  const scope2YoY = previous2024Scope2 > 0
    ? ((current2025Scope2 - previous2024Scope2) / previous2024Scope2) * 100
    : null
  const scope3YoY = previous2024Scope3 > 0
    ? ((current2025Scope3 - previous2024Scope3) / previous2024Scope3) * 100
    : null

  console.log('=== YoY Changes (2025 vs 2024) ===')
  console.log(`Total: ${totalYoY !== null ? totalYoY.toFixed(2) + '%' : 'N/A'} ${totalYoY !== null ? (totalYoY < 0 ? '✅ REDUCTION' : '⚠️ INCREASE') : ''}`)
  console.log(`Scope 1: ${scope1YoY !== null ? scope1YoY.toFixed(2) + '%' : 'N/A'} ${scope1YoY !== null ? (scope1YoY < 0 ? '✅ REDUCTION' : '⚠️ INCREASE') : ''}`)
  console.log(`Scope 2: ${scope2YoY !== null ? scope2YoY.toFixed(2) + '%' : 'N/A'} ${scope2YoY !== null ? (scope2YoY < 0 ? '✅ REDUCTION' : '⚠️ INCREASE') : ''}`)
  console.log(`Scope 3: ${scope3YoY !== null ? scope3YoY.toFixed(2) + '%' : 'N/A'} ${scope3YoY !== null ? (scope3YoY < 0 ? '✅ REDUCTION' : '⚠️ INCREASE') : ''}\n`)

  // Check for business metrics YoY
  console.log('=== Checking Business Metrics for Intensity YoY ===')

  const { data: orgData } = await supabase
    .from('organizations')
    .select('annual_revenue, annual_customers')
    .eq('id', organizationId)
    .single()

  const { data: sites2025 } = await supabase
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  let totalEmployees2025 = 0
  let totalFloorArea2025 = 0
  sites2025?.forEach(site => {
    totalEmployees2025 += site.total_employees || 0
    totalFloorArea2025 += site.total_area_sqm || 0
  })

  console.log(`2025 Employees: ${totalEmployees2025}`)
  console.log(`2025 Floor Area: ${totalFloorArea2025} m²`)
  console.log(`2025 Revenue: ${orgData?.annual_revenue ? '$' + orgData.annual_revenue.toLocaleString() : 'Not set'}`)
  console.log(`2025 Customers: ${orgData?.annual_customers || 'Not set'}`)

  // Calculate current intensity metrics
  if (totalEmployees2025 > 0 && current2025Total > 0) {
    const perEmployee = current2025Total / totalEmployees2025
    console.log(`\nPer Employee: ${perEmployee.toFixed(2)} tonnes CO₂e / employee`)
  }

  if (totalFloorArea2025 > 0 && current2025Total > 0) {
    const perFloorArea = (current2025Total * 1000) / totalFloorArea2025 // kg CO2e / m²
    console.log(`Per Floor Area: ${perFloorArea.toFixed(2)} kg CO₂e / m²`)
  }

  console.log('\n⚠️  Note: For intensity YoY to work, we need historical business metrics data')
  console.log('    Currently we only have current year business metrics, not 2024 values')
}

verifyYoY()
