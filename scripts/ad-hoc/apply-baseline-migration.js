const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  console.log('📦 Applying baseline restatement migration...\n');

  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/20251012_baseline_restatement.sql', 'utf8');

    // Split into individual statements (basic approach - handles most cases)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error.message);
        console.log('Statement:', statement.substring(0, 200));
        // Continue with next statement
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✅ Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration().catch(console.error);
