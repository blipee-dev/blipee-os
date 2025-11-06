const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkScope2Data() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  console.log('Checking Scope 2 (Energy Indirect Emissions) data...\n')

  // Get all scope2 and GRI 302 metrics from catalog
  const { data: scope2Metrics, error: catalogError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('code.ilike.scope2_%,code.ilike.gri_302%')
    .eq('is_active', true)

  if (catalogError) {
    console.error('Catalog Error:', catalogError)
    return
  }

  console.log(`\n📊 Scope 2 Metrics in Catalog (${scope2Metrics?.length || 0})`)
  console.log('='.repeat(100))

  if (scope2Metrics && scope2Metrics.length > 0) {
    scope2Metrics.forEach(m => {
      console.log(`Code: ${m.code.padEnd(50)} | ${m.name}`)
      console.log(`  Category: ${m.category || 'N/A'} | Unit: ${m.unit || 'N/A'} | Renewable: ${m.is_renewable ? 'Yes' : 'No'}`)
      console.log('-'.repeat(100))
    })
  } else {
    console.log('No Scope 2 metrics found in catalog')
  }

  // Get actual data records for scope2
  const { data: allData, error: dataError } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metric:metrics_catalog(code, name, category, is_renewable),
      site:sites(name, location)
    `)
    .eq('organization_id', organizationId)

  if (dataError) {
    console.error('Data Error:', dataError)
    return
  }

  // Filter scope2 data
  const scope2Records = allData?.filter(d => {
    const code = d.metric?.code || ''
    return code.startsWith('scope2_') || code.startsWith('gri_302')
  }) || []

  console.log(`\n\n📈 Scope 2 Data Records (${scope2Records.length})`)
  console.log('='.repeat(100))

  if (scope2Records.length > 0) {
    // Group by metric code
    const byMetric = {}
    scope2Records.forEach(r => {
      const code = r.metric?.code || 'unknown'
      if (!byMetric[code]) {
        byMetric[code] = {
          code,
          name: r.metric?.name || 'Unknown',
          category: r.metric?.category || 'N/A',
          is_renewable: r.metric?.is_renewable || false,
          records: []
        }
      }
      byMetric[code].records.push(r)
    })

    // Show summary by metric
    console.log('\n📊 Summary by Metric:')
    console.log('='.repeat(100))

    let totalEnergy = 0
    let totalEmissions = 0
    let renewableEnergy = 0

    Object.values(byMetric).sort((a, b) => b.records.length - a.records.length).forEach(m => {
      const totalValue = m.records.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0)
      const emissionsKg = m.records.reduce((sum, r) => sum + (parseFloat(r.co2e_emissions) || 0), 0)
      const emissionsTonnes = emissionsKg / 1000

      totalEnergy += totalValue
      totalEmissions += emissionsKg
      if (m.is_renewable) {
        renewableEnergy += totalValue
      }

      console.log(`\n${m.code}`)
      console.log(`  Name: ${m.name}`)
      console.log(`  Category: ${m.category}`)
      console.log(`  Renewable: ${m.is_renewable ? 'Yes ✅' : 'No'}`)
      console.log(`  Records: ${m.records.length}`)
      console.log(`  Total Value: ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${m.records[0]?.unit || 'N/A'})`)
      console.log(`  Total Emissions: ${emissionsTonnes.toLocaleString('en-US', { maximumFractionDigits: 2 })} tonnes CO2e`)

      // Show period coverage
      const periods = m.records.map(r => r.period_start).sort()
      if (periods.length > 0) {
        console.log(`  Period: ${periods[0]} to ${periods[periods.length - 1]}`)
      }
    })

    // Overall summary
    console.log('\n\n🌍 OVERALL SCOPE 2 SUMMARY')
    console.log('='.repeat(100))
    console.log(`Total Energy Consumption: ${totalEnergy.toLocaleString('en-US', { maximumFractionDigits: 2 })} kWh`)
    console.log(`Total Emissions: ${(totalEmissions / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} tonnes CO2e`)
    console.log(`Renewable Energy: ${renewableEnergy.toLocaleString('en-US', { maximumFractionDigits: 2 })} kWh`)
    console.log(`Renewable Percentage: ${totalEnergy > 0 ? ((renewableEnergy / totalEnergy) * 100).toFixed(1) : 0}%`)
    console.log(`Total Records: ${scope2Records.length}`)

    // Show breakdown by site
    console.log('\n\n🏢 Breakdown by Site:')
    console.log('='.repeat(100))

    const bySite = {}
    scope2Records.forEach(r => {
      const siteName = r.site?.name || 'Unknown Site'
      if (!bySite[siteName]) {
        bySite[siteName] = {
          energy: 0,
          emissions: 0,
          records: 0
        }
      }
      bySite[siteName].energy += parseFloat(r.value) || 0
      bySite[siteName].emissions += (parseFloat(r.co2e_emissions) || 0) / 1000
      bySite[siteName].records++
    })

    Object.entries(bySite).sort((a, b) => b[1].energy - a[1].energy).forEach(([site, data]) => {
      console.log(`\n${site}`)
      console.log(`  Energy: ${data.energy.toLocaleString('en-US', { maximumFractionDigits: 2 })} kWh`)
      console.log(`  Emissions: ${data.emissions.toLocaleString('en-US', { maximumFractionDigits: 2 })} tonnes CO2e`)
      console.log(`  Records: ${data.records}`)
    })

    // Show monthly trend (last 12 months)
    console.log('\n\n📅 Monthly Trend (Recent Data):')
    console.log('='.repeat(100))

    const byMonth = {}
    scope2Records.forEach(r => {
      const month = r.period_start?.substring(0, 7) // YYYY-MM
      if (month) {
        if (!byMonth[month]) {
          byMonth[month] = { energy: 0, emissions: 0 }
        }
        byMonth[month].energy += parseFloat(r.value) || 0
        byMonth[month].emissions += (parseFloat(r.co2e_emissions) || 0) / 1000
      }
    })

    Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12).forEach(([month, data]) => {
      console.log(`${month}: ${data.energy.toLocaleString('en-US', { maximumFractionDigits: 0 })} kWh | ${data.emissions.toLocaleString('en-US', { maximumFractionDigits: 2 })} tonnes CO2e`)
    })

    // Sample records
    console.log('\n\n📝 Sample Records (first 3):')
    console.log('='.repeat(100))
    scope2Records.slice(0, 3).forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.metric?.code || 'unknown'}`)
      console.log(`   Site: ${r.site?.name || 'N/A'}`)
      console.log(`   Period: ${r.period_start} to ${r.period_end}`)
      console.log(`   Value: ${r.value} ${r.unit}`)
      console.log(`   Emissions: ${(parseFloat(r.co2e_emissions || 0) / 1000).toFixed(2)} tonnes CO2e`)
      console.log(`   Quality: ${r.data_quality || 'N/A'}`)
    })
  } else {
    console.log('\n❌ No Scope 2 data records found')
  }
}

checkScope2Data().catch(console.error)
