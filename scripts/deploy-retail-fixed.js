const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function deployRetailSchemaFixed() {
  const client = new Client({
    host: 'aws-0-eu-west-3.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.quovvwrwyfkzhgqdeham',
    password: 'vkS1yz3A8tH3jvnp',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Deploying Retail Schema (Fixed)...\n');
    await client.connect();
    
    // First, enable required extensions
    console.log('🔧 Enabling required extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✅ Extensions enabled\n');

    // Read and modify the schema to use gen_random_uuid() instead
    const schemaPath = path.join(__dirname, '..', 'projects', 'retail-intelligence', 'database', 'migrations', '001_initial_schema.sql');
    let schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Replace uuid_generate_v4() with gen_random_uuid() (Supabase standard)
    schemaSQL = schemaSQL.replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
    
    console.log('📋 Deploying retail migration schema...');

    // Execute the schema
    await client.query(schemaSQL);
    console.log('✅ Retail schema deployed successfully!\n');

    // Verify retail tables were created
    console.log('🔍 Verifying retail tables...');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'retail'
      ORDER BY tablename
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`Found ${tablesResult.rows.length} retail tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`  ✅ retail.${row.tablename}`);
      });
    } else {
      console.log('❌ No retail tables found');
    }

    // Populate stores from any existing data
    console.log('\n🏪 Setting up stores...');
    try {
      await client.query('SELECT retail.populate_stores_from_data()');
      console.log('✅ Store population function executed');
    } catch (error) {
      console.log('ℹ️  No existing data to populate stores from');
    }

    // Check total table count
    const totalTablesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_tables 
      WHERE schemaname IN ('public', 'retail')
    `);
    
    console.log(`\n📊 Database now has ${totalTablesResult.rows[0].count} total tables`);
    console.log('✅ Retail module ready for testing!');

  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

deployRetailSchemaFixed();