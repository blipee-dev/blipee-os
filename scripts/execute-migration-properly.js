const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function executeMigration() {
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

    // Read the entire migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250112_create_missing_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📋 Executing migration...\n');

    // Execute the entire migration as one transaction
    await client.query('BEGIN');
    
    try {
      // Execute the full migration
      await client.query(migrationSQL);
      
      await client.query('COMMIT');
      console.log('✅ Migration executed successfully!\n');
      
      // Verify tables were created
      console.log('🔍 Verifying tables...');
      const tables = ['buildings', 'emissions_data', 'waste_data', 'water_usage', 'sustainability_reports', 'document_uploads'];
      
      for (const table of tables) {
        const result = await client.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
          [table]
        );
        const exists = result.rows[0].exists;
        console.log(`  ${table}: ${exists ? '✅ Created' : '❌ Missing'}`);
      }
      
      // Check RLS status
      console.log('\n🔒 Checking RLS status...');
      const rlsResult = await client.query(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('buildings', 'emissions_data', 'waste_data', 'water_usage', 'sustainability_reports', 'document_uploads')
      `);
      
      rlsResult.rows.forEach(row => {
        console.log(`  ${row.tablename}: RLS ${row.rowsecurity ? '✅ Enabled' : '❌ Disabled'}`);
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', error.message);
      console.error('\nError detail:', error.detail || 'No additional details');
      
      // If it's a syntax error, try to show where
      if (error.position) {
        const position = parseInt(error.position);
        const errorContext = migrationSQL.substring(Math.max(0, position - 100), position + 100);
        console.error('\nError context around position', position, ':');
        console.error(errorContext);
      }
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

executeMigration();