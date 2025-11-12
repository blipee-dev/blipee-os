require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Define the relationships between consumption metrics and their derived emission metrics
const DERIVED_METRICS_RELATIONSHIPS = [
  // Scope 2 - Electricity - Emissions
  {
    parent: 'scope2_electricity_grid',
    derived: [
      'gri_305_2_purchased_electricity',
      'gri_305_2_location_based',
      'gri_305_2_market_based',
      'gri_305_2_indirect_emissions'
    ],
    calculation_type: 'emission_factor'
  },
  // Scope 2 - Electricity - Unit Conversion (kWh → GJ for GRI reporting)
  {
    parent: 'scope2_electricity_grid',
    derived: ['gri_302_1_electricity_consumption'],
    calculation_type: 'unit_conversion'
  },
  // Scope 2 - Heating - Emissions
  {
    parent: 'scope2_purchased_heating',
    derived: ['gri_305_2_purchased_heating'],
    calculation_type: 'emission_factor'
  },
  // Scope 2 - Heating - Unit Conversion
  {
    parent: 'scope2_purchased_heating',
    derived: ['gri_302_1_heating_consumption'],
    calculation_type: 'unit_conversion'
  },
  {
    parent: 'scope2_district_heating',
    derived: ['gri_302_1_heating_consumption'],
    calculation_type: 'unit_conversion'
  },
  // Scope 2 - Cooling - Emissions
  {
    parent: 'scope2_purchased_cooling',
    derived: ['gri_305_2_purchased_cooling'],
    calculation_type: 'emission_factor'
  },
  // Scope 2 - Cooling - Unit Conversion
  {
    parent: 'scope2_purchased_cooling',
    derived: ['gri_302_1_cooling_consumption'],
    calculation_type: 'unit_conversion'
  },
  {
    parent: 'scope2_district_cooling',
    derived: ['gri_302_1_cooling_consumption'],
    calculation_type: 'unit_conversion'
  },
  // Scope 2 - Steam - Emissions
  {
    parent: 'scope2_purchased_steam',
    derived: ['gri_305_2_purchased_steam'],
    calculation_type: 'emission_factor'
  },
  // Water metrics - consumption to discharge/treatment
  {
    parent: 'gri_303_3_withdrawal_total',
    derived: ['gri_303_4_discharge_total', 'gri_303_5_consumption_total'],
    calculation_type: 'water_balance'
  },
  // Add more relationships as needed
]

async function populateDerivedMetrics() {
  console.log('🔄 Populating derived metrics relationships...\n')

  let totalUpdated = 0
  let totalErrors = 0

  for (const relationship of DERIVED_METRICS_RELATIONSHIPS) {
    console.log(`\n📊 Processing parent: ${relationship.parent}`)

    // Get parent metric ID
    const { data: parentMetric, error: parentError } = await supabase
      .from('metrics_catalog')
      .select('id, code, name')
      .eq('code', relationship.parent)
      .single()

    if (parentError || !parentMetric) {
      console.log(`   ❌ Parent metric not found: ${relationship.parent}`)
      totalErrors++
      continue
    }

    console.log(`   ✅ Parent found: ${parentMetric.name}`)
    console.log(`   📝 Updating ${relationship.derived.length} derived metrics...`)

    // Update each derived metric
    for (const derivedCode of relationship.derived) {
      const { data: updated, error: updateError } = await supabase
        .from('metrics_catalog')
        .update({
          parent_metric_id: parentMetric.id,
          is_calculated: true,
          calculation_type: relationship.calculation_type
        })
        .eq('code', derivedCode)
        .select('code, name')

      if (updateError) {
        console.log(`      ❌ Error updating ${derivedCode}: ${updateError.message}`)
        totalErrors++
      } else if (updated && updated.length > 0) {
        console.log(`      ✅ Updated: ${derivedCode} - ${updated[0].name}`)
        totalUpdated++
      } else {
        console.log(`      ⚠️  Not found: ${derivedCode}`)
      }
    }
  }

  console.log(`\n\n📈 Summary:`)
  console.log(`   ✅ Successfully updated: ${totalUpdated} metrics`)
  console.log(`   ❌ Errors: ${totalErrors}`)

  // Verify the updates
  console.log(`\n🔍 Verifying updates...`)
  const { data: calculatedMetrics, error: verifyError } = await supabase
    .from('metrics_catalog')
    .select('code, name, is_calculated, calculation_type, parent:parent_metric_id(code, name)')
    .eq('is_calculated', true)
    .order('code')

  if (verifyError) {
    console.error('❌ Verification error:', verifyError)
    return
  }

  console.log(`\n📋 All calculated metrics (${calculatedMetrics?.length || 0}):`)
  calculatedMetrics?.forEach(m => {
    console.log(`\n   ${m.code}`)
    console.log(`      Name: ${m.name}`)
    console.log(`      Parent: ${m.parent?.code} (${m.parent?.name})`)
    console.log(`      Type: ${m.calculation_type}`)
  })
}

populateDerivedMetrics().catch(console.error)
