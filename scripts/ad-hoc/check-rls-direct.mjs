#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePassword = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Extract project ref from URL (e.g., https://abc123.supabase.co -> abc123)
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)/)?.[1];

if (!projectRef) {
  console.error('❌ Could not parse project ref from Supabase URL');
  process.exit(1);
}

console.log('📡 Connecting to Supabase PostgreSQL database...');
console.log(`   Project: ${projectRef}\n`);

// Try connection via connection pooler
const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: supabasePassword,
  ssl: { rejectUnauthorized: false }
});

async function checkRLS() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Check tables with RLS enabled
    console.log('📊 TABLES WITH ROW LEVEL SECURITY ENABLED:');
    console.log('='.repeat(80));

    const tablesResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
        AND rowsecurity = true
      ORDER BY tablename;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  NO tables found with RLS enabled!\n');
    } else {
      console.log(`Found ${tablesResult.rows.length} tables with RLS enabled:\n`);
      tablesResult.rows.forEach(row => {
        console.log(`  ✓ ${row.tablename}`);
      });
      console.log('');
    }

    // 2. Check all RLS policies
    console.log('🔐 ACTIVE RLS POLICIES:');
    console.log('='.repeat(80));

    const policiesResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (policiesResult.rows.length === 0) {
      console.log('⚠️  NO RLS policies found!\n');
    } else {
      console.log(`Found ${policiesResult.rows.length} active policies:\n`);

      let currentTable = '';
      policiesResult.rows.forEach(policy => {
        if (policy.tablename !== currentTable) {
          currentTable = policy.tablename;
          console.log(`\n📋 Table: ${policy.tablename}`);
          console.log('   ' + '-'.repeat(75));
        }
        console.log(`   • Policy: ${policy.policyname}`);
        console.log(`     Command: ${policy.cmd}`);
        console.log(`     Permissive: ${policy.permissive}`);
        console.log(`     Roles: ${policy.roles.join(', ')}`);
      });
      console.log('');
    }

    // 3. Summary by table
    console.log('\n📈 POLICY SUMMARY BY TABLE:');
    console.log('='.repeat(80));

    const summaryResult = await client.query(`
      SELECT
        tablename,
        COUNT(*) as policy_count,
        array_agg(DISTINCT cmd) as commands
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename
      ORDER BY policy_count DESC, tablename;
    `);

    summaryResult.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.policy_count} policies (${row.commands.join(', ')})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ RLS Check Complete\n');

  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.error('❌ Cannot connect to database');
      console.error('   Database password not configured in environment');
      console.error('\n💡 To connect directly, you need SUPABASE_DB_PASSWORD');
      console.error('   Get it from: Supabase Dashboard > Project Settings > Database > Connection String\n');
    } else if (error.code === '28P01') {
      console.error('❌ Authentication failed');
      console.error('   Check SUPABASE_DB_PASSWORD is correct\n');
    } else {
      console.error('❌ Error:', error.message);
      console.error('   Code:', error.code);
    }

    console.log('\n📝 ALTERNATIVE: Check via Supabase Dashboard');
    console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/editor');
    console.log('   2. Run SQL query:');
    console.log('      SELECT tablename, COUNT(*) as policies FROM pg_policies WHERE schemaname = \'public\' GROUP BY tablename;');
    console.log('');

    process.exit(1);
  } finally {
    await client.end();
  }
}

checkRLS();
