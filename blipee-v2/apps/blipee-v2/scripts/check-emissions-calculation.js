require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function checkEmissionsCalculation() {
  console.log('🔍 Checking if emissions are calculated automatically...\n')

  // 1. Get electricity consumption metric ID
  const { data: electricityMetric } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, unit')
    .eq('code', 'scope2_electricity_grid')
    .single()

  if (!electricityMetric) {
    console.log('❌ Electricity metric not found')
    return
  }

  console.log(`📊 Electricity consumption metric:`)
  console.log(`   Code: ${electricityMetric.code}`)
  console.log(`   Name: ${electricityMetric.name}`)
  console.log(`   Unit: ${electricityMetric.unit}`)
  console.log(`   ID: ${electricityMetric.id}`)

  // 2. Get some sample data for electricity
  const { data: electricityData } = await supabase
    .from('metrics_data')
    .select('id, value, unit, emissions_co2e, period_start, period_end')
    .eq('organization_id', organizationId)
    .eq('metric_id', electricityMetric.id)
    .order('period_start', { ascending: false })
    .limit(5)

  console.log(`\n📋 Sample electricity consumption records (${electricityData?.length || 0}):`)
  if (electricityData && electricityData.length > 0) {
    electricityData.forEach((record, i) => {
      console.log(`\n   Record ${i + 1}:`)
      console.log(`      Value: ${record.value} ${record.unit}`)
      console.log(`      Emissions CO2e: ${record.emissions_co2e !== null ? record.emissions_co2e + ' tCO2e' : 'NOT CALCULATED'}`)
      console.log(`      Period: ${record.period_start} to ${record.period_end}`)
    })

    // Check if emissions are being calculated
    const hasEmissions = electricityData.some(r => r.emissions_co2e !== null)

    console.log(`\n${hasEmissions ? '✅' : '❌'} Emissions calculation:`)
    if (hasEmissions) {
      console.log(`   The system IS calculating emissions automatically from consumption data`)
      console.log(`   emissions_co2e field is populated`)
    } else {
      console.log(`   The system is NOT calculating emissions automatically`)
      console.log(`   emissions_co2e field is NULL`)
    }
  } else {
    console.log('   No data found')
  }

  // 3. Check if there are any records for the emissions metric
  const { data: emissionsMetric } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, unit')
    .eq('code', 'gri_305_2_purchased_electricity')
    .single()

  if (emissionsMetric) {
    console.log(`\n📊 Purchased Electricity Emissions metric:`)
    console.log(`   Code: ${emissionsMetric.code}`)
    console.log(`   Name: ${emissionsMetric.name}`)
    console.log(`   Unit: ${emissionsMetric.unit}`)
    console.log(`   ID: ${emissionsMetric.id}`)

    const { data: emissionsData } = await supabase
      .from('metrics_data')
      .select('id, value, unit')
      .eq('organization_id', organizationId)
      .eq('metric_id', emissionsMetric.id)
      .limit(5)

    console.log(`\n   Data records: ${emissionsData?.length || 0}`)
    if (emissionsData && emissionsData.length > 0) {
      console.log(`   ✅ This metric IS being tracked separately`)
    } else {
      console.log(`   ❌ This metric is NOT being tracked separately`)
      console.log(`   (Could be a gap, or emissions are in the consumption record)`)
    }
  }

  // 4. Show table structure
  console.log(`\n📋 Summary:`)
  console.log(`   • Consumption (scope2_electricity_grid): ${electricityData?.length || 0} records`)
  console.log(`   • Has emissions_co2e field: ${electricityData?.some(r => r.emissions_co2e !== null) ? 'YES' : 'NO'}`)
  console.log(`   • Separate emissions metric tracked: NO`)
  console.log(`\n💡 Conclusion:`)
  if (electricityData?.some(r => r.emissions_co2e !== null)) {
    console.log(`   Emissions ARE calculated and stored in the consumption record`)
    console.log(`   The GRI 305-2 metric is a reporting/view of this calculated data`)
  } else {
    console.log(`   Emissions are NOT being calculated automatically`)
    console.log(`   You might need to track both consumption AND emissions separately`)
  }
}

checkEmissionsCalculation().catch(console.error)
