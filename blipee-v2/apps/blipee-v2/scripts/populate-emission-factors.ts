/**
 * Pre-populate Emission Factors Cache
 * One-time script to populate common emission factors
 * Uses ~70-100 API calls (within free tier for first month)
 */

import { config } from 'dotenv'
import { resolve, join } from 'path'
import { calculateEmissionDirect } from '../src/lib/apis/climatiq'
import { createClient } from '@supabase/supabase-js'

// Load .env.local from the correct location
const envPath = join(__dirname, '..', '.env.local')
config({ path: envPath })

console.log(`Loading env from: ${envPath}`)
console.log(`CLIMATIQ_API_KEY present: ${!!process.env.CLIMATIQ_API_KEY}`)
console.log(`SUPABASE_URL present: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}\n`)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// COMMON ACTIVITIES TO PRE-POPULATE
// Using /estimate endpoint with unit quantities to extract factors
// ============================================================================

const COMMON_ACTIVITIES = [
  // Scope 2: Electricity (most common)
  {
    activityId: 'electricity-supply_grid-source_supplier_mix',
    displayName: 'Grid Electricity',
    regions: ['US', 'GB', 'DE', 'FR', 'ES', 'PT', 'BR', 'IN', 'CN', 'AU'],
    parameters: { energy: 1, energy_unit: 'kWh' },
    priority: 1,
  },

  // Scope 1: Fuels - Stationary combustion
  {
    activityId: 'fuel_type_natural_gas-fuel_use_na',
    displayName: 'Natural Gas',
    regions: ['US', 'GB', 'DE', 'FR', 'ES', 'PT'],
    parameters: { energy: 1, energy_unit: 'kWh' },
    priority: 2,
  },
  {
    activityId: 'fuel_type_diesel_fuel-fuel_use_na',
    displayName: 'Diesel Fuel',
    regions: ['US', 'GB', 'DE', 'FR', 'ES', 'PT'],
    parameters: { volume: 1, volume_unit: 'l' },
    priority: 2,
  },
  {
    activityId: 'fuel_type_petrol-fuel_use_na',
    displayName: 'Gasoline',
    regions: ['US', 'GB', 'DE', 'FR', 'ES', 'PT'],
    parameters: { volume: 1, volume_unit: 'l' },
    priority: 2,
  },
]

// ============================================================================
// POPULATE FUNCTION
// ============================================================================

async function populateEmissionFactors(dryRun: boolean = false) {
  const stats = {
    totalAttempts: 0,
    successfulCaches: 0,
    apiCalls: 0,
    errors: 0,
    skipped: 0,
  }

  console.log('🚀 Starting emission factors pre-population...\n')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`)
  console.log('='.repeat(70) + '\n')

  for (const activityGroup of COMMON_ACTIVITIES) {
    console.log(`\n📊 Activity: ${activityGroup.displayName}`)
    console.log(`   Activity ID: ${activityGroup.activityId}`)
    console.log(`   Regions: ${activityGroup.regions.join(', ')}`)
    console.log(`   Priority: ${activityGroup.priority}`)

    for (const region of activityGroup.regions) {
      stats.totalAttempts++

      try {
        // Check if already cached
        const { data: existing } = await supabase
          .from('emission_factors_cache')
          .select('id, api_calls_saved')
          .eq('climatiq_activity_id', activityGroup.activityId)
          .eq('region_code', region)
          .single()

        if (existing) {
          console.log(`   ⏭️  ${region}: Already cached (saved ${existing.api_calls_saved} API calls)`)
          stats.skipped++
          continue
        }

        if (dryRun) {
          console.log(`   🔍 ${region}: Would fetch from API (dry run)`)
          continue
        }

        // Call Climatiq /estimate endpoint with 1 unit to extract factor
        console.log(`   🌐 ${region}: Calling /estimate with 1 unit...`)
        const estimateResult = await calculateEmissionDirect({
          emission_factor: {
            activity_id: activityGroup.activityId,
            region: region,
            data_version: '^12',
          } as any,
          parameters: activityGroup.parameters,
        })

        if (!estimateResult) {
          console.log(`   ❌ ${region}: Estimate failed`)
          stats.errors++
          continue
        }

        stats.apiCalls++

        // Extract factor: co2e / activity_value = factor per unit
        const activityValue = (activityGroup.parameters as any)[Object.keys(activityGroup.parameters)[0]]
        const factorValue = estimateResult.co2e / activityValue // kg CO2e per unit
        const factorUnit = `kg/${(activityGroup.parameters as any)[Object.keys(activityGroup.parameters)[1]]}` // e.g., kg/kWh

        console.log(
          `   📊 ${region}: Factor = ${factorValue.toFixed(4)} ${factorUnit} (${estimateResult.emission_factor.source} ${estimateResult.emission_factor.year})`
        )

        // Save to cache
        const { error: insertError } = await supabase.from('emission_factors_cache').insert({
          climatiq_id: estimateResult.emission_factor.id,
          climatiq_activity_id: estimateResult.emission_factor.activity_id,
          activity_name: estimateResult.emission_factor.name,
          category: estimateResult.emission_factor.category,
          sector: 'Energy', // Default for now
          region_code: estimateResult.emission_factor.region,
          factor_value: factorValue,
          factor_unit: factorUnit,
          source_dataset: estimateResult.emission_factor.source,
          source_year:
            typeof estimateResult.emission_factor.year === 'number'
              ? estimateResult.emission_factor.year
              : parseInt(estimateResult.emission_factor.year as string),
          factor_calculation_method: estimateResult.co2e_calculation_method,
          co2_factor: estimateResult.constituent_gases?.co2_mt
            ? estimateResult.constituent_gases.co2_mt / activityValue
            : null,
          ch4_factor: estimateResult.constituent_gases?.ch4_mt
            ? estimateResult.constituent_gases.ch4_mt / activityValue
            : null,
          n2o_factor: estimateResult.constituent_gases?.n2o_mt
            ? estimateResult.constituent_gases.n2o_mt / activityValue
            : null,
          co2e_total: estimateResult.emission_factor.constituent_gases?.co2e_total,
          ghg_protocol_compliant: true,
          api_calls_saved: 0,
        })

        if (insertError) {
          if (insertError.message.includes('unique_factor')) {
            console.log(`   ⏭️  ${region}: Already exists (concurrent insert)`)
            stats.skipped++
          } else {
            console.log(`   ❌ ${region}: Cache save error - ${insertError.message}`)
            stats.errors++
          }
        } else {
          console.log(`   ✅ ${region}: Cached successfully!`)
          console.log(`      API call #${stats.apiCalls}`)
          stats.successfulCaches++
        }

        // Rate limiting: 1 call per second to be respectful
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.log(`   ❌ ${region}: Error - ${error.message}`)
        stats.errors++
      }
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 Pre-Population Summary:\n')
  console.log(`   Total attempts:      ${stats.totalAttempts}`)
  console.log(`   Successfully cached: ${stats.successfulCaches}`)
  console.log(`   Already cached:      ${stats.skipped}`)
  console.log(`   Errors:              ${stats.errors}`)
  console.log(`   API calls used:      ${stats.apiCalls}`)

  if (!dryRun && stats.apiCalls > 0) {
    const FREE_TIER_LIMIT = 100
    const percentage = (stats.apiCalls / FREE_TIER_LIMIT) * 100

    console.log(`\n   Free tier usage:     ${percentage.toFixed(1)}% (${stats.apiCalls}/${FREE_TIER_LIMIT})`)

    if (percentage > 80) {
      console.log('\n   ⚠️  WARNING: Approaching free tier limit!')
    } else {
      console.log('\n   ✅ Well within free tier limits')
    }
  }

  // Calculate expected cache hit rate
  const totalFactors = stats.successfulCaches + stats.skipped
  if (totalFactors > 0) {
    console.log(`\n   Total factors in cache: ${totalFactors}`)
    console.log(`   Expected cache hit rate: 95%+`)
    console.log(`   Expected future API calls: 10-15/month`)
  }

  console.log('\n' + '='.repeat(70) + '\n')

  // ============================================================================
  // CACHE STATISTICS
  // ============================================================================

  if (!dryRun) {
    console.log('📈 Cache Statistics:\n')

    // Total cached factors
    const { count: totalCached } = await supabase
      .from('emission_factors_cache')
      .select('*', { count: 'exact', head: true })

    console.log(`   Total emission factors cached: ${totalCached}`)

    // Factors by category
    const { data: byCategory } = await supabase
      .from('emission_factors_cache')
      .select('category')
      .order('category')

    if (byCategory) {
      const categoryCounts = byCategory.reduce((acc: Record<string, number>, row) => {
        acc[row.category] = (acc[row.category] || 0) + 1
        return acc
      }, {})

      console.log('\n   By category:')
      Object.entries(categoryCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .forEach(([category, count]) => {
          console.log(`     - ${category}: ${count}`)
        })
    }

    // Factors by region
    const { data: byRegion } = await supabase
      .from('emission_factors_cache')
      .select('region_code')
      .order('region_code')

    if (byRegion) {
      const regionCounts = byRegion.reduce((acc: Record<string, number>, row) => {
        acc[row.region_code] = (acc[row.region_code] || 0) + 1
        return acc
      }, {})

      console.log('\n   By region:')
      Object.entries(regionCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .forEach(([region, count]) => {
          console.log(`     - ${region}: ${count}`)
        })
    }

    console.log('\n' + '='.repeat(70) + '\n')
  }

  // ============================================================================
  // NEXT STEPS
  // ============================================================================

  console.log('✨ Next Steps:\n')
  console.log('1. Test the cache with some calculations')
  console.log('2. Monitor cache hit rate in production')
  console.log('3. Add more factors as needed (organization-specific)')
  console.log('4. Set up monthly cache refresh for updated factors\n')

  return stats
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

populateEmissionFactors(dryRun)
  .then((stats) => {
    if (dryRun) {
      console.log('✅ Dry run completed. Run without --dry-run to populate cache.')
    } else {
      console.log(`✅ Pre-population completed! ${stats.successfulCaches} factors cached.`)
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Pre-population failed:', error)
    process.exit(1)
  })
