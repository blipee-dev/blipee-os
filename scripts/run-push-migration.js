/**
 * Run Push Subscriptions Migration
 *
 * This script creates the push_subscriptions table in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running push_subscriptions migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251028_push_subscriptions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔗 Connecting to Supabase...');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct approach
      console.log('⚠️  RPC method not available, trying direct execution...\n');

      // Split SQL into statements and execute one by one
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') ||
            statement.includes('CREATE POLICY') || statement.includes('ALTER TABLE') ||
            statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('CREATE TRIGGER') ||
            statement.includes('COMMENT ON')) {
          console.log('   Executing:', statement.substring(0, 60) + '...');

          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });

          if (stmtError) {
            console.error('   ❌ Error:', stmtError.message);
          } else {
            console.log('   ✓ Success');
          }
        }
      }
    }

    // Verify table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(1);

    if (tableError && tableError.code === 'PGRST116') {
      // Table doesn't exist - need manual migration
      console.log('\n⚠️  Could not create table automatically.');
      console.log('\n📋 Please run this migration manually:');
      console.log('─────────────────────────────────────────────────────────');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and run the following file:');
      console.log(`   ${migrationPath}`);
      console.log('─────────────────────────────────────────────────────────\n');
      process.exit(1);
    }

    console.log('✅ Table verified: push_subscriptions exists\n');
    console.log('🎉 Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Restart your dev server: npm run dev');
    console.log('2. Open http://localhost:3000/mobile');
    console.log('3. Test push notification permission prompt\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📋 Manual migration instructions:');
    console.error('─────────────────────────────────────────────────────────');
    console.error('1. Go to Supabase Dashboard → SQL Editor');
    console.error('2. Run: supabase/migrations/20251028_push_subscriptions.sql');
    console.error('─────────────────────────────────────────────────────────\n');
    process.exit(1);
  }
}

runMigration();
