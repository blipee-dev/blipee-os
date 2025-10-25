import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const problemSiteId = 'dccb2397-6731-4f4d-bd43-992c598bd0ce';

async function traceSingleMetric() {
  console.log('🔍 Tracing a Single Metric Forecast for Problem Site\n');

  // Get a metric from the problem site
  const { data: sampleRecord } = await supabase
    .from('metrics_data')
    .select('metric_id, metrics_catalog(name)')
    .eq('organization_id', organizationId)
    .eq('site_id', problemSiteId)
    .gte('period_start', '2025-09-01')
    .lt('period_start', '2025-10-01')
    .limit(1)
    .single();

  if (!sampleRecord) {
    console.log('No sample record found');
    return;
  }

  const metricId = sampleRecord.metric_id;
  console.log(`Analyzing metric: ${sampleRecord.metrics_catalog?.name}`);
  console.log(`Metric ID: ${metricId}\n`);

  // Get ALL historical data for this metric + site from 2022
  const { data: historicalData } = await supabase
    .from('metrics_data')
    .select('metric_id, site_id, period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', metricId)
    .eq('site_id', problemSiteId)
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-10-01')
    .order('period_start', { ascending: true });

  if (!historicalData) return;

  // Deduplicate
  const seen = new Set<string>();
  const uniqueData = historicalData.filter(r => {
    const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`Historical records: ${historicalData.length} total, ${uniqueData.length} unique\n`);

  // Group by month (THIS IS WHAT THE SCRIPT DOES)
  const monthlyData = new Map<string, number>();
  uniqueData.forEach(r => {
    const month = r.period_start.substring(0, 7);
    const value = r.co2e_emissions || r.value || 0;
    monthlyData.set(month, (monthlyData.get(month) || 0) + value);
  });

  const months = Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, emissions]) => ({ month, emissions }));

  console.log('Monthly aggregated data for forecasting:');
  console.log('Month       Value (kg CO2e)');
  console.log('-'.repeat(40));
  months.slice(-12).forEach(m => {
    console.log(`${m.month}    ${m.emissions.toFixed(2)}`);
  });

  // Run forecast
  console.log('\n🤖 Running EnterpriseForecast...\n');
  const forecast = EnterpriseForecast.forecast(months, 3, true);

  console.log('\n📊 Forecast Results:');
  console.log(`Oct 2025: ${forecast.forecasted[0].toFixed(2)} kg CO2e`);
  console.log(`Nov 2025: ${forecast.forecasted[1].toFixed(2)} kg CO2e`);
  console.log(`Dec 2025: ${forecast.forecasted[2].toFixed(2)} kg CO2e`);
  console.log(`\nTotal forecast: ${forecast.forecasted.reduce((a, b) => a + b, 0).toFixed(2)} kg CO2e`);

  // Compare with actual September
  const sepValue = monthlyData.get('2025-09') || 0;
  console.log(`\nSeptember actual: ${sepValue.toFixed(2)} kg CO2e`);
  console.log(`October forecast: ${forecast.forecasted[0].toFixed(2)} kg CO2e`);
  console.log(`Ratio: ${(forecast.forecasted[0] / sepValue).toFixed(1)}x`);
}

traceSingleMetric().catch(console.error);
