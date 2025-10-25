import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Simple prediction with trend and seasonality
function predictValue(historicalData: any[], targetMonth: number) {
  if (!historicalData || historicalData.length === 0) return 0;

  // Get monthly averages
  const monthlyData: any = {};
  historicalData.forEach(d => {
    const month = new Date(d.period_start).getMonth() + 1;
    if (!monthlyData[month]) monthlyData[month] = [];
    monthlyData[month].push(d.value);
  });

  // Get average for target month
  const targetMonthData = monthlyData[targetMonth] || [];
  if (targetMonthData.length === 0) {
    // If no data for this month, use overall average
    const allValues = historicalData.map(d => d.value);
    return Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length);
  }

  // Calculate trend
  const yearlyGrowth = 1.05; // 5% annual growth
  const baseValue = targetMonthData[targetMonthData.length - 1] ||
                    targetMonthData.reduce((a: number, b: number) => a + b, 0) / targetMonthData.length;

  // Add variation
  const variation = (Math.random() - 0.5) * 0.1; // ±5% random variation
  return Math.round(baseValue * yearlyGrowth * (1 + variation));
}

async function generateCompletePredictions() {
  console.log('\n=== GENERATING COMPLETE 2025 PREDICTIONS ===\n');

  // Get all sites for PLMJ
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2');

  console.log('Found sites:', sites?.map(s => s.name).join(', ') || 'None');

  // Get ALL historical metrics
  const { data: historicalMetrics } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        id,
        name,
        category,
        unit,
        scope
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2022-01-01')
    .lte('period_end', '2024-12-31')
    .order('period_start', { ascending: true });

  if (!historicalMetrics || historicalMetrics.length === 0) {
    console.log('No historical data found');
    return;
  }

  // Group by metric_id and site_id
  const metricGroups: any = {};
  historicalMetrics.forEach(m => {
    const key = `${m.metric_id}_${m.site_id || 'org'}`;
    if (!metricGroups[key]) {
      metricGroups[key] = {
        metric_id: m.metric_id,
        site_id: m.site_id,
        name: m.metrics_catalog?.name,
        category: m.metrics_catalog?.category,
        unit: m.unit || m.metrics_catalog?.unit,
        data: []
      };
    }
    metricGroups[key].data.push({
      period_start: m.period_start,
      value: m.value,
      co2e_emissions: m.co2e_emissions
    });
  });

  console.log(`\nFound ${Object.keys(metricGroups).length} unique metric-site combinations`);

  // Check what we already have for 2025
  const { data: existing2025 } = await supabase
    .from('metrics_data')
    .select('metric_id, site_id, period_start')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-08-31');

  const existingKeys = new Set(
    existing2025?.map(e => `${e.metric_id}_${e.site_id || 'org'}_${e.period_start.substring(0, 7)}`)
  );

  console.log(`Already have ${existingKeys.size} predictions for 2025`);

  // Generate predictions for ALL metrics for Jan-Aug 2025
  const predictions: any[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

  const summaryByMetric: any = {};

  Object.entries(metricGroups).forEach(([key, metric]: any) => {
    // Initialize summary
    if (!summaryByMetric[metric.name]) {
      summaryByMetric[metric.name] = {
        category: metric.category,
        unit: metric.unit,
        totalValue: 0,
        totalEmissions: 0,
        count: 0
      };
    }

    for (let month = 1; month <= 8; month++) {
      const monthStart = `2025-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(2025, month, 0).getDate();
      const monthEnd = `2025-${String(month).padStart(2, '0')}-${lastDay}`;

      // Skip if already exists
      const checkKey = `${metric.metric_id}_${metric.site_id || 'org'}_${monthStart.substring(0, 7)}`;
      if (existingKeys.has(checkKey)) {
        continue;
      }

      // Predict value
      const predictedValue = predictValue(metric.data, month);
      if (predictedValue === 0) continue; // Skip zero predictions

      // Calculate emissions based on historical ratio
      let predictedEmissions = 0;
      if (metric.data.length > 0) {
        const totalValue = metric.data.reduce((sum: number, d: any) => sum + d.value, 0);
        const totalEmissions = metric.data.reduce((sum: number, d: any) => sum + d.co2e_emissions, 0);
        if (totalValue > 0) {
          const emissionFactor = totalEmissions / totalValue;
          predictedEmissions = predictedValue * emissionFactor;
        }
      }

      predictions.push({
        metric_id: metric.metric_id,
        organization_id: '22647141-2ee4-4d8d-8b47-16b0cbd830b2',
        site_id: metric.site_id,
        period_start: monthStart,
        period_end: monthEnd,
        value: predictedValue,
        unit: metric.unit,
        co2e_emissions: predictedEmissions,
        data_quality: 'estimated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update summary
      summaryByMetric[metric.name].totalValue += predictedValue;
      summaryByMetric[metric.name].totalEmissions += predictedEmissions;
      summaryByMetric[metric.name].count += 1;
    }
  });

  // Display summary
  console.log('\n=== PREDICTION SUMMARY BY METRIC ===\n');
  Object.entries(summaryByMetric)
    .sort((a: any, b: any) => b[1].totalEmissions - a[1].totalEmissions)
    .forEach(([name, data]: any) => {
      if (data.count > 0) {
        console.log(`${name} [${data.category}]:`);
        console.log(`  Total: ${data.totalValue.toLocaleString()} ${data.unit}`);
        console.log(`  Emissions: ${Math.round(data.totalEmissions / 1000)} tCO2e`);
        console.log(`  Records: ${data.count}`);
        console.log('');
      }
    });

  const totalEmissions = Object.values(summaryByMetric)
    .reduce((sum: number, data: any) => sum + data.totalEmissions, 0) / 1000;

  console.log(`\nTOTAL PREDICTED EMISSIONS: ${Math.round(totalEmissions).toLocaleString()} tCO2e`);
  console.log(`NEW PREDICTIONS TO INSERT: ${predictions.length} records`);

  // Check site distribution
  const bySite: any = {};
  predictions.forEach(p => {
    const siteName = p.site_id || 'Organization-level';
    if (!bySite[siteName]) bySite[siteName] = 0;
    bySite[siteName]++;
  });

  console.log('\n=== PREDICTIONS BY SITE ===');
  Object.entries(bySite).forEach(([site, count]) => {
    console.log(`${site}: ${count} records`);
  });

  if (process.argv.includes('--insert')) {
    console.log('\nInserting predictions into database...');

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < predictions.length; i += batchSize) {
      const batch = predictions.slice(i, i + batchSize);
      const { error } = await supabase
        .from('metrics_data')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        break;
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${inserted}/${predictions.length}`);
      }
    }

    console.log(`\n✅ Successfully inserted ${inserted} predictions for 2025!`);
  } else {
    console.log('\nTo insert predictions, run: npx tsx predict-2025-complete.ts --insert');
  }
}

generateCompletePredictions().catch(console.error);