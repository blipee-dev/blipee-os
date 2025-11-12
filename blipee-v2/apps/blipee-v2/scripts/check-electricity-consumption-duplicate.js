require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkElectricityConsumptionDuplicate() {
  console.log('🔍 Checking if Electricity Consumption is a duplicate...\n')

  // Get both metrics
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('code', ['scope2_electricity_grid', 'gri_302_1_electricity_consumption'])

  if (!metrics || metrics.length !== 2) {
    console.log(`❌ Could not find both metrics (found ${metrics?.length || 0})`)
    return
  }

  const scopeMetric = metrics.find(m => m.code === 'scope2_electricity_grid')
  const griMetric = metrics.find(m => m.code === 'gri_302_1_electricity_consumption')

  console.log('📊 DETAILED COMPARISON:\n')

  console.log('1️⃣  scope2_electricity_grid (TRACKED):')
  console.log(`   Name: ${scopeMetric.name}`)
  console.log(`   Category: ${scopeMetric.category} › ${scopeMetric.subcategory || '(none)'}`)
  console.log(`   Unit: ${scopeMetric.unit}`)
  console.log(`   Scope: ${scopeMetric.scope}`)
  console.log(`   Description: ${scopeMetric.description || '(none)'}`)
  console.log()

  console.log('2️⃣  gri_302_1_electricity_consumption (OPPORTUNITY):')
  console.log(`   Name: ${griMetric.name}`)
  console.log(`   Category: ${griMetric.category} › ${griMetric.subcategory || '(none)'}`)
  console.log(`   Unit: ${griMetric.unit}`)
  console.log(`   Scope: ${griMetric.scope}`)
  console.log(`   Description: ${griMetric.description || '(none)'}`)
  console.log()

  // Unit conversion check
  console.log('🔄 UNIT ANALYSIS:')
  console.log(`   scope2_electricity_grid: ${scopeMetric.unit}`)
  console.log(`   gri_302_1_electricity_consumption: ${griMetric.unit}`)

  if (scopeMetric.unit === 'kWh' && griMetric.unit === 'GJ') {
    console.log('   → These are the SAME physical quantity (energy) in different units!')
    console.log('   → 1 GJ = 277.778 kWh')
    console.log('   ⚠️  This is likely a DUPLICATE!')
  } else if (scopeMetric.unit === griMetric.unit) {
    console.log('   → Same unit! Definitely a duplicate!')
  } else {
    console.log('   → Different units, might be different metrics')
  }
  console.log()

  // Purpose analysis
  console.log('📝 PURPOSE ANALYSIS:')

  const scopePurpose = 'Tracks electricity consumption from the grid (operational metric)'
  const griPurpose = 'GRI 302-1 reporting metric for total electricity consumption'

  console.log(`   scope2_electricity_grid: ${scopePurpose}`)
  console.log(`   gri_302_1_electricity_consumption: ${griPurpose}`)
  console.log()

  console.log('💡 CONCLUSION:')

  if ((scopeMetric.unit === 'kWh' && griMetric.unit === 'GJ') ||
      (scopeMetric.unit === griMetric.unit)) {
    console.log('   ⚠️  These appear to be DUPLICATE metrics!')
    console.log()
    console.log('   OPTIONS:')
    console.log('   1. Mark gri_302_1_electricity_consumption as CALCULATED from scope2_electricity_grid')
    console.log('      (just a unit conversion)')
    console.log()
    console.log('   2. OR treat them as different:')
    console.log('      - scope2_* = Operational tracking (kWh)')
    console.log('      - gri_302_* = GRI reporting standard (GJ)')
    console.log()
    console.log('   RECOMMENDATION:')
    console.log('   Since you already track electricity in scope2_electricity_grid,')
    console.log('   gri_302_1_electricity_consumption should be marked as a DERIVED metric')
    console.log('   (it\'s just the same data converted to GJ for GRI reporting)')
  } else {
    console.log('   ✅ These are different metrics')
  }
  console.log()

  // Check if there's a pattern
  console.log('🔍 Checking for more potential duplicates...\n')

  const { data: allScope2 } = await supabase
    .from('metrics_catalog')
    .select('code, name, unit')
    .eq('is_active', true)
    .like('code', 'scope2%')
    .order('code')

  const { data: allGRI302 } = await supabase
    .from('metrics_catalog')
    .select('code, name, unit')
    .eq('is_active', true)
    .like('code', 'gri_302%')
    .order('code')

  console.log(`Found ${allScope2?.length || 0} scope2_* metrics`)
  console.log(`Found ${allGRI302?.length || 0} gri_302_* metrics`)
  console.log()

  console.log('Potential unit conversion duplicates:')
  allScope2?.forEach(s2 => {
    allGRI302?.forEach(gri => {
      // Check if they might be measuring the same thing
      const s2Lower = s2.name.toLowerCase()
      const griLower = gri.name.toLowerCase()

      if ((s2Lower.includes('electricity') && griLower.includes('electricity')) ||
          (s2Lower.includes('heating') && griLower.includes('heating')) ||
          (s2Lower.includes('cooling') && griLower.includes('cooling'))) {

        // Check if units are energy-related
        const energyUnits = ['kWh', 'GJ', 'MJ', 'MWh', 'TJ']
        if (energyUnits.includes(s2.unit) && energyUnits.includes(gri.unit) && s2.unit !== gri.unit) {
          console.log(`   ⚠️  ${s2.code} (${s2.unit}) ↔️ ${gri.code} (${gri.unit})`)
          console.log(`      "${s2.name}" vs "${gri.name}"`)
        }
      }
    })
  })
}

checkElectricityConsumptionDuplicate().catch(console.error)
