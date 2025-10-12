const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkSuppliersSchema() {
  console.log('Checking existing suppliers table schema...\n');

  // Try to get a sample row to see columns
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error querying suppliers:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✓ Existing columns in suppliers table:');
    console.log(Object.keys(data[0]).join(', '));
  } else {
    console.log('✓ suppliers table exists but is empty');
    console.log('Attempting to insert a test row to discover schema...');

    // Try inserting with minimal required fields
    const { error: insertError } = await supabase
      .from('suppliers')
      .insert({ supplier_name: 'test' })
      .select();

    if (insertError) {
      console.log('Insert failed:', insertError.message);
      console.log('This tells us about required fields');
    }
  }

  // Check what indexes exist
  console.log('\nChecking existing indexes on suppliers table...');
  const { data: indexes, error: indexError } = await supabase
    .rpc('get_table_indexes', { table_name: 'suppliers' });

  if (indexError) {
    console.log('Could not fetch indexes (function may not exist)');
  } else if (indexes) {
    console.log('Existing indexes:', indexes);
  }
}

checkSuppliersSchema().catch(console.error);
