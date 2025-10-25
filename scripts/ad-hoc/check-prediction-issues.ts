import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkIssues() {
  // Get specific problematic metrics
  const { data: metrics } = await supabase
    .from('metrics')
    .select('*')
    .in('id', [
      '2fe49bc3-0f26-4597-a13d-54d89b1e08d9', // 92% increase
      'f312fb8f-7f20-490c-8462-c96e787e99ff'  // 113% increase
    ]);

  console.log('=== PROBLEMATIC METRICS ===\n');
  metrics?.forEach(m => {
    console.log(`${m.name} [${m.category}]: ${m.unit}`);
    console.log(`  ID: ${m.id}`);
    console.log(`  Emission factor: ${m.emission_factor}`);
  });

  // Check historical plane travel (the 92% increase one)
  const planeId = '2fe49bc3-0f26-4597-a13d-54d89b1e08d9';
  const { data: planeHistorical } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('metric_id', planeId)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .lte('period_end', '2024-12-31')
    .order('period_start');

  const { data: planePredicted } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('metric_id', planeId)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .order('period_start');

  console.log('\n=== PLANE TRAVEL ANALYSIS ===\n');

  // Calculate monthly averages by year
  const planeByYear: any = {};
  planeHistorical?.forEach(d => {
    const year = new Date(d.period_start).getFullYear();
    if (!planeByYear[year]) planeByYear[year] = [];
    planeByYear[year].push((d.co2e_emissions || 0) / 1000);
  });

  Object.entries(planeByYear).forEach(([year, values]: any) => {
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const total = values.reduce((a: number, b: number) => a + b, 0);
    console.log(`${year}: ${total.toFixed(1)} tCO2e total, ${avg.toFixed(2)} tCO2e/month avg`);
  });

  const predicted2025 = planePredicted?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
  const predictedAvg = predicted2025 / (planePredicted?.length || 1);
  console.log(`2025 (predicted): ${predicted2025.toFixed(1)} tCO2e total, ${predictedAvg.toFixed(2)} tCO2e/month avg`);

  // Check waste to landfill (the 113% increase one)
  const wasteId = 'f312fb8f-7f20-490c-8462-c96e787e99ff';
  const { data: wasteHistorical } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('metric_id', wasteId)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .lte('period_end', '2024-12-31')
    .order('period_start');

  const { data: wastePredicted } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('metric_id', wasteId)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .order('period_start');

  console.log('\n=== WASTE TO LANDFILL ANALYSIS ===\n');

  const wasteByYear: any = {};
  wasteHistorical?.forEach(d => {
    const year = new Date(d.period_start).getFullYear();
    if (!wasteByYear[year]) wasteByYear[year] = [];
    wasteByYear[year].push((d.co2e_emissions || 0) / 1000);
  });

  Object.entries(wasteByYear).forEach(([year, values]: any) => {
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const total = values.reduce((a: number, b: number) => a + b, 0);
    console.log(`${year}: ${total.toFixed(3)} tCO2e total, ${avg.toFixed(4)} tCO2e/month avg`);
  });

  const waste2025 = wastePredicted?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
  const wasteAvg = waste2025 / (wastePredicted?.length || 1);
  console.log(`2025 (predicted): ${waste2025.toFixed(3)} tCO2e total, ${wasteAvg.toFixed(4)} tCO2e/month avg`);

  // Check the May spike
  console.log('\n=== MAY 2025 SPIKE ANALYSIS ===\n');
  const { data: mayData } = await supabase
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-05-01')
    .lte('period_end', '2025-05-31');

  const mayByMetric: any = {};
  mayData?.forEach(d => {
    if (!mayByMetric[d.metric_id]) mayByMetric[d.metric_id] = 0;
    mayByMetric[d.metric_id] += (d.co2e_emissions || 0) / 1000;
  });

  const sortedMay = Object.entries(mayByMetric)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  console.log('Top 5 contributors to May 2025:');
  for (const [metricId, emissions] of sortedMay) {
    const { data: metric } = await supabase
      .from('metrics')
      .select('name')
      .eq('id', metricId)
      .single();

    console.log(`  ${metric?.name}: ${(emissions as number).toFixed(1)} tCO2e`);
  }
}

checkIssues();