import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function analyzePLMJ() {
  // Get PLMJ metrics
  const { data: metrics } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        name,
        category,
        scope,
        subcategory,
        unit
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2');

  // Group by category
  const byCategory: any = {};
  const byName: any = {};

  metrics?.forEach(m => {
    const cat = m.metrics_catalog?.category || 'Unknown';
    const name = m.metrics_catalog?.name || 'Unknown';
    const scope = m.metrics_catalog?.scope || 'unknown';

    if (!byCategory[cat]) {
      byCategory[cat] = {
        total_emissions: 0,
        total_value: 0,
        count: 0,
        scope: scope,
        items: new Set()
      };
    }

    byCategory[cat].total_emissions += m.co2e_emissions || 0;
    byCategory[cat].total_value += m.value || 0;
    byCategory[cat].count += 1;
    byCategory[cat].items.add(name);

    if (!byName[name]) {
      byName[name] = {
        total_emissions: 0,
        total_value: 0,
        count: 0,
        category: cat,
        scope: scope,
        unit: m.metrics_catalog?.unit
      };
    }

    byName[name].total_emissions += m.co2e_emissions || 0;
    byName[name].total_value += m.value || 0;
    byName[name].count += 1;
  });

  console.log('\n=== PLMJ ACTUAL EMISSIONS BY CATEGORY (from database) ===\n');

  let totalEmissions = 0;
  const sortedCategories = Object.entries(byCategory)
    .sort((a: any, b: any) => b[1].total_emissions - a[1].total_emissions);

  sortedCategories.forEach(([cat, data]: any) => {
    const percentage = (data.total_emissions / 518706 * 100).toFixed(1);
    console.log(`📊 ${cat}:`);
    console.log(`   - Emissions: ${Math.round(data.total_emissions).toLocaleString()} tCO2e (${percentage}%)`);
    console.log(`   - Records: ${data.count}`);
    console.log(`   - Scope: ${data.scope}`);
    console.log(`   - Items: ${Array.from(data.items).join(', ')}`);
    console.log('');
    totalEmissions += data.total_emissions;
  });

  console.log(`TOTAL: ${Math.round(totalEmissions).toLocaleString()} tCO2e`);

  console.log('\n=== DETAILED BREAKDOWN BY SPECIFIC ITEM ===\n');

  Object.entries(byName)
    .sort((a: any, b: any) => b[1].total_emissions - a[1].total_emissions)
    .slice(0, 10)
    .forEach(([name, data]: any) => {
      console.log(`• ${name}:`);
      console.log(`  - Category: ${data.category}`);
      console.log(`  - Emissions: ${Math.round(data.total_emissions).toLocaleString()} tCO2e`);
      console.log(`  - Value: ${Math.round(data.total_value).toLocaleString()} ${data.unit || 'units'}`);
      console.log(`  - Records: ${data.count}`);
      console.log(`  - Scope: ${data.scope}`);
      console.log('');
    });
}

analyzePLMJ().catch(console.error);