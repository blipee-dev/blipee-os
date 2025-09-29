import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function debug() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get ALL 2024 emissions
  const { data: all2024 } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('organization_id', orgId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const totalAll = all2024?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
  console.log('ALL 2024 records: ' + all2024?.length);
  console.log('Total emissions: ' + totalAll.toFixed(1) + ' tCO2e');

  // Get with ordering/limit like the page does
  const { data: ordered } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('organization_id', orgId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')
    .order('created_at', { ascending: false });

  const totalOrdered = ordered?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
  console.log('\nWith order by created_at desc: ' + ordered?.length + ' records');
  console.log('Total emissions: ' + totalOrdered.toFixed(1) + ' tCO2e');

  // Check what dashboard might be calculating
  // Dashboard shows 532.1, actual is 642.1, difference is 110
  console.log('\nDifference: ' + (totalAll - 532.1).toFixed(1) + ' tCO2e missing from dashboard');

  // Check if it's a specific category
  const { data: metricsData } = await supabase
    .from('metrics_data')
    .select('metric_id, co2e_emissions')
    .eq('organization_id', orgId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const { data: metricDefs } = await supabase
    .from('metrics_catalog')
    .select('id, name, category');

  // Group by category
  const byCategory: any = {};
  metricsData?.forEach(m => {
    const def = metricDefs?.find(d => d.id === m.metric_id);
    const cat = def?.category || 'Unknown';
    if (!byCategory[cat]) byCategory[cat] = 0;
    byCategory[cat] += (m.co2e_emissions || 0) / 1000;
  });

  console.log('\nEmissions by category:');
  Object.entries(byCategory)
    .sort((a: any, b: any) => b[1] - a[1])
    .forEach(([cat, total]: any) => {
      console.log(`  ${cat}: ${total.toFixed(1)} tCO2e`);
    });

  // Check if Business Travel is being excluded
  const businessTravelTotal = byCategory['Business Travel'] || 0;
  console.log('\nBusiness Travel: ' + businessTravelTotal.toFixed(1) + ' tCO2e');
  console.log('Dashboard total + Business Travel portion: ' + (532.1 + 110).toFixed(1) + ' tCO2e');

  // Maybe it's excluding a specific metric
  const metricTotals: any = {};
  metricsData?.forEach(m => {
    const def = metricDefs?.find(d => d.id === m.metric_id);
    const name = def?.name || m.metric_id;
    if (!metricTotals[name]) metricTotals[name] = 0;
    metricTotals[name] += (m.co2e_emissions || 0) / 1000;
  });

  console.log('\nTop emissions by metric:');
  Object.entries(metricTotals)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([name, total]: any) => {
      console.log(`  ${name}: ${total.toFixed(1)} tCO2e`);
    });
}

debug();