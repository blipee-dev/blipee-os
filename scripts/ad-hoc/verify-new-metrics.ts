import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  const { data: allWater } = await supabase
    .from('metrics_catalog')
    .select('code, name, consumption_rate')
    .ilike('code', '%water%')
    .order('code');

  console.log('🌊 All Water-Related Metrics:\n');
  
  allWater?.forEach(m => {
    const rate = m.consumption_rate != null ? `${(m.consumption_rate * 100).toFixed(0)}% consumed` : 'N/A';
    console.log(`  ${m.code.padEnd(30)} ${m.name.padEnd(40)} ${rate}`);
  });
  
  console.log(`\n📊 Total: ${allWater?.length || 0} water metrics`);
}

verify();
