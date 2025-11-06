const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateAllGridMix() {
  console.log('🔄 Updating ALL metrics with grid_mix metadata...\n')

  // Get all scope2 metrics with grid_mix metadata
  const { data: metrics, error } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      metadata,
      metric:metrics_catalog(code)
    `)
    .like('metric.code', 'scope2_%')
    .not('metadata->grid_mix', 'is', null)

  if (error) {
    console.error('❌ Error fetching metrics:', error)
    return
  }

  console.log(`📊 Found ${metrics.length} metrics with grid_mix metadata\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const metric of metrics) {
    const periodStart = new Date(metric.period_start)
    const year = periodStart.getFullYear()
    const month = periodStart.getMonth() + 1

    // Get correct renewable percentage from reference table
    const { data: refData } = await supabase
      .from('portugal_grid_mix_reference')
      .select('renewable_percentage, carbon_intensity')
      .eq('year', year)
      .eq('month', month)
      .is('quarter', null)
      .maybeSingle()

    if (!refData) {
      console.log(`⚠️  No reference data for ${year}-${month.toString().padStart(2, '0')} (${metric.metric.code})`)
      skipped++
      continue
    }

    const renewablePercentage = refData.renewable_percentage
    const nonRenewablePercentage = 100 - renewablePercentage
    const value = metric.value

    // Calculate new renewable and non-renewable kWh
    const renewableKwh = (value * renewablePercentage) / 100
    const nonRenewableKwh = (value * nonRenewablePercentage) / 100

    // Update metadata
    const updatedMetadata = {
      ...metric.metadata,
      grid_mix: {
        ...metric.metadata.grid_mix,
        renewable_percentage: renewablePercentage,
        renewable_kwh: renewableKwh,
        non_renewable_kwh: nonRenewableKwh,
        carbon_intensity: refData.carbon_intensity,
        updated_at: new Date().toISOString(),
        source: 'portugal_grid_mix_reference'
      }
    }

    const { error: updateError } = await supabase
      .from('metrics_data')
      .update({ metadata: updatedMetadata })
      .eq('id', metric.id)

    if (updateError) {
      console.error(`❌ Error updating metric ${metric.id}:`, updateError)
      errors++
    } else {
      updated++
      if (updated % 10 === 0) {
        console.log(`✅ Updated ${updated} metrics...`)
      }
    }
  }

  console.log(`\n✨ Done!`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)

  // Now verify the results
  console.log('\n🔍 Verifying results...')
  const { data: verifyData } = await supabase
    .from('metrics_data')
    .select(`
      metadata,
      metric:metrics_catalog(code)
    `)
    .eq('metric.code', 'scope2_ev_charging')
    .gte('period_start', '2025-01-01')
    .limit(3)

  console.log('\nEV Charging samples after update:')
  verifyData.forEach(d => {
    console.log(`  ${d.metric.code}: ${d.metadata.grid_mix.renewable_percentage}% renewable`)
  })
}

updateAllGridMix()
