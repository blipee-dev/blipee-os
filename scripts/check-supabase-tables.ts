import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  try {
    console.log('🔍 Checking existing Supabase tables...\n');

    // Query to get all tables in public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      // Try alternative approach using raw SQL
      const { data, error } = await supabase.rpc('get_all_tables', {});

      if (error) {
        console.log('Using direct query approach...');

        // List of known tables to check
        const tablesToCheck = [
          'organizations',
          'users',
          'buildings',
          'sites',
          'sustainability_targets',
          'target_progress',
          'target_initiatives',
          'sbti_validation_checklist',
          'industry_benchmarks',
          'emissions_data',
          'energy_data',
          'sustainability_metrics',
          'ml_predictions',
          'ml_models',
          'autonomous_agents',
          'agent_tasks',
          'gri_mappings',
          'peer_benchmarks'
        ];

        console.log('📊 Checking known tables:\n');

        for (const tableName of tablesToCheck) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);

          if (!error) {
            console.log(`✅ ${tableName} - EXISTS`);

            // Get row count
            const { count } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });

            console.log(`   Rows: ${count || 0}`);
          } else {
            console.log(`❌ ${tableName} - NOT FOUND`);
          }
        }
      } else {
        console.log('📊 Tables in database:', data);
      }
    } else {
      console.log('📊 All tables in public schema:\n');
      tables?.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

    // Check specific sustainability tables with details
    console.log('\n🎯 Checking sustainability-specific tables:\n');

    // Check sustainability_targets
    const { data: targets, count: targetCount } = await supabase
      .from('sustainability_targets')
      .select('*', { count: 'exact' })
      .limit(5);

    if (targets) {
      console.log(`✅ sustainability_targets exists - ${targetCount} rows`);
      if (targets.length > 0) {
        console.log('   Sample columns:', Object.keys(targets[0]));
      }
    } else {
      console.log('❌ sustainability_targets not found');
    }

    // Check target_progress
    const { data: progress, count: progressCount } = await supabase
      .from('target_progress')
      .select('*', { count: 'exact' })
      .limit(5);

    if (progress) {
      console.log(`✅ target_progress exists - ${progressCount} rows`);
      if (progress.length > 0) {
        console.log('   Sample columns:', Object.keys(progress[0]));
      }
    } else {
      console.log('❌ target_progress not found');
    }

    // Check target_initiatives
    const { data: initiatives, count: initiativesCount } = await supabase
      .from('target_initiatives')
      .select('*', { count: 'exact' })
      .limit(5);

    if (initiatives) {
      console.log(`✅ target_initiatives exists - ${initiativesCount} rows`);
      if (initiatives.length > 0) {
        console.log('   Sample columns:', Object.keys(initiatives[0]));
      }
    } else {
      console.log('❌ target_initiatives not found');
    }

    // Check sbti_validation_checklist
    const { data: checklist, count: checklistCount } = await supabase
      .from('sbti_validation_checklist')
      .select('*', { count: 'exact' })
      .limit(5);

    if (checklist) {
      console.log(`✅ sbti_validation_checklist exists - ${checklistCount} rows`);
      if (checklist.length > 0) {
        console.log('   Sample columns:', Object.keys(checklist[0]));
      }
    } else {
      console.log('❌ sbti_validation_checklist not found');
    }

    // Check industry_benchmarks
    const { data: benchmarks, count: benchmarksCount } = await supabase
      .from('industry_benchmarks')
      .select('*', { count: 'exact' })
      .limit(5);

    if (benchmarks) {
      console.log(`✅ industry_benchmarks exists - ${benchmarksCount} rows`);
      if (benchmarks.length > 0) {
        console.log('   Sample columns:', Object.keys(benchmarks[0]));
        console.log('   Sample data:', benchmarks[0]);
      }
    } else {
      console.log('❌ industry_benchmarks not found');
    }

    // Check ML-related tables
    console.log('\n🤖 Checking ML/AI tables:\n');

    const mlTables = [
      'ml_predictions',
      'ml_models',
      'ml_training_runs',
      'autonomous_agents',
      'agent_tasks',
      'agent_executions'
    ];

    for (const tableName of mlTables) {
      const { data, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (count !== null) {
        console.log(`✅ ${tableName} - ${count} rows`);
      } else {
        console.log(`❌ ${tableName} - not found`);
      }
    }

    // Check enums that might exist
    console.log('\n📋 Checking custom types/enums:\n');

    const { data: types, error: typesError } = await supabase.rpc('get_enum_types', {});

    if (!typesError && types) {
      console.log('Custom types found:', types);
    } else {
      console.log('Could not retrieve custom types');
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

// Create RPC functions if they don't exist
async function createHelperFunctions() {
  try {
    // Function to get all tables
    await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION get_all_tables()
        RETURNS TABLE(table_name text) AS $$
        BEGIN
          RETURN QUERY
          SELECT tablename::text
          FROM pg_tables
          WHERE schemaname = 'public'
          ORDER BY tablename;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    // Function to get enum types
    await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION get_enum_types()
        RETURNS TABLE(type_name text, enum_values text[]) AS $$
        BEGIN
          RETURN QUERY
          SELECT
            t.typname::text as type_name,
            array_agg(e.enumlabel)::text[] as enum_values
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          GROUP BY t.typname;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
  } catch (error) {
    // Helper functions might already exist or we might not have permission
    console.log('Note: Could not create helper functions (may already exist)');
  }
}

// Run the check
(async () => {
  await createHelperFunctions();
  await checkTables();
})();