import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllYears() {
  console.log('🔍 Checking ALL years of water data...\n');

  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Water,code.ilike.%water%');

  const metricIds = waterMetrics?.map(m => m.id) || [];

  // Get ALL water data without any filters
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('*')
    .in('metric_id', metricIds)
    .order('period_start');

  console.log(`📊 Total records: ${allData?.length || 0}\n`);

  // Group by year-month
  const byYearMonth: any = {};
  allData?.forEach((r: any) => {
    const date = new Date(r.period_start);
    const year = date.getFullYear();
    const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!byYearMonth[year]) {
      byYearMonth[year] = [];
    }
    if (!byYearMonth[year].includes(monthKey)) {
      byYearMonth[year].push(monthKey);
    }
  });

  console.log('📅 Data availability by year:\n');
  Object.keys(byYearMonth).sort().forEach(year => {
    console.log(`${year}: ${byYearMonth[year].length} months`);
    console.log(`  ${byYearMonth[year].sort().join(', ')}`);
  });

  console.log('\n💡 For proper YoY comparison, we should compare:');
  console.log('  2023 vs 2022 (full year comparison)');
  console.log('  2024 vs 2023 (Jul-Dec comparison)');
  console.log('  2025 vs 2024 (Jul comparison only)\n');
}

checkAllYears();
