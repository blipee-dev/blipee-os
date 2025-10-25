import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function forecast2025EnergyBySource() {
  console.log('🔮 Forecasting 2025 Energy Consumption by Source using Enterprise ML Model\n');
  console.log('=' .repeat(80));

  try {
    // Get all energy-related metrics
    const { data: energyMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .in('category', ['Purchased Energy', 'Electricity', 'Stationary Combustion', 'Mobile Combustion']);

    if (!energyMetrics) {
      console.log('❌ No energy metrics found');
      return;
    }

    console.log(`\n📊 Found ${energyMetrics.length} energy metrics\n`);

    // Get historical data (last 36 months for good ML training)
    const historicalStartDate = new Date('2022-01-01');
    const { data: historicalData } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', energyMetrics.map(m => m.id))
      .gte('period_start', historicalStartDate.toISOString().split('T')[0])
      .lte('period_start', '2024-12-31')
      .order('period_start', { ascending: true });

    if (!historicalData || historicalData.length === 0) {
      console.log('❌ No historical data found');
      return;
    }

    console.log(`📈 Loaded ${historicalData.length} historical records\n`);

    // Group by source and month
    const sourceData: { [source: string]: { [monthKey: string]: number } } = {};

    historicalData.forEach((record: any) => {
      const metric = energyMetrics.find(m => m.id === record.metric_id);
      if (!metric) return;

      const source = metric.name;
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const consumption = parseFloat(record.value) || 0;

      if (!sourceData[source]) {
        sourceData[source] = {};
      }

      if (!sourceData[source][monthKey]) {
        sourceData[source][monthKey] = 0;
      }

      sourceData[source][monthKey] += consumption;
    });

    // Generate 2025 forecasts for each source
    const results: any = {};
    const monthsToForecast = 12; // All 12 months of 2025

    console.log('🔮 Generating ML forecasts for each energy source...\n');
    console.log('=' .repeat(80));

    for (const [source, monthlyData] of Object.entries(sourceData)) {
      const months = Object.keys(monthlyData).sort();

      if (months.length < 12) {
        console.log(`⚠️  ${source}: Insufficient data (${months.length} months) - skipping\n`);
        continue;
      }

      const timeSeries = months.map(monthKey => ({
        month: monthKey,
        emissions: monthlyData[monthKey]
      }));

      // Use Enterprise Forecast ML model
      const forecast = EnterpriseForecast.forecast(timeSeries, monthsToForecast, false);

      // Build 2025 monthly forecast
      const forecast2025: any = {};
      for (let month = 1; month <= 12; month++) {
        const monthKey = `2025-${String(month).padStart(2, '0')}`;
        const forecastIndex = month - 1;
        forecast2025[monthKey] = {
          value: forecast.forecasted[forecastIndex] || 0,
          lower: forecast.confidence.lower[forecastIndex] || 0,
          upper: forecast.confidence.upper[forecastIndex] || 0
        };
      }

      results[source] = {
        forecast: forecast2025,
        method: forecast.method,
        metadata: forecast.metadata,
        historicalMonths: months.length,
        totalForecast: forecast.forecasted.reduce((sum, val) => sum + val, 0),
        avgMonthly: forecast.forecasted.reduce((sum, val) => sum + val, 0) / 12
      };

      // Display results
      console.log(`\n📊 ${source}`);
      console.log(`   Method: ${forecast.method}`);
      console.log(`   R²: ${forecast.metadata.r2.toFixed(3)}`);
      console.log(`   Trend: ${forecast.metadata.trendSlope.toFixed(2)} kWh/month`);
      console.log(`   Volatility: ${forecast.metadata.volatility.toFixed(2)}`);
      console.log(`   Historical Data: ${months.length} months`);
      console.log(`   2025 Total Forecast: ${(results[source].totalForecast / 1000).toFixed(1)} MWh`);
      console.log(`   2025 Avg Monthly: ${(results[source].avgMonthly / 1000).toFixed(1)} MWh`);
      console.log(`\n   Monthly Breakdown (kWh):`);

      Object.entries(forecast2025).forEach(([monthKey, data]: [string, any]) => {
        const monthName = new Date(monthKey + '-01').toLocaleString('default', { month: 'short' });
        console.log(`      ${monthName} 2025: ${(data.value / 1000).toFixed(1)} MWh (±${((data.upper - data.lower) / 2000).toFixed(1)} MWh)`);
      });

      console.log('\n' + '-'.repeat(80));
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 2025 TOTAL ENERGY FORECAST SUMMARY');
    console.log('='.repeat(80) + '\n');

    const totalAnnual = Object.values(results).reduce((sum: number, r: any) => sum + r.totalForecast, 0);
    const totalMonthlyAvg = totalAnnual / 12;

    console.log(`   Total 2025 Forecast: ${(totalAnnual / 1000).toFixed(1)} MWh`);
    console.log(`   Average Monthly: ${(totalMonthlyAvg / 1000).toFixed(1)} MWh`);
    console.log(`\n   By Source:`);

    Object.entries(results)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b.totalForecast - a.totalForecast)
      .forEach(([source, data]: [string, any]) => {
        const percentage = (data.totalForecast / totalAnnual) * 100;
        console.log(`      ${source}: ${(data.totalForecast / 1000).toFixed(1)} MWh (${percentage.toFixed(1)}%)`);
      });

    // Monthly totals
    console.log(`\n   Monthly Totals (MWh):`);
    for (let month = 1; month <= 12; month++) {
      const monthKey = `2025-${String(month).padStart(2, '0')}`;
      const monthName = new Date(monthKey + '-01').toLocaleString('default', { month: 'short' });
      const monthTotal = Object.values(results).reduce((sum: number, r: any) => {
        return sum + (r.forecast[monthKey]?.value || 0);
      }, 0);
      console.log(`      ${monthName} 2025: ${(monthTotal / 1000).toFixed(1)} MWh`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Forecast complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forecast2025EnergyBySource();
