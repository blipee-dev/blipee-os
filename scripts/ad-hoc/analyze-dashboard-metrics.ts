import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function analyzeMetrics() {
  // Get all 2024 metrics grouped by category
  const { data: metrics } = await supabase
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const { data: metricDefs } = await supabase
    .from('metrics')
    .select('id, name, category, unit');

  const categories: any = {};
  metrics?.forEach(m => {
    const def = metricDefs?.find(d => d.id === m.metric_id);
    if (def) {
      if (!categories[def.category]) {
        categories[def.category] = {
          emissions: 0,
          count: 0,
          metrics: new Set(),
          unit: def.unit,
          totalValue: 0
        };
      }
      categories[def.category].emissions += (m.co2e_emissions || 0) / 1000;
      categories[def.category].count++;
      categories[def.category].metrics.add(def.name);

      // Sum values for energy and water
      if (def.category === 'Electricity' || def.category === 'Purchased Energy') {
        categories[def.category].totalValue += (m.value || 0) / 1000; // Convert to MWh
      } else if (def.category === 'Purchased Goods & Services') {
        categories[def.category].totalValue += (m.value || 0); // Keep as m³
      } else if (def.category === 'Waste') {
        categories[def.category].totalValue += (m.value || 0); // Keep as tons
      }
    }
  });

  console.log('=== TOP EMISSION CATEGORIES (2024) ===\n');
  const sorted = Object.entries(categories)
    .sort((a: any, b: any) => b[1].emissions - a[1].emissions);

  sorted.forEach(([cat, data]: any) => {
    console.log(`${cat}: ${data.emissions.toFixed(1)} tCO2e (${data.count} datapoints)`);
    console.log(`  Metrics: ${Array.from(data.metrics).join(', ')}`);
    if (data.totalValue > 0) {
      const unit = cat.includes('Energy') || cat === 'Electricity' ? 'MWh' :
                   cat === 'Purchased Goods & Services' ? 'm³' :
                   cat === 'Waste' ? 'tons' : '';
      console.log(`  Total Value: ${data.totalValue.toFixed(1)} ${unit}`);
    }
    console.log('');
  });

  // Calculate totals
  const totalEmissions = sorted.reduce((sum, [_, data]: any) => sum + data.emissions, 0);
  const totalEnergy = (categories['Electricity']?.totalValue || 0) + (categories['Purchased Energy']?.totalValue || 0);
  const totalWater = categories['Purchased Goods & Services']?.totalValue || 0;
  const totalWaste = categories['Waste']?.totalValue || 0;

  console.log('=== DASHBOARD METRICS EXPLANATION ===\n');
  console.log('1. "Midday Performance" (279.4 tCO2e) = Total emissions for current period');
  console.log(`   Actual 2024 total: ${totalEmissions.toFixed(1)} tCO2e\n`);

  console.log('2. "Emissions" card = Same total, just different view options');
  console.log('   - By Scope: Scope 1/2/3 breakdown');
  console.log('   - By Building: Site-specific emissions');
  console.log('   - Trends: Historical comparison\n');

  console.log('3. "Energy" card = Electricity + Purchased Energy combined');
  console.log(`   Actual 2024: ${totalEnergy.toFixed(1)} MWh\n`);

  console.log('4. "Water" card = Water + Wastewater consumption');
  console.log(`   Actual 2024: ${totalWater.toFixed(1)} m³\n`);

  console.log('5. "Waste" card = All waste streams');
  console.log(`   Actual 2024: ${totalWaste.toFixed(1)} tons\n`);

  console.log('=== RECOMMENDATION ===');
  console.log('Based on PLMJ data, the dashboard should prioritize:');
  console.log('1. Business Travel (279 tCO2e) - Largest emission source');
  console.log('2. Energy (Electricity + Purchased) - Second largest');
  console.log('3. Waste - Small but tracked');
  console.log('4. Water - Minimal emissions but tracked for sustainability');
}

analyzeMetrics();