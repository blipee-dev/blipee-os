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

async function checkRealTables() {
  console.log('🔍 Checking REAL tables that actually exist...\n');

  // Let's try a different approach - use a raw SQL query to get table names
  try {
    const { data, error } = await supabase.rpc('get_table_names');
    if (error) {
      console.log('Custom function not available, trying alternate approach...');
      
      // Try to access some tables we know should exist from the migrations
      const knownTables = [
        'organizations', 'buildings', 'emissions_data', 'waste_data', 
        'water_usage', 'sustainability_reports', 'document_uploads',
        'devices', 'conversations', 'user_organizations'
      ];
      
      console.log('🔍 Testing known tables from migrations...');
      
      for (const tableName of knownTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!error) {
            console.log(`✅ ${tableName} - EXISTS`);
            
            // Get count
            const { count } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            console.log(`   📊 Rows: ${count || 0}`);
            
            // Show sample data if available
            if (data && data.length > 0) {
              console.log(`   📝 Sample columns: ${Object.keys(data[0]).join(', ')}`);
            }
          } else {
            console.log(`❌ ${tableName} - ERROR: ${error.message}`);
          }
        } catch (e) {
          console.log(`❌ ${tableName} - EXCEPTION: ${e}`);
        }
      }
      
      // Check if there's an 'emissions' table (not 'emissions_data')
      console.log('\n🔍 Checking for emissions table...');
      try {
        const { data: emissionsData, error: emissionsError } = await supabase
          .from('emissions')
          .select('*')
          .limit(1);
        
        if (!emissionsError && emissionsData) {
          console.log('✅ emissions table exists');
          console.log(`   📊 Rows: ${emissionsData.length > 0 ? '1+' : '0'}`);
          
          if (emissionsData.length > 0) {
            console.log('   📝 Sample data structure:');
            console.log(JSON.stringify(emissionsData[0], null, 2));
          }
        } else {
          console.log('❌ emissions table not found');
        }
      } catch (e) {
        console.log('❌ emissions table - error checking');
      }
      
    } else {
      console.log('✅ Custom function available:', data);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRealTables().catch(console.error);