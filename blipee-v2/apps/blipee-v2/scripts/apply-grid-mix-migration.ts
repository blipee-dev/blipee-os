/**
 * Apply Grid Mix Snapshots Migration
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function applyMigration() {
  console.log('📦 Applying grid_mix_snapshots migration...\n')

  // Read the SQL file
  const sqlPath = resolve(__dirname, '../supabase/migrations/20250105_create_grid_mix_snapshots.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  console.log('SQL to execute:')
  console.log('='.repeat(60))
  console.log(sql)
  console.log('='.repeat(60))
  console.log()

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration applied successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n💡 Note: If exec_sql function doesn\'t exist, you can:')
    console.log('   1. Run the migration manually in Supabase SQL Editor')
    console.log('   2. Or copy the SQL from: supabase/migrations/20250105_create_grid_mix_snapshots.sql')
    process.exit(1)
  }
}

applyMigration()
