import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Based on 2024 data:
 * - Recycling: 4.45 tons/year (split into materials)
 * - Composting: 2.63 tons/year (split into food/garden)
 *
 * For 2025, we'll use similar amounts (slight increase for growth)
 */
const RECYCLING_COMPOSITION = {
  paper: 0.45,
  plastic: 0.20,
  metal: 0.10,
  glass: 0.15,
  mixed: 0.10
};

const COMPOSTING_COMPOSITION = {
  food: 0.70,
  garden: 0.30
};

async function backfill2025Waste() {
  console.log('🔄 Backfilling 2025 waste data based on 2024 patterns...\n');

  // Get metric IDs
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .in('code', [
      'scope3_waste_recycling_paper',
      'scope3_waste_recycling_plastic',
      'scope3_waste_recycling_metal',
      'scope3_waste_recycling_glass',
      'scope3_waste_recycling_mixed',
      'scope3_waste_composting_food',
      'scope3_waste_composting_garden'
    ]);

  const metricMap: any = {};
  metrics?.forEach(m => {
    metricMap[m.code] = m.id;
  });

  // Get organization and site info from existing 2025 data
  const { data: existing2025 } = await supabase
    .from('metrics_data')
    .select('organization_id, site_id')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')
    .limit(1)
    .single();

  if (!existing2025) {
    console.error('❌ No 2025 data found to get organization/site info');
    return;
  }

  const { organization_id, site_id } = existing2025;

  console.log(`📍 Organization: ${organization_id}`);
  console.log(`📍 Site: ${site_id}\n`);

  // 2024 had 4.45 tons recycling, let's do 4.7 tons for 2025 (+5% growth)
  const totalRecycling2025 = 4.7; // tons/year
  const monthlyRecycling = totalRecycling2025 / 12;

  // 2024 had 2.63 tons composting, let's do 2.8 tons for 2025 (+6% growth)
  const totalComposting2025 = 2.8; // tons/year
  const monthlyComposting = totalComposting2025 / 12;

  console.log('📊 2025 Targets:');
  console.log(`  Recycling: ${totalRecycling2025} tons/year (${monthlyRecycling.toFixed(3)} tons/month)`);
  console.log(`  Composting: ${totalComposting2025} tons/year (${monthlyComposting.toFixed(3)} tons/month)\n`);

  const newRecords: any[] = [];

  // Generate monthly data for 2025 (8 months: Jan-Aug)
  for (let month = 0; month < 8; month++) {
    const periodStart = new Date(2025, month, 1).toISOString().split('T')[0];
    const periodEnd = new Date(2025, month + 1, 0).toISOString().split('T')[0];

    console.log(`📅 ${periodStart}:`);

    // Add recycling by material
    const recyclingSplits = [
      { metric: 'scope3_waste_recycling_paper', value: monthlyRecycling * RECYCLING_COMPOSITION.paper, name: 'Paper' },
      { metric: 'scope3_waste_recycling_plastic', value: monthlyRecycling * RECYCLING_COMPOSITION.plastic, name: 'Plastic' },
      { metric: 'scope3_waste_recycling_metal', value: monthlyRecycling * RECYCLING_COMPOSITION.metal, name: 'Metal' },
      { metric: 'scope3_waste_recycling_glass', value: monthlyRecycling * RECYCLING_COMPOSITION.glass, name: 'Glass' },
      { metric: 'scope3_waste_recycling_mixed', value: monthlyRecycling * RECYCLING_COMPOSITION.mixed, name: 'Mixed' }
    ];

    recyclingSplits.forEach(split => {
      console.log(`  ♻️  ${split.name}: ${split.value.toFixed(3)} tons`);
      newRecords.push({
        organization_id,
        site_id,
        metric_id: metricMap[split.metric],
        value: split.value.toString(),
        unit: 'tons',
        period_start: periodStart,
        period_end: periodEnd,
        data_quality: 'estimated',
        notes: `Projected from 2024 trends (+5% growth)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    // Add composting by type
    const compostingSplits = [
      { metric: 'scope3_waste_composting_food', value: monthlyComposting * COMPOSTING_COMPOSITION.food, name: 'Food' },
      { metric: 'scope3_waste_composting_garden', value: monthlyComposting * COMPOSTING_COMPOSITION.garden, name: 'Garden' }
    ];

    compostingSplits.forEach(split => {
      console.log(`  🌱 ${split.name}: ${split.value.toFixed(3)} tons`);
      newRecords.push({
        organization_id,
        site_id,
        metric_id: metricMap[split.metric],
        value: split.value.toString(),
        unit: 'tons',
        period_start: periodStart,
        period_end: periodEnd,
        data_quality: 'estimated',
        notes: `Projected from 2024 trends (+6% growth)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    console.log('');
  }

  console.log(`\n📝 Prepared ${newRecords.length} new records (8 months × 7 materials)\n`);

  // Insert the records
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

  console.log('📊 Expected 2025 results (Jan-Aug):');
  console.log(`  Total Generated: ~${(totalRecycling2025 * 8/12 + totalComposting2025 * 8/12 + 8.0).toFixed(2)} tons`);
  console.log(`  Diverted: ~${((totalRecycling2025 * 8/12 + totalComposting2025 * 8/12) / (totalRecycling2025 * 8/12 + totalComposting2025 * 8/12 + 8.0) * 100).toFixed(1)}%`);
  console.log(`  Recycling: ~${((totalRecycling2025 * 8/12) / (totalRecycling2025 * 8/12 + totalComposting2025 * 8/12 + 8.0) * 100).toFixed(1)}%`);
}

backfill2025Waste();
