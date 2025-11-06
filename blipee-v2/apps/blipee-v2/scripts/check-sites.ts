/**
 * Check Sites Table
 * Quick script to check sites table structure and country data
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkSites() {
  console.log('🔍 Checking sites table...\n')

  // Get all sites
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .limit(5)

  if (error) {
    console.error('❌ Error fetching sites:', error)
    return
  }

  console.log(`📊 Found ${sites?.length} sites (showing first 5):\n`)

  sites?.forEach((site, index) => {
    console.log(`Site ${index + 1}:`)
    console.log(`  ID: ${site.id}`)
    console.log(`  Name: ${site.name}`)
    console.log(`  Location: ${site.location}`)
    console.log(`  Country: ${site.country || '❌ NOT SET'}`)
    console.log(`  All fields:`, Object.keys(site).join(', '))
    console.log('')
  })
}

checkSites()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
