import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmissionsData() {
  console.log('\n=== Testing Emissions Data ===\n');

  // Get PLMJ organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'plmj-ymlknd')
    .single();

  if (!org) {
    console.log('❌ PLMJ organization not found');
    return;
  }

  console.log('✅ Organization found:', org.name, 'ID:', org.id);

  // Test different date ranges
  const testRanges = [
    { name: 'Last Month', months: 1 },
    { name: 'Last 3 Months', months: 3 },
    { name: 'Last 6 Months', months: 6 },
    { name: 'Last Year', months: 12 }
  ];

  for (const range of testRanges) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - range.months);

    console.log(`\n📊 ${range.name} (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}):`);

    // Fetch metrics data with catalog info
    const { data: metricsData, error } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog!inner(
          id,
          name,
          category,
          subcategory,
          scope,
          unit,
          emission_factor
        )
      `)
      .eq('organization_id', org.id)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString())
      .order('period_start', { ascending: true });

    if (error) {
      console.log('❌ Error fetching data:', error.message);
      continue;
    }

    if (!metricsData || metricsData.length === 0) {
      console.log('⚠️ No data found for this period');
      continue;
    }

    // Calculate emissions by scope
    let scope1 = 0;
    let scope2 = 0;
    let scope3 = 0;
    const categoryCounts = new Map<string, number>();

    metricsData.forEach(record => {
      const emissions = record.co2e_emissions || 0;
      const scope = record.metrics_catalog?.scope;
      const category = record.metrics_catalog?.category;

      if (scope === 'scope_1' || scope === 1) {
        scope1 += emissions;
      } else if (scope === 'scope_2' || scope === 2) {
        scope2 += emissions;
      } else {
        scope3 += emissions;
      }

      if (category) {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + emissions);
      }
    });

    const total = scope1 + scope2 + scope3;

    console.log(`  Total records: ${metricsData.length}`);
    console.log(`  Total emissions: ${(total / 1000).toFixed(2)} tCO2e`);
    console.log(`  ├─ Scope 1: ${(scope1 / 1000).toFixed(2)} tCO2e (${((scope1/total)*100).toFixed(1)}%)`);
    console.log(`  ├─ Scope 2: ${(scope2 / 1000).toFixed(2)} tCO2e (${((scope2/total)*100).toFixed(1)}%)`);
    console.log(`  └─ Scope 3: ${(scope3 / 1000).toFixed(2)} tCO2e (${((scope3/total)*100).toFixed(1)}%)`);

    // Show top categories
    const sortedCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    console.log(`  Top categories:`);
    sortedCategories.forEach(([cat, emissions]) => {
      console.log(`    - ${cat}: ${(emissions / 1000).toFixed(2)} tCO2e`);
    });
  }

  console.log('\n=== Test Complete ===\n');
}

testEmissionsData().catch(console.error);