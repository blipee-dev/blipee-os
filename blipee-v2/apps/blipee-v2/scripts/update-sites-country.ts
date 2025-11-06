/**
 * Update Sites Country
 * Populate country field for sites based on location information
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

async function updateSitesCountry() {
  console.log('🔄 Updating sites country information...\n')
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '✍️  WRITE MODE'}\n`)

  // Get all sites
  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, name, location, city, country')

  if (error) {
    console.error('❌ Error fetching sites:', error)
    process.exit(1)
  }

  if (!sites || sites.length === 0) {
    console.log('✅ No sites found')
    return
  }

  console.log(`📊 Found ${sites.length} sites\n`)

  let updatedCount = 0
  let skippedCount = 0

  for (const site of sites) {
    console.log(`Processing: ${site.name}`)
    console.log(`  Location: ${site.location}`)
    console.log(`  Current Country: ${site.country || '(not set)'}`)

    // Skip if country is already set
    if (site.country) {
      console.log(`  ✅ Already has country set\n`)
      skippedCount++
      continue
    }

    // Try to extract country from location
    let country = null

    // Check location field
    if (site.location) {
      const locationLower = site.location.toLowerCase()

      // Simple pattern matching for Portugal
      if (locationLower.includes('portugal') ||
          locationLower.includes('lisboa') ||
          locationLower.includes('porto') ||
          locationLower.includes('faro')) {
        country = 'Portugal'
      }

      // Add more patterns as needed
      if (locationLower.includes('spain') || locationLower.includes('españa')) {
        country = 'Spain'
      }
      if (locationLower.includes('france')) {
        country = 'France'
      }
      if (locationLower.includes('germany') || locationLower.includes('deutschland')) {
        country = 'Germany'
      }
      if (locationLower.includes('uk') || locationLower.includes('united kingdom')) {
        country = 'United Kingdom'
      }
    }

    if (!country) {
      console.log(`  ⚠️  Could not determine country from location\n`)
      skippedCount++
      continue
    }

    console.log(`  🎯 Inferred country: ${country}`)

    if (!isDryRun) {
      const { error: updateError } = await supabase
        .from('sites')
        .update({ country })
        .eq('id', site.id)

      if (updateError) {
        console.log(`  ❌ Error updating site:`, updateError.message)
      } else {
        console.log(`  ✅ Updated successfully\n`)
        updatedCount++
      }
    } else {
      console.log(`  🔍 Would update to: ${country}\n`)
      updatedCount++
    }
  }

  // Summary
  console.log('='.repeat(60))
  console.log('📊 Update Summary')
  console.log('='.repeat(60))
  console.log(`Total sites: ${sites.length}`)
  console.log(`✅ Updated: ${updatedCount}`)
  console.log(`⚠️  Skipped: ${skippedCount}`)
  console.log('='.repeat(60))

  if (isDryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.')
  }
}

// Run the script
updateSitesCountry()
  .then(() => {
    console.log('\n✅ Update complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error)
    process.exit(1)
  })
