/**
 * Get 2025 Emissions Forecast using ML Model
 * Uses Supabase service role key to bypass auth
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Fetch all metrics data with pagination
 */
async function fetchAllMetricsData(organizationId, startDate, endDate) {
  let allData = [];
  let rangeStart = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batchData, error } = await supabaseAdmin
      .from('metrics_data')
      .select('metric_id, value, co2e_emissions, period_start, scope')
      .eq('organization_id', organizationId)
      .gte('period_start', startDate)
      .lte('period_start', endDate)
      .order('period_start', { ascending: true })
      .range(rangeStart, rangeStart + batchSize - 1);

    if (error || !batchData || batchData.length === 0) {
      hasMore = false;
      break;
    }

    allData = allData.concat(batchData);

    if (batchData.length < batchSize) {
      hasMore = false;
    } else {
      rangeStart += batchSize;
    }
  }

  return allData;
}

/**
 * Get monthly emissions aggregated by scope
 */
async function getMonthlyEmissions(organizationId, startDate, endDate) {
  console.log(`📊 Fetching data from ${startDate} to ${endDate}...`);

  const metricsData = await fetchAllMetricsData(organizationId, startDate, endDate);

  console.log(`✅ Fetched ${metricsData.length} records`);

  // Group by month and scope
  const monthlyData = {};

  metricsData.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        scope_1: 0,
        scope_2: 0,
        scope_3: 0,
        emissions: 0
      };
    }

    const emissions = parseFloat(record.co2e_emissions) || 0;
    const emissionsInTonnes = emissions / 1000; // Convert kg to tonnes

    // Add to scope-specific totals
    if (record.scope === 1) {
      monthlyData[monthKey].scope_1 += emissionsInTonnes;
    } else if (record.scope === 2) {
      monthlyData[monthKey].scope_2 += emissionsInTonnes;
    } else if (record.scope === 3) {
      monthlyData[monthKey].scope_3 += emissionsInTonnes;
    }

    monthlyData[monthKey].emissions += emissionsInTonnes;
  });

  // Convert to array and sort
  const result = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  return result;
}

/**
 * Simple Enterprise Forecast (Seasonal Decomposition)
 * Simplified version of the full EnterpriseForecast
 */
function simpleSeasonalForecast(historicalData, monthsToForecast) {
  const values = historicalData.map(d => d.emissions * 1000); // Convert to kg
  const n = values.length;

  if (n < 12) {
    console.log('⚠️ Not enough data for seasonal decomposition');
    return { forecasted: Array(monthsToForecast).fill(0), method: 'insufficient-data' };
  }

  // Calculate trend (linear regression)
  const indices = Array.from({ length: n }, (_, i) => i);
  const meanX = indices.reduce((a, b) => a + b) / n;
  const meanY = values.reduce((a, b) => a + b) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (indices[i] - meanX) * (values[i] - meanY);
    denominator += Math.pow(indices[i] - meanX, 2);
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  console.log(`📈 Trend: slope=${slope.toFixed(2)}, intercept=${intercept.toFixed(2)}`);

  // Calculate seasonality (12-month pattern)
  const seasonality = Array(12).fill(0);
  const seasonalCounts = Array(12).fill(0);

  for (let i = 0; i < n; i++) {
    const detrended = values[i] - (slope * i + intercept);
    const monthIndex = i % 12;
    seasonality[monthIndex] += detrended;
    seasonalCounts[monthIndex]++;
  }

  // Average seasonal components
  for (let i = 0; i < 12; i++) {
    if (seasonalCounts[i] > 0) {
      seasonality[i] /= seasonalCounts[i];
    }
  }

  console.log(`🌊 Seasonality pattern (12 months):`, seasonality.map(s => s.toFixed(1)));

  // Generate forecast
  const forecasted = [];
  for (let i = 0; i < monthsToForecast; i++) {
    const futureIndex = n + i;
    const trend = slope * futureIndex + intercept;
    const seasonal = seasonality[futureIndex % 12];
    const predicted = trend + seasonal;
    forecasted.push(Math.max(0, predicted)); // No negative emissions
  }

  return {
    forecasted,
    method: 'seasonal-decomposition',
    trend: { slope, intercept },
    seasonality
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting 2025 Emissions Forecast...\n');

  // Get all historical data from 2020
  const historicalData = await getMonthlyEmissions(
    ORG_ID,
    '2020-01-01',
    '2025-07-31'
  );

  console.log(`\n📊 Historical Data Summary:`);
  console.log(`   Total months: ${historicalData.length}`);
  console.log(`   Date range: ${historicalData[0]?.month} to ${historicalData[historicalData.length - 1]?.month}`);

  const totalHistorical = historicalData.reduce((sum, m) => sum + m.emissions, 0);
  console.log(`   Total historical emissions: ${totalHistorical.toFixed(1)} tCO2e\n`);

  // Show last few months
  console.log('📅 Last 5 months of actual data:');
  historicalData.slice(-5).forEach(m => {
    console.log(`   ${m.month}: ${m.emissions.toFixed(1)} tCO2e (S1: ${m.scope_1.toFixed(1)}, S2: ${m.scope_2.toFixed(1)}, S3: ${m.scope_3.toFixed(1)})`);
  });

  // Forecast Aug-Dec 2025 (5 months)
  console.log('\n🔬 Running ML Forecast Model...\n');

  const totalForecast = simpleSeasonalForecast(historicalData, 5);

  console.log(`✅ Forecast Model: ${totalForecast.method}\n`);

  // Forecast by scope
  const scope1Historical = historicalData.map(m => ({ month: m.month, emissions: m.scope_1 }));
  const scope2Historical = historicalData.map(m => ({ month: m.month, emissions: m.scope_2 }));
  const scope3Historical = historicalData.map(m => ({ month: m.month, emissions: m.scope_3 }));

  const scope1Forecast = simpleSeasonalForecast(scope1Historical, 5);
  const scope2Forecast = simpleSeasonalForecast(scope2Historical, 5);
  const scope3Forecast = simpleSeasonalForecast(scope3Historical, 5);

  // Display forecast
  const months = ['Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25'];

  console.log('\n📊 2025 Forecast (Aug-Dec):');
  console.log('─'.repeat(80));

  let totalForecastSum = 0;

  months.forEach((month, i) => {
    const total = totalForecast.forecasted[i] / 1000; // Convert to tonnes
    const s1 = scope1Forecast.forecasted[i] / 1000;
    const s2 = scope2Forecast.forecasted[i] / 1000;
    const s3 = scope3Forecast.forecasted[i] / 1000;

    totalForecastSum += total;

    console.log(`   ${month}: ${total.toFixed(1)} tCO2e (S1: ${s1.toFixed(1)}, S2: ${s2.toFixed(1)}, S3: ${s3.toFixed(1)})`);
  });

  console.log('─'.repeat(80));
  console.log(`   TOTAL FORECAST (Aug-Dec 2025): ${totalForecastSum.toFixed(1)} tCO2e`);
  console.log('─'.repeat(80));

  // Calculate full year projection
  const actualJanJul = historicalData
    .filter(m => m.month.startsWith('2025-'))
    .reduce((sum, m) => sum + m.emissions, 0);

  const fullYear2025 = actualJanJul + totalForecastSum;

  console.log(`\n📊 Full Year 2025 Projection:`);
  console.log(`   Jan-Jul 2025 (actual): ${actualJanJul.toFixed(1)} tCO2e`);
  console.log(`   Aug-Dec 2025 (forecast): ${totalForecastSum.toFixed(1)} tCO2e`);
  console.log(`   Full Year 2025: ${fullYear2025.toFixed(1)} tCO2e\n`);
}

main().catch(console.error);
