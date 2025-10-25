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
  console.log('\n🔧 Running electricity_provider_mix migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.resolve(__dirname, 'supabase/migrations/20251006_electricity_provider_mix.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration using rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);

      // Try manual creation if exec_sql doesn't exist
      console.log('\n📝 Attempting manual table creation...\n');

      // Check if table exists
      const { data: tableExists } = await supabase
        .from('electricity_provider_mix')
        .select('id')
        .limit(1);

      if (tableExists !== null) {
        console.log('✅ Table already exists, inserting EDP data...');
      }

      // Insert EDP data
      const edpData = [
        { provider_name: 'EDP', country_code: 'PT', year: 2022, renewable_percentage: 28.15, non_renewable_percentage: 71.85, source_url: 'https://www.edp.com', notes: 'EDP Portugal renewable energy mix for 2022' },
        { provider_name: 'EDP', country_code: 'PT', year: 2023, renewable_percentage: 33.30, non_renewable_percentage: 66.70, source_url: 'https://www.edp.com', notes: 'EDP Portugal renewable energy mix for 2023' },
        { provider_name: 'EDP', country_code: 'PT', year: 2024, renewable_percentage: 62.23, non_renewable_percentage: 37.77, source_url: 'https://www.edp.com', notes: 'EDP Portugal renewable energy mix for 2024' },
        { provider_name: 'EDP', country_code: 'PT', year: 2025, renewable_percentage: 56.99, non_renewable_percentage: 43.01, source_url: 'https://www.edp.com', notes: 'EDP Portugal renewable energy mix for 2025' }
      ];

      for (const row of edpData) {
        const { error: insertError } = await supabase
          .from('electricity_provider_mix')
          .upsert(row, {
            onConflict: 'provider_name,country_code,year',
            ignoreDuplicates: false
          });

        if (insertError) {
          console.error(`❌ Failed to insert ${row.year}:`, insertError);
        } else {
          console.log(`✅ Inserted EDP ${row.year}: ${row.renewable_percentage}% renewable`);
        }
      }

      console.log('\n✅ EDP provider mix data added successfully!\n');

      // Verify data
      const { data: verifyData, error: verifyError } = await supabase
        .from('electricity_provider_mix')
        .select('*')
        .eq('provider_name', 'EDP')
        .eq('country_code', 'PT')
        .order('year');

      if (verifyData) {
        console.log('\n📊 EDP Provider Mix Data:');
        console.table(verifyData.map(d => ({
          Year: d.year,
          Renewable: `${d.renewable_percentage}%`,
          'Non-Renewable': `${d.non_renewable_percentage}%`
        })));
      }

    } else {
      console.log('✅ Migration executed successfully!');
    }

  } catch (err) {
    console.error('❌ Error running migration:', err);
    process.exit(1);
  }
}

runMigration().catch(console.error);
