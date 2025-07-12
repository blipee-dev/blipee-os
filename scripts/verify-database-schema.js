#!/usr/bin/env node

/**
 * Verify Database Schema
 * 
 * This script connects to Supabase and verifies the actual column names
 * and table structures in the production database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableSchema(tableName) {
  try {
    // Query the information schema to get column details
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName })
      .select('*');

    if (error) {
      // Fallback: Try to get schema by selecting with limit 0
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (fallbackError) {
        return { error: fallbackError.message };
      }

      // Extract column names from the empty result
      return { columns: Object.keys(fallbackData[0] || {}) };
    }

    return { columns: data };
  } catch (err) {
    return { error: err.message };
  }
}

async function verifyTables() {
  console.log('🔍 Verifying Database Schema in Supabase...\n');

  const tables = [
    'organizations',
    'facilities',
    'emissions',
    'emission_sources',
    'energy_consumption',
    'water_consumption',
    'waste_generation',
    'sustainability_targets',
    'material_topics',
    'compliance_frameworks',
    'suppliers'
  ];

  for (const table of tables) {
    console.log(`\n📊 Table: ${table}`);
    console.log('─'.repeat(50));

    // Try to get a sample row to see actual columns
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Error accessing table: ${error.message}`);
      
      // Check if table exists
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('   ⚠️  Table does not exist in database');
      } else if (error.message.includes('permission denied')) {
        console.log('   ⚠️  No permission to access table (RLS policy)');
      }
      continue;
    }

    // Get column names from the result
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    
    if (columns.length === 0) {
      console.log('   ℹ️  Table exists but no data found');
      
      // Try to insert a test row to see required fields
      const testData = {};
      const { error: insertError } = await supabase
        .from(table)
        .insert([testData])
        .select();

      if (insertError) {
        // Parse error message for column info
        const errorMsg = insertError.message;
        if (errorMsg.includes('null value in column')) {
          const match = errorMsg.match(/column "([^"]+)"/);
          if (match) {
            console.log(`   📌 Required column found: ${match[1]}`);
          }
        }
      }
    } else {
      console.log('   ✅ Columns found:');
      columns.forEach(col => {
        const value = data[0][col];
        const type = value === null ? 'null' : typeof value;
        console.log(`      - ${col} (${type})`);
      });
    }
  }
}

async function checkRLSPolicies() {
  console.log('\n\n🔐 Checking RLS Policies...');
  console.log('─'.repeat(50));

  // Test creating a dummy organization
  const testOrg = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Test Organization for Schema Verification',
    created_at: new Date().toISOString()
  };

  console.log('\n📝 Testing INSERT permission on organizations table...');
  const { data: insertData, error: insertError } = await supabase
    .from('organizations')
    .insert([testOrg])
    .select();

  if (insertError) {
    console.log(`❌ Cannot INSERT: ${insertError.message}`);
    if (insertError.message.includes('new row violates row-level security policy')) {
      console.log('   ⚠️  RLS policy is blocking inserts for authenticated users');
    }
  } else {
    console.log('✅ INSERT successful');
    
    // Clean up
    await supabase
      .from('organizations')
      .delete()
      .eq('id', testOrg.id);
  }

  // Test selecting
  console.log('\n📝 Testing SELECT permission on organizations table...');
  const { data: selectData, error: selectError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (selectError) {
    console.log(`❌ Cannot SELECT: ${selectError.message}`);
  } else {
    console.log(`✅ SELECT successful (found ${selectData.length} rows)`);
  }
}

async function suggestColumnMappings() {
  console.log('\n\n🔧 Suggested Column Mappings...');
  console.log('─'.repeat(50));

  // Check emissions table specifically
  const { data, error } = await supabase
    .from('emissions')
    .select('*')
    .limit(1);

  if (!error && data.length === 0) {
    console.log('\n📋 Emissions table column mappings:');
    console.log('   Component uses -> Database has');
    console.log('   ─────────────────────────────');
    
    // Try different column names
    const mappings = [
      { component: 'emission_date', possible: ['period_start/period_end', 'date', 'created_at'] },
      { component: 'co2_equivalent', possible: ['co2e_tonnes', 'co2_tonnes', 'emissions_value'] },
      { component: 'activity_data', possible: ['activity_value', 'consumption', 'amount'] },
      { component: 'emission_source_id', possible: ['source_id', 'source', 'emission_source'] }
    ];

    mappings.forEach(map => {
      console.log(`   ${map.component} -> ${map.possible.join(' or ')}`);
    });
  }
}

async function createRLSPolicyScript() {
  console.log('\n\n📝 Generating RLS Policy Update Script...');
  console.log('─'.repeat(50));

  const rlsScript = `
-- =====================================================
-- RLS POLICIES FOR ESG TABLES
-- Run this in Supabase SQL Editor to enable data access
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_topics ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can see and manage their organizations
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = organizations.id
    )
  );

CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true);  -- Allow any authenticated user to create org

CREATE POLICY "Users can update their organizations" ON organizations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = organizations.id 
      AND role IN ('owner', 'admin')
    )
  );

-- Facilities: Organization members can manage facilities
CREATE POLICY "Organization members can view facilities" ON facilities
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert facilities" ON facilities
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Emissions: Organization members can manage emissions
CREATE POLICY "Organization members can view emissions" ON emissions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert emissions" ON emissions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Emission Sources: Organization members can manage sources
CREATE POLICY "Organization members can view emission sources" ON emission_sources
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert emission sources" ON emission_sources
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Similar policies for other tables...
-- (Add more as needed)

-- Create a simplified policy for testing (temporary)
-- WARNING: Remove this in production!
CREATE POLICY "Temporary: Allow all authenticated users" ON emissions
  FOR ALL USING (auth.uid() IS NOT NULL);
`;

  console.log(rlsScript);
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('supabase/migrations/add_rls_policies.sql', rlsScript);
  console.log('\n✅ RLS policy script saved to: supabase/migrations/add_rls_policies.sql');
}

async function main() {
  try {
    await verifyTables();
    await checkRLSPolicies();
    await suggestColumnMappings();
    await createRLSPolicyScript();
    
    console.log('\n\n✨ Verification complete!');
    console.log('\nNext steps:');
    console.log('1. Review the column mappings above');
    console.log('2. Run the RLS policy script in Supabase SQL Editor');
    console.log('3. Update component field names to match actual database columns');
    console.log('4. Run the seed script to create test data');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main();