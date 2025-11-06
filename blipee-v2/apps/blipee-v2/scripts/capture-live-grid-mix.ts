/**
 * Capture Live Grid Mix Data
 *
 * This script fetches CURRENT grid mix data from Electricity Maps /latest endpoint
 * and stores it in the database. Run this periodically (e.g., hourly via cron)
 * to build historical grid mix data over time.
 *
 * Usage:
 *   npx tsx scripts/capture-live-grid-mix.ts [--dry-run]
 *
 * Cron example (run every hour):
 *   0 * * * * cd /path/to/app && npx tsx scripts/capture-live-grid-mix.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ELECTRICITY_MAPS_API_KEY = process.env.ELECTRICITY_MAPS_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ELECTRICITY_MAPS_API_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

interface GridMixSnapshot {
  zone: string
  datetime: string
  carbon_intensity: number // gCO2e/kWh
  renewable_percentage: number
  fossil_free_percentage: number
  price_day_ahead?: number // EUR/MWh
  power_consumption_breakdown: Record<string, number>
}

/**
 * Fetch current grid mix data from Electricity Maps /latest endpoint
 */
async function fetchCurrentGridMix(zone: string): Promise<GridMixSnapshot | null> {
  try {
    const baseUrl = 'https://api.electricitymaps.com/v3'

    // Fetch carbon intensity, power breakdown, and price in parallel
    const [carbonResponse, powerResponse, priceResponse] = await Promise.all([
      fetch(`${baseUrl}/carbon-intensity/latest?zone=${zone}`, {
        headers: { 'auth-token': ELECTRICITY_MAPS_API_KEY },
      }),
      fetch(`${baseUrl}/power-breakdown/latest?zone=${zone}`, {
        headers: { 'auth-token': ELECTRICITY_MAPS_API_KEY },
      }),
      fetch(`${baseUrl}/price-day-ahead/latest?zone=${zone}`, {
        headers: { 'auth-token': ELECTRICITY_MAPS_API_KEY },
      }).catch(() => null), // Price might not always be available
    ])

    if (!carbonResponse.ok || !powerResponse.ok) {
      console.error(`❌ API Error: Carbon=${carbonResponse.status}, Power=${powerResponse.status}`)
      return null
    }

    const carbonData = await carbonResponse.json()
    const powerData = await powerResponse.json()
    const priceData = priceResponse?.ok ? await priceResponse.json() : null

    // Extract renewable sources
    const consumption = powerData.powerConsumptionBreakdown || {}
    const renewableSources = ['solar', 'wind', 'hydro', 'hydro discharge', 'geothermal', 'biomass']

    return {
      zone,
      datetime: carbonData.datetime,
      carbon_intensity: carbonData.carbonIntensity,
      renewable_percentage: powerData.renewablePercentage || 0,
      fossil_free_percentage: powerData.fossilFreePercentage || 0,
      price_day_ahead: priceData?.price || undefined,
      power_consumption_breakdown: consumption,
    }
  } catch (error) {
    console.error('❌ Error fetching grid mix:', error)
    return null
  }
}

/**
 * Store grid mix snapshot in database
 */
async function storeGridMixSnapshot(snapshot: GridMixSnapshot) {
  const { error } = await supabase
    .from('grid_mix_snapshots')
    .insert({
      zone: snapshot.zone,
      datetime: snapshot.datetime,
      carbon_intensity: snapshot.carbon_intensity,
      renewable_percentage: snapshot.renewable_percentage,
      fossil_free_percentage: snapshot.fossil_free_percentage,
      price_day_ahead: snapshot.price_day_ahead,
      power_breakdown: snapshot.power_consumption_breakdown,
      captured_at: new Date().toISOString(),
    })

  if (error) {
    // Check if it's a duplicate (already captured this hour)
    if (error.code === '23505') {
      console.log('ℹ️  Snapshot already exists for this datetime')
      return false
    }
    throw error
  }

  return true
}

/**
 * Main function
 */
async function captureGridMix() {
  console.log('📡 Capturing current grid mix data...\n')
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN' : '✍️  WRITE MODE'}`)
  console.log(`Time: ${new Date().toISOString()}\n`)

  // Get list of unique countries from sites
  const { data: sites } = await supabase
    .from('sites')
    .select('country')
    .not('country', 'is', null)

  if (!sites || sites.length === 0) {
    console.log('⚠️  No sites with country information found')
    return
  }

  // Get unique countries
  const countries = [...new Set(sites.map(s => s.country))]
  console.log(`📍 Countries to capture: ${countries.join(', ')}\n`)

  // Map country to zone (simplified - expand as needed)
  const countryToZone: Record<string, string> = {
    'Portugal': 'PT',
    'Spain': 'ES',
    'France': 'FR',
    'Germany': 'DE',
    'United Kingdom': 'GB',
    // Add more as needed
  }

  let successCount = 0
  let errorCount = 0

  for (const country of countries) {
    const zone = countryToZone[country]

    if (!zone) {
      console.log(`⚠️  ${country}: No zone mapping found`)
      continue
    }

    console.log(`🔍 ${country} (${zone})...`)

    const snapshot = await fetchCurrentGridMix(zone)

    if (!snapshot) {
      console.log(`   ❌ Failed to fetch data\n`)
      errorCount++
      continue
    }

    console.log(`   📊 Carbon Intensity: ${snapshot.carbon_intensity} gCO₂/kWh`)
    console.log(`   🌱 Renewable: ${snapshot.renewable_percentage.toFixed(1)}%`)
    console.log(`   ⚡ Fossil-free: ${snapshot.fossil_free_percentage.toFixed(1)}%`)
    if (snapshot.price_day_ahead) {
      console.log(`   💰 Price: €${snapshot.price_day_ahead.toFixed(2)}/MWh`)
    }
    console.log(`   🕐 Datetime: ${snapshot.datetime}`)

    if (!isDryRun) {
      try {
        const stored = await storeGridMixSnapshot(snapshot)
        if (stored) {
          console.log(`   ✅ Stored successfully\n`)
          successCount++
        } else {
          console.log(`   ⏭️  Skipped (duplicate)\n`)
        }
      } catch (error: any) {
        console.log(`   ❌ Storage error: ${error.message}\n`)
        errorCount++
      }
    } else {
      console.log(`   🔍 Would store snapshot\n`)
      successCount++
    }
  }

  // Summary
  console.log('='.repeat(60))
  console.log('📊 Capture Summary')
  console.log('='.repeat(60))
  console.log(`Countries processed: ${countries.length}`)
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log('='.repeat(60))

  if (isDryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to store data.')
  }
}

// Run the script
captureGridMix()
  .then(() => {
    console.log('\n✅ Capture complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Capture failed:', error)
    process.exit(1)
  })
