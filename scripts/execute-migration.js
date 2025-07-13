const fs = require('fs').promises;
const path = require('path');

async function executeMigration() {
  console.log('🚀 Executing Database Migration...\n');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250112_create_missing_tables.sql');
  const migrationSQL = await fs.readFile(migrationPath, 'utf8');
  
  console.log('📋 Migration will create:');
  console.log('- buildings table');
  console.log('- emissions_data table'); 
  console.log('- waste_data table');
  console.log('- water_usage table');
  console.log('- sustainability_reports table');
  console.log('- document_uploads table\n');
  
  console.log('Since we cannot execute raw SQL directly from Node.js, here\'s what to do:\n');
  
  console.log('Option 1: Use Supabase Dashboard (Easiest)');
  console.log('1. Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
  console.log('2. Copy and paste the following SQL:\n');
  
  // Print a portion of the SQL for reference
  const sqlPreview = migrationSQL.split('\n').slice(0, 20).join('\n');
  console.log('--- SQL Preview (first 20 lines) ---');
  console.log(sqlPreview);
  console.log('... (continued in file)\n');
  
  console.log('The full SQL is saved at:', migrationPath);
  console.log('\nOption 2: Use a PostgreSQL client');
  console.log('Connection details:');
  console.log('- Host: aws-0-eu-west-3.pooler.supabase.com');
  console.log('- Port: 5432');
  console.log('- Database: postgres');
  console.log('- User: postgres.quovvwrwyfkzhgqdeham');
  console.log('- Password: postgresblipeeos\n');
  
  // Also save the migration content for easy copying
  const tempPath = path.join(__dirname, 'MIGRATION_TO_RUN.sql');
  await fs.writeFile(tempPath, migrationSQL);
  console.log('✅ Migration SQL saved to:', tempPath);
  console.log('   You can copy this file content easily\n');
  
  console.log('After running the migration, verify with:');
  console.log('node scripts/check-db-tables.js');
}

executeMigration();