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

async function checkTableStructure() {
  console.log('🔍 Checking Table Structures...\n');

  const esgTables = ['emissions_data', 'waste_data', 'water_usage', 'sustainability_reports'];
  
  for (const tableName of esgTables) {
    console.log(`\n📊 ${tableName.toUpperCase()} TABLE:`);
    console.log('=' .repeat(50));
    
    try {
      // Get a sample row to understand the structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`Error querying ${tableName}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log('✅ Sample data found:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('⚠️  Table exists but no data found');
        
        // Try to get table structure by checking for common columns
        const { data: emptyData, error: structureError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (!structureError) {
          console.log('✅ Table structure detected (empty table)');
        }
      }
      
      // Try to get row count
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      console.log(`📈 Total rows: ${count || 0}`);
      
    } catch (error) {
      console.error(`Error checking ${tableName}:`, error);
    }
  }

  // Check metrics table specifically for energy consumption
  console.log(`\n📊 METRICS TABLE (for energy/consumption data):`);
  console.log('=' .repeat(50));
  
  try {
    const { data: metrics, error } = await supabase
      .from('metrics')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error querying metrics:', error);
    } else if (metrics && metrics.length > 0) {
      console.log('✅ Sample metrics data:');
      metrics.forEach((metric, idx) => {
        console.log(`${idx + 1}. ${JSON.stringify(metric, null, 2)}`);
      });
    } else {
      console.log('⚠️  Metrics table exists but no data found');
    }
    
    // Check for specific metric types that might exist
    const metricTypes = ['power', 'energy', 'temperature', 'emissions', 'consumption'];
    for (const type of metricTypes) {
      const { count } = await supabase
        .from('metrics')
        .select('*', { count: 'exact', head: true })
        .eq('metric_type', type);
      
      if (count && count > 0) {
        console.log(`  📊 ${type}: ${count} records`);
      }
    }
    
  } catch (error) {
    console.error('Error checking metrics:', error);
  }
}

checkTableStructure().catch(console.error);