/**
 * Backfill Grid Mix Data
 *
 * This script fetches historical grid mix data from Electricity Maps API
 * and stores it in the metadata field of existing electricity consumption records.
 *
 * Usage:
 *   npx tsx scripts/backfill-grid-mix.ts [--dry-run] [--org-id=<id>]
 *
 * Options:
 *   --dry-run    Preview changes without updating the database
 *   --org-id     Process specific organization (default: all organizations)
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { getCarbonIntensityPast, getPowerBreakdownPast, getZoneFromCountry } from '../src/lib/apis/electricity-maps'

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const orgIdArg = args.find(arg => arg.startsWith('--org-id='))
const targetOrgId = orgIdArg ? orgIdArg.split('=')[1] : null

interface GridMixData {
  zone: string
  datetime: string
  renewable_percentage: number
  non_renewable_percentage: number
  carbon_intensity: number
  fossil_free_percentage: number
  sources: Array<{
    name: string
    percentage: number
    renewable: boolean
  }>
}

interface EnergyRecord {
  id: string
  period_start: string
  value: number
  site_id: string
  metadata: any
}

/**
 * Fetch grid mix data from Electricity Maps for a specific date and zone
 */
async function fetchGridMixForDate(zone: string, date: Date): Promise<GridMixData | null> {
  try {
    console.log(`  📡 Fetching grid mix for ${zone} on ${date.toISOString().split('T')[0]}...`)

    // Set time to noon for representative daily snapshot
    date.setHours(12, 0, 0, 0)
    const datetime = date.toISOString()

    // Fetch both carbon intensity and power breakdown for the specific date
    const [carbonData, powerData] = await Promise.all([
      getCarbonIntensityPast(zone, datetime),
      getPowerBreakdownPast(zone, datetime)
    ])

    if (!carbonData || !powerData) {
      console.log(`  ⚠️  No data available from Electricity Maps`)
      return null
    }

    // Map power consumption breakdown to sources
    const consumption = powerData.powerConsumptionBreakdown || {}
    const total = powerData.powerConsumptionTotal || 0

    const renewableSources = ['solar', 'wind', 'hydro', 'hydro discharge', 'geothermal', 'biomass', 'battery discharge']
    const sources: Array<{ name: string; percentage: number; renewable: boolean }> = []

    let renewablePower = 0
    let fossilFreePower = 0

    Object.entries(consumption).forEach(([source, value]) => {
      if (typeof value === 'number' && value > 0) {
        const isRenewable = renewableSources.includes(source.toLowerCase())
        const isFossilFree = isRenewable || source.toLowerCase() === 'nuclear'

        if (isRenewable) renewablePower += value
        if (isFossilFree) fossilFreePower += value

        const percentage = total > 0 ? (value / total) * 100 : 0
        if (percentage > 0.1) { // Only include sources > 0.1%
          sources.push({
            name: source.charAt(0).toUpperCase() + source.slice(1),
            percentage: Math.round(percentage * 100) / 100,
            renewable: isRenewable
          })
        }
      }
    })

    // Sort sources by percentage descending
    sources.sort((a, b) => b.percentage - a.percentage)

    const renewablePercentage = total > 0 ? (renewablePower / total) * 100 : 0
    const fossilFreePercentage = total > 0 ? (fossilFreePower / total) * 100 : 0

    return {
      zone,
      datetime: date.toISOString(),
      renewable_percentage: Math.round(renewablePercentage * 100) / 100,
      non_renewable_percentage: Math.round((100 - renewablePercentage) * 100) / 100,
      carbon_intensity: carbonData.carbonIntensity,
      fossil_free_percentage: Math.round(fossilFreePercentage * 100) / 100,
      sources
    }
  } catch (error) {
    console.error(`  ❌ Error fetching grid mix:`, error)
    return null
  }
}

/**
 * Get site country for a given site ID
 */
async function getSiteCountry(siteId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('sites')
    .select('country')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    return null
  }

  return data.country
}

/**
 * Main backfill function
 */
async function backfillGridMix() {
  console.log('🔄 Starting grid mix backfill...\n')
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '✍️  WRITE MODE'}\n`)

  // Build query for electricity records
  let query = supabase
    .from('metrics_data')
    .select('id, period_start, value, site_id, metadata, metric_id')
    .gte('period_start', '2022-01-01')
    .order('period_start', { ascending: true })

  if (targetOrgId) {
    console.log(`🎯 Targeting organization: ${targetOrgId}\n`)
    query = query.eq('organization_id', targetOrgId)
  }

  const { data: records, error } = await query

  if (error) {
    console.error('❌ Error fetching records:', error)
    process.exit(1)
  }

  if (!records || records.length === 0) {
    console.log('✅ No records found to process')
    return
  }

  // Filter for electricity metrics only
  const { data: electricityMetrics } = await supabase
    .from('metrics_catalog')
    .select('id')
    .in('category', ['Purchased Energy', 'Electricity'])
    .eq('is_active', true)

  const electricityMetricIds = new Set(electricityMetrics?.map(m => m.id) || [])

  const electricityRecords = records.filter(r =>
    electricityMetricIds.has(r.metric_id) &&
    (!r.metadata?.grid_mix || !r.metadata?.grid_mix?.source)
  )

  console.log(`📊 Found ${records.length} total records`)
  console.log(`⚡ ${electricityRecords.length} electricity records need grid mix data\n`)

  if (electricityRecords.length === 0) {
    console.log('✅ All electricity records already have grid mix data')
    return
  }

  // Group by site and date to minimize API calls
  const groups = new Map<string, EnergyRecord[]>()

  for (const record of electricityRecords) {
    const date = record.period_start.split('T')[0]
    const key = `${record.site_id}:${date}`

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(record)
  }

  console.log(`📅 Grouped into ${groups.size} unique site-date combinations\n`)

  let processedCount = 0
  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  // Process each group
  for (const [key, groupRecords] of groups.entries()) {
    const [siteId, dateStr] = key.split(':')
    processedCount++

    console.log(`\n[${processedCount}/${groups.size}] Processing ${dateStr} at site ${siteId.substring(0, 8)}...`)
    console.log(`  📝 ${groupRecords.length} record(s) in this group`)

    // Get site country
    const country = await getSiteCountry(siteId)
    if (!country) {
      console.log(`  ⚠️  Skipping: Site has no country`)
      skippedCount += groupRecords.length
      continue
    }

    // Get zone from country
    const zone = getZoneFromCountry(country)
    if (!zone) {
      console.log(`  ⚠️  Skipping: Country "${country}" not supported by Electricity Maps`)
      skippedCount += groupRecords.length
      continue
    }

    // Skip future dates
    const date = new Date(dateStr)
    if (date > new Date()) {
      console.log(`  ⚠️  Skipping: Future date`)
      skippedCount += groupRecords.length
      continue
    }

    // Fetch grid mix for this date
    const gridMix = await fetchGridMixForDate(zone, date)

    if (!gridMix) {
      console.log(`  ❌ Failed to fetch grid mix`)
      errorCount += groupRecords.length
      continue
    }

    console.log(`  ✅ Renewable: ${gridMix.renewable_percentage}%`)
    console.log(`  🏭 Carbon Intensity: ${gridMix.carbon_intensity} gCO₂/kWh`)
    console.log(`  📊 Sources: ${gridMix.sources.length} types`)

    // Update all records in this group
    for (const record of groupRecords) {
      const consumption = parseFloat(String(record.value)) || 0
      const renewableKwh = consumption * (gridMix.renewable_percentage / 100)
      const nonRenewableKwh = consumption * (gridMix.non_renewable_percentage / 100)

      const newMetadata = {
        ...(record.metadata || {}),
        grid_mix: {
          provider: 'Electricity Maps',
          zone: gridMix.zone,
          datetime: gridMix.datetime,
          country: country,
          renewable_percentage: gridMix.renewable_percentage,
          non_renewable_percentage: gridMix.non_renewable_percentage,
          renewable_kwh: Math.round(renewableKwh * 100) / 100,
          non_renewable_kwh: Math.round(nonRenewableKwh * 100) / 100,
          carbon_intensity: gridMix.carbon_intensity,
          fossil_free_percentage: gridMix.fossil_free_percentage,
          sources: gridMix.sources,
          source: 'electricity_maps_api',
          backfilled_at: new Date().toISOString()
        }
      }

      if (!isDryRun) {
        const { error: updateError } = await supabase
          .from('metrics_data')
          .update({ metadata: newMetadata })
          .eq('id', record.id)

        if (updateError) {
          console.log(`  ❌ Error updating record ${record.id}:`, updateError.message)
          errorCount++
        } else {
          updatedCount++
        }
      } else {
        console.log(`  🔍 Would update record ${record.id}: ${renewableKwh.toFixed(1)} kWh renewable`)
        updatedCount++
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Backfill Summary')
  console.log('='.repeat(60))
  console.log(`Total electricity records: ${electricityRecords.length}`)
  console.log(`Site-date groups processed: ${processedCount}`)
  console.log(`✅ Successfully updated: ${updatedCount}`)
  console.log(`⚠️  Skipped: ${skippedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log('='.repeat(60))

  if (isDryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.')
  }
}

// Run the script
backfillGridMix()
  .then(() => {
    console.log('\n✅ Backfill complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error)
    process.exit(1)
  })
