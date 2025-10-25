#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeDetailedMetrics() {
  // Get detailed breakdown for July 2025
  const { data } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog!inner(name, category, subcategory, scope, unit)
    `)
    .gte('period_start', '2025-07-01')
    .lte('period_start', '2025-07-31');

  console.log('📊 JULY 2025 DETAILED METRICS');
  console.log('=' .repeat(60));

  // Group by category
  const byCategory: Record<string, any[]> = {};
  data?.forEach(d => {
    const cat = d.metrics_catalog.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({
      name: d.metrics_catalog.name,
      value: d.value,
      unit: d.metrics_catalog.unit,
      co2e: d.co2e_emissions,
      scope: d.metrics_catalog.scope
    });
  });

  Object.entries(byCategory).forEach(([cat, items]) => {
    console.log(`\n${cat}:`);
    items.forEach(i => {
      console.log(`  • ${i.name}: ${i.value} ${i.unit} → ${(i.co2e/1000).toFixed(2)} tCO2e (${i.scope})`);
    });
  });

  // Show what additional features we could extract
  console.log('\n🔧 POTENTIAL ML FEATURES:');
  console.log('Currently using:');
  console.log('  • Total Scope 1, 2, 3 emissions');
  console.log('  • Energy consumption (partial)');
  console.log('  • Transport data (partial)');

  console.log('\nCould also use:');
  console.log('  • Waste composition (recycling vs incineration)');
  console.log('  • Water usage patterns');
  console.log('  • Travel mode breakdown (air vs rail)');
  console.log('  • Seasonal electricity patterns');
  console.log('  • EV charging trends');
  console.log('  • Purchased goods patterns');

  // Calculate proportions
  const totalEmissions = data?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 1;
  const wasteEmissions = data?.filter(d => d.metrics_catalog.category === 'Waste')
    .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0;
  const travelEmissions = data?.filter(d => d.metrics_catalog.category === 'Business Travel')
    .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0;
  const electricityEmissions = data?.filter(d => d.metrics_catalog.category === 'Electricity')
    .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0;

  console.log('\n📈 EMISSIONS BREAKDOWN (July 2025):');
  console.log(`  Electricity: ${(electricityEmissions/totalEmissions*100).toFixed(1)}%`);
  console.log(`  Waste: ${(wasteEmissions/totalEmissions*100).toFixed(1)}%`);
  console.log(`  Travel: ${(travelEmissions/totalEmissions*100).toFixed(1)}%`);
  console.log(`  Other: ${((totalEmissions-wasteEmissions-travelEmissions-electricityEmissions)/totalEmissions*100).toFixed(1)}%`);

  console.log(`\nTotal July 2025: ${(totalEmissions/1000).toFixed(1)} tCO2e`);

  // Check for missing Scope 1
  const scope1Data = data?.filter(d => d.metrics_catalog.scope === 'scope_1');
  if (!scope1Data || scope1Data.length === 0) {
    console.log('\n⚠️  WARNING: No Scope 1 data (direct emissions)!');
    console.log('   Missing: Company vehicles, on-site fuel, refrigerants, etc.');
  }
}

analyzeDetailedMetrics().catch(console.error);