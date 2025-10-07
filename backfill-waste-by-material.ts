import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Industry-standard waste composition for office/commercial buildings
 * Source: EPA Commercial & Institutional Waste Studies
 */
const RECYCLING_COMPOSITION = {
  paper: 0.45,      // 45% - Paper, cardboard, documents
  plastic: 0.20,    // 20% - PET bottles, containers, packaging
  metal: 0.10,      // 10% - Aluminum cans, steel
  glass: 0.15,      // 15% - Glass bottles, jars
  mixed: 0.10       // 10% - Other recyclables
};

const COMPOSTING_COMPOSITION = {
  food: 0.70,       // 70% - Food waste from cafeteria
  garden: 0.30      // 30% - Landscaping, green waste
};

async function backfillHistoricalWaste() {
  console.log('🔄 Starting historical waste data backfill...\n');
  console.log('📋 Using industry-standard composition:');
  console.log('   Recycling: 45% paper, 20% plastic, 10% metal, 15% glass, 10% mixed');
  console.log('   Composting: 70% food, 30% garden\n');

  // Get metric IDs
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .in('code', [
      'scope3_waste_recycling',
      'scope3_waste_composting',
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

  // Get all historical recycling data
  const { data: recyclingData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('metric_id', metricMap['scope3_waste_recycling'])
    .order('period_start');

  console.log(`📊 Found ${recyclingData?.length || 0} recycling records to split\n`);

  // Get all historical composting data
  const { data: compostingData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('metric_id', metricMap['scope3_waste_composting'])
    .order('period_start');

  console.log(`📊 Found ${compostingData?.length || 0} composting records to split\n`);

  let totalInserted = 0;
  const newRecords: any[] = [];

  // Process recycling records
  console.log('♻️  Processing recycling records...\n');
  for (const record of recyclingData || []) {
    const totalValue = parseFloat(record.value);
    const date = new Date(record.period_start);
    const year = date.getFullYear();

    console.log(`  ${date.toISOString().split('T')[0]}: ${totalValue.toFixed(2)} tons`);

    // Split into materials
    const splits = [
      { metric: 'scope3_waste_recycling_paper', value: totalValue * RECYCLING_COMPOSITION.paper, name: 'Paper' },
      { metric: 'scope3_waste_recycling_plastic', value: totalValue * RECYCLING_COMPOSITION.plastic, name: 'Plastic' },
      { metric: 'scope3_waste_recycling_metal', value: totalValue * RECYCLING_COMPOSITION.metal, name: 'Metal' },
      { metric: 'scope3_waste_recycling_glass', value: totalValue * RECYCLING_COMPOSITION.glass, name: 'Glass' },
      { metric: 'scope3_waste_recycling_mixed', value: totalValue * RECYCLING_COMPOSITION.mixed, name: 'Mixed' }
    ];

    splits.forEach(split => {
      console.log(`    → ${split.name}: ${split.value.toFixed(3)} tons (${(split.value / totalValue * 100).toFixed(1)}%)`);

      newRecords.push({
        organization_id: record.organization_id,
        site_id: record.site_id,
        metric_id: metricMap[split.metric],
        value: split.value.toString(),
        unit: 'tons',
        period_start: record.period_start,
        period_end: record.period_end,
        data_quality: 'estimated', // Mark as estimated since it's backfilled
        notes: `Backfilled from aggregated recycling data using industry-standard composition (${year})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    console.log('');
  }

  // Process composting records
  console.log('\n🌱 Processing composting records...\n');
  for (const record of compostingData || []) {
    const totalValue = parseFloat(record.value);
    const date = new Date(record.period_start);
    const year = date.getFullYear();

    console.log(`  ${date.toISOString().split('T')[0]}: ${totalValue.toFixed(2)} tons`);

    // Split into food and garden
    const splits = [
      { metric: 'scope3_waste_composting_food', value: totalValue * COMPOSTING_COMPOSITION.food, name: 'Food' },
      { metric: 'scope3_waste_composting_garden', value: totalValue * COMPOSTING_COMPOSITION.garden, name: 'Garden' }
    ];

    splits.forEach(split => {
      console.log(`    → ${split.name}: ${split.value.toFixed(3)} tons (${(split.value / totalValue * 100).toFixed(1)}%)`);

      newRecords.push({
        organization_id: record.organization_id,
        site_id: record.site_id,
        metric_id: metricMap[split.metric],
        value: split.value.toString(),
        unit: 'tons',
        period_start: record.period_start,
        period_end: record.period_end,
        data_quality: 'estimated',
        notes: `Backfilled from aggregated composting data using industry-standard composition (${year})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    console.log('');
  }

  console.log(`\n📝 Prepared ${newRecords.length} new records for insertion\n`);
  console.log('Do you want to proceed with insertion? (This is a DRY RUN)\n');
  console.log('Summary:');
  console.log(`  - Recycling split into 5 materials: ${(recyclingData?.length || 0) * 5} records`);
  console.log(`  - Composting split into 2 types: ${(compostingData?.length || 0) * 2} records`);
  console.log(`  - Total new records: ${newRecords.length}`);
  console.log(`\nTo actually insert, uncomment the insert code below.\n`);

  // DRY RUN - Show sample records
  console.log('📋 Sample records that would be inserted:\n');
  newRecords.slice(0, 5).forEach((record, i) => {
    const metric = metrics?.find(m => m.id === record.metric_id);
    console.log(`${i + 1}. ${metric?.name}`);
    console.log(`   Value: ${parseFloat(record.value).toFixed(3)} tons`);
    console.log(`   Period: ${record.period_start}`);
    console.log(`   Quality: ${record.data_quality}`);
    console.log(`   Notes: ${record.notes}\n`);
  });

  // INSERT THE RECORDS
  console.log('💾 Inserting records...\n');

  // Insert in batches of 100
  const batchSize = 100;
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

  console.log(`\n✅ Backfill complete! Inserted ${totalInserted} records`);

  console.log('\n💡 Next steps:');
  console.log('   1. Review the sample records above');
  console.log('   2. If composition looks correct, uncomment the insert code');
  console.log('   3. Run the script again to perform actual insertion');
  console.log('   4. Verify data in dashboard\n');
}

backfillHistoricalWaste();
