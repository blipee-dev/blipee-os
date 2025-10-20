import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCategoryData() {
  console.log('🔍 Testing Category Data for 2025\n');
  console.log('=====================================\n');

  // Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  // Get metrics data with catalog info for 2025
  const { data: metricsData } = await supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      metrics_catalog!inner(
        category,
        scope,
        name
      )
    `)
    .eq('organization_id', plmj!.id)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')
    .not('co2e_emissions', 'is', null);

  console.log('📊 Total metrics records:', metricsData?.length || 0);

  // Group by category
  const categoryData: any = {};

  metricsData?.forEach(d => {
    const category = d.metrics_catalog?.category || 'Other';
    const scope = d.metrics_catalog?.scope || 'scope_1';

    if (!categoryData[category]) {
      categoryData[category] = {
        category,
        scope_1: 0,
        scope_2: 0,
        scope_3: 0,
        count: 0
      };
    }

    categoryData[category][scope] += d.co2e_emissions || 0;
    categoryData[category].count++;
  });

  console.log('\n📈 Emissions by Category (2025):\n');

  // Sort by total emissions
  const sorted = Object.values(categoryData).sort((a: any, b: any) => {
    const totalA = a.scope_1 + a.scope_2 + a.scope_3;
    const totalB = b.scope_1 + b.scope_2 + b.scope_3;
    return totalB - totalA;
  });

  sorted.forEach((cat: any) => {
    const total = cat.scope_1 + cat.scope_2 + cat.scope_3;
    console.log(`${cat.category}:`);
    console.log(`  Total: ${(total / 1000).toFixed(1)} tCO2e`);
    if (cat.scope_1 > 0) console.log(`  - Scope 1: ${(cat.scope_1 / 1000).toFixed(1)} tCO2e`);
    if (cat.scope_2 > 0) console.log(`  - Scope 2: ${(cat.scope_2 / 1000).toFixed(1)} tCO2e`);
    if (cat.scope_3 > 0) console.log(`  - Scope 3: ${(cat.scope_3 / 1000).toFixed(1)} tCO2e`);
    console.log(`  Data points: ${cat.count}`);
    console.log();
  });

  // Check unique categories
  const uniqueCategories = [...new Set(metricsData?.map(d => d.metrics_catalog?.category))];
  console.log('📋 Unique categories found:', uniqueCategories);

  process.exit(0);
}

testCategoryData().catch(console.error);