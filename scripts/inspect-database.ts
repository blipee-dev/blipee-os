import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function inspectDatabase() {
  console.log('🔍 Inspecting database schema...\n');

  try {
    // Query to get all tables using raw SQL
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables', {}, {
      get: true
    }).single();

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    console.log(`Found ${tables?.length || 0} tables in public schema:\n`);
    
    const tableNames = tables?.map(t => t.table_name) || [];
    console.log('Tables:', tableNames.join(', '));
    
    console.log('\n📊 Key tables for test data:\n');
    
    // Check for essential tables
    const essentialTables = [
      'organizations',
      'buildings',
      'users',
      'user_organizations',
      'emissions_data',
      'waste_data',
      'water_usage',
      'sustainability_reports',
      'document_uploads',
      'agent_instances',
      'agent_definitions',
      'agent_task_executions'
    ];
    
    for (const tableName of essentialTables) {
      if (tableNames.includes(tableName)) {
        console.log(`✅ ${tableName}`);
      } else {
        console.log(`❌ ${tableName} (missing)`);
      }
    }

    // Get row counts for existing tables
    console.log('\n📈 Current data counts:\n');
    
    for (const tableName of essentialTables) {
      if (tableNames.includes(tableName)) {
        try {
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          console.log(`${tableName}: ${count || 0} rows`);
        } catch (e) {
          console.log(`${tableName}: Unable to count`);
        }
      }
    }

  } catch (error) {
    console.error('Error inspecting database:', error);
  }
}

inspectDatabase();