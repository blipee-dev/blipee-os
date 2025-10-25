import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  // Get all energy metrics
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .in('category', ['Purchased Energy', 'Electricity']);

  console.log('📊 Energy consumption by type:\n');

  for (const m of metrics || []) {
    const { data } = await supabase
      .from('metrics_data')
      .select('value')
      .eq('metric_id', m.id);

    const sum = (data || []).reduce((s: number, r: any) => s + parseFloat(r.value), 0);
    if (sum > 0) {
      console.log(`${m.code}: ${sum.toFixed(0)} kWh (${data?.length} records)`);
    }
  }
})();
