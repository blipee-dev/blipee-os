/**
 * Populate Energy Metric Targets
 *
 * This script creates metric-level targets for energy categories based on:
 * - 2023 baseline emissions data
 * - Category-level SBTi reduction rates (4.2% annual reduction for 1.5°C pathway)
 * - Weighted allocation methodology
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.com';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const ORGANIZATION_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5'; // Near-term SBTi target
const BASELINE_YEAR = 2023;
const TARGET_YEAR = 2025;

// Category-level reduction rates (from weighted allocation)
const CATEGORY_REDUCTION_RATES = {
  'Electricity': 5.2, // 5.2% annual reduction
  'Purchased Energy': 4.2 // 4.2% annual reduction (default SBTi 1.5°C)
};

async function main() {
  console.log('🚀 Starting Energy Metric Targets Population');
  console.log(`📊 Organization: ${ORGANIZATION_ID}`);
  console.log(`🎯 Target: ${TARGET_ID}`);
  console.log(`📅 Baseline Year: ${BASELINE_YEAR}, Target Year: ${TARGET_YEAR}\n`);

  try {
    // Step 1: Get all metrics catalog entries for energy categories
    console.log('📡 Fetching energy metrics catalog...');

    const { data: catalogData, error: catalogError } = await supabase
      .from('metrics_catalog')
      .select('id, name, category, scope, unit')
      .in('category', ['Electricity', 'Purchased Energy']);

    if (catalogError) {
      throw new Error(`Error fetching catalog: ${catalogError.message}`);
    }

    const metricIds = catalogData.map(m => m.id);
    console.log(`✅ Found ${catalogData.length} energy metrics in catalog`);

    // Step 2: Get 2023 baseline data for these metrics
    console.log('📡 Fetching 2023 baseline data...');

    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics_data')
      .select('metric_id, value, co2e_emissions')
      .eq('organization_id', ORGANIZATION_ID)
      .in('metric_id', metricIds)
      .gte('period_start', `${BASELINE_YEAR}-01-01`)
      .lt('period_start', `${BASELINE_YEAR + 1}-01-01`);

    if (metricsError) {
      throw new Error(`Error fetching metrics data: ${metricsError.message}`);
    }

    // Step 2: Aggregate by metric
    console.log(`✅ Found ${metricsData?.length || 0} data points\n`);

    const metricAggregates = {};

    metricsData?.forEach(record => {
      const metricId = record.metric_id;
      const catalog = record.metrics_catalog;

      if (!metricAggregates[metricId]) {
        metricAggregates[metricId] = {
          metric_catalog_id: metricId,
          name: catalog.name,
          category: catalog.category,
          scope: catalog.scope,
          unit: catalog.unit,
          baseline_value: 0,
          baseline_emissions: 0, // in kgCO2e
          data_points: 0
        };
      }

      metricAggregates[metricId].baseline_value += parseFloat(record.value || 0);
      metricAggregates[metricId].baseline_emissions += parseFloat(record.co2e_emissions || 0);
      metricAggregates[metricId].data_points += 1;
    });

    const metrics = Object.values(metricAggregates).filter(m => m.baseline_emissions > 0);

    console.log(`📊 Aggregated into ${metrics.length} unique metrics:\n`);

    // Step 3: Calculate targets for each metric
    const metricTargets = [];

    for (const metric of metrics) {
      const category = metric.category;
      const annualReductionRate = CATEGORY_REDUCTION_RATES[category] || 4.2;
      const yearsToTarget = TARGET_YEAR - BASELINE_YEAR; // 2 years
      const cumulativeReduction = annualReductionRate * yearsToTarget / 100; // 10.4% for Electricity, 8.4% for Purchased Energy

      const baselineEmissionsKg = metric.baseline_emissions;
      const targetEmissionsKg = baselineEmissionsKg * (1 - cumulativeReduction);

      // Calculate target value (proportional reduction in consumption)
      const targetValue = metric.baseline_value * (1 - cumulativeReduction);

      console.log(`  📌 ${metric.name}`);
      console.log(`     Category: ${category}`);
      console.log(`     Baseline (${BASELINE_YEAR}): ${(baselineEmissionsKg / 1000).toFixed(2)} tCO2e`);
      console.log(`     Reduction Rate: ${annualReductionRate}% annual (${(cumulativeReduction * 100).toFixed(1)}% cumulative)`);
      console.log(`     Target (${TARGET_YEAR}): ${(targetEmissionsKg / 1000).toFixed(2)} tCO2e\n`);

      metricTargets.push({
        organization_id: ORGANIZATION_ID,
        target_id: TARGET_ID,
        metric_catalog_id: metric.metric_catalog_id,
        baseline_value: metric.baseline_value,
        baseline_emissions: baselineEmissionsKg,
        target_value: targetValue,
        target_emissions: targetEmissionsKg,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Step 4: Check for existing metric targets
    console.log(`\n🔍 Checking for existing metric targets...`);

    const { data: existingTargets, error: existingError } = await supabase
      .from('metric_targets')
      .select('metric_catalog_id')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('target_id', TARGET_ID);

    if (existingError) {
      console.warn(`⚠️  Warning checking existing targets: ${existingError.message}`);
    }

    const existingMetricIds = new Set(existingTargets?.map(t => t.metric_catalog_id) || []);
    const newTargets = metricTargets.filter(t => !existingMetricIds.has(t.metric_catalog_id));

    if (existingMetricIds.size > 0) {
      console.log(`⚠️  Found ${existingMetricIds.size} existing metric targets (will skip)`);
    }

    if (newTargets.length === 0) {
      console.log(`\n✅ All metric targets already exist. Nothing to insert.`);
      return;
    }

    // Step 5: Insert metric targets
    console.log(`\n💾 Inserting ${newTargets.length} new metric targets...`);

    const { data: insertedTargets, error: insertError } = await supabase
      .from('metric_targets')
      .insert(newTargets)
      .select();

    if (insertError) {
      throw new Error(`Error inserting metric targets: ${insertError.message}`);
    }

    console.log(`\n✅ Successfully created ${insertedTargets?.length || 0} metric targets!`);

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Total Metrics Processed: ${metrics.length}`);
    console.log(`   New Targets Created: ${insertedTargets?.length || 0}`);
    console.log(`   Existing Targets Skipped: ${existingMetricIds.size}`);
    console.log(`\n🎉 Done! The expandable SBTi targets section should now work.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
