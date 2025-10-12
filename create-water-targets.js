const { createClient } = require('@supabase/supabase-js');

// Load env from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
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

  // Get 2023 baseline data
  console.log('📊 Step 2: Fetching 2023 baseline water data...\n');

  const baselineRes = await fetch('http://localhost:3001/api/water/sources?start_date=2023-01-01&end_date=2023-12-31');
  const baselineData = await baselineRes.json();

  const baseline2023Consumption = baselineData.total_consumption || 0;
  const baseline2023Withdrawal = baselineData.total_withdrawal || 0;
  const baseline2023Discharge = baselineData.total_discharge || 0;

  console.log('2023 Baseline:');
  console.log(`  Consumption: ${(baseline2023Consumption / 1000).toFixed(2)} ML`);
  console.log(`  Withdrawal: ${(baseline2023Withdrawal / 1000).toFixed(2)} ML`);
  console.log(`  Discharge: ${(baseline2023Discharge / 1000).toFixed(2)} ML\n`);

  // Calculate 2025 targets (2.5% annual reduction)
  const annualReductionRate = 0.025; // 2.5%
  const yearsElapsed = 2; // 2023 to 2025
  const reductionFactor = Math.pow(1 - annualReductionRate, yearsElapsed);

  const targetConsumption = baseline2023Consumption * reductionFactor;
  const targetWithdrawal = baseline2023Withdrawal * reductionFactor;
  const targetDischarge = baseline2023Discharge * reductionFactor;

  console.log('2025 Targets (2.5% annual reduction):');
  console.log(`  Consumption: ${(targetConsumption / 1000).toFixed(2)} ML`);
  console.log(`  Withdrawal: ${(targetWithdrawal / 1000).toFixed(2)} ML`);
  console.log(`  Discharge: ${(targetDischarge / 1000).toFixed(2)} ML\n`);

  // Get current 2025 YTD data
  console.log('📈 Step 3: Fetching 2025 YTD data...\n');

  const ytdRes = await fetch('http://localhost:3001/api/water/sources?start_date=2025-01-01&end_date=2025-07-31');
  const ytdData = await ytdRes.json();

  const current2025Consumption = ytdData.total_consumption || 0;
  const current2025Withdrawal = ytdData.total_withdrawal || 0;
  const current2025Discharge = ytdData.total_discharge || 0;

  console.log('2025 YTD (Jan-Jul):');
  console.log(`  Consumption: ${(current2025Consumption / 1000).toFixed(2)} ML`);
  console.log(`  Withdrawal: ${(current2025Withdrawal / 1000).toFixed(2)} ML`);
  console.log(`  Discharge: ${(current2025Discharge / 1000).toFixed(2)} ML\n`);

  // Create metric targets
  console.log('💾 Step 4: Creating metric targets in database...\n');

  const targetsToCreate = [];

  // Map metrics to their baseline/target values
  for (const metric of waterMetrics) {
    let baselineValue, targetValue, currentValue;

    if (metric.category === 'Water Consumption') {
      baselineValue = baseline2023Consumption;
      targetValue = targetConsumption;
      currentValue = current2025Consumption;
    } else if (metric.category === 'Water Withdrawal') {
      baselineValue = baseline2023Withdrawal;
      targetValue = targetWithdrawal;
      currentValue = current2025Withdrawal;
    } else if (metric.category === 'Water Discharge') {
      baselineValue = baseline2023Discharge;
      targetValue = targetDischarge;
      currentValue = current2025Discharge;
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
      current_value: currentValue,
      current_emissions: currentValue,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log(`✅ Prepared target for: ${metric.name}`);
    console.log(`   Category: ${metric.category}`);
    console.log(`   Baseline: ${(baselineValue / 1000).toFixed(2)} ML`);
    console.log(`   Target: ${(targetValue / 1000).toFixed(2)} ML`);
    console.log(`   Current: ${(currentValue / 1000).toFixed(2)} ML\n`);
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
  console.log('🔍 Step 5: Verifying created targets...\n');

  const { data: verification, error: verifyError } = await supabase
    .from('metric_targets')
    .select(`
      id,
      baseline_value,
      target_value,
      current_value,
      metrics_catalog (
        name,
        category
      )
    `)
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metrics_catalog.category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption']);

  if (verifyError) {
    console.error('Error verifying:', verifyError);
  } else {
    console.log('Verification results:');
    verification.forEach(v => {
      console.log(`✅ ${v.metrics_catalog.name}`);
      console.log(`   Baseline: ${(v.baseline_value / 1000).toFixed(2)} ML`);
      console.log(`   Target: ${(v.target_value / 1000).toFixed(2)} ML`);
      console.log(`   Current: ${(v.current_value / 1000).toFixed(2)} ML`);
    });
  }

  console.log('\n✨ Water metric targets setup complete!');
}

createWaterMetricTargets().catch(console.error);
