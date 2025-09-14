const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250113_enterprise_audit_events.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements (simple split by semicolon at end of line)
    const statements = sql
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));

    console.log(`Running ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
        console.log(statement.substring(0, 100) + '...');
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).single();

        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with next statement instead of stopping
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log('\nMigration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();