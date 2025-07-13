const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function deployRetailSchema() {
  const client = new Client({
    host: 'aws-0-eu-west-3.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.quovvwrwyfkzhgqdeham',
    password: 'vkS1yz3A8tH3jvnp',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Deploying Retail Schema...\n');
    await client.connect();
    
    // Read the migration schema (compatible with existing system)
    const schemaPath = path.join(__dirname, '..', 'projects', 'retail-intelligence', 'database', 'migrations', '001_initial_schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');

    console.log('📋 Deploying retail migration schema...');
    console.log('This includes:');
    console.log('- retail schema creation');
    console.log('- Legacy tables (sales_data, people_counting_data, etc.)');
    console.log('- New tables (stores, user_mappings, etc.)');
    console.log('- Indexes and views for performance');
    console.log('- Backward compatibility functions\n');

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

    console.log(`Found ${tablesResult.rows.length} retail tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ retail.${row.tablename}`);
    });

    // Check if retail schema exists
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'retail'
    `);

    if (schemaResult.rows.length > 0) {
      console.log('\n✅ Retail schema successfully created');
    } else {
      console.log('\n❌ Retail schema not found');
    }

    console.log('\n🎯 Next steps for testing:');
    console.log('1. Test retail API endpoints');
    console.log('2. Insert sample data');
    console.log('3. Test Telegram bot compatibility');
    console.log('4. Test web dashboard integration');

  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

deployRetailSchema();