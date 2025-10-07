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
    .order('period_start');

  const months: any = {};
  data?.forEach(r => {
    const m = metrics?.find(x => x.id === r.metric_id);
    const date = new Date(r.period_start);
    const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!months[key]) months[key] = { w: 0, d: 0 };
    
    if (m?.code === 'scope3_water_supply') months[key].w += parseFloat(r.value);
    if (m?.code === 'scope3_wastewater') months[key].d += parseFloat(r.value);
  });

  console.log('📅 2025 Monthly Water Data:\n');
  Object.entries(months).forEach(([month, vals]: any) => {
    console.log(month + ':');
    console.log('  Withdrawal: ' + (vals.w / 1000).toFixed(3) + ' ML');
    console.log('  Discharge:  ' + (vals.d / 1000).toFixed(3) + ' ML');
    console.log('  Consumption: ' + ((vals.w - vals.d) / 1000).toFixed(3) + ' ML');
  });
}

check();
