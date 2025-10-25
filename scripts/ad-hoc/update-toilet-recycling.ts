import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function update() {
  console.log('♻️  Updating water system for toilet recycling...\n');

  // Step 1: Add recycled water metric
  const { data: recycledMetric, error: metricError } = await supabase
    .from('metrics_catalog')
    .insert({
      code: 'scope3_water_recycled_toilet',
      name: 'Recycled Water - Toilet Flush',
      category: 'Purchased Goods & Services',
      subcategory: 'Water',
      unit: 'm³',
      scope: 'scope_3',
      emission_factor: 0.00,  // No emissions for recycled water
      description: 'Recycled greywater from handwashing used for toilet flushing. GRI 303-3: Water withdrawal (recycled). Zero carbon footprint.',
      consumption_rate: 0.00  // Recycled water isn't "consumed" - it's reused
    })
    .select()
    .single();

  if (metricError && !metricError.message.includes('duplicate')) {
    console.error('❌ Error creating metric:', metricError.message);
    return;
  }

  console.log('✅ Recycled water metric created\n');

  // Step 2: Calculate the recycling adjustment
  // If half of toilet water comes from recycled handwash water:
  // - Toilet still uses 47.5% of TOTAL building water
  // - But ~50% of that comes from recycled handwash water
  // - So we need to reduce fresh water for toilets by 50%

  const { data: toiletMetric } = await supabase
    .from('metrics_catalog')
    .select('id')
    .eq('code', 'scope3_water_toilet')
    .single();

  const recycledId = recycledMetric?.id || (await supabase
    .from('metrics_catalog')
    .select('id')
    .eq('code', 'scope3_water_recycled_toilet')
    .single()).data?.id;

  // Get all toilet water records
  const { data: toiletRecords } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('metric_id', toiletMetric?.id);

  console.log(`📊 Found ${toiletRecords?.length || 0} toilet water records\n`);

  const updates = [];
  const recycledRecords = [];

  for (const record of toiletRecords || []) {
    const originalValue = parseFloat(record.value);
    const freshWater = originalValue * 0.50;  // 50% fresh water
    const recycledWater = originalValue * 0.50;  // 50% recycled

    // Update existing toilet record to show only fresh water
    updates.push(
      supabase
        .from('metrics_data')
        .update({
          value: freshWater.toFixed(2),
          co2e_emissions: (freshWater * 0.70 / 1000).toFixed(3)
        })
        .eq('id', record.id)
    );

    // Create recycled water record
    recycledRecords.push({
      organization_id: record.organization_id,
      site_id: record.site_id,
      metric_id: recycledId,
      value: recycledWater.toFixed(2),
      unit: 'm³',
      period_start: record.period_start,
      period_end: record.period_end,
      co2e_emissions: 0  // Zero emissions for recycled water
    });
  }

  // Execute updates
  console.log('🔄 Updating toilet records to show 50% fresh water...\n');
  await Promise.all(updates);

  console.log('♻️  Inserting recycled water records...\n');
  const { error: insertError } = await supabase
    .from('metrics_data')
    .insert(recycledRecords);

  if (insertError) {
    console.error('❌ Error inserting recycled records:', insertError.message);
    return;
  }

  console.log(`✅ Updated ${toiletRecords?.length || 0} toilet records`);
  console.log(`✅ Created ${recycledRecords.length} recycled water records\n`);

  // Verify results
  const { data: verification } = await supabase
    .from('metrics_data')
    .select('value, metrics_catalog!inner(code, name)')
    .in('metrics_catalog.code', [
      'scope3_water_toilet',
      'scope3_water_recycled_toilet'
    ])
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  let freshToilet = 0;
  let recycledToilet = 0;

  verification?.forEach((r: any) => {
    const val = parseFloat(r.value);
    if (r.metrics_catalog.code === 'scope3_water_toilet') {
      freshToilet += val;
    } else {
      recycledToilet += val;
    }
  });

  console.log('📊 2025 Toilet Water Summary:');
  console.log('  Fresh Water:    ' + (freshToilet / 1000).toFixed(3) + ' ML (50%)');
  console.log('  Recycled Water: ' + (recycledToilet / 1000).toFixed(3) + ' ML (50%)');
  console.log('  Total:          ' + ((freshToilet + recycledToilet) / 1000).toFixed(3) + ' ML');
  console.log('');
  console.log('✅ Water recycling system configured!');
  console.log('💡 This reduces fresh water consumption and carbon emissions');
}

update();
