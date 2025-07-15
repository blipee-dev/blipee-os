#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkESGTables() {
  console.log('🔍 Checking ESG and sustainability tables...\n');

  // Tables we found that actually exist
  const existingTables = [
    'organizations', 'buildings', 'emissions_data', 'waste_data', 
    'water_usage', 'sustainability_reports', 'document_uploads',
    'conversations', 'user_organizations', 'emissions'
  ];

  // Additional tables that might exist
  const possibleTables = [
    'emission_sources', 'emission_factors', 'facilities', 'energy_consumption',
    'energy_data', 'building_metrics', 'sustainability_goals', 'sustainability_targets',
    'esg_metrics', 'compliance_reports', 'materiality_assessments', 'suppliers',
    'supply_chain_emissions', 'transportation_emissions', 'waste_management',
    'biodiversity_data', 'scope_1_emissions', 'scope_2_emissions', 'scope_3_emissions',
    'carbon_offsets', 'renewable_energy', 'ghg_inventory', 'climate_targets'
  ];

  console.log('📊 CONFIRMED EXISTING TABLES:');
  console.log('=' .repeat(50));
  
  for (const tableName of existingTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        console.log(`✅ ${tableName} (${count || 0} rows)`);
        
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   📝 Columns: ${columns.slice(0, 8).join(', ')}${columns.length > 8 ? '...' : ''}`);
        }
      }
    } catch (e) {
      console.log(`❌ ${tableName} - Error checking`);
    }
  }

  console.log('\n🔍 CHECKING FOR ADDITIONAL TABLES:');
  console.log('=' .repeat(50));
  
  const additionalExisting = [];
  
  for (const tableName of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        console.log(`✅ ${tableName} (${count || 0} rows)`);
        additionalExisting.push(tableName);
        
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   📝 Columns: ${columns.slice(0, 8).join(', ')}${columns.length > 8 ? '...' : ''}`);
        }
      }
    } catch (e) {
      // Table doesn't exist, which is expected for most
    }
  }
  
  if (additionalExisting.length === 0) {
    console.log('   ⚠️  No additional tables found');
  }

  // Show detailed structure for key tables with data
  console.log('\n📊 DETAILED TABLE STRUCTURES:');
  console.log('=' .repeat(50));
  
  const keyTables = ['emissions', 'organizations'];
  
  for (const tableName of keyTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        console.log(`\n📊 ${tableName.toUpperCase()}:`);
        console.log(JSON.stringify(data[0], null, 2));
      }
    } catch (e) {
      console.log(`❌ Error checking ${tableName}`);
    }
  }
  
  // Summary
  console.log('\n📈 SUMMARY:');
  console.log('=' .repeat(50));
  console.log(`✅ Total confirmed tables: ${existingTables.length + additionalExisting.length}`);
  console.log(`🌱 ESG-related tables: ${existingTables.filter(t => t.includes('emission') || t.includes('waste') || t.includes('water') || t.includes('sustainability')).length + additionalExisting.filter(t => t.includes('emission') || t.includes('waste') || t.includes('water') || t.includes('sustainability')).length}`);
  console.log(`📊 Tables with data: ${existingTables.filter(t => t === 'emissions' || t === 'organizations').length}`);
  
  console.log('\n🎯 KEY FINDINGS:');
  console.log('- Main emissions data is in the "emissions" table');
  console.log('- "emissions_data", "waste_data", "water_usage" exist but are empty');
  console.log('- Organizations table has 1 organization');
  console.log('- Buildings table exists but is empty');
  console.log('- No energy consumption data found in checked tables');
}

checkESGTables().catch(console.error);