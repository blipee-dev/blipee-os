const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateDiscrepancy() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  const startDate = '2025-01-01'
  const endDate = '2025-12-31'

  console.log('Investigating emissions discrepancy...\n')

  // Get ALL metrics with CO2e emissions for 2025
  const { data: allMetrics, error } = await supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      period_start,
      metric:metrics_catalog(code, name, category)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', startDate)
    .lte('period_end', endDate)
    .not('co2e_emissions', 'is', null)
    .order('co2e_emissions', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Total metrics with CO2e emissions: ${allMetrics.length}\n`)

  // Group by metric code to see what we have
  const byCode = {}
  let totalEmissions = 0

  allMetrics.forEach(m => {
    const code = m.metric?.code || 'unknown'
    const emissions = (m.co2e_emissions || 0) / 1000 // tonnes

    if (!byCode[code]) {
      byCode[code] = {
        name: m.metric?.name || 'Unknown',
        category: m.metric?.category || 'Unknown',
        count: 0,
        total: 0
      }
    }
    byCode[code].count++
    byCode[code].total += emissions
    totalEmissions += emissions
  })

  console.log('Emissions by Metric Code:\n')
  Object.keys(byCode)
    .sort((a, b) => byCode[b].total - byCode[a].total)
    .forEach(code => {
      const info = byCode[code]
      console.log(`${code}:`)
      console.log(`  Name: ${info.name}`)
      console.log(`  Category: ${info.category}`)
      console.log(`  Records: ${info.count}`)
      console.log(`  Total: ${info.total.toFixed(2)} tonnes`)
      console.log()
    })

  console.log(`\nTOTAL ALL EMISSIONS: ${totalEmissions.toFixed(2)} tonnes\n`)

  // Now check what the current filter logic includes
  const filtered = allMetrics.filter((m) => {
    const code = m.metric?.code || ''
    return (
      code.startsWith('gri_305') ||
      code.startsWith('scope1_') ||
      code.startsWith('scope2_') ||
      (code.startsWith('scope3_') && !code.includes('waste'))
    )
  })

  let filteredTotal = 0
  filtered.forEach(m => {
    filteredTotal += (m.co2e_emissions || 0) / 1000
  })

  console.log(`Current Filter Logic Results:`)
  console.log(`  Records: ${filtered.length}`)
  console.log(`  Total: ${filteredTotal.toFixed(2)} tonnes\n`)

  console.log(`Difference: ${(totalEmissions - filteredTotal).toFixed(2)} tonnes\n`)

  // Check which records are being excluded
  const excluded = allMetrics.filter((m) => {
    const code = m.metric?.code || ''
    return !(
      code.startsWith('gri_305') ||
      code.startsWith('scope1_') ||
      code.startsWith('scope2_') ||
      (code.startsWith('scope3_') && !code.includes('waste'))
    )
  })

  if (excluded.length > 0) {
    console.log('EXCLUDED Records:\n')
    const excludedByCode = {}
    excluded.forEach(m => {
      const code = m.metric?.code || 'unknown'
      const emissions = (m.co2e_emissions || 0) / 1000
      if (!excludedByCode[code]) {
        excludedByCode[code] = { count: 0, total: 0, name: m.metric?.name }
      }
      excludedByCode[code].count++
      excludedByCode[code].total += emissions
    })

    Object.keys(excludedByCode).forEach(code => {
      const info = excludedByCode[code]
      console.log(`${code}: ${info.total.toFixed(2)} tonnes (${info.count} records) - ${info.name}`)
    })
  }
}

investigateDiscrepancy()
