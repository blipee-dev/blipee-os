const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function getTableColumns(tableName) {
  console.log(`\n📋 Checking columns in ${tableName} table...\n`);

  const { data, error } = await supabase.rpc('get_table_columns', {
    p_table_name: tableName
  });

  if (error) {
    console.log('❌ get_table_columns function not available');
    console.log('Trying alternative method via information_schema...\n');

    // Alternative: Query Postgres information_schema
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;

    // We can't execute raw SQL, so let's just provide the solution
    console.log('⚠️ Cannot query schema directly via Supabase client');
    console.log('\n✅ SOLUTION: Drop and recreate the suppliers table');
    console.log('\nThe existing suppliers table has a different schema.');
    console.log('We need to either:');
    console.log('  1. DROP TABLE suppliers CASCADE; then run migration');
    console.log('  2. Rename existing: ALTER TABLE suppliers RENAME TO suppliers_old;');
    console.log('  3. Modify migration to ALTER existing table');

    return;
  }

  console.log('Columns:', data);
}

async function main() {
  await getTableColumns('suppliers');
  await getTableColumns('biodiversity_sites');
  await getTableColumns('environmental_incidents');
}

main().catch(console.error);
