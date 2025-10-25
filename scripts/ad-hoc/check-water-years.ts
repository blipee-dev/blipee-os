import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code')
    .in('code', [
      'scope3_water_toilet',
      'scope3_water_kitchen',
      'scope3_water_cleaning',
      'scope3_water_irrigation',
      'scope3_water_other'
    ]);

  const ids = waterMetrics?.map(m => m.id) || [];

  const { data } = await supabase
    .from('metrics_data')
    .select('period_start, value')
    .in('metric_id', ids)
    .order('period_start');

  const byYear: any = {};
  data?.forEach((r: any) => {
    const year = new Date(r.period_start).getFullYear();
    if (!byYear[year]) byYear[year] = { count: 0, total: 0 };
    byYear[year].count++;
    byYear[year].total += parseFloat(r.value);
  });

  console.log('💧 Water end-use data by year:\n');
  Object.entries(byYear).forEach(([year, stats]: [string, any]) => {
    console.log(`${year}: ${stats.count} records, ${(stats.total / 1000).toFixed(2)} ML total`);
  });
}

check();
