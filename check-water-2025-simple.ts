import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .or('subcategory.eq.Water,code.ilike.%water%');

  const ids = metrics?.map(m => m.id) || [];
  const { data } = await supabase
    .from('metrics_data')
    .select('metric_id, value, period_start')
    .in('metric_id', ids)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  let withdrawal = 0;
  let discharge = 0;

  data?.forEach(r => {
    const m = metrics?.find(x => x.id === r.metric_id);
    if (m?.code === 'scope3_water_supply') withdrawal += parseFloat(r.value);
    if (m?.code === 'scope3_wastewater') discharge += parseFloat(r.value);
  });

  console.log('💧 2025 Water Summary:\n');
  console.log('Total Withdrawal: ' + (withdrawal / 1000).toFixed(2) + ' ML');
  console.log('Total Discharge:  ' + (discharge / 1000).toFixed(2) + ' ML');
  console.log('Consumption:      ' + ((withdrawal - discharge) / 1000).toFixed(2) + ' ML');
  console.log('\nRecords: ' + (data?.length || 0));
}

check();
