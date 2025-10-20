const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.com';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function calculate2025Projections() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('\n📊 2025 ENERGY CONSUMPTION PROJECTION ANALYSIS\n');
  console.log('='.repeat(100));

  // Get energy categories
  const energyCategories = [
    'Electricity', 'Purchased Energy', 'Purchased Heating', 'Purchased Cooling', 'Purchased Steam',
    'Natural Gas', 'Heating Oil', 'Diesel', 'Gasoline', 'Propane',
    'District Heating', 'District Cooling', 'Steam'
  ];

  // 1. Get all energy metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('id, name, category, scope, unit')
    .in('category', energyCategories)
    .in('scope', ['scope_1', 'scope_2']);

  if (metricsError) {
    console.error('Error fetching metrics:', metricsError);
    return;
  }

  console.log(`\nFound ${metrics.length} energy metrics across ${energyCategories.length} categories\n`);

  // 2. Get 2025 YTD data
  const metricIds = metrics.map(m => m.id);
  const { data: ytdData, error: ytdError } = await supabase
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  if (ytdError) {
    console.error('Error fetching YTD data:', ytdError);
    return;
  }

  console.log(`Found ${ytdData.length} data records for 2025 YTD\n`);

  // 3. Aggregate by metric and calculate projections
  const metricAggregates = new Map();

  ytdData.forEach(record => {
    if (!metricAggregates.has(record.metric_id)) {
      metricAggregates.set(record.metric_id, {
        totalValue: 0,
        totalEmissions: 0,
        months: new Set()
      });
    }

    const agg = metricAggregates.get(record.metric_id);
    agg.totalValue += parseFloat(record.value || 0);
    agg.totalEmissions += parseFloat(record.co2e_emissions || 0);

    // Track unique months
    const monthKey = record.period_start.substring(0, 7); // YYYY-MM
    agg.months.add(monthKey);
  });

  // 4. Calculate projections by category
  const categoryResults = new Map();

  metrics.forEach(metric => {
    const agg = metricAggregates.get(metric.id);

    if (!agg) return; // Skip metrics with no data

    const monthsWithData = agg.months.size;
    const ytdConsumption = agg.totalValue;
    const ytdEmissions = agg.totalEmissions;

    // Project annual values
    const projectedAnnualConsumption = monthsWithData > 0 && monthsWithData < 12
      ? (ytdConsumption / monthsWithData) * 12
      : ytdConsumption;

    const projectedAnnualEmissions = monthsWithData > 0 && monthsWithData < 12
      ? (ytdEmissions / monthsWithData) * 12
      : ytdEmissions;

    // Group by category
    if (!categoryResults.has(metric.category)) {
      categoryResults.set(metric.category, {
        category: metric.category,
        metrics: [],
        totalYtd: 0,
        totalProjected: 0,
        totalYtdEmissions: 0,
        totalProjectedEmissions: 0
      });
    }

    const catResult = categoryResults.get(metric.category);
    catResult.metrics.push({
      name: metric.name,
      unit: metric.unit,
      scope: metric.scope,
      monthsWithData,
      ytdConsumption: Math.round(ytdConsumption * 100) / 100,
      projectedAnnual: Math.round(projectedAnnualConsumption * 100) / 100,
      ytdEmissions: Math.round(ytdEmissions / 1000 * 10) / 10, // Convert kg to tCO2e
      projectedEmissions: Math.round(projectedAnnualEmissions / 1000 * 10) / 10
    });

    catResult.totalYtd += ytdConsumption;
    catResult.totalProjected += projectedAnnualConsumption;
    catResult.totalYtdEmissions += ytdEmissions;
    catResult.totalProjectedEmissions += projectedAnnualEmissions;
  });

  // 5. Display results by category
  Array.from(categoryResults.values()).forEach(catResult => {
    console.log(`\n📁 ${catResult.category.toUpperCase()}`);
    console.log('-'.repeat(100));

    catResult.metrics.forEach(metric => {
      console.log(`\n  ${metric.name} (${metric.scope})`);
      console.log(`    Months with data: ${metric.monthsWithData}`);
      console.log(`    YTD (Jan-Oct 2025): ${metric.ytdConsumption} ${metric.unit}`);
      console.log(`    Projected Annual 2025: ${metric.projectedAnnual} ${metric.unit}`);
      console.log(`    YTD Emissions: ${metric.ytdEmissions} tCO2e`);
      console.log(`    Projected Annual Emissions: ${metric.projectedEmissions} tCO2e`);
    });

    console.log(`\n  📊 CATEGORY TOTALS:`);
    console.log(`    YTD Consumption: ${Math.round(catResult.totalYtd * 100) / 100} (mixed units)`);
    console.log(`    Projected Annual Consumption: ${Math.round(catResult.totalProjected * 100) / 100} (mixed units)`);
    console.log(`    YTD Emissions: ${Math.round(catResult.totalYtdEmissions / 1000 * 10) / 10} tCO2e`);
    console.log(`    Projected Annual Emissions: ${Math.round(catResult.totalProjectedEmissions / 1000 * 10) / 10} tCO2e`);
  });

  // 6. Overall summary
  let overallYtd = 0;
  let overallProjected = 0;
  let overallYtdEmissions = 0;
  let overallProjectedEmissions = 0;

  categoryResults.forEach(catResult => {
    overallYtd += catResult.totalYtd;
    overallProjected += catResult.totalProjected;
    overallYtdEmissions += catResult.totalYtdEmissions;
    overallProjectedEmissions += catResult.totalProjectedEmissions;
  });

  console.log('\n' + '='.repeat(100));
  console.log('\n🎯 OVERALL ENERGY SUMMARY (All Categories Combined)');
  console.log(`  YTD Consumption (Jan-Oct 2025): ${Math.round(overallYtd * 100) / 100} (mixed units)`);
  console.log(`  Projected Annual Consumption 2025: ${Math.round(overallProjected * 100) / 100} (mixed units)`);
  console.log(`  YTD Emissions: ${Math.round(overallYtdEmissions / 1000 * 10) / 10} tCO2e`);
  console.log(`  Projected Annual Emissions 2025: ${Math.round(overallProjectedEmissions / 1000 * 10) / 10} tCO2e`);
  console.log('\n' + '='.repeat(100) + '\n');
}

calculate2025Projections().catch(console.error);
