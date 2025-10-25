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
    .or('subcategory.eq.Water,code.ilike.%water%');

  if (metricsError) {
    console.error('Error fetching metrics:', metricsError);
    return;
  }

  console.log(`Found ${waterMetrics.length} water metrics in catalog\n`);

  // Get metric IDs
  const metricIds = waterMetrics.map(m => m.id);

  // Get actual water metrics data from metrics_data table
  console.log('📊 Step 2: Querying water data from metrics_data table...\n');

  // Get 2023 baseline data
  const { data: baseline2023Data, error: baseline2023Error } = await supabase
    .from('metrics_data')
    .select('metric_id, value, period_start')
    .eq('organization_id', ORG_ID)
    .in('metric_id', metricIds)
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2024-01-01');

  if (baseline2023Error) {
    console.error('Error fetching 2023 baseline:', baseline2023Error);
    return;
  }

  console.log(`  Found ${baseline2023Data?.length || 0} records for 2023 baseline`);

  // Get 2025 YTD data
  const { data: ytd2025Data, error: ytd2025Error } = await supabase
    .from('metrics_data')
    .select('metric_id, value, period_start')
    .eq('organization_id', ORG_ID)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-08-01');

  if (ytd2025Error) {
    console.error('Error fetching 2025 YTD:', ytd2025Error);
    return;
  }

  console.log(`  Found ${ytd2025Data?.length || 0} records for 2025 YTD\n`);

  // Calculate totals for 2023 baseline
  let baseline2023Withdrawal = 0;
  let baseline2023Discharge = 0;

  baseline2023Data?.forEach(record => {
    const metric = waterMetrics.find(m => m.id === record.metric_id);
    const metricCode = metric?.code || '';
    const value = parseFloat(record.value) || 0;

    // Determine if this is withdrawal or discharge
    const isDischarge = metricCode.includes('wastewater');

    if (isDischarge) {
      baseline2023Discharge += value;
    } else {
      baseline2023Withdrawal += value;
    }
  });

  const baseline2023Consumption = baseline2023Withdrawal - baseline2023Discharge;

  console.log('2023 Baseline:');
  console.log(`  Withdrawal: ${(baseline2023Withdrawal).toFixed(2)} m³ (${(baseline2023Withdrawal * 1000).toFixed(0)} L)`);
  console.log(`  Discharge: ${(baseline2023Discharge).toFixed(2)} m³ (${(baseline2023Discharge * 1000).toFixed(0)} L)`);
  console.log(`  Consumption: ${(baseline2023Consumption).toFixed(2)} m³ (${(baseline2023Consumption * 1000).toFixed(0)} L)\n`);

  // Calculate totals for 2025 YTD
  let ytd2025Withdrawal = 0;
  let ytd2025Discharge = 0;

  ytd2025Data?.forEach(record => {
    const metric = waterMetrics.find(m => m.id === record.metric_id);
    const metricCode = metric?.code || '';
    const value = parseFloat(record.value) || 0;

    // Determine if this is withdrawal or discharge
    const isDischarge = metricCode.includes('wastewater');

    if (isDischarge) {
      ytd2025Discharge += value;
    } else {
      ytd2025Withdrawal += value;
    }
  });

  const ytd2025Consumption = ytd2025Withdrawal - ytd2025Discharge;

  console.log('2025 YTD (Jan-Jul):');
  console.log(`  Withdrawal: ${(ytd2025Withdrawal).toFixed(2)} m³ (${(ytd2025Withdrawal * 1000).toFixed(0)} L)`);
  console.log(`  Discharge: ${(ytd2025Discharge).toFixed(2)} m³ (${(ytd2025Discharge * 1000).toFixed(0)} L)`);
  console.log(`  Consumption: ${(ytd2025Consumption).toFixed(2)} m³ (${(ytd2025Consumption * 1000).toFixed(0)} L)\n`);

  // Calculate 2025 targets (2.5% annual reduction from 2023)
  const annualReductionRate = 0.025; // 2.5%
  const yearsElapsed = 2; // 2023 to 2025
  const reductionFactor = Math.pow(1 - annualReductionRate, yearsElapsed);

  const targetWithdrawal = baseline2023Withdrawal * reductionFactor;
  const targetDischarge = baseline2023Discharge * reductionFactor;
  const targetConsumption = baseline2023Consumption * reductionFactor;

  console.log('2025 Targets (2.5% annual reduction):');
  console.log(`  Withdrawal: ${(targetWithdrawal).toFixed(2)} m³`);
  console.log(`  Discharge: ${(targetDischarge).toFixed(2)} m³`);
  console.log(`  Consumption: ${(targetConsumption).toFixed(2)} m³\n`);

  // Get the 3 water metric targets we created earlier
  console.log('💾 Step 3: Updating metric targets in database...\n');

  // Get water metrics from catalog with specific categories
  const { data: waterCategoryMetrics, error: waterCatError } = await supabase
    .from('metrics_catalog')
    .select('id, name, category')
    .in('category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption']);

  if (waterCatError) {
    console.error('Error fetching water category metrics:', waterCatError);
    return;
  }

  const waterCategoryMetricIds = waterCategoryMetrics.map(m => m.id);

  const { data: existingTargets, error: existingError } = await supabase
    .from('metric_targets')
    .select('id, metric_catalog_id, baseline_value, target_value')
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metric_catalog_id', waterCategoryMetricIds);

  if (existingError) {
    console.error('Error fetching existing targets:', existingError);
    return;
  }

  console.log(`Found ${existingTargets?.length || 0} existing water targets to update\n`);

  // Update each target with actual values
  for (const target of existingTargets || []) {
    // Find the metric details
    const metric = waterCategoryMetrics.find(m => m.id === target.metric_catalog_id);
    if (!metric) continue;

    let baselineValue, targetValue, currentValue;
    const category = metric.category;

    if (category === 'Water Consumption') {
      baselineValue = baseline2023Consumption;
      targetValue = targetConsumption;
      currentValue = ytd2025Consumption;
    } else if (category === 'Water Withdrawal') {
      baselineValue = baseline2023Withdrawal;
      targetValue = targetWithdrawal;
      currentValue = ytd2025Withdrawal;
    } else if (category === 'Water Discharge') {
      baselineValue = baseline2023Discharge;
      targetValue = targetDischarge;
      currentValue = ytd2025Discharge;
    }

    // Update the target with actual values
    const { data: updated, error: updateError } = await supabase
      .from('metric_targets')
      .update({
        baseline_value: baselineValue,
        baseline_emissions: baselineValue, // For water, value = emissions
        target_value: targetValue,
        target_emissions: targetValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', target.id)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ Error updating ${metric.name}:`, updateError);
    } else {
      console.log(`✅ Updated: ${metric.name}`);
      console.log(`   Category: ${category}`);
      console.log(`   Baseline: ${(baselineValue).toFixed(2)} m³`);
      console.log(`   Target: ${(targetValue).toFixed(2)} m³`);
      console.log(`   Current YTD: ${(currentValue).toFixed(2)} m³\n`);
    }
  }

  // Verify final results
  console.log('🔍 Step 4: Verifying updated targets...\n');

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
      console.log(`   Baseline: ${(v.baseline_value).toFixed(2)} ${v.metrics_catalog.unit || 'm³'}`);
      console.log(`   Target: ${(v.target_value).toFixed(2)} ${v.metrics_catalog.unit || 'm³'}`);
      console.log(`   ID: ${v.id}`);
    });
  }

  console.log('\n✨ Water metric targets updated successfully!');
  console.log('🌊 Refresh your water dashboard to see the actual targets.\n');
}

createWaterMetricTargets().catch(console.error);
