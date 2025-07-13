const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function executeSQLDirectly() {
  // PostgreSQL connection
  const client = new Client({
    host: 'aws-0-eu-west-3.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.quovvwrwyfkzhgqdeham',
    password: 'vkS1yz3A8tH3jvnp',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250112_create_missing_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    // Split SQL into individual statements (basic split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Extract table name if possible
      const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS public\.(\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : `Statement ${i + 1}`;
      
      try {
        await client.query(statement);
        console.log(`✅ ${tableName} - Success`);
        successCount++;
      } catch (error) {
        console.log(`❌ ${tableName} - Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);

    // Test if tables were created
    console.log('\n🔍 Verifying tables...');
    const tables = ['buildings', 'emissions_data', 'waste_data', 'water_usage', 'sustainability_reports', 'document_uploads'];
    
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${table}: ${exists ? '✅ Exists' : '❌ Missing'}`);
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

executeSQLDirectly();