// Simple fetch script to get 2025 projection data
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.com';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function main() {
  console.log('\n📊 2025 ENERGY CONSUMPTION PROJECTION\n');
  console.log('='.repeat(100));

  // 1. Get energy metrics
  const metricsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/metrics_catalog?category=in.(Electricity,Purchased%20Energy,Natural%20Gas)&scope=in.(scope_1,scope_2)&select=id,name,category,scope,unit`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const metrics = await metricsRes.json();

  console.log(`\nFound ${metrics.length} metrics\n`);

  // 2. Get 2025 data for these metrics
  const metricIds = metrics.map(m => m.id).join(',');
  const dataRes = await fetch(
    `${SUPABASE_URL}/rest/v1/metrics_data?organization_id=eq.${ORG_ID}&metric_id=in.(${metricIds})&period_start=gte.2025-01-01&period_start=lt.2026-01-01&select=metric_id,value,co2e_emissions,period_start`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const data = await dataRes.json();

  console.log(`Found ${data.length} data records\n`);

  // 3. Aggregate by metric
  const metricMap = new Map();
  data.forEach(record => {
    if (!metricMap.has(record.metric_id)) {
      metricMap.set(record.metric_id, {
        value: 0,
        emissions: 0,
        months: new Set()
      });
    }
    const m = metricMap.get(record.metric_id);
    m.value += parseFloat(record.value || 0);
    m.emissions += parseFloat(record.co2e_emissions || 0);
    m.months.add(record.period_start.substring(0, 7));
  });

  // 4. Calculate projections
  const byCategory = new Map();

  metrics.forEach(metric => {
    const metricData = metricMap.get(metric.id);
    if (!metricData) return;

    const months = metricData.months.size;
    const ytd = metricData.value;
    const ytdEmissions = metricData.emissions;
    const projected = months > 0 && months < 12 ? (ytd / months) * 12 : ytd;
    const projectedEmissions = months > 0 && months < 12 ? (ytdEmissions / months) * 12 : ytdEmissions;

    if (!byCategory.has(metric.category)) {
      byCategory.set(metric.category, {
        metrics: [],
        totalYtd: 0,
        totalProjected: 0,
        totalYtdEmissions: 0,
        totalProjectedEmissions: 0
      });
    }

    const cat = byCategory.get(metric.category);
    cat.metrics.push({
      name: metric.name,
      unit: metric.unit,
      scope: metric.scope,
      months,
      ytd: Math.round(ytd * 100) / 100,
      projected: Math.round(projected * 100) / 100,
      ytdEmissions: Math.round(ytdEmissions / 1000 * 10) / 10,
      projectedEmissions: Math.round(projectedEmissions / 1000 * 10) / 10
    });
    cat.totalYtd += ytd;
    cat.totalProjected += projected;
    cat.totalYtdEmissions += ytdEmissions;
    cat.totalProjectedEmissions += projectedEmissions;
  });

  // 5. Display results
  let grandTotalYtd = 0;
  let grandTotalProjected = 0;
  let grandTotalYtdEmissions = 0;
  let grandTotalProjectedEmissions = 0;

  Array.from(byCategory.entries()).forEach(([category, data]) => {
    console.log(`\n📁 ${category.toUpperCase()}`);
    console.log('-'.repeat(100));

    data.metrics.forEach(m => {
      console.log(`\n  ${m.name} (${m.scope})`);
      console.log(`    Months with data: ${m.months}`);
      console.log(`    YTD (Jan-Oct 2025): ${m.ytd} ${m.unit}`);
      console.log(`    Projected Annual 2025: ${m.projected} ${m.unit}`);
      console.log(`    YTD Emissions: ${m.ytdEmissions} tCO2e`);
      console.log(`    Projected Emissions: ${m.projectedEmissions} tCO2e`);
    });

    console.log(`\n  📊 CATEGORY TOTALS:`);
    console.log(`    YTD Consumption: ${Math.round(data.totalYtd * 100) / 100}`);
    console.log(`    Projected Consumption: ${Math.round(data.totalProjected * 100) / 100}`);
    console.log(`    YTD Emissions: ${Math.round(data.totalYtdEmissions / 1000 * 10) / 10} tCO2e`);
    console.log(`    Projected Emissions: ${Math.round(data.totalProjectedEmissions / 1000 * 10) / 10} tCO2e`);

    grandTotalYtd += data.totalYtd;
    grandTotalProjected += data.totalProjected;
    grandTotalYtdEmissions += data.totalYtdEmissions;
    grandTotalProjectedEmissions += data.totalProjectedEmissions;
  });

  console.log('\n' + '='.repeat(100));
  console.log('\n🎯 OVERALL SUMMARY');
  console.log(`  Total YTD Consumption: ${Math.round(grandTotalYtd * 100) / 100} (mixed units)`);
  console.log(`  Total Projected 2025: ${Math.round(grandTotalProjected * 100) / 100} (mixed units)`);
  console.log(`  Total YTD Emissions: ${Math.round(grandTotalYtdEmissions / 1000 * 10) / 10} tCO2e`);
  console.log(`  Total Projected Emissions 2025: ${Math.round(grandTotalProjectedEmissions / 1000 * 10) / 10} tCO2e`);
  console.log('\n' + '='.repeat(100) + '\n');
}

main().catch(console.error);
