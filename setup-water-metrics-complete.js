const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

async function setupWaterMetrics() {
  console.log('🌊 Setting up water metrics and targets...\n');

  // Step 1: Create water metrics in catalog if they don't exist
  console.log('📋 Step 1: Creating water metrics in catalog...\n');

  const waterMetricsToCreate = [
    {
      code: 'WATER_WITHDRAWAL_TOTAL',
      name: 'Total Water Withdrawal',
      category: 'Water Withdrawal',
      scope: 'scope_3', // Water is typically Scope 3 (indirect)
      unit: 'L',
      description: 'Total water withdrawn from all sources',
      calculation_method: 'Sum of all water withdrawal sources'
    },
    {
      code: 'WATER_DISCHARGE_TOTAL',
      name: 'Total Water Discharge',
      category: 'Water Discharge',
      scope: 'scope_3',
      unit: 'L',
      description: 'Total water discharged to all destinations',
      calculation_method: 'Sum of all water discharge points'
    },
    {
      code: 'WATER_CONSUMPTION_TOTAL',
      name: 'Total Water Consumption',
      category: 'Water Consumption',
      scope: 'scope_3',
      unit: 'L',
      description: 'Net water consumption (Withdrawal - Discharge)',
      calculation_method: 'Total withdrawal minus total discharge'
    }
  ];

  const createdMetrics = [];

  for (const metric of waterMetricsToCreate) {
    // Check if exists
    const { data: existing } = await supabase
      .from('metrics_catalog')
      .select('id, name')
      .eq('code', metric.code)
      .single();

    if (existing) {
      console.log(`✓ Metric already exists: ${existing.name}`);
      createdMetrics.push(existing);
    } else {
      const { data: created, error } = await supabase
        .from('metrics_catalog')
        .insert(metric)
        .select()
        .single();

      if (error) {
        console.error(`✗ Error creating ${metric.name}:`, error.message);
      } else {
        console.log(`✓ Created metric: ${created.name}`);
        createdMetrics.push(created);
      }
    }
  }

  console.log(`\n✅ ${createdMetrics.length} water metrics ready in catalog\n`);

  // Step 2: Get baseline data
  console.log('📊 Step 2: Fetching water data...\n');

  // Note: Using fetch with localhost - adjust if your dev server is on a different port
  try {
    const baselineRes = await fetch('http://localhost:3001/api/water/sources?start_date=2023-01-01&end_date=2023-12-31');
    const baselineData = await baselineRes.json();

    const ytdRes = await fetch('http://localhost:3001/api/water/sources?start_date=2025-01-01&end_date=2025-07-31');
    const ytdData = await ytdRes.json();

    console.log('2023 Baseline:');
    console.log(`  Consumption: ${(baselineData.total_consumption / 1000).toFixed(2)} ML`);
    console.log(`  Withdrawal: ${(baselineData.total_withdrawal / 1000).toFixed(2)} ML`);
    console.log(`  Discharge: ${(baselineData.total_discharge / 1000).toFixed(2)} ML`);

    console.log('\n2025 YTD (Jan-Jul):');
    console.log(`  Consumption: ${(ytdData.total_consumption / 1000).toFixed(2)} ML`);
    console.log(`  Withdrawal: ${(ytdData.total_withdrawal / 1000).toFixed(2)} ML`);
    console.log(`  Discharge: ${(ytdData.total_discharge / 1000).toFixed(2)} ML\n`);

    // Calculate targets (2.5% annual reduction)
    const annualReductionRate = 0.025;
    const yearsElapsed = 2;
    const reductionFactor = Math.pow(1 - annualReductionRate, yearsElapsed);

    // Step 3: Create metric targets
    console.log('💾 Step 3: Creating metric targets...\n');

    const targetsToCreate = [];

    for (const metric of createdMetrics) {
      let baselineValue, targetValue;

      if (metric.category === 'Water Consumption') {
        baselineValue = baselineData.total_consumption;
        targetValue = baselineValue * reductionFactor;
      } else if (metric.category === 'Water Withdrawal') {
        baselineValue = baselineData.total_withdrawal;
        targetValue = baselineValue * reductionFactor;
      } else if (metric.category === 'Water Discharge') {
        baselineValue = baselineData.total_discharge;
        targetValue = baselineValue * reductionFactor;
      }

      // Check if target already exists
      const { data: existingTarget } = await supabase
        .from('metric_targets')
        .select('id')
        .eq('organization_id', ORG_ID)
        .eq('target_id', TARGET_ID)
        .eq('metric_catalog_id', metric.id)
        .single();

      if (existingTarget) {
        console.log(`✓ Target already exists for: ${metric.name}`);
        continue;
      }

      targetsToCreate.push({
        organization_id: ORG_ID,
        target_id: TARGET_ID,
        metric_catalog_id: metric.id,
        baseline_year: 2023,
        baseline_value: baselineValue,
        baseline_emissions: baselineValue, // For water, emissions = value (in liters)
        target_year: 2025,
        target_value: targetValue,
        target_emissions: targetValue,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      console.log(`✓ Prepared target for: ${metric.name}`);
      console.log(`   Baseline: ${(baselineValue / 1000).toFixed(2)} ML`);
      console.log(`   Target: ${(targetValue / 1000).toFixed(2)} ML`);
    }

    if (targetsToCreate.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('metric_targets')
        .insert(targetsToCreate)
        .select();

      if (insertError) {
        console.error('\n❌ Error creating targets:', insertError);
      } else {
        console.log(`\n✅ Successfully created ${inserted.length} metric targets!`);
      }
    } else {
      console.log('\n✓ All targets already exist');
    }

    // Step 4: Verify
    console.log('\n🔍 Step 4: Verifying setup...\n');

    const { data: verification } = await supabase
      .from('metric_targets')
      .select(`
        id,
        baseline_value,
        target_value,
        baseline_emissions,
        target_emissions,
        metrics_catalog (
          name,
          category,
          unit
        )
      `)
      .eq('organization_id', ORG_ID)
      .eq('target_id', TARGET_ID);

    if (verification && verification.length > 0) {
      const waterTargets = verification.filter(v =>
        v.metrics_catalog.category.includes('Water')
      );

      console.log(`Found ${waterTargets.length} water metric targets:`);
      waterTargets.forEach(v => {
        console.log(`\n✅ ${v.metrics_catalog.name}`);
        console.log(`   Category: ${v.metrics_catalog.category}`);
        console.log(`   Baseline: ${(v.baseline_value / 1000).toFixed(2)} ML`);
        console.log(`   Target: ${(v.target_value / 1000).toFixed(2)} ML`);
        console.log(`   ID: ${v.id}`);
      });
    }

    console.log('\n\n🎉 Water metrics and targets setup complete!');
    console.log('🌊 Refresh your water dashboard to see the new targets.\n');

  } catch (error) {
    console.error('\n❌ Error fetching water data:', error.message);
    console.log('\n⚠️  Make sure your dev server is running on http://localhost:3001');
  }
}

setupWaterMetrics().catch(console.error);
