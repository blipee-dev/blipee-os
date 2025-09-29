import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkPredictionCoverage() {
  // Get all unique metrics from historical data
  const { data: historicalMetrics } = await supabase
    .from('metrics_data')
    .select(`
      metric_id,
      metrics_catalog (
        id,
        name,
        category
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2022-01-01')
    .lte('period_end', '2024-12-31');

  // Get unique metrics from 2025 predictions
  const { data: predictedMetrics } = await supabase
    .from('metrics_data')
    .select(`
      metric_id,
      metrics_catalog (
        id,
        name,
        category
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-08-31');

  // Create maps of unique metrics
  const historicalMap = new Map();
  const predictedMap = new Map();

  historicalMetrics?.forEach(m => {
    if (m.metrics_catalog?.name) {
      historicalMap.set(m.metric_id, {
        name: m.metrics_catalog.name,
        category: m.metrics_catalog.category
      });
    }
  });

  predictedMetrics?.forEach(m => {
    if (m.metrics_catalog?.name) {
      predictedMap.set(m.metric_id, {
        name: m.metrics_catalog.name,
        category: m.metrics_catalog.category
      });
    }
  });

  console.log('\n=== PREDICTION COVERAGE ANALYSIS ===\n');
  console.log('Unique metrics tracked historically:', historicalMap.size);
  console.log('Unique metrics with 2025 predictions:', predictedMap.size);

  const predicted: string[] = [];
  const notPredicted: string[] = [];

  historicalMap.forEach((metric, id) => {
    const metricStr = `${metric.name} [${metric.category}]`;
    if (predictedMap.has(id)) {
      predicted.push(metricStr);
    } else {
      notPredicted.push(metricStr);
    }
  });

  console.log('\n=== METRICS WITH PREDICTIONS ===');
  predicted.sort().forEach(metric => {
    console.log('✅', metric);
  });

  console.log('\n=== METRICS WITHOUT PREDICTIONS ===');
  notPredicted.sort().forEach(metric => {
    console.log('❌', metric);
  });

  // Get totals by category
  const { data: historical2024 } = await supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      metrics_catalog (
        category
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-08-31');

  const { data: predicted2025 } = await supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      metrics_catalog (
        category
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-08-31');

  const by2024: any = {};
  const by2025: any = {};

  historical2024?.forEach(m => {
    const cat = m.metrics_catalog?.category || 'Unknown';
    if (!by2024[cat]) by2024[cat] = 0;
    by2024[cat] += (m.co2e_emissions || 0) / 1000;
  });

  predicted2025?.forEach(m => {
    const cat = m.metrics_catalog?.category || 'Unknown';
    if (!by2025[cat]) by2025[cat] = 0;
    by2025[cat] += (m.co2e_emissions || 0) / 1000;
  });

  console.log('\n=== EMISSIONS BY CATEGORY (Jan-Aug) ===');
  console.log('\nCategory                  2024 Actual  2025 Predicted  Coverage');
  console.log('---------------------------------------------------------------');

  const allCategories = new Set([...Object.keys(by2024), ...Object.keys(by2025)]);
  let total2024 = 0;
  let total2025 = 0;

  Array.from(allCategories).sort().forEach(cat => {
    const actual = by2024[cat] || 0;
    const predicted = by2025[cat] || 0;
    const coverage = actual > 0 ? (predicted > 0 ? '✅' : '❌') : 'N/A';

    console.log(
      cat.padEnd(25),
      Math.round(actual).toString().padStart(10) + ' tCO2e',
      Math.round(predicted).toString().padStart(10) + ' tCO2e',
      '  ' + coverage
    );

    total2024 += actual;
    total2025 += predicted;
  });

  console.log('---------------------------------------------------------------');
  console.log(
    'TOTAL'.padEnd(25),
    Math.round(total2024).toString().padStart(10) + ' tCO2e',
    Math.round(total2025).toString().padStart(10) + ' tCO2e',
    '  ' + (total2025 / total2024 * 100).toFixed(0) + '%'
  );

  // Show what percentage of emissions we're predicting
  const coveragePercent = (total2025 / total2024 * 100).toFixed(1);
  console.log(`\n📊 Prediction Coverage: ${coveragePercent}% of 2024 emissions`);

  if (notPredicted.length > 0) {
    console.log('\n⚠️  Missing predictions for:', notPredicted.length, 'metrics');
    console.log('   These metrics need to be added to get full coverage');
  }
}

checkPredictionCoverage().catch(console.error);