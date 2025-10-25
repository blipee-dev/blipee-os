import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const problemSiteId = 'dccb2397-6731-4f4d-bd43-992c598bd0ce';

async function traceWasteIncinerated() {
  console.log('🔍 DETAILED TRACE: Waste Incinerated Forecast Bug\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Step 1: Find the metric ID for "Waste Incinerated"
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .ilike('name', '%Waste%Incinerated%');

  if (!metrics || metrics.length === 0) {
    console.log('❌ Metric not found');
    return;
  }

  const metric = metrics[0];
  console.log(`📊 Metric Found:`);
  console.log(`   ID: ${metric.id}`);
  console.log(`   Name: ${metric.name}`);
  console.log(`   Unit: ${metric.unit}`);
  console.log(`   Category: ${metric.category}\n`);

  // Step 2: Get historical data (exactly as regeneration script does)
  console.log('📥 Step 2: Fetching Historical Data (2022-01-01 to 2025-09-30)...\n');

  const { data: historicalData } = await supabase
    .from('metrics_data')
    .select('metric_id, site_id, period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', metric.id)
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-10-01')
    .order('period_start', { ascending: true });

  if (!historicalData) {
    console.log('❌ No historical data found');
    return;
  }

  console.log(`Total records fetched: ${historicalData.length}\n`);

  // Step 3: Deduplicate (exactly as regeneration script does)
  console.log('🔄 Step 3: Deduplicating...\n');

  const seen = new Set<string>();
  const uniqueData = historicalData.filter(r => {
    const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
    if (seen.has(key)) {
      console.log(`   ⚠️  Duplicate found: ${r.period_start} - site ${r.site_id?.substring(0, 8)}`);
      return false;
    }
    seen.add(key);
    return true;
  });

  console.log(`Unique records after deduplication: ${uniqueData.length}\n`);

  // Step 4: Filter to problem site
  console.log('🎯 Step 4: Filtering to Problem Site (dccb2397)...\n');

  const siteData = uniqueData.filter(r => r.site_id === problemSiteId);
  console.log(`Records for site dccb2397: ${siteData.length}\n`);

  if (siteData.length === 0) {
    console.log('❌ No data for this site!');
    return;
  }

  // Show all records for this site
  console.log('All records for site dccb2397:');
  console.log('Date          Value       CO2e Emissions');
  console.log('-'.repeat(50));
  siteData.forEach(r => {
    console.log(`${r.period_start}  ${String(r.value || 0).padStart(10)} ${String(r.co2e_emissions || 0).padStart(15)}`);
  });
  console.log('');

  // Step 5: Aggregate by month (exactly as regeneration script does)
  console.log('📊 Step 5: Aggregating by Month...\n');

  const monthlyData = new Map<string, { value: number, emissions: number, count: number }>();
  siteData.forEach(r => {
    const month = r.period_start.substring(0, 7);
    const value = r.co2e_emissions || r.value || 0; // THIS IS THE KEY LINE

    if (!monthlyData.has(month)) {
      monthlyData.set(month, { value: 0, emissions: 0, count: 0 });
    }

    const current = monthlyData.get(month)!;
    current.value += value;
    current.emissions += (r.co2e_emissions || 0);
    current.count++;
  });

  console.log('Monthly aggregated data:');
  console.log('Month       Aggregated Value  CO2e Sum  Record Count');
  console.log('-'.repeat(65));

  const months = Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));

  months.forEach(([month, data]) => {
    console.log(`${month}    ${data.value.toFixed(2).padStart(16)}  ${data.emissions.toFixed(2).padStart(8)}  ${String(data.count).padStart(12)}`);
  });
  console.log('');

  // Step 6: Prepare data for model (exactly as regeneration script does)
  console.log('🤖 Step 6: Preparing Data for EnterpriseForecast Model...\n');

  const modelInput = months.map(([month, data]) => ({
    month,
    emissions: data.value // Using aggregated value
  }));

  console.log('Input to EnterpriseForecast.forecast():');
  console.log('Month       Emissions (model input)');
  console.log('-'.repeat(40));
  modelInput.slice(-12).forEach(m => {
    console.log(`${m.month}    ${m.emissions.toFixed(2)}`);
  });
  console.log('');

  // Step 7: Run the forecast
  console.log('🎯 Step 7: Running EnterpriseForecast.forecast()...\n');

  const forecast = EnterpriseForecast.forecast(modelInput, 3, true);

  console.log('📈 Forecast Results:');
  console.log(`   Oct 2025: ${forecast.forecasted[0].toFixed(2)} kg CO2e`);
  console.log(`   Nov 2025: ${forecast.forecasted[1].toFixed(2)} kg CO2e`);
  console.log(`   Dec 2025: ${forecast.forecasted[2].toFixed(2)} kg CO2e`);
  console.log(`   Method: ${forecast.method}`);
  console.log(`   R²: ${forecast.metadata.r2?.toFixed(4) || 'N/A'}`);
  console.log(`   Trend Slope: ${forecast.metadata.trendSlope?.toFixed(4) || 'N/A'}\n`);

  // Step 8: Compare with stored forecast
  console.log('🔍 Step 8: Comparing with Stored Forecast in Database...\n');

  const { data: storedForecast } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', metric.id)
    .eq('site_id', problemSiteId)
    .gte('period_start', '2025-10-01')
    .lte('period_start', '2025-12-31')
    .order('period_start', { ascending: true });

  if (storedForecast && storedForecast.length > 0) {
    console.log('Stored forecast in database:');
    console.log('Month       Value          CO2e Emissions');
    console.log('-'.repeat(50));
    storedForecast.forEach(r => {
      console.log(`${r.period_start}  ${String(r.value).padStart(13)}  ${String(r.co2e_emissions).padStart(15)}`);
    });
    console.log('');

    console.log('⚖️  COMPARISON:');
    console.log('Month       Expected (model)   Stored (DB)     Ratio');
    console.log('-'.repeat(65));
    forecast.forecasted.forEach((expected, i) => {
      const stored = storedForecast[i]?.co2e_emissions || 0;
      const ratio = expected > 0 ? stored / expected : 0;
      console.log(`${['Oct', 'Nov', 'Dec'][i]} 2025    ${expected.toFixed(2).padStart(16)}  ${stored.toFixed(2).padStart(13)}  ${ratio.toFixed(1).padStart(10)}x`);
    });
  } else {
    console.log('⚠️  No stored forecast found in database!');
  }

  // Step 9: Analysis
  console.log('\n📋 ANALYSIS:\n');

  const sepValue = monthlyData.get('2025-09')?.value || 0;
  const octForecast = forecast.forecasted[0];
  const octStored = storedForecast?.[0]?.co2e_emissions || 0;

  console.log(`September 2025 actual: ${sepValue.toFixed(2)} kg CO2e`);
  console.log(`October model output: ${octForecast.toFixed(2)} kg CO2e`);
  console.log(`October stored in DB: ${octStored.toFixed(2)} kg CO2e`);
  console.log(`\nModel reasonableness: ${(octForecast / sepValue).toFixed(1)}x of September`);
  console.log(`Stored inflation: ${(octStored / sepValue).toFixed(1)}x of September`);

  if (octStored > octForecast * 10) {
    console.log('\n❌ CRITICAL BUG: Stored value is 10x+ higher than model output!');
    console.log('   This indicates a bug in the storage/insertion logic.');
  } else if (octForecast > sepValue * 10) {
    console.log('\n❌ CRITICAL BUG: Model is producing unrealistic forecasts!');
    console.log('   This indicates a bug in the model input preparation.');
  }
}

traceWasteIncinerated().catch(console.error);
