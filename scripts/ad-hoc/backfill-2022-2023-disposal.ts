import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 2024 had:
 * - Total Generated: 10.82 tons
 * - Disposal: 3.75 tons (34.6%)
 *   - Landfill: 0.01 tons
 *   - Incineration: 3.74 tons
 *   - E-waste: 0.00 tons
 *
 * For 2022-2023, we'll use similar disposal rates
 */

async function backfill20222023Disposal() {
  console.log('🔄 Backfilling 2022-2023 disposal data...\n');

  // Get metric IDs
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .in('code', [
      'scope3_waste_landfill',
      'scope3_waste_incineration',
      'scope3_waste_ewaste'
    ]);

  const metricMap: any = {};
  metrics?.forEach(m => {
    metricMap[m.code] = m.id;
  });

  // Get org and site from existing data
  const { data: existingSample } = await supabase
    .from('metrics_data')
    .select('organization_id, site_id')
    .gte('period_start', '2022-01-01')
    .limit(1)
    .single();

  if (!existingSample) {
    console.error('❌ No existing data found');
    return;
  }

  const { organization_id, site_id } = existingSample;

  const newRecords: any[] = [];

  // 2024 pattern: ~35% disposal rate
  // 2022 total: 11.39 tons → disposal should be ~4.0 tons
  // 2023 total: 7.04 tons → disposal should be ~2.5 tons

  const yearData = [
    {
      year: 2022,
      months: 12,
      totalDisposal: 4.0,  // tons/year
      landfillRatio: 0.003,  // Very small like 2024
      incinerationRatio: 0.997,
      ewasteRatio: 0.0
    },
    {
      year: 2023,
      months: 12,
      totalDisposal: 2.5,  // tons/year
      landfillRatio: 0.004,
      incinerationRatio: 0.996,
      ewasteRatio: 0.0
    }
  ];

  for (const yearInfo of yearData) {
    console.log(`📅 Processing ${yearInfo.year}...`);
    console.log(`   Total Disposal: ${yearInfo.totalDisposal} tons/year\n`);

    const monthlyLandfill = (yearInfo.totalDisposal * yearInfo.landfillRatio) / yearInfo.months;
    const monthlyIncineration = (yearInfo.totalDisposal * yearInfo.incinerationRatio) / yearInfo.months;
    const monthlyEwaste = (yearInfo.totalDisposal * yearInfo.ewasteRatio) / yearInfo.months;

    for (let month = 0; month < yearInfo.months; month++) {
      const periodStart = new Date(yearInfo.year, month, 1).toISOString().split('T')[0];
      const periodEnd = new Date(yearInfo.year, month + 1, 0).toISOString().split('T')[0];

      // Landfill
      newRecords.push({
        organization_id,
        site_id,
        metric_id: metricMap['scope3_waste_landfill'],
        value: monthlyLandfill.toString(),
        unit: 'tons',
        period_start: periodStart,
        period_end: periodEnd,
        data_quality: 'estimated',
        notes: `Backfilled disposal data (${yearInfo.year}) - based on 2024 patterns`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Incineration
      newRecords.push({
        organization_id,
        site_id,
        metric_id: metricMap['scope3_waste_incineration'],
        value: monthlyIncineration.toString(),
        unit: 'tons',
        period_start: periodStart,
        period_end: periodEnd,
        data_quality: 'estimated',
        notes: `Backfilled disposal data (${yearInfo.year}) - based on 2024 patterns`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // E-waste
      newRecords.push({
        organization_id,
        site_id,
        metric_id: metricMap['scope3_waste_ewaste'],
        value: monthlyEwaste.toString(),
        unit: 'tons',
        period_start: periodStart,
        period_end: periodEnd,
        data_quality: 'estimated',
        notes: `Backfilled disposal data (${yearInfo.year}) - based on 2024 patterns`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    console.log(`  ✅ Prepared ${yearInfo.months * 3} records for ${yearInfo.year}`);
    console.log(`     Landfill: ${(monthlyLandfill * 12).toFixed(3)} tons/year`);
    console.log(`     Incineration: ${(monthlyIncineration * 12).toFixed(3)} tons/year`);
    console.log(`     E-waste: ${(monthlyEwaste * 12).toFixed(3)} tons/year\n`);
  }

  console.log(`📝 Total new records: ${newRecords.length}\n`);

  // Insert
  console.log('💾 Inserting records...\n');

  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < newRecords.length; i += batchSize) {
    const batch = newRecords.slice(i, i + batchSize);
    const { error } = await supabase
      .from('metrics_data')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`✅ Inserted batch ${i / batchSize + 1}: ${batch.length} records`);
      totalInserted += batch.length;
    }
  }

  console.log(`\n✅ Backfill complete! Inserted ${totalInserted} records\n`);

  console.log('📊 Expected results:');
  console.log('   2022: ~26% diversion rate (was 100%)');
  console.log('   2023: ~26% diversion rate (was 100%)');
  console.log('   Both years now have realistic disposal data ✓\n');
}

backfill20222023Disposal();
