/**
 * Update grid_mix metadata in existing metrics_data records
 * with correct renewable percentages from portugal_grid_mix_reference table
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function updateGridMixMetadata() {
  console.log('🔄 Fetching electricity metrics with grid_mix metadata...')

  // Get all electricity metrics
  const { data: metrics, error } = await supabase
    .from('metrics_data')
    .select('id, value, period_start, metadata')
    .eq('metric_id', (await supabase.from('metrics_catalog').select('id').eq('code', 'scope2_electricity_grid').single()).data?.id)
    .not('metadata->grid_mix', 'is', null)

  if (error) {
    console.error('❌ Error fetching metrics:', error)
    return
  }

  console.log(`📊 Found ${metrics?.length} metrics to update`)

  let updated = 0
  let skipped = 0

  for (const metric of metrics || []) {
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
      console.log(`⚠️  No reference data for ${year}-${month.toString().padStart(2, '0')}`)
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
}

updateGridMixMetadata()
