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

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  const essentialTables = [
    'organizations',
    'buildings',
    'emissions_data',
    'waste_data', 
    'water_usage',
    'sustainability_reports',
    'document_uploads',
    'agent_instances',
    'agent_definitions',
    'agent_task_executions',
    'agent_scheduled_tasks',
    'agent_approvals',
    'agent_learning_patterns',
    'agent_metrics',
    'agent_decisions',
    'agent_collaborations'
  ];

  console.log('📊 Checking table existence and row counts:\n');
  
  for (const tableName of essentialTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: Does not exist or error accessing`);
      } else {
        console.log(`✅ ${tableName}: ${count || 0} rows`);
      }
    } catch (e) {
      console.log(`❌ ${tableName}: Error - ${e}`);
    }
  }

  // Check for some auth tables
  console.log('\n🔐 Auth tables (via auth schema):\n');
  
  try {
    // Try to get user count through a different method
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (!orgError) {
      console.log('✅ Database connection successful');
    }
  } catch (e) {
    console.log('❌ Database connection error:', e);
  }
}

checkTables();