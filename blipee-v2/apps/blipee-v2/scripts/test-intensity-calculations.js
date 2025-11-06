const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testIntensityCalculations() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2' // PLMJ
  const startDate = '2025-01-01'
  const endDate = '2025-12-31'

  console.log('Testing intensity calculations for PLMJ...\n')

  // Get organization business metrics
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('name, annual_revenue, employee_count, floor_area_m2, business_metrics_year')
    .eq('id', organizationId)
    .single()

  if (orgError) {
    console.error('Error fetching org:', orgError)
    return
  }

  console.log('Organization Business Metrics:')
  console.log('================================================================================')
  console.log(`Organization: ${orgData.name}`)
  console.log(`Annual Revenue: $${orgData.annual_revenue.toLocaleString()}`)
  console.log(`Employee Count: ${orgData.employee_count}`)
  console.log(`Floor Area: ${orgData.floor_area_m2.toLocaleString()} m²`)
  console.log(`Metrics Year: ${orgData.business_metrics_year}\n`)

  // Get total emissions for 2025
  const { data: metricsData, error: metricsError } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('organization_id', organizationId)
    .gte('period_start', startDate)
    .lte('period_end', endDate)

  if (metricsError) {
    console.error('Error fetching metrics:', metricsError)
    return
  }

  const totalEmissions = metricsData.reduce((sum, record) => sum + (record.co2e_emissions || 0), 0)

  console.log('Emissions Data:')
  console.log('================================================================================')
  console.log(`Total Emissions (2025): ${totalEmissions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tonnes CO₂e`)
  console.log(`Number of records: ${metricsData.length}\n`)

  // Calculate intensity metrics
  console.log('Intensity Metrics (GRI 305-4):')
  console.log('================================================================================')

  // Per employee
  const perEmployee = totalEmissions / orgData.employee_count
  console.log(`Per Employee: ${perEmployee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tonnes CO₂e / employee`)
  console.log(`  Calculation: ${totalEmissions.toFixed(2)} / ${orgData.employee_count} = ${perEmployee.toFixed(2)}`)

  // Per revenue million
  const revenueMillion = orgData.annual_revenue / 1000000
  const perRevenueMillion = totalEmissions / revenueMillion
  console.log(`\nPer Revenue: ${perRevenueMillion.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tonnes CO₂e / $M revenue`)
  console.log(`  Calculation: ${totalEmissions.toFixed(2)} / ${revenueMillion} = ${perRevenueMillion.toFixed(2)}`)

  // Per floor area (in kg CO2e per m²)
  const perFloorAreaM2 = (totalEmissions * 1000) / orgData.floor_area_m2
  console.log(`\nPer Floor Area: ${perFloorAreaM2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg CO₂e / m²`)
  console.log(`  Calculation: (${totalEmissions.toFixed(2)} * 1000) / ${orgData.floor_area_m2} = ${perFloorAreaM2.toFixed(2)}`)

  console.log('\n================================================================================')
}

testIntensityCalculations()
