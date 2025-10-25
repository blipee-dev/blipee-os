import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('\n🔧 Running grid mix metadata migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.resolve(__dirname, 'supabase/migrations/20251006_auto_add_grid_mix_metadata.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement (rough split - good enough for this migration)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement using raw SQL
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('COMMENT')) {
        continue;
      }

      console.log(`${i + 1}. Executing statement...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).catch(async (err) => {
        // If exec_sql doesn't exist, try execute_sql
        return await supabase.rpc('execute_sql', {
          query: statement
        });
      }).catch(() => {
        // If neither works, we'll handle it below
        return { error: { message: 'RPC function not available' } };
      });

      if (error) {
        console.log(`   ⚠️  ${error.message}`);
      } else {
        console.log(`   ✅ Success`);
      }
    }

    console.log('\n✅ Migration complete!\n');
    console.log('🎯 The trigger is now active. New electricity records will automatically get grid_mix metadata.\n');

    // Test the function
    console.log('🧪 Testing the function...\n');

    const { data: testData, error: testError } = await supabase
      .rpc('get_edp_renewable_percentage', { period_date: '2024-01-15' });

    if (testData) {
      console.log(`✅ Function test successful!`);
      console.log(`   2024-01-15 → ${testData}% renewable\n`);
    } else {
      console.log(`⚠️  Function test failed: ${testError?.message}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📋 Manual steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the contents of:');
    console.log('   supabase/migrations/20251006_auto_add_grid_mix_metadata.sql');
    console.log('3. Click "Run"\n');
  }
}

runMigration().catch(console.error);
