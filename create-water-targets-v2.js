const { createClient } = require('@supabase/supabase-js');

// Load env from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

async function createWaterMetricTargets() {
  console.log('🔍 Step 1: Checking water metrics in catalog...\n');

  // Get water metrics from catalog
  const { data: waterMetrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption'])
    .order('category');

  if (metricsError) {
    console.error('Error fetching metrics:', metricsError);
    return;
  }

  console.log(`Found ${waterMetrics.length} water metrics in catalog\n`);

  // Get actual water usage data from database
  console.log('📊 Step 2: Querying water usage from database...\n');

  // Get 2023 baseline
  const { data: baseline2023, error: baseline2023Error } = await supabase
    .from('water_usage')
    .select('usage_type, volume_liters')
    .eq('organization_id', ORG_ID)
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2024-01-01');

  if (baseline2023Error) {
    console.error('Error fetching 2023 baseline:', baseline2023Error);
    return;
  }

  // Calculate totals for 2023
  let baseline2023Withdrawal = 0;
  let baseline2023Discharge = 0;

  baseline2023.forEach(row => {
    if (row.usage_type === 'withdrawal') {
      baseline2023Withdrawal += parseFloat(row.volume_liters) || 0;
    } else if (row.usage_type === 'discharge') {
      baseline2023Discharge += parseFloat(row.volume_liters) || 0;
    }
  });

  const baseline2023Consumption = baseline2023Withdrawal - baseline2023Discharge;

  console.log('2023 Baseline:');
  console.log(`  Withdrawal: ${(baseline2023Withdrawal / 1000).toFixed(2)} ML`);
  console.log(`  Discharge: ${(baseline2023Discharge / 1000).toFixed(2)} ML`);
  console.log(`  Consumption: ${(baseline2023Consumption / 1000).toFixed(2)} ML\n`);

  // Get 2025 YTD
  const { data: ytd2025, error: ytd2025Error } = await supabase
    .from('water_usage')
    .select('usage_type, volume_liters')
    .eq('organization_id', ORG_ID)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-08-01');

  if (ytd2025Error) {
    console.error('Error fetching 2025 YTD:', ytd2025Error);
    return;
  }

  // Calculate totals for 2025 YTD
  let ytd2025Withdrawal = 0;
  let ytd2025Discharge = 0;

  ytd2025.forEach(row => {
    if (row.usage_type === 'withdrawal') {
      ytd2025Withdrawal += parseFloat(row.volume_liters) || 0;
    } else if (row.usage_type === 'discharge') {
      ytd2025Discharge += parseFloat(row.volume_liters) || 0;
    }
  });

  const ytd2025Consumption = ytd2025Withdrawal - ytd2025Discharge;

  console.log('2025 YTD (Jan-Jul):');
  console.log(`  Withdrawal: ${(ytd2025Withdrawal / 1000).toFixed(2)} ML`);
  console.log(`  Discharge: ${(ytd2025Discharge / 1000).toFixed(2)} ML`);
  console.log(`  Consumption: ${(ytd2025Consumption / 1000).toFixed(2)} ML\n`);

  // Calculate 2025 targets (2.5% annual reduction from 2023)
  const annualReductionRate = 0.025; // 2.5%
  const yearsElapsed = 2; // 2023 to 2025
  const reductionFactor = Math.pow(1 - annualReductionRate, yearsElapsed);

  const targetWithdrawal = baseline2023Withdrawal * reductionFactor;
  const targetDischarge = baseline2023Discharge * reductionFactor;
  const targetConsumption = baseline2023Consumption * reductionFactor;

  console.log('2025 Targets (2.5% annual reduction):');
  console.log(`  Withdrawal: ${(targetWithdrawal / 1000).toFixed(2)} ML`);
  console.log(`  Discharge: ${(targetDischarge / 1000).toFixed(2)} ML`);
  console.log(`  Consumption: ${(targetConsumption / 1000).toFixed(2)} ML\n`);

  // Create metric targets
  console.log('💾 Step 3: Creating metric targets in database...\n');

  const targetsToCreate = [];

  // Map metrics to their baseline/target values
  for (const metric of waterMetrics) {
    let baselineValue, targetValue, currentValue;

    if (metric.category === 'Water Consumption') {
      baselineValue = baseline2023Consumption;
      targetValue = targetConsumption;
      currentValue = ytd2025Consumption;
    } else if (metric.category === 'Water Withdrawal') {
      baselineValue = baseline2023Withdrawal;
      targetValue = targetWithdrawal;
      currentValue = ytd2025Withdrawal;
    } else if (metric.category === 'Water Discharge') {
      baselineValue = baseline2023Discharge;
      targetValue = targetDischarge;
      currentValue = ytd2025Discharge;
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
      baseline_emissions: baselineValue, // For water, value = emissions
      target_year: 2025,
      target_value: targetValue,
      target_emissions: targetValue,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log(`✅ Prepared target for: ${metric.name}`);
    console.log(`   Category: ${metric.category}`);
    console.log(`   Baseline: ${(baselineValue / 1000).toFixed(2)} ML`);
    console.log(`   Target: ${(targetValue / 1000).toFixed(2)} ML`);
    console.log(`   Current YTD: ${(currentValue / 1000).toFixed(2)} ML\n`);
  }

  if (targetsToCreate.length === 0) {
    console.log('✓ All targets already exist');
    return;
  }

  // Insert all targets
  const { data: inserted, error: insertError } = await supabase
    .from('metric_targets')
    .insert(targetsToCreate)
    .select();

  if (insertError) {
    console.error('❌ Error creating targets:', insertError);
    return;
  }

  console.log(`\n🎉 Successfully created ${inserted.length} water metric targets!\n`);

  // Verify
  console.log('🔍 Step 4: Verifying created targets...\n');

  const { data: verification, error: verifyError } = await supabase
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

  if (verifyError) {
    console.error('Error verifying:', verifyError);
  } else {
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

  console.log('\n✨ Water metric targets setup complete!');
  console.log('🌊 Refresh your water dashboard to see the new targets.\n');
}

createWaterMetricTargets().catch(console.error);
