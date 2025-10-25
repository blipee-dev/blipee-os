import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrate() {
  console.log('🔄 Migrating existing water data to end-use breakdown...\n');

  // Get water supply and wastewater metric IDs
  const { data: oldMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code')
    .in('code', ['scope3_water_supply', 'scope3_wastewater']);

  const waterSupplyId = oldMetrics?.find(m => m.code === 'scope3_water_supply')?.id;
  const wastewaterId = oldMetrics?.find(m => m.code === 'scope3_wastewater')?.id;

  if (!waterSupplyId) {
    console.error('❌ Water supply metric not found');
    return;
  }

  // Get new end-use metric IDs
  const { data: newMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code')
    .in('code', [
      'scope3_water_toilet',
      'scope3_water_kitchen',
      'scope3_water_cleaning',
      'scope3_water_irrigation',
      'scope3_water_other',
      'scope3_wastewater_toilet',
      'scope3_wastewater_kitchen',
      'scope3_wastewater_cleaning',
      'scope3_wastewater_other'
    ]);

  const metricMap = Object.fromEntries(
    newMetrics?.map(m => [m.code, m.id]) || []
  );

  console.log('📊 Metric IDs mapped:', Object.keys(metricMap).length, 'metrics\n');

  // Get all existing water supply records
  const { data: waterRecords } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('metric_id', waterSupplyId)
    .order('period_start');

  console.log(`📥 Found ${waterRecords?.length || 0} water supply records to migrate\n`);

  // Distribution percentages for office without cooling
  const distribution = {
    toilet: 0.475,    // 47.5%
    kitchen: 0.175,   // 17.5%
    cleaning: 0.125,  // 12.5%
    irrigation: 0.125, // 12.5%
    other: 0.10       // 10%
  };

  // Discharge rates (what gets discharged back)
  const dischargeRates = {
    toilet: 1.00,    // 100% discharged
    kitchen: 0.75,   // 75% discharged
    cleaning: 0.50,  // 50% discharged
    irrigation: 0.00, // 0% discharged (all consumed)
    other: 0.80      // 80% discharged
  };

  let insertedCount = 0;
  const recordsToInsert = [];

  for (const record of waterRecords || []) {
    const totalValue = parseFloat(record.value);

    // Create withdrawal records for each end-use
    const endUses = [
      { code: 'scope3_water_toilet', type: 'toilet' },
      { code: 'scope3_water_kitchen', type: 'kitchen' },
      { code: 'scope3_water_cleaning', type: 'cleaning' },
      { code: 'scope3_water_irrigation', type: 'irrigation' },
      { code: 'scope3_water_other', type: 'other' }
    ];

    for (const endUse of endUses) {
      const withdrawalValue = totalValue * distribution[endUse.type as keyof typeof distribution];
      
      recordsToInsert.push({
        organization_id: record.organization_id,
        site_id: record.site_id,
        metric_id: metricMap[endUse.code],
        value: withdrawalValue.toFixed(2),
        unit: 'm³',
        period_start: record.period_start,
        period_end: record.period_end,
        co2e_emissions: (withdrawalValue * 0.70 / 1000).toFixed(3)
      });
    }

    // Create discharge records for end-uses that discharge
    const dischargeEndUses = [
      { code: 'scope3_wastewater_toilet', type: 'toilet' },
      { code: 'scope3_wastewater_kitchen', type: 'kitchen' },
      { code: 'scope3_wastewater_cleaning', type: 'cleaning' },
      { code: 'scope3_wastewater_other', type: 'other' }
    ];

    for (const endUse of dischargeEndUses) {
      const withdrawalValue = totalValue * distribution[endUse.type as keyof typeof distribution];
      const dischargeValue = withdrawalValue * dischargeRates[endUse.type as keyof typeof dischargeRates];
      
      if (dischargeValue > 0) {
        recordsToInsert.push({
          organization_id: record.organization_id,
          site_id: record.site_id,
          metric_id: metricMap[endUse.code],
          value: dischargeValue.toFixed(2),
          unit: 'm³',
          period_start: record.period_start,
          period_end: record.period_end,
          co2e_emissions: (dischargeValue * 0.70 / 1000).toFixed(3)
        });
      }
    }
  }

  console.log(`📝 Preparing to insert ${recordsToInsert.length} new records...\n`);

  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < recordsToInsert.length; i += batchSize) {
    const batch = recordsToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('metrics_data')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records (total: ${insertedCount}/${recordsToInsert.length})`);
    }
  }

  console.log(`\n✅ Migration complete! Inserted ${insertedCount} new end-use records\n`);

  // Verify the results
  const { data: verification } = await supabase
    .from('metrics_data')
    .select('value, metrics_catalog!inner(code, name)')
    .in('metric_id', Object.values(metricMap))
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  const summary: any = {};
  verification?.forEach((r: any) => {
    const code = r.metrics_catalog.code;
    if (!summary[code]) {
      summary[code] = { name: r.metrics_catalog.name, total: 0, count: 0 };
    }
    summary[code].total += parseFloat(r.value);
    summary[code].count += 1;
  });

  console.log('📊 2025 End-Use Data Summary:\n');
  Object.entries(summary).forEach(([code, data]: [string, any]) => {
    console.log(`${data.name}:`);
    console.log(`  Total: ${(data.total / 1000).toFixed(3)} ML (${data.count} records)`);
  });
}

migrate();
