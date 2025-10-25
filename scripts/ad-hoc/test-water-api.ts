import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testWaterAPI() {
  console.log('🧪 Testing Water API logic...\n');

  // Get organization
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  const organizationId = orgs![0].id;
  console.log(`Organization: ${orgs![0].name} (${organizationId})\n`);

  // Get water metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Water,code.ilike.%water%');

  console.log(`Water metrics: ${waterMetrics?.length}\n`);

  // Get water data with increased limit
  const metricIds = waterMetrics?.map(m => m.id) || [];
  const { data: waterData, count } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .limit(10000)
    .order('period_start', { ascending: false });

  console.log(`Total count in DB: ${count}`);
  console.log(`Records fetched: ${waterData?.length}\n`);

  // Calculate monthly trends
  const monthlyData = (waterData || []).reduce((acc: any, record: any) => {
    const metric = waterMetrics?.find(m => m.id === record.metric_id);
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short' });
    const metricCode = metric?.code || '';
    const isDischarge = metricCode.includes('wastewater');

    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthName,
        monthKey,
        withdrawal: 0,
        discharge: 0,
        recycled: 0
      };
    }

    const value = parseFloat(record.value) || 0;

    if (isDischarge) {
      acc[monthKey].discharge += value;
    } else {
      acc[monthKey].withdrawal += value;
      if (metricCode.includes('recycled')) {
        acc[monthKey].recycled += value;
      }
    }

    return acc;
  }, {});

  const monthlyTrends = Object.values(monthlyData)
    .sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey));

  console.log(`📅 Monthly trends: ${monthlyTrends.length} months\n`);
  console.log('First 5 months:');
  monthlyTrends.slice(0, 5).forEach((m: any) => {
    console.log(`  ${m.monthKey}: ${m.withdrawal.toFixed(2)} m³`);
  });
  console.log('Last 5 months:');
  monthlyTrends.slice(-5).forEach((m: any) => {
    console.log(`  ${m.monthKey}: ${m.withdrawal.toFixed(2)} m³`);
  });

  // Test YoY calculation
  const currentYear = new Date().getFullYear();
  const currentYearData = monthlyTrends.filter((m: any) =>
    m.monthKey.startsWith(String(currentYear))
  );
  const prevYearData = monthlyTrends.filter((m: any) =>
    m.monthKey.startsWith(String(currentYear - 1))
  );

  console.log(`\n🔄 YoY Data:`);
  console.log(`  Current year (${currentYear}): ${currentYearData.length} months`);
  console.log(`  Previous year (${currentYear - 1}): ${prevYearData.length} months`);

  const chartData = currentYearData
    .map((trend: any) => {
      const monthNum = trend.monthKey.split('-')[1];
      const prevYearKey = `${currentYear - 1}-${monthNum}`;
      const prevTrend = prevYearData.find((prev: any) => prev.monthKey === prevYearKey);
      return {
        month: trend.month,
        hasPrevious: (prevTrend?.withdrawal || 0) > 0
      };
    })
    .filter((item: any) => item.hasPrevious);

  console.log(`  Chart will show: ${chartData.length} months`);
  console.log(`  Months: ${chartData.map((d: any) => d.month).join(', ')}`);
}

testWaterAPI();
