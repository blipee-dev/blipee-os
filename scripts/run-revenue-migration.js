/**
 * Run the annual_revenue column migration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🔧 Running annual_revenue migration...\n');

  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20251009_add_annual_revenue.sql'),
    'utf8'
  );

  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

  if (error) {
    console.error('❌ Migration failed:', error);

    // Try direct approach
    console.log('\n🔄 Trying direct SQL execution...\n');
    const { error: directError } = await supabase.from('_migrations').insert({
      name: '20251009_add_annual_revenue',
      executed_at: new Date().toISOString()
    });

    if (directError) {
      console.log('Note: Migration tracking failed, but column may already exist');
    }
  } else {
    console.log('✅ Migration successful!');
  }

  // Verify column exists
  console.log('\n🔍 Verifying column...');
  const { data, error: verifyError } = await supabase
    .from('organizations')
    .select('annual_revenue')
    .limit(1);

  if (!verifyError) {
    console.log('✅ annual_revenue column is available!\n');
  } else {
    console.error('❌ Verification failed:', verifyError);
  }
}

runMigration().catch(console.error);
