import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log('🧪 Testing Water End-Use API Logic\n');

  // Get organization
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs?.[0]?.id;

  if (!orgId) {
    console.error('No organization found');
    return;
  }

  // Get all water metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Water,code.ilike.%water%');

  console.log(`📊 Found ${waterMetrics?.length || 0} water metrics\n`);

  // Get water data for 2025
  const metricIds = waterMetrics?.map(m => m.id) || [];
  const { data: waterData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  console.log(`📅 Found ${waterData?.length || 0} records for 2025\n`);

  // Calculate end-use breakdown
  const sourcesByType: any = {};

  (waterData || []).forEach((record: any) => {
    const metric = waterMetrics?.find(m => m.id === record.metric_id);
    const metricCode = metric?.code || '';
    const value = parseFloat(record.value) || 0;

    const typeMap: any = {
      'scope3_water_toilet': 'toilet',
      'scope3_water_kitchen': 'kitchen',
      'scope3_water_cleaning': 'cleaning',
      'scope3_water_irrigation': 'irrigation',
      'scope3_water_other': 'other_use'
    };

    const type = typeMap[metricCode];
    if (type) {
      if (!sourcesByType[type]) {
        sourcesByType[type] = {
          name: metric?.name || '',
          type: type,
          withdrawal: 0,
          consumptionRate: metric?.consumption_rate || 0
        };
      }
      sourcesByType[type].withdrawal += value;
    }
  });

  const endUseBreakdown = Object.values(sourcesByType).map((s: any) => {
    const consumption = s.withdrawal * s.consumptionRate;
    const discharge = s.withdrawal * (1 - s.consumptionRate);

    return {
      name: s.name,
      type: s.type,
      withdrawal: Math.round(s.withdrawal * 100) / 100,
      consumption: Math.round(consumption * 100) / 100,
      discharge: Math.round(discharge * 100) / 100,
      consumption_rate: Math.round(s.consumptionRate * 100)
    };
  });

  console.log('🌊 End-Use Breakdown:\n');
  endUseBreakdown.forEach(item => {
    console.log(`${item.name}:`);
    console.log(`  Withdrawal:       ${(item.withdrawal / 1000).toFixed(3)} ML`);
    console.log(`  Consumption:      ${(item.consumption / 1000).toFixed(3)} ML (${item.consumption_rate}%)`);
    console.log(`  Discharge:        ${(item.discharge / 1000).toFixed(3)} ML`);
    console.log('');
  });

  const totalWithdrawal = endUseBreakdown.reduce((sum, item) => sum + item.withdrawal, 0);
  const totalConsumption = endUseBreakdown.reduce((sum, item) => sum + item.consumption, 0);
  const totalDischarge = endUseBreakdown.reduce((sum, item) => sum + item.discharge, 0);

  console.log('📈 Totals:');
  console.log(`  Total Withdrawal:  ${(totalWithdrawal / 1000).toFixed(3)} ML`);
  console.log(`  Total Consumption: ${(totalConsumption / 1000).toFixed(3)} ML`);
  console.log(`  Total Discharge:   ${(totalDischarge / 1000).toFixed(3)} ML`);
}

test();
