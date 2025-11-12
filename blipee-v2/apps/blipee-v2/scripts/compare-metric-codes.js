require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function compareMetricCodes() {
  console.log('🔍 Comparing metric codes: scope2_electricity_grid vs gri_305_2_purchased_electricity\n')

  // Get both metrics from catalog
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('code', ['scope2_electricity_grid', 'gri_305_2_purchased_electricity'])

  if (!metrics || metrics.length !== 2) {
    console.log('❌ Could not find both metrics')
    return
  }

  const scopeMetric = metrics.find(m => m.code === 'scope2_electricity_grid')
  const griMetric = metrics.find(m => m.code === 'gri_305_2_purchased_electricity')

  console.log('📊 METRIC COMPARISON:\n')

  console.log('1️⃣  scope2_electricity_grid:')
  console.log(`   ID: ${scopeMetric.id}`)
  console.log(`   Name: ${scopeMetric.name}`)
  console.log(`   Category: ${scopeMetric.category}`)
  console.log(`   Subcategory: ${scopeMetric.subcategory || 'none'}`)
  console.log(`   Unit: ${scopeMetric.unit}`)
  console.log(`   Scope: ${scopeMetric.scope}`)
  console.log(`   Description: ${scopeMetric.description || 'none'}`)
  console.log()

  console.log('2️⃣  gri_305_2_purchased_electricity:')
  console.log(`   ID: ${griMetric.id}`)
  console.log(`   Name: ${griMetric.name}`)
  console.log(`   Category: ${griMetric.category}`)
  console.log(`   Subcategory: ${griMetric.subcategory || 'none'}`)
  console.log(`   Unit: ${griMetric.unit}`)
  console.log(`   Scope: ${griMetric.scope}`)
  console.log(`   Description: ${griMetric.description || 'none'}`)
  console.log()

  // Check if they have data
  const { data: scopeData } = await supabase
    .from('metrics_data')
    .select('id, value, unit, co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .eq('metric_id', scopeMetric.id)
    .order('period_start', { ascending: false })
    .limit(3)

  const { data: griData } = await supabase
    .from('metrics_data')
    .select('id, value, unit, co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .eq('metric_id', griMetric.id)
    .order('period_start', { ascending: false })
    .limit(3)

  console.log('📈 DATA COMPARISON:\n')

  console.log(`1️⃣  scope2_electricity_grid has ${scopeData?.length || 0} records`)
  if (scopeData && scopeData.length > 0) {
    console.log('   Sample data:')
    scopeData.forEach((record, i) => {
      console.log(`      Record ${i+1}: ${record.value} ${record.unit}, emissions: ${record.co2e_emissions} tCO2e`)
    })
  }
  console.log()

  console.log(`2️⃣  gri_305_2_purchased_electricity has ${griData?.length || 0} records`)
  if (griData && griData.length > 0) {
    console.log('   Sample data:')
    griData.forEach((record, i) => {
      console.log(`      Record ${i+1}: ${record.value} ${record.unit}, emissions: ${record.co2e_emissions} tCO2e`)
    })
  }
  console.log()

  // Analysis
  console.log('💡 ANALYSIS:\n')

  if (scopeMetric.unit === griMetric.unit) {
    console.log('⚠️  Same unit! They might be duplicates with different codes')
  } else {
    console.log('✅ Different units:')
    console.log(`   - ${scopeMetric.code}: ${scopeMetric.unit}`)
    console.log(`   - ${griMetric.code}: ${griMetric.unit}`)
    console.log('   They measure DIFFERENT things!')
  }
  console.log()

  if (scopeMetric.name === griMetric.name) {
    console.log('⚠️  Same name! Likely duplicates')
  } else {
    console.log('✅ Different names:')
    console.log(`   - ${scopeMetric.code}: "${scopeMetric.name}"`)
    console.log(`   - ${griMetric.code}: "${griMetric.name}"`)
  }
  console.log()

  if (scopeData && scopeData.length > 0 && griData && griData.length > 0) {
    console.log('⚠️  BOTH have data! They might be duplicates being tracked separately')
  } else if (scopeData && scopeData.length > 0) {
    console.log('✅ Only scope2_electricity_grid has data')
    console.log('   gri_305_2_purchased_electricity would be a VIEW/REPORTING of the emissions')
  } else if (griData && griData.length > 0) {
    console.log('⚠️  Only gri_305_2_purchased_electricity has data')
  } else {
    console.log('   Neither has data')
  }
  console.log()

  console.log('📝 CONCLUSION:')
  if (scopeMetric.unit !== griMetric.unit) {
    console.log('   These are DIFFERENT metrics:')
    console.log(`   - scope2_electricity_grid = Electricity CONSUMPTION (${scopeMetric.unit})`)
    console.log(`   - gri_305_2_purchased_electricity = Electricity EMISSIONS (${griMetric.unit})`)
    console.log('   The emissions are CALCULATED from consumption!')
    console.log('   ✅ Current logic is CORRECT - hide the emissions metric when consumption is tracked')
  } else {
    console.log('   These might be DUPLICATE codes for the same metric!')
    console.log('   ⚠️  Need to investigate why there are two codes')
  }
}

compareMetricCodes().catch(console.error)
