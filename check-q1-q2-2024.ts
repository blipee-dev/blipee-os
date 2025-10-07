import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs![0].id;

  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code')
    .or('subcategory.eq.Water,code.ilike.%water%');

  const withdrawalMetrics = waterMetrics!.filter(m =>
    !m.code.includes('wastewater') && m.code.includes('water')
  ).map(m => m.id);

  const { data } = await supabase
    .from('metrics_data')
    .select('period_start, metric_id, value')
    .eq('organization_id', orgId)
    .in('metric_id', withdrawalMetrics)
    .gte('period_start', '2024-01-01')
    .lt('period_start', '2024-07-01')
    .order('period_start');

  console.log('2024 Q1-Q2 withdrawal records:', data?.length || 0);
  
  const byMonth: any = {};
  data?.forEach((r: any) => {
    const month = r.period_start.substring(0, 7);
    byMonth[month] = (byMonth[month] || 0) + parseFloat(r.value);
  });

  console.log('\nWithdrawal by month:');
  Object.keys(byMonth).sort().forEach(m => {
    console.log(`  ${m}: ${byMonth[m].toFixed(2)} m³`);
  });
}

check();
