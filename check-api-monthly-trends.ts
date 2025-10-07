import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkApiMonthlyTrends() {
  console.log('🔍 Checking what monthly trends API would return...\n');

  // Get organization ID (first org in database)
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  const orgId = orgs?.[0]?.id;
  console.log(`Using organization: ${orgs?.[0]?.name} (${orgId})\n`);

  // Get water metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Water,code.ilike.%water%');

  const metricIds = waterMetrics?.map(m => m.id) || [];

  // Get all water data for this org (no date filter to see everything)
  const { data: waterData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('metric_id', metricIds)
    .order('period_start', { ascending: false });

  console.log(`📊 Total water records: ${waterData?.length || 0}\n`);

  // Calculate monthly trends exactly like the API does
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
        consumption: 0,
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
    .sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey))
    .map((m: any) => ({
      ...m,
      consumption: m.withdrawal - m.discharge,
      withdrawal: Math.round(m.withdrawal * 100) / 100,
      discharge: Math.round(m.discharge * 100) / 100,
      recycled: Math.round(m.recycled * 100) / 100
    }));

  console.log('📅 Monthly trends (as API returns them):\n');
  monthlyTrends.forEach((trend: any) => {
    console.log(`${trend.monthKey} (${trend.month}): Withdrawal=${trend.withdrawal} m³, Discharge=${trend.discharge} m³`);
  });

  console.log('\n🔄 Now testing YoY calculation logic:\n');

  const currentYear = new Date().getFullYear();

  // Filter current year and previous year data
  const currentYearData = monthlyTrends.filter((m: any) =>
    m.monthKey.startsWith(String(currentYear))
  );
  const prevYearData = monthlyTrends.filter((m: any) =>
    m.monthKey.startsWith(String(currentYear - 1))
  );

  console.log(`Current year (${currentYear}) data: ${currentYearData.length} months`);
  console.log(`Previous year (${currentYear - 1}) data: ${prevYearData.length} months\n`);

  console.log('Previous year monthKeys:');
  prevYearData.forEach((m: any) => console.log(`  ${m.monthKey}: ${m.withdrawal} m³`));

  console.log('\n📊 YoY Comparison Chart Data:\n');

  const chartData = currentYearData.map((trend: any) => {
    const monthNum = trend.monthKey.split('-')[1];
    const prevYearKey = `${currentYear - 1}-${monthNum}`;

    const prevTrend = prevYearData.find((prev: any) =>
      prev.monthKey === prevYearKey
    );

    const previous = prevTrend?.withdrawal || 0;
    const current = trend.withdrawal;
    const absoluteChange = current - previous;

    const percentChange = previous > 0
      ? ((absoluteChange / previous) * 100)
      : 0;

    console.log(`${trend.month}:`);
    console.log(`  Current (${trend.monthKey}): ${current} m³`);
    console.log(`  Previous (${prevYearKey}): ${previous} m³ ${prevTrend ? '✅' : '❌ NOT FOUND'}`);
    console.log(`  Change: ${percentChange.toFixed(1)}%\n`);

    return {
      month: trend.month,
      monthKey: trend.monthKey,
      change: percentChange,
      current: current,
      previous: previous,
      absoluteChange: absoluteChange
    };
  });

  console.log('\n✅ Diagnostic complete!');
}

checkApiMonthlyTrends();
