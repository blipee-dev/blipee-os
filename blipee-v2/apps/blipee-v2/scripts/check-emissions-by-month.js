const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEmissionsData() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  console.log('Checking emissions data for 2025...\n')

  const { data, error } = await supabase
    .from('metrics_data')
    .select(`
      period_start,
      period_end,
      co2e_emissions,
      metric:metrics_catalog(code, name)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')
    .order('period_start')

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('No emissions data found for 2025')
    return
  }

  // Group by month and scope
  const monthlyData = {}

  data.forEach(record => {
    const month = record.period_start?.substring(0, 7)
    const code = record.metric?.code || ''
    const emissions = (record.co2e_emissions || 0) / 1000 // tonnes

    if (!month) return

    if (!monthlyData[month]) {
      monthlyData[month] = { scope1: 0, scope2: 0, scope3: 0, total: 0 }
    }

    if (code.startsWith('scope1_') || code.includes('gri_305_1')) {
      monthlyData[month].scope1 += emissions
      monthlyData[month].total += emissions
    } else if (code.startsWith('scope2_') || code.includes('gri_305_2')) {
      monthlyData[month].scope2 += emissions
      monthlyData[month].total += emissions
    } else if (code.startsWith('scope3_') && !code.includes('waste')) {
      monthlyData[month].scope3 += emissions
      monthlyData[month].total += emissions
    }
  })

  console.log('Monthly Emissions (tonnes CO2e):\n')
  Object.keys(monthlyData).sort().forEach(month => {
    const d = monthlyData[month]
    console.log(`${month}: Total=${d.total.toFixed(2)}, Scope1=${d.scope1.toFixed(2)}, Scope2=${d.scope2.toFixed(2)}, Scope3=${d.scope3.toFixed(2)}`)
  })

  console.log(`\nTotal records found: ${data.length}`)
}

checkEmissionsData()
