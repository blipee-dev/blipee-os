const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkScope1Data() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  console.log('Checking Scope 1 (Direct Emissions) data...\n')

  // Get all scope1 metrics from catalog
  const { data: scope1Metrics, error: catalogError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('code.ilike.scope1_%,code.ilike.gri_305_1%')
    .eq('is_active', true)

  if (catalogError) {
    console.error('Catalog Error:', catalogError)
    return
  }

  console.log(`\n📊 Scope 1 Metrics in Catalog (${scope1Metrics?.length || 0})`)
  console.log('='.repeat(100))

  if (scope1Metrics && scope1Metrics.length > 0) {
    scope1Metrics.forEach(m => {
      console.log(`Code: ${m.code.padEnd(50)} | ${m.name}`)
      console.log(`  Category: ${m.category || 'N/A'} | Unit: ${m.unit || 'N/A'}`)
      console.log('-'.repeat(100))
    })
  } else {
    console.log('No Scope 1 metrics found in catalog')
  }

  // Get actual data records for scope1
  const { data: scope1Data, error: dataError } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metric:metrics_catalog(code, name, category),
      site:sites(name, location)
    `)
    .eq('organization_id', organizationId)

  if (dataError) {
    console.error('Data Error:', dataError)
    return
  }

  // Filter scope1 data
  const scope1Records = scope1Data?.filter(d => {
    const code = d.metric?.code || ''
    return code.startsWith('scope1_') || code.startsWith('gri_305_1')
  }) || []

  console.log(`\n\n📈 Scope 1 Data Records (${scope1Records.length})`)
  console.log('='.repeat(100))

  if (scope1Records.length > 0) {
    // Group by metric code
    const byMetric = {}
    scope1Records.forEach(r => {
      const code = r.metric?.code || 'unknown'
      if (!byMetric[code]) {
        byMetric[code] = {
          code,
          name: r.metric?.name || 'Unknown',
          category: r.metric?.category || 'N/A',
          records: []
        }
      }
      byMetric[code].records.push(r)
    })

    // Show summary
    console.log('\nSummary by Metric:')
    Object.values(byMetric).forEach(m => {
      const totalValue = m.records.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0)
      const totalEmissions = m.records.reduce((sum, r) => sum + (parseFloat(r.co2e_emissions) || 0), 0) / 1000
      console.log(`\n${m.code}`)
      console.log(`  Name: ${m.name}`)
      console.log(`  Category: ${m.category}`)
      console.log(`  Records: ${m.records.length}`)
      console.log(`  Total Value: ${totalValue.toFixed(2)}`)
      console.log(`  Total Emissions: ${totalEmissions.toFixed(2)} tonnes CO2e`)
    })

    // Show sample records
    console.log('\n\nSample Records (first 5):')
    scope1Records.slice(0, 5).forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.metric?.code || 'unknown'}`)
      console.log(`   Site: ${r.site?.name || 'N/A'}`)
      console.log(`   Period: ${r.period_start} to ${r.period_end}`)
      console.log(`   Value: ${r.value} ${r.unit}`)
      console.log(`   Emissions: ${(parseFloat(r.co2e_emissions || 0) / 1000).toFixed(2)} tonnes CO2e`)
      console.log(`   Quality: ${r.data_quality || 'N/A'}`)
    })
  } else {
    console.log('\n❌ No Scope 1 data records found')
    console.log('\nScope 1 includes direct emissions from:')
    console.log('  - Stationary combustion (natural gas, fuel oil, coal)')
    console.log('  - Mobile combustion (company vehicles, fleet)')
    console.log('  - Fugitive emissions (refrigerants, AC leaks)')
    console.log('  - Process emissions (chemical reactions, manufacturing)')
  }

  // Check all emission-related metrics
  console.log('\n\n🔍 All Emission-Related Metrics in Data:')
  console.log('='.repeat(100))

  const emissionMetrics = scope1Data?.filter(d => {
    const code = d.metric?.code || ''
    return code.includes('scope') || code.includes('emission') || code.includes('gri_305')
  }) || []

  const uniqueEmissionCodes = [...new Set(emissionMetrics.map(d => d.metric?.code))].filter(Boolean)

  console.log(`\nFound ${uniqueEmissionCodes.length} unique emission metric codes:`)
  uniqueEmissionCodes.forEach(code => {
    const count = emissionMetrics.filter(d => d.metric?.code === code).length
    const metric = emissionMetrics.find(d => d.metric?.code === code)?.metric
    console.log(`  ${code.padEnd(50)} | ${count.toString().padStart(4)} records | ${metric?.name || 'N/A'}`)
  })
}

checkScope1Data().catch(console.error)
