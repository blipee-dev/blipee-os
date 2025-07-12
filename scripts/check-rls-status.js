const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('Checking RLS Policies Status...\n');

  try {
    // Check if RLS is enabled on tables
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_status', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN (
          'organizations',
          'facilities', 
          'emissions',
          'emission_sources',
          'energy_consumption',
          'water_consumption',
          'waste_generation',
          'sustainability_targets',
          'material_topics',
          'team_members'
        )
        ORDER BY tablename
      `
    });

    if (rlsError) {
      // Try direct query approach
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('row-level security')) {
        console.log('✅ RLS is enabled on organizations table');
      } else if (data) {
        console.log('⚠️  RLS might not be properly configured on organizations table');
      }

      // Check other tables
      const tables = [
        'facilities',
        'emissions',
        'emission_sources',
        'energy_consumption',
        'water_consumption',
        'waste_generation',
        'sustainability_targets',
        'material_topics',
        'team_members'
      ];

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          if (error && error.message.includes('row-level security')) {
            console.log(`✅ RLS is enabled on ${table} table`);
          } else if (error && error.message.includes('does not exist')) {
            console.log(`❌ Table ${table} does not exist`);
          } else {
            console.log(`⚠️  RLS status unclear for ${table} table`);
          }
        } catch (e) {
          console.log(`❌ Error checking ${table}: ${e.message}`);
        }
      }
    } else {
      console.log('RLS Status by Table:');
      console.log(rlsStatus);
    }

    // Check if specific policies exist by trying operations
    console.log('\n\nChecking Policy Functionality:\n');

    // Test 1: Check if we can query organizations (should work with service key)
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);
    
    if (orgError) {
      console.log('❌ Cannot query organizations:', orgError.message);
    } else {
      console.log(`✅ Can query organizations table (found ${orgs?.length || 0} records)`);
    }

    // Test 2: Check team_members table
    const { data: teamMembers, error: tmError } = await supabase
      .from('team_members')
      .select('id')
      .limit(1);
    
    if (tmError && tmError.message.includes('does not exist')) {
      console.log('❌ team_members table does not exist');
      
      // Check for organization_members instead
      const { data: orgMembers, error: omError } = await supabase
        .from('organization_members')
        .select('id')
        .limit(1);
      
      if (omError && omError.message.includes('does not exist')) {
        console.log('❌ organization_members table does not exist either');
      } else {
        console.log('✅ organization_members table exists (alternative to team_members)');
      }
    } else {
      console.log('✅ team_members table exists');
    }

    // Check if helper functions exist
    console.log('\n\nChecking Helper Functions:\n');
    
    try {
      // This is a bit hacky but we can check if functions exist by trying to use them
      const { data, error } = await supabase.rpc('is_organization_member', { 
        org_id: '00000000-0000-0000-0000-000000000000' 
      });
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ is_organization_member function does not exist');
      } else {
        console.log('✅ is_organization_member function exists');
      }
    } catch (e) {
      console.log('❌ Error checking is_organization_member function');
    }

    console.log('\n\nSummary:');
    console.log('=========');
    console.log('The RLS policies from the migration files need to be checked manually in Supabase dashboard.');
    console.log('To apply missing policies:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run the contents of /supabase/migrations/20240710_add_esg_rls_policies.sql');
    console.log('3. This will set up proper RLS policies for all ESG tables');

  } catch (error) {
    console.error('Error checking RLS policies:', error);
  }
}

checkRLSPolicies();