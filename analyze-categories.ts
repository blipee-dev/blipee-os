import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function analyzeMetrics() {
  // Get all metrics definitions
  const { data: metricDefs } = await supabase
    .from('metrics')
    .select('id, name, category, unit');

  // Get 2025 data
  const { data: data2025 } = await supabase
    .from('metrics_data')
    .select('metric_id, value, unit')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-08-31');

  // Group by category
  const byCategory: any = {};

  data2025?.forEach(d => {
    const metric = metricDefs?.find(m => m.id === d.metric_id);
    if (metric) {
      const cat = metric.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, totalValue: 0, metrics: new Set(), units: new Set() };
      }
      byCategory[cat].count++;
      byCategory[cat].totalValue += d.value || 0;
      byCategory[cat].metrics.add(metric.name);
      byCategory[cat].units.add(d.unit);
    }
  });

  console.log('=== METRICS BY CATEGORY IN 2025 DATA ===');
  Object.entries(byCategory).forEach(([cat, data]: any) => {
    console.log(`\n${cat}:`);
    console.log(`  Records: ${data.count}`);
    console.log(`  Total value: ${data.totalValue}`);
    console.log(`  Units in data: ${Array.from(data.units).join(', ')}`);
    console.log(`  Metrics: ${Array.from(data.metrics).join(', ')}`);
  });

  // Check specific categories
  console.log('\n=== CHECKING SPECIFIC FILTERS ===');

  const electricity = data2025?.filter(d => {
    const metric = metricDefs?.find(m => m.id === d.metric_id);
    return metric?.category === 'Electricity';
  });
  console.log(`Electricity category: ${electricity?.length} records`);

  const energy = data2025?.filter(d => {
    const metric = metricDefs?.find(m => m.id === d.metric_id);
    return metric?.category === 'Electricity' || metric?.category === 'Purchased Energy';
  });
  console.log(`Energy (Electricity + Purchased Energy): ${energy?.length} records`);

  // Calculate total energy in MWh
  let totalEnergy = 0;
  energy?.forEach(e => {
    totalEnergy += (e.value || 0) / 1000; // Convert to MWh if in kWh
  });
  console.log(`  Total energy value: ${totalEnergy.toFixed(1)} MWh`);

  const water = data2025?.filter(d => {
    const metric = metricDefs?.find(m => m.id === d.metric_id);
    return metric?.category === 'Purchased Goods & Services' &&
           (metric?.name === 'Water' || metric?.name === 'Wastewater');
  });
  console.log(`Water metrics: ${water?.length} records`);
  const totalWater = water?.reduce((sum, w) => sum + (w.value || 0), 0) || 0;
  console.log(`  Total water value: ${totalWater} m³`);

  const waste = data2025?.filter(d => {
    const metric = metricDefs?.find(m => m.id === d.metric_id);
    return metric?.category === 'Waste';
  });
  console.log(`Waste category: ${waste?.length} records`);
  const totalWaste = waste?.reduce((sum, w) => sum + (w.value || 0), 0) || 0;
  console.log(`  Total waste value: ${totalWaste} tons`);
}

analyzeMetrics();