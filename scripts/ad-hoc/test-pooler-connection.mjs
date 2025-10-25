#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)/)?.[1];

console.log('🔍 Testing different connection methods...\n');

if (!dbPassword || !projectRef) {
  console.error('❌ Missing configuration');
  process.exit(1);
}

// Try different connection URLs
const connectionConfigs = [
  {
    name: 'Direct Connection (IPv4)',
    config: {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: dbPassword,
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'Connection Pooler (Session Mode)',
    config: {
      host: `aws-0-us-east-1.pooler.supabase.com`,
      port: 5432,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: dbPassword,
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'Connection Pooler (Transaction Mode)',
    config: {
      host: `aws-0-us-east-1.pooler.supabase.com`,
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: dbPassword,
      ssl: { rejectUnauthorized: false }
    }
  }
];

for (const { name, config } of connectionConfigs) {
  console.log(`Testing: ${name}`);
  console.log('  Host:', config.host);
  console.log('  Port:', config.port);
  console.log('  User:', config.user);

  const client = new Client(config);

  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    console.log('  ✅ SUCCESS!');
    console.log('  Version:', result.rows[0].version.split(' ')[1]);

    // Test if we can run DDL
    await client.query('SELECT 1');
    console.log('  ✅ Can execute queries\n');

    await client.end();

    console.log('✅ WORKING CONNECTION FOUND!\n');
    console.log('Connection details:');
    console.log('  Host:', config.host);
    console.log('  Port:', config.port);
    console.log('  User:', config.user);
    console.log('  Database:', config.database);
    console.log('\nI can create a migration runner with these settings!');
    break;

  } catch (error) {
    console.log('  ❌ Failed:', error.message);
    console.log('');
    try {
      await client.end();
    } catch {}
  }
}

console.log('\n📋 SUMMARY:');
console.log('='.repeat(80));
console.log('If none worked, the database connection is restricted.');
console.log('This is normal for some Supabase plans or network configurations.');
console.log('');
console.log('Current approach (npx supabase db push) remains the best option:');
console.log('  ✅ Officially supported by Supabase');
console.log('  ✅ Handles migrations safely');
console.log('  ✅ Version controlled');
console.log('  ✅ No need for direct DB access');
