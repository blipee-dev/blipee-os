import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('code, name, consumption_rate')
    .or('code.ilike.scope3_water_%,code.ilike.scope3_wastewater_%')
    .order('code');

  console.log('🌊 Water End-Use Metrics Created:\n');
  
  const withdrawal = metrics?.filter(m => m.code.includes('water_') && !m.code.includes('wastewater'));
  const discharge = metrics?.filter(m => m.code.includes('wastewater_'));
  
  console.log('📥 WITHDRAWAL METRICS:');
  withdrawal?.forEach(m => {
    const rate = m.consumption_rate != null ? `${(m.consumption_rate * 100).toFixed(0)}% consumed` : 'N/A';
    console.log(`  ✓ ${m.name.padEnd(35)} ${rate}`);
  });
  
  console.log('\n📤 DISCHARGE METRICS:');
  discharge?.forEach(m => {
    console.log(`  ✓ ${m.name}`);
  });
  
  console.log(`\n📊 Total: ${metrics?.length || 0} water metrics`);
}

verify();
