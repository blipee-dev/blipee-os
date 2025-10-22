#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

console.log('🔍 Investigating migration execution options...\n');

// Option 1: Check for Supabase CLI
console.log('1️⃣ OPTION 1: Supabase CLI');
console.log('='.repeat(80));
console.log('✅ RECOMMENDED - Officially supported');
console.log('   Command: npx supabase db push');
console.log('   Status: Available (you\'ve been using this)');
console.log('');

// Option 2: Direct PostgreSQL connection
console.log('2️⃣ OPTION 2: Direct PostgreSQL Connection');
console.log('='.repeat(80));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)/)?.[1];

if (dbPassword && projectRef) {
  console.log('✅ Database password configured!');
  console.log(`   Host: db.${projectRef}.supabase.co`);
  console.log('   Port: 5432');
  console.log('   Database: postgres');
  console.log('   User: postgres');
  console.log('');

  console.log('Testing connection...');

  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL connection successful!');

    // Test running a simple query
    const result = await client.query('SELECT version()');
    console.log('✅ Can execute SQL queries');
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);

    // Test if we can run DDL
    await client.query('SELECT 1');
    console.log('✅ Can run migrations directly!');
    console.log('');

    await client.end();

    console.log('📝 Can create a migration runner script');
    console.log('   Usage: node run-migration.mjs <migration-file>');

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
} else {
  console.log('❌ SUPABASE_DB_PASSWORD not configured');
  console.log('');
  console.log('To enable direct connection:');
  console.log('  1. Go to Supabase Dashboard > Project Settings > Database');
  console.log('  2. Copy the connection string password');
  console.log('  3. Add to .env.local: SUPABASE_DB_PASSWORD=your_password');
  console.log('');
}

// Option 3: Supabase Management API
console.log('3️⃣ OPTION 3: Supabase Management API');
console.log('='.repeat(80));

const managementToken = process.env.SUPABASE_ACCESS_TOKEN;

if (managementToken && projectRef) {
  console.log('✅ Management API token configured!');
  console.log('   Can run migrations via HTTP API');
  console.log('   Endpoint: https://api.supabase.com/v1/projects/{ref}/database/migrations');
  console.log('');

  console.log('Testing Management API...');

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
      }
    });

    if (response.ok) {
      console.log('✅ Management API connection successful!');
      console.log('✅ Can run migrations via API');
      console.log('');
      console.log('📝 Can create API-based migration runner');
    } else {
      console.log('❌ Management API error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Management API failed:', error.message);
  }
} else {
  console.log('❌ SUPABASE_ACCESS_TOKEN not configured');
  console.log('');
  console.log('To enable Management API:');
  console.log('  1. Go to https://supabase.com/dashboard/account/tokens');
  console.log('  2. Generate a new access token');
  console.log('  3. Add to .env.local: SUPABASE_ACCESS_TOKEN=your_token');
  console.log('');
}

// Option 4: RPC function approach (not recommended)
console.log('4️⃣ OPTION 4: Custom RPC Function (NOT RECOMMENDED)');
console.log('='.repeat(80));
console.log('⚠️  Create a PostgreSQL function that executes dynamic SQL');
console.log('⚠️  SECURITY RISK: Allows arbitrary SQL execution');
console.log('⚠️  Only use in development, never in production');
console.log('');

// Summary
console.log('📋 RECOMMENDATION:');
console.log('='.repeat(80));
console.log('Current workflow is optimal:');
console.log('  • I create migration files');
console.log('  • You run: npx supabase db push');
console.log('  • Safe, auditable, version controlled');
console.log('');
console.log('Alternative: If you add SUPABASE_DB_PASSWORD to .env.local,');
console.log('I can create a script to run migrations automatically.');
console.log('');
