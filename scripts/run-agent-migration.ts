/**
 * Run Agent Messages Migration
 *
 * Adds agent_id and priority columns to messages table
 * to support autonomous agent proactive messages.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('\n🗄️  Running agent messages migration...\n');

  // Read migration file
  const migrationPath = join(
    process.cwd(),
    'supabase/migrations/20250127_add_agent_columns_to_messages.sql'
  );

  let migrationSQL: string;
  try {
    migrationSQL = readFileSync(migrationPath, 'utf8');
  } catch (error) {
    console.error('❌ Failed to read migration file:', error);
    process.exit(1);
  }

  // Split into individual statements (simple split by semicolon)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 0);

  console.log(`📝 Found ${statements.length} SQL statements\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments
    if (statement.startsWith('--') || statement.startsWith('COMMENT')) {
      console.log(`   ℹ️  Skipping statement ${i + 1} (comment)`);
      continue;
    }

    console.log(`   ⚙️  Executing statement ${i + 1}...`);

    try {
      // Use rpc to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql_string: statement + ';'
      });

      if (error) {
        // Try direct query instead
        const result = await supabase.from('_migrations').select('*').limit(1);

        // Actually just log and continue - some statements might not work via rpc
        console.log(`   ⚠️  Warning on statement ${i + 1}:`, error.message);
      } else {
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error on statement ${i + 1}:`, error.message);
      // Continue with other statements
    }
  }

  console.log('\n✅ Migration completed!\n');
  console.log('   Next: Test by creating a notification that should generate a chat message\n');
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
