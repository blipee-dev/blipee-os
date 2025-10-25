import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  console.log('🌊 Running water end-use tracking migration...\n');

  const sql = readFileSync('supabase/migrations/20251007_water_enduse_tracking.sql', 'utf8');

  // Split by statement and execute one by one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const [index, stmt] of statements.entries()) {
    if (!stmt) continue;

    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
    console.log(`[${index + 1}/${statements.length}] ${preview}...`);

    try {
      const { error } = await (supabase as any).rpc('exec_sql', { sql_query: stmt + ';' });
      if (error) {
        console.error(`❌ Error:`, error.message);
        if (error.message.includes('does not exist') || error.message.includes('already exists')) {
          console.log('   ⚠️  Continuing anyway...\n');
          continue;
        }
        throw error;
      }
      console.log('   ✅ Success\n');
    } catch (e: any) {
      console.error('❌ Failed:', e.message);
      process.exit(1);
    }
  }

  console.log('\n✅ Migration completed successfully!\n');

  // Verify
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('code, name, consumption_rate')
    .or('code.ilike.scope3_water_%,code.ilike.scope3_wastewater_%')
    .order('code');

  console.log('📊 Water Metrics in Database:\n');
  metrics?.forEach(m => {
    const rate = m.consumption_rate != null ? `${(m.consumption_rate * 100).toFixed(0)}% consumed` : 'N/A';
    console.log(`  ${m.code.padEnd(30)} ${rate}`);
  });
}

runMigration();
