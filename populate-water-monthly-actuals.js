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

async function populateWaterMonthlyActuals() {
  console.log('🔍 Step 1: Getting water metric targets...\n');

  // Get water category metrics first
  const { data: waterCategoryMetrics, error: catError } = await supabase
    .from('metrics_catalog')
    .select('id, name, category, code')
    .in('category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption']);

  if (catError) {
    console.error('Error fetching water category metrics:', catError);
    return;
  }

  const waterCategoryMetricIds = waterCategoryMetrics.map(m => m.id);

  // Get water metric targets for these specific categories
  const { data: waterTargets, error: targetsError } = await supabase
    .from('metric_targets')
    .select('id, metric_catalog_id, baseline_value, target_value')
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metric_catalog_id', waterCategoryMetricIds);

  if (targetsError) {
    console.error('Error fetching water targets:', targetsError);
    return;
  }

  // Add metric details to targets
  const enrichedTargets = waterTargets.map(t => ({
    ...t,
    metrics_catalog: waterCategoryMetrics.find(m => m.id === t.metric_catalog_id)
  }));

  console.log(`Found ${enrichedTargets.length} water metric targets\n`);

  // Get water metrics from catalog
  const { data: waterMetrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Water,code.ilike.%water%');

  if (metricsError) {
    console.error('Error fetching water metrics:', metricsError);
    return;
  }

  console.log(`Found ${waterMetrics.length} water metrics in catalog\n`);

  const metricIds = waterMetrics.map(m => m.id);

  // For each water metric target, calculate monthly actuals for 2025
  console.log('📊 Step 2: Calculating monthly actuals for 2025...\n');

  const monthlyRecordsToInsert = [];

  for (const target of enrichedTargets) {
    const category = target.metrics_catalog.category;
    console.log(`\n📝 Processing: ${target.metrics_catalog.name} (${category})`);

    // For each month of 2025 (Jan-Jul so far)
    for (let month = 1; month <= 7; month++) {
      const monthStart = `2025-${String(month).padStart(2, '0')}-01`;
      const monthEnd = month === 12
        ? `2026-01-01`
        : `2025-${String(month + 1).padStart(2, '0')}-01`;

      // Get metrics data for this month
      const { data: monthData, error: monthError } = await supabase
        .from('metrics_data')
        .select('metric_id, value')
        .eq('organization_id', ORG_ID)
        .in('metric_id', metricIds)
        .gte('period_start', monthStart)
        .lt('period_start', monthEnd);

      if (monthError) {
        console.error(`Error fetching data for month ${month}:`, monthError);
        continue;
      }

      // Calculate monthly total based on category
      let monthlyValue = 0;

      monthData?.forEach(record => {
        const metric = waterMetrics.find(m => m.id === record.metric_id);
        const metricCode = metric?.code || '';
        const value = parseFloat(record.value) || 0;

        const isDischarge = metricCode.includes('wastewater');

        if (category === 'Water Withdrawal' && !isDischarge) {
          monthlyValue += value;
        } else if (category === 'Water Discharge' && isDischarge) {
          monthlyValue += value;
        } else if (category === 'Water Consumption') {
          // Consumption = Withdrawal - Discharge, calculated later
        }
      });

      // For consumption, we need both withdrawal and discharge
      if (category === 'Water Consumption') {
        let withdrawal = 0;
        let discharge = 0;

        monthData?.forEach(record => {
          const metric = waterMetrics.find(m => m.id === record.metric_id);
          const metricCode = metric?.code || '';
          const value = parseFloat(record.value) || 0;

          const isDischarge = metricCode.includes('wastewater');

          if (isDischarge) {
            discharge += value;
          } else {
            withdrawal += value;
          }
        });

        monthlyValue = withdrawal - discharge;
      }

      // Calculate monthly target (proportional to annual target)
      const annualTarget = target.target_value || 0;
      const monthlyTarget = annualTarget / 12;

      // Check if this monthly record already exists
      const { data: existing } = await supabase
        .from('metric_targets_monthly')
        .select('id')
        .eq('metric_target_id', target.id)
        .eq('year', 2025)
        .eq('month', month)
        .single();

      if (existing) {
        console.log(`  Month ${month}: Already exists, skipping`);
        continue;
      }

      monthlyRecordsToInsert.push({
        metric_target_id: target.id,
        year: 2025,
        month: month,
        planned_value: monthlyTarget,
        planned_emissions: monthlyTarget, // For water, value = emissions
        actual_value: monthlyValue,
        actual_emissions: monthlyValue
      });

      console.log(`  Month ${month}: Actual ${(monthlyValue / 1000).toFixed(2)} ML, Target ${(monthlyTarget / 1000).toFixed(2)} ML`);
    }
  }

  // Insert all monthly records
  if (monthlyRecordsToInsert.length > 0) {
    console.log(`\n💾 Step 3: Inserting ${monthlyRecordsToInsert.length} monthly records...\n`);

    const { data: inserted, error: insertError } = await supabase
      .from('metric_targets_monthly')
      .insert(monthlyRecordsToInsert)
      .select();

    if (insertError) {
      console.error('❌ Error inserting monthly records:', insertError);
      return;
    }

    console.log(`✅ Successfully inserted ${inserted.length} monthly records!\n`);
  } else {
    console.log('\n✓ All monthly records already exist\n');
  }

  // Verify the results
  console.log('🔍 Step 4: Verifying monthly actuals...\n');

  for (const target of enrichedTargets) {
    const { data: monthlyRecords, error: verifyError } = await supabase
      .from('metric_targets_monthly')
      .select('year, month, actual_value, planned_value')
      .eq('metric_target_id', target.id)
      .eq('year', 2025)
      .order('month');

    if (verifyError) {
      console.error('Error verifying:', verifyError);
      continue;
    }

    const totalActual = monthlyRecords.reduce((sum, m) => sum + (m.actual_value || 0), 0);
    const totalPlanned = monthlyRecords.reduce((sum, m) => sum + (m.planned_value || 0), 0);

    console.log(`\n✅ ${target.metrics_catalog.name}`);
    console.log(`   Category: ${target.metrics_catalog.category}`);
    console.log(`   Months: ${monthlyRecords.length}`);
    console.log(`   Total Actual: ${(totalActual / 1000).toFixed(2)} ML`);
    console.log(`   Total Planned: ${(totalPlanned / 1000).toFixed(2)} ML`);
    console.log(`   Status: ${totalActual <= totalPlanned ? 'On Track' : 'Off Track'}`);
  }

  console.log('\n✨ Water monthly actuals populated successfully!');
  console.log('🌊 Refresh your water dashboard to see current values.\n');
}

populateWaterMonthlyActuals().catch(console.error);
