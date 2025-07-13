const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function runSafeMigration() {
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

    // Read the safe migration
    const migrationPath = path.join(__dirname, 'safe-migration.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📋 Running safe migration...\n');

    // Execute migration
    try {
      await client.query(migrationSQL);
      console.log('✅ Migration completed successfully!\n');
      
      // Verify tables
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
      
      // Check RLS
      console.log('\n🔒 Checking RLS status...');
      const rlsResult = await client.query(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('buildings', 'emissions_data', 'waste_data', 'water_usage', 'sustainability_reports', 'document_uploads')
        ORDER BY tablename
      `);
      
      rlsResult.rows.forEach(row => {
        console.log(`  ${row.tablename}: RLS ${row.rowsecurity ? '✅ Enabled' : '❌ Disabled'}`);
      });
      
      console.log('\n✅ Database setup complete!');
      console.log('\nNext steps:');
      console.log('1. Run: node scripts/check-db-tables.js to verify all tables');
      console.log('2. Apply RLS policies to existing tables');
      
    } catch (error) {
      console.error('❌ Migration error:', error.message);
      if (error.detail) console.error('Detail:', error.detail);
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

runSafeMigration();