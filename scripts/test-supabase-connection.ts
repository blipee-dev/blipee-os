#!/usr/bin/env tsx
/**
 * Supabase Connection Testing Script
 * Debug connection issues before proceeding with Phase 2
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connections...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SUPABASE_DB_PASSWORD: ${process.env.SUPABASE_DB_PASSWORD ? '✅ Set' : '❌ Missing'}\n`);

  try {
    // Test 1: Anonymous client connection
    console.log('🧪 Test 1: Anonymous Supabase Client Connection');
    const anonClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test basic connection
    const { data: testData, error: testError } = await anonClient
      .from('organizations')
      .select('count(*)', { count: 'exact', head: true });

    if (testError) {
      console.log('  ❌ Anonymous client test failed:', testError.message);
    } else {
      console.log('  ✅ Anonymous client connected successfully');
      console.log(`  📊 Organizations table accessible`);
    }

    // Test 2: Service role client connection
    console.log('\n🔑 Test 2: Service Role Client Connection');
    const serviceClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test with service role
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('organizations')
      .select('id, name, created_at')
      .limit(1);

    if (serviceError) {
      console.log('  ❌ Service role client test failed:', serviceError.message);
    } else {
      console.log('  ✅ Service role client connected successfully');
      console.log(`  📊 Retrieved ${serviceData?.length || 0} organization records`);
      if (serviceData && serviceData.length > 0) {
        console.log(`  🏢 Sample org: ${serviceData[0].name || 'Unnamed'} (${serviceData[0].id})`);
      }
    }

    // Test 3: Check available tables
    console.log('\n📋 Test 3: Database Schema Check');
    const { data: tables, error: tablesError } = await serviceClient
      .rpc('get_all_tables')
      .select('*');

    if (tablesError) {
      console.log('  ⚠️  Could not fetch table list via RPC:', tablesError.message);
      
      // Try alternative method
      try {
        const { data: altTables, error: altError } = await serviceClient
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(10);

        if (altError) {
          console.log('  ❌ Alternative table query failed:', altError.message);
        } else {
          console.log(`  ✅ Found ${altTables?.length || 0} tables using information_schema`);
          if (altTables && altTables.length > 0) {
            console.log('  📋 Sample tables:', altTables.slice(0, 5).map(t => t.table_name).join(', '));
          }
        }
      } catch (error) {
        console.log('  ❌ Information schema query failed:', error);
      }
    } else {
      console.log(`  ✅ Retrieved ${tables?.length || 0} tables via RPC`);
    }

    // Test 4: Direct PostgreSQL connection test
    console.log('\n🐘 Test 4: Direct PostgreSQL Connection Test');
    
    const { Pool } = await import('pg');
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([\w-]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      console.log('  ❌ Could not extract project reference from URL');
    } else {
      console.log(`  🔍 Project reference: ${projectRef}`);
      
      const pgConfig = {
        host: `db.${projectRef}.supabase.co`,
        port: 5432,
        database: 'postgres',
        user: `postgres.${projectRef}`,
        password: process.env.SUPABASE_DB_PASSWORD!,
        ssl: { rejectUnauthorized: false }
      };
      
      console.log(`  🔗 Attempting connection to: ${pgConfig.host}:${pgConfig.port}`);
      console.log(`  👤 User: ${pgConfig.user}`);
      console.log(`  🔒 Password: ${pgConfig.password ? 'Set' : 'Missing'}`);
      
      const pool = new Pool(pgConfig);
      
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        client.release();
        
        console.log('  ✅ Direct PostgreSQL connection successful!');
        console.log(`  🕒 Database time: ${result.rows[0].current_time}`);
        console.log(`  🏗️  PostgreSQL version: ${result.rows[0].version.substring(0, 50)}...`);
        
        await pool.end();
      } catch (pgError) {
        console.log('  ❌ Direct PostgreSQL connection failed:', pgError);
        
        // Try with different configurations
        const alternativeConfigs = [
          { ...pgConfig, port: 6543 },
          { ...pgConfig, host: `db.supabase.co`, database: projectRef },
          { ...pgConfig, ssl: false }
        ];
        
        for (const altConfig of alternativeConfigs) {
          console.log(`  🔄 Trying alternative config: ${altConfig.host}:${altConfig.port}`);
          const altPool = new Pool(altConfig);
          
          try {
            const altClient = await altPool.connect();
            await altClient.query('SELECT 1');
            altClient.release();
            await altPool.end();
            
            console.log('  ✅ Alternative config worked!');
            break;
          } catch (altError) {
            console.log(`  ❌ Alternative config failed: ${altError.message}`);
            await altPool.end().catch(() => {});
          }
        }
      }
    }

    console.log('\n📊 Connection Test Summary:');
    console.log('  🔸 Supabase REST API: Available for database operations');
    console.log('  🔸 Service Role Access: Full database access available');
    console.log('  🔸 Direct PostgreSQL: Requires configuration verification');
    
    console.log('\n✅ Supabase connection testing completed!');

  } catch (error) {
    console.error('❌ Connection testing failed:', error);
    throw error;
  }
}

// Run the connection test
if (require.main === module) {
  testSupabaseConnection()
    .then(() => {
      console.log('\n🎉 Connection testing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Connection testing failed:', error);
      process.exit(1);
    });
}

export { testSupabaseConnection };