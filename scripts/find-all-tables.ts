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

async function findAllTables() {
  console.log('🔍 Searching for all possible tables...\n');

  // Common table names to try
  const possibleTables = [
    // Core ESG tables
    'emissions', 'emissions_data', 'emission_data', 'carbon_emissions',
    'energy', 'energy_data', 'energy_consumption', 'energy_usage',
    'water', 'water_data', 'water_usage', 'water_consumption',
    'waste', 'waste_data', 'waste_generation', 'waste_management',
    'sustainability', 'sustainability_data', 'sustainability_reports',
    'esg_data', 'esg_metrics', 'esg_reports',
    
    // Building/facility tables
    'buildings', 'facilities', 'sites', 'locations',
    'devices', 'equipment', 'assets', 'meters', 'sensors',
    'metrics', 'measurements', 'readings', 'data_points',
    
    // Organizational tables
    'organizations', 'companies', 'tenants', 'clients',
    'users', 'profiles', 'user_profiles', 'accounts',
    'user_organizations', 'organization_members',
    
    // Document/compliance tables
    'documents', 'document_uploads', 'files', 'uploads',
    'reports', 'compliance_reports', 'audit_reports',
    'goals', 'targets', 'sustainability_goals', 'sustainability_targets',
    
    // Operational tables  
    'conversations', 'chats', 'messages',
    'notifications', 'alerts', 'events',
    'logs', 'audit_logs', 'activity_logs',
    
    // Time-series tables
    'time_series', 'sensor_data', 'iot_data',
    'building_metrics', 'facility_metrics',
    'weather_data', 'climate_data',
    
    // Additional sustainability tables
    'suppliers', 'supply_chain', 'vendor_data',
    'transport', 'transportation', 'travel_data',
    'materials', 'material_data', 'inventory',
    'biodiversity', 'environmental_data'
  ];

  const existingTables: string[] = [];
  
  console.log('🔍 Testing table existence...');
  
  for (const tableName of possibleTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        existingTables.push(tableName);
        console.log(`✅ ${tableName}`);
      }
    } catch (e) {
      // Table doesn't exist, ignore
    }
  }
  
  console.log(`\n📊 FOUND ${existingTables.length} TABLES:`);
  console.log('=' .repeat(50));
  
  // Categorize tables
  const esgTables: string[] = [];
  const coreTables: string[] = [];
  const operationalTables: string[] = [];
  const otherTables: string[] = [];
  
  existingTables.forEach(table => {
    if (table.includes('emission') || table.includes('energy') || table.includes('water') || 
        table.includes('waste') || table.includes('sustainability') || table.includes('esg') ||
        table.includes('carbon') || table.includes('environment')) {
      esgTables.push(table);
    } else if (table.includes('building') || table.includes('device') || table.includes('metric') ||
               table.includes('sensor') || table.includes('equipment')) {
      coreTables.push(table);
    } else if (table.includes('user') || table.includes('organization') || table.includes('conversation')) {
      operationalTables.push(table);
    } else {
      otherTables.push(table);
    }
  });
  
  if (esgTables.length > 0) {
    console.log(`\n🌱 ESG/SUSTAINABILITY TABLES (${esgTables.length}):`);
    esgTables.forEach(table => console.log(`  ✅ ${table}`));
  }
  
  if (coreTables.length > 0) {
    console.log(`\n🏢 BUILDING/DEVICE TABLES (${coreTables.length}):`);
    coreTables.forEach(table => console.log(`  ✅ ${table}`));
  }
  
  if (operationalTables.length > 0) {
    console.log(`\n⚙️  OPERATIONAL TABLES (${operationalTables.length}):`);
    operationalTables.forEach(table => console.log(`  ✅ ${table}`));
  }
  
  if (otherTables.length > 0) {
    console.log(`\n📋 OTHER TABLES (${otherTables.length}):`);
    otherTables.forEach(table => console.log(`  ✅ ${table}`));
  }
  
  // Sample data from key tables
  console.log('\n📊 SAMPLE DATA FROM KEY TABLES:');
  console.log('=' .repeat(50));
  
  for (const table of esgTables.concat(coreTables).slice(0, 5)) {
    console.log(`\n📊 ${table.toUpperCase()}:`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`Error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('⚠️  No data found');
      }
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
}

findAllTables().catch(console.error);