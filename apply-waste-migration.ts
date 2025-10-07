import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('🚀 Applying waste tracking enhanced migration...\n');

  const migration = fs.readFileSync(
    'supabase/migrations/20251007_waste_tracking_enhanced.sql',
    'utf-8'
  );

  // Split into statements and execute one by one
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';

    if (stmt.includes('COMMENT ON') || stmt.length < 10) {
      continue;
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
      if (error) {
        console.log(`❌ Statement ${i + 1} failed:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
      }
    } catch (err: any) {
      console.log(`❌ Statement ${i + 1} error:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} failed`);
}

applyMigration();
