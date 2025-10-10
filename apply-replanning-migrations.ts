import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.com',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function applyMigrations() {
  console.log('🚀 Applying Replanning System Migrations...');
  console.log('='.repeat(70));

  try {
    // Read migration files
    const systemMigration = readFileSync('supabase/migrations/20251010_replanning_system.sql', 'utf8');
    const functionsMigration = readFileSync('supabase/migrations/20251010_replanning_functions.sql', 'utf8');

    // Apply system migration (tables, indexes, RLS)
    console.log('\n📦 Applying replanning_system.sql...');
    const { error: systemError } = await supabase.rpc('exec_sql', { sql: systemMigration });

    if (systemError) {
      console.error('❌ Error applying system migration:', systemError);

      // Try direct execution via pg library if rpc fails
      console.log('\n🔄 Trying direct SQL execution...');
      const { Pool } = require('pg');
      const pool = new Pool({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.yrbmmymayojycyszUnis',
        password: 'MG5faEtcGRvBWkn1',
        ssl: { rejectUnauthorized: false }
      });

      try {
        await pool.query(systemMigration);
        console.log('✅ System migration applied successfully via pg');
      } catch (pgError: any) {
        console.error('❌ pg error:', pgError.message);
        throw pgError;
      } finally {
        await pool.end();
      }
    } else {
      console.log('✅ System migration applied successfully');
    }

    // Apply functions migration
    console.log('\n📦 Applying replanning_functions.sql...');
    const { error: functionsError } = await supabase.rpc('exec_sql', { sql: functionsMigration });

    if (functionsError) {
      console.error('❌ Error applying functions migration:', functionsError);

      const { Pool } = require('pg');
      const pool = new Pool({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.yrbmmymayojycyszUnis',
        password: 'MG5faEtcGRvBWkn1',
        ssl: { rejectUnauthorized: false }
      });

      try {
        await pool.query(functionsMigration);
        console.log('✅ Functions migration applied successfully via pg');
      } catch (pgError: any) {
        console.error('❌ pg error:', pgError.message);
        throw pgError;
      } finally {
        await pool.end();
      }
    } else {
      console.log('✅ Functions migration applied successfully');
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', [
        'metric_targets',
        'metric_targets_monthly',
        'reduction_initiatives',
        'target_replanning_history',
        'allocation_strategies'
      ]);

    if (verifyError) {
      console.log('⚠️ Could not verify via Supabase client, checking directly...');

      const { Pool } = require('pg');
      const pool = new Pool({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.yrbmmymayojycyszUnis',
        password: 'MG5faEtcGRvBWkn1',
        ssl: { rejectUnauthorized: false }
      });

      const result = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('metric_targets', 'metric_targets_monthly', 'reduction_initiatives', 'target_replanning_history', 'allocation_strategies')
      `);

      console.log('\n✅ Tables created:');
      result.rows.forEach((row: any) => console.log(`   - ${row.table_name}`));

      await pool.end();
    } else {
      console.log('\n✅ Tables created:');
      tables?.forEach(t => console.log(`   - ${t.table_name}`));
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 Replanning system migrations applied successfully!');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigrations();
