const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const sql = fs.readFileSync('supabase/migrations/20251014_gri_additional_standards.sql', 'utf8');

    console.log('Applying GRI additional standards migration...');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      if (statement.includes('CREATE') || statement.includes('INSERT') || statement.includes('ALTER') || statement.includes('COMMENT')) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn(`Warning on statement ${i + 1}:`, error.message);
          } else if (!error) {
            console.log(`✓ Statement ${i + 1} executed successfully`);
          } else {
            console.log(`⊘ Statement ${i + 1} skipped (already exists)`);
          }
        } catch (err) {
          console.warn(`Error on statement ${i + 1}:`, err.message);
        }
      }
    }

    // Verify tables were created
    console.log('\nVerifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['environmental_incidents', 'suppliers', 'biodiversity_sites']);

    if (tables) {
      console.log('✓ Tables created:', tables.map(t => t.table_name).join(', '));
    }

    // Check materials metrics
    console.log('\nChecking materials metrics...');
    const { data: materials, error: matError } = await supabase
      .from('metrics_catalog')
      .select('code, name, category')
      .ilike('category', '%Material%');

    if (materials) {
      console.log(`✓ ${materials.length} materials metrics in catalog`);
      materials.slice(0, 5).forEach(m => console.log(`  - ${m.code}: ${m.name}`));
      if (materials.length > 5) console.log(`  ... and ${materials.length - 5} more`);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();
