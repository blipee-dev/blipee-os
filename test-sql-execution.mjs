#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function testSQLExecution() {
  console.log('🔍 Testing SQL execution capabilities with service role key...\n');

  // Test 1: Try RPC with a simple query
  console.log('1️⃣ Testing RPC function call:');
  console.log('='.repeat(80));

  const { data: rpcData, error: rpcError } = await supabase.rpc('version');

  if (rpcError) {
    console.log('❌ RPC Error:', rpcError.message);
    console.log('   Code:', rpcError.code);
  } else {
    console.log('✅ RPC works! PostgreSQL version:', rpcData);
  }
  console.log('');

  // Test 2: Try creating a test RPC function to execute SQL
  console.log('2️⃣ Testing if we can create RPC functions:');
  console.log('='.repeat(80));

  // Try to insert a test function via Data API (won't work, but let's see the error)
  const { data: createData, error: createError } = await supabase
    .from('pg_proc')
    .select('*')
    .limit(1);

  if (createError) {
    console.log('❌ Cannot access pg_proc:', createError.message);
    console.log('   This is expected - system tables are not exposed via Data API');
  }
  console.log('');

  // Test 3: Check what SQL functions are available via RPC
  console.log('3️⃣ Checking available RPC functions:');
  console.log('='.repeat(80));

  // Try to query pg_proc to see what functions exist
  const { data: functionsData, error: functionsError } = await supabase
    .from('information_schema.routines')
    .select('routine_name, routine_type')
    .eq('routine_schema', 'public')
    .limit(10);

  if (functionsError) {
    console.log('❌ Cannot query functions:', functionsError.message);
  } else if (functionsData) {
    console.log('✅ Found some functions:');
    functionsData.forEach(f => console.log(`   • ${f.routine_name} (${f.routine_type})`));
  }
  console.log('');

  // Test 4: Try using postgrest-js raw SQL (if available)
  console.log('4️⃣ Testing raw SQL capabilities:');
  console.log('='.repeat(80));

  // Check if there's a way to execute raw SQL
  if (typeof supabase.rpc === 'function') {
    console.log('✅ supabase.rpc() is available');
    console.log('   Can call PostgreSQL functions created in the database');
  }

  if (typeof supabase.sql === 'function') {
    console.log('✅ supabase.sql() is available');
  } else {
    console.log('❌ supabase.sql() is NOT available');
    console.log('   Supabase JS client does not support raw SQL execution');
  }
  console.log('');

  // Summary
  console.log('📋 SUMMARY:');
  console.log('='.repeat(80));
  console.log('Supabase JS Client capabilities:');
  console.log('  ✅ Query tables via Data API (SELECT, INSERT, UPDATE, DELETE)');
  console.log('  ✅ Call PostgreSQL functions via RPC');
  console.log('  ❌ Execute arbitrary SQL (CREATE TABLE, ALTER TABLE, etc.)');
  console.log('  ❌ Run migrations directly');
  console.log('');
  console.log('Why?');
  console.log('  • Supabase JS client uses PostgREST (REST API over PostgreSQL)');
  console.log('  • PostgREST only exposes tables, views, and functions - not DDL');
  console.log('  • This is by design for security (prevents SQL injection)');
  console.log('');
  console.log('How to run migrations:');
  console.log('  1. Supabase CLI: npx supabase db push');
  console.log('  2. Direct PostgreSQL connection (requires DB password)');
  console.log('  3. Supabase Dashboard SQL Editor');
  console.log('  4. Create an RPC function that executes SQL (security risk!)');
  console.log('');

  // Test 5: Check if Management API is available
  console.log('5️⃣ Checking Supabase Management API:');
  console.log('='.repeat(80));

  const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

  if (SUPABASE_ACCESS_TOKEN) {
    console.log('✅ SUPABASE_ACCESS_TOKEN found in environment');
    console.log('   Can use Management API to run migrations programmatically');
    console.log('   Endpoint: https://api.supabase.com/v1/projects/{ref}/database/migrations');
  } else {
    console.log('❌ SUPABASE_ACCESS_TOKEN not found');
    console.log('   Management API not available');
    console.log('   Get token from: https://supabase.com/dashboard/account/tokens');
  }
  console.log('');
}

testSQLExecution().catch(console.error);
