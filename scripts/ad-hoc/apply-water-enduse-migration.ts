import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function apply() {
  const sql = readFileSync('supabase/migrations/20251007_water_enduse_tracking.sql', 'utf8');

  console.log('📝 Applying water end-use tracking migration...\n');

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!\n');

  // Verify new metrics
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('code, name, consumption_rate')
    .ilike('code', 'scope3_water_%')
    .order('code');

  console.log('🌊 Water Metrics Created:\n');
  metrics?.forEach(m => {
    console.log(`${m.code}: ${m.consumption_rate ? (m.consumption_rate * 100 + '% consumed') : 'N/A'}`);
  });
}

apply();
