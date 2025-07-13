const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client with service role key
const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function applyMigration() {
  console.log('🚀 Alternative Migration Approach\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250112_create_missing_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('📋 Migration Content Summary:');
    console.log('- Creates 6 missing tables (buildings, emissions_data, etc.)');
    console.log('- Adds indexes for performance');
    console.log('- Enables Row Level Security');
    console.log('- Creates RLS policies\n');
    
    console.log('⚠️  Since we cannot execute raw SQL via the JS client, here are your options:\n');
    
    console.log('Option 1: Supabase Dashboard (Recommended)');
    console.log('1. Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
    console.log('2. Copy the content from: supabase/migrations/20250112_create_missing_tables.sql');
    console.log('3. Paste and run it in the SQL editor\n');
    
    console.log('Option 2: Use Supabase CLI with password');
    console.log('1. Get your database password from:');
    console.log('   https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/settings/database');
    console.log('2. Run: npx supabase db push');
    console.log('3. Enter the password when prompted\n');
    
    console.log('Option 3: Direct PostgreSQL connection');
    console.log('Use any PostgreSQL client with the connection string from your dashboard\n');
    
    // Create a simplified version that shows what will be created
    console.log('📊 Tables that will be created:');
    const tables = [
      { name: 'buildings', purpose: 'Multi-building support for organizations' },
      { name: 'emissions_data', purpose: 'Track Scope 1, 2, 3 GHG emissions' },
      { name: 'waste_data', purpose: 'Waste generation and recycling data' },
      { name: 'water_usage', purpose: 'Water consumption tracking' },
      { name: 'sustainability_reports', purpose: 'Store generated reports' },
      { name: 'document_uploads', purpose: 'Document storage and data extraction' }
    ];
    
    tables.forEach(table => {
      console.log(`  • ${table.name}: ${table.purpose}`);
    });
    
    // Save a copy for easy access
    const copyPath = path.join(__dirname, 'migration_to_run.sql');
    await fs.writeFile(copyPath, migrationSQL);
    console.log('\n✅ Migration file copied to:', copyPath);
    console.log('   You can copy this file content to run in Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration();