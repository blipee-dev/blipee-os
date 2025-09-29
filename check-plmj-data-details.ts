import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkPLMJDataDetails() {
  // Get detailed metrics for PLMJ
  const { data: metrics } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        name,
        category,
        scope,
        subcategory,
        unit,
        description
      )
    `)
    .eq('organization_id', 'b24d6a88-a434-4090-851e-f5154005e17f')
    .order('co2e_emissions', { ascending: false });

  // Group by category and show details
  const categoryDetails: any = {};
  metrics?.forEach(m => {
    const cat = m.metrics_catalog?.category || 'Unknown';
    const subcat = m.metrics_catalog?.subcategory || 'No subcategory';
    const name = m.metrics_catalog?.name || 'No name';

    if (!categoryDetails[cat]) {
      categoryDetails[cat] = {
        total: 0,
        items: {} as any
      };
    }

    if (!categoryDetails[cat].items[name]) {
      categoryDetails[cat].items[name] = {
        subcategory: subcat,
        unit: m.metrics_catalog?.unit,
        description: m.metrics_catalog?.description,
        total_emissions: 0,
        total_value: 0,
        count: 0,
        sample_note: m.note // Get a sample note to see what's actually tracked
      };
    }

    categoryDetails[cat].total += m.co2e_emissions || 0;
    categoryDetails[cat].items[name].total_emissions += m.co2e_emissions || 0;
    categoryDetails[cat].items[name].total_value += m.value || 0;
    categoryDetails[cat].items[name].count += 1;
  });

  console.log('\n=== PLMJ ACTUAL DATA BREAKDOWN ===\n');
  console.log(`Total metrics records: ${metrics?.length || 0}\n`);

  Object.entries(categoryDetails)
    .sort((a: any, b: any) => b[1].total - a[1].total)
    .forEach(([category, data]: any) => {
      console.log(`\n📊 ${category}: ${Math.round(data.total).toLocaleString()} tCO2e`);
      console.log('   Items:');

      Object.entries(data.items)
        .sort((a: any, b: any) => b[1].total_emissions - a[1].total_emissions)
        .forEach(([name, item]: any) => {
          console.log(`\n     • ${name}`);
          console.log(`       - Emissions: ${Math.round(item.total_emissions).toLocaleString()} tCO2e`);
          console.log(`       - Value: ${Math.round(item.total_value).toLocaleString()} ${item.unit || 'units'}`);
          console.log(`       - Records: ${item.count}`);

          if (item.subcategory !== 'No subcategory') {
            console.log(`       - Subcategory: ${item.subcategory}`);
          }
          if (item.description) {
            console.log(`       - Description: ${item.description}`);
          }
          if (item.sample_note) {
            console.log(`       - Sample note: "${item.sample_note}"`);
          }
        });
    });

  // Also check what specific metric names we have
  console.log('\n\n=== UNIQUE METRIC NAMES IN DATABASE ===\n');
  const uniqueNames = new Set(metrics?.map(m => m.metrics_catalog?.name));
  Array.from(uniqueNames).sort().forEach(name => {
    console.log(`- ${name}`);
  });
}

checkPLMJDataDetails().catch(console.error);