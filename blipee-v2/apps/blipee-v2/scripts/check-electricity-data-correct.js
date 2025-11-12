require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function checkElectricityDataCorrect() {
  console.log('🔍 Checking electricity data with CORRECT join...\n')

  // 1. First get the metric ID from catalog
  const { data: metric } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, unit')
    .eq('code', 'scope2_electricity_grid')
    .single()

  if (!metric) {
    console.log('❌ Metric not found in catalog')
    return
  }

  console.log(`📊 Metric found:`)
  console.log(`   Code: ${metric.code}`)
  console.log(`   Name: ${metric.name}`)
  console.log(`   ID: ${metric.id}`)
  console.log()

  // 2. Now query metrics_data with this ID
  const { data: records, error } = await supabase
    .from('metrics_data')
    .select('id, value, unit, co2e_emissions, emissions_location_based, emissions_market_based, period_start, period_end')
    .eq('organization_id', organizationId)
    .eq('metric_id', metric.id)
    .order('period_start', { ascending: false })
    .limit(5)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`📋 Data records found: ${records?.length || 0}`)

  if (records && records.length > 0) {
    console.log()
    records.forEach((record, i) => {
      console.log(`Record ${i + 1}:`)
      console.log(`   Value: ${record.value} ${record.unit}`)
      console.log(`   CO2e emissions: ${record.co2e_emissions !== null ? record.co2e_emissions + ' tCO2e' : 'NULL'}`)
      console.log(`   Location-based: ${record.emissions_location_based !== null ? record.emissions_location_based + ' tCO2e' : 'NULL'}`)
      console.log(`   Market-based: ${record.emissions_market_based !== null ? record.emissions_market_based + ' tCO2e' : 'NULL'}`)
      console.log(`   Period: ${record.period_start} to ${record.period_end}`)
      console.log()
    })

    // Check if emissions are calculated
    const hasEmissions = records.some(r =>
      r.co2e_emissions !== null ||
      r.emissions_location_based !== null ||
      r.emissions_market_based !== null
    )

    console.log(`💡 Emissions calculation:`)
    if (hasEmissions) {
      console.log(`   ✅ YES - Emissions ARE being calculated/stored`)
      console.log(`   The system calculates emissions from consumption data`)
      console.log()
      console.log(`📝 Conclusion:`)
      console.log(`   "Purchased Electricity Emissions" (gri_305_2_purchased_electricity) is a`)
      console.log(`   REPORTING/VIEW metric that shows the emissions already calculated`)
      console.log(`   from the consumption data (scope2_electricity_grid).`)
      console.log()
      console.log(`   This is NOT really a gap - it's just a different way to view the same data!`)
    } else {
      console.log(`   ❌ NO - Emissions are NOT being calculated`)
      console.log(`   You need to track emissions separately`)
    }
  } else {
    console.log('❌ No data records found for this metric')
    console.log('   The metric exists in the catalog but has no actual data yet')
  }
}

checkElectricityDataCorrect().catch(console.error)
