/**
 * Check and Run Push Subscriptions Migration
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndMigrate() {
  console.log('🔍 Checking if push_subscriptions table exists...\n');

  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('✅ Table already exists: push_subscriptions');
      console.log('📊 Current subscriptions:', data?.length || 0);
      console.log('\n✓ Migration not needed - table already exists!\n');
      return;
    }

    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist. Migration needed.\n');
      console.log('📋 MANUAL MIGRATION REQUIRED:\n');
      console.log('─────────────────────────────────────────────────────────');
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Select your project: blipee-os');
      console.log('3. Go to: SQL Editor (left sidebar)');
      console.log('4. Click "New Query"');
      console.log('5. Copy the contents of this file:');
      console.log('   supabase/migrations/20251028_push_subscriptions.sql');
      console.log('6. Paste into SQL Editor');
      console.log('7. Click "Run" button');
      console.log('8. Verify success (should see "Success. No rows returned")');
      console.log('─────────────────────────────────────────────────────────\n');

      // Show first few lines of migration
      const migrationPath = path.join(__dirname, '../supabase/migrations/20251028_push_subscriptions.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log('📄 Migration SQL (first 500 chars):');
      console.log('─────────────────────────────────────────────────────────');
      console.log(migrationSQL.substring(0, 500) + '...\n');
      console.log('─────────────────────────────────────────────────────────\n');
    } else {
      console.error('❌ Unexpected error:', error);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkAndMigrate();
