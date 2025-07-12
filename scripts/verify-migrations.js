const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigrations() {
  console.log('🔍 Verifying Migration Status...\n');
  
  const results = {
    esgTables: {
      passed: 0,
      failed: 0,
      details: []
    },
    agentTables: {
      passed: 0,
      failed: 0,
      details: []
    },
    rlsPolicies: {
      passed: 0,
      failed: 0,
      details: []
    }
  };

  // Check ESG tables
  console.log('📊 Checking ESG Tables...');
  const esgTables = [
    'organizations',
    'facilities',
    'emissions',
    'emission_sources',
    'energy_consumption',
    'water_consumption',
    'waste_generation',
    'sustainability_targets',
    'material_topics'
  ];

  for (const table of esgTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error && error.message.includes('does not exist')) {
        results.esgTables.failed++;
        results.esgTables.details.push(`❌ ${table} - Table does not exist`);
      } else if (error) {
        results.esgTables.failed++;
        results.esgTables.details.push(`❌ ${table} - Error: ${error.message}`);
      } else {
        results.esgTables.passed++;
        results.esgTables.details.push(`✅ ${table} - Table exists`);
      }
    } catch (e) {
      results.esgTables.failed++;
      results.esgTables.details.push(`❌ ${table} - Error: ${e.message}`);
    }
  }

  // Check Agent tables
  console.log('\n🤖 Checking Agent Tables...');
  const agentTables = [
    'agent_configs',
    'agent_events',
    'agent_results',
    'agent_approvals',
    'agent_knowledge',
    'agent_errors',
    'agent_scheduled_tasks',
    'agent_outcomes',
    'agent_patterns',
    'agent_knowledge_base',
    'agent_alerts',
    'agent_analyses'
  ];

  for (const table of agentTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error && error.message.includes('does not exist')) {
        results.agentTables.failed++;
        results.agentTables.details.push(`❌ ${table} - Table does not exist`);
      } else if (error) {
        results.agentTables.failed++;
        results.agentTables.details.push(`❌ ${table} - Error: ${error.message}`);
      } else {
        results.agentTables.passed++;
        results.agentTables.details.push(`✅ ${table} - Table exists`);
      }
    } catch (e) {
      results.agentTables.failed++;
      results.agentTables.details.push(`❌ ${table} - Error: ${e.message}`);
    }
  }

  // Check key relationships
  console.log('\n🔗 Checking Key Relationships...');
  
  // Check organization_members table
  const { data: orgMembers, error: omError } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true });
  
  if (omError && omError.message.includes('does not exist')) {
    console.log('❌ organization_members table does not exist - RLS policies will not work!');
  } else {
    console.log('✅ organization_members table exists');
  }

  // Check helper functions
  console.log('\n🔧 Checking Helper Functions...');
  try {
    const { error: funcError } = await supabase.rpc('is_organization_member', { 
      org_id: '00000000-0000-0000-0000-000000000000' 
    });
    
    if (funcError && funcError.message.includes('does not exist')) {
      console.log('❌ is_organization_member function does not exist');
    } else {
      console.log('✅ is_organization_member function exists');
    }
  } catch (e) {
    console.log('❌ Error checking helper functions');
  }

  // Summary
  console.log('\n📈 SUMMARY');
  console.log('==========');
  console.log(`ESG Tables: ${results.esgTables.passed} passed, ${results.esgTables.failed} failed`);
  console.log(`Agent Tables: ${results.agentTables.passed} passed, ${results.agentTables.failed} failed`);
  
  if (results.esgTables.failed > 0) {
    console.log('\n⚠️  ESG Table Issues:');
    results.esgTables.details.filter(d => d.includes('❌')).forEach(d => console.log(d));
  }
  
  if (results.agentTables.failed > 0) {
    console.log('\n⚠️  Agent Table Issues:');
    results.agentTables.details.filter(d => d.includes('❌')).forEach(d => console.log(d));
  }

  // Recommendations
  console.log('\n📋 NEXT STEPS');
  console.log('=============');
  
  if (results.esgTables.failed > 0) {
    console.log('1. ESG tables are missing - ensure the main schema is created first');
  }
  
  if (results.agentTables.failed === agentTables.length) {
    console.log('2. Agent tables are not created yet');
    console.log('   → Run: /supabase/migrations/AUTONOMOUS_AGENTS_MIGRATION.sql');
  }
  
  console.log('3. To apply RLS policies:');
  console.log('   → Run: /supabase/migrations/APPLY_ESG_RLS_POLICIES.sql');
  
  console.log('\n🔗 Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
  console.log('\nPassword: postgresblipeeos');
}

verifyMigrations().catch(console.error);