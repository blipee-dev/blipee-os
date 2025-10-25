import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function calculateAllTimeEmissions() {
  console.log('📊 ALL-TIME EMISSIONS ANALYSIS\n');
  console.log('=====================================\n');

  // Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  // Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, total_area_sqm')
    .eq('organization_id', plmj!.id)
    .order('name');

  const totalArea = sites?.reduce((sum, s) => sum + (s.total_area_sqm || 0), 0) || 0;

  // Get ALL emissions data (no date filter)
  const { data: allEmissions } = await supabase
    .from('metrics_data')
    .select('site_id, co2e_emissions, period_start, period_end')
    .eq('organization_id', plmj!.id)
    .not('site_id', 'is', null)
    .order('period_start');

  console.log('📅 Date Range:');
  if (allEmissions && allEmissions.length > 0) {
    const firstDate = allEmissions[0].period_start;
    const lastDate = allEmissions[allEmissions.length - 1].period_end;
    console.log(`   From: ${firstDate}`);
    console.log(`   To: ${lastDate}`);
  }

  console.log(`\n📍 Sites: ${sites?.map(s => s.name).join(', ')}`);
  console.log(`📐 Total area: ${totalArea.toLocaleString()} m²`);
  console.log(`📊 Total data points: ${allEmissions?.length || 0}\n`);

  // Calculate all-time totals
  let allTimeTotal = 0;
  const siteAllTimeTotals: any = {};

  for (const site of sites || []) {
    const siteEmissions = allEmissions?.filter(e => e.site_id === site.id) || [];
    const siteTotalKg = siteEmissions.reduce((sum, e) => sum + (e.co2e_emissions || 0), 0);
    siteAllTimeTotals[site.name] = {
      total: siteTotalKg / 1000, // tons
      dataPoints: siteEmissions.length,
      intensity: site.total_area_sqm ? siteTotalKg / site.total_area_sqm : 0
    };
    allTimeTotal += siteTotalKg;
  }

  const allTimeTotalTons = allTimeTotal / 1000;
  const allTimeIntensity = totalArea > 0 ? allTimeTotal / totalArea : 0;

  console.log('🌍 ALL-TIME TOTALS:\n');
  console.log(`   Total emissions: ${Math.round(allTimeTotalTons * 10) / 10} tCO2e`);
  console.log(`   Average intensity: ${Math.round(allTimeIntensity * 10) / 10} kgCO2e/m²`);
  console.log();

  console.log('📊 BY SITE (All-Time):\n');
  for (const [siteName, data] of Object.entries(siteAllTimeTotals) as any) {
    const percentage = (data.total / allTimeTotalTons) * 100;
    console.log(`   ${siteName}:`);
    console.log(`     - Total: ${Math.round(data.total * 10) / 10} tCO2e (${Math.round(percentage)}%)`);
    console.log(`     - Intensity: ${Math.round(data.intensity * 10) / 10} kgCO2e/m²`);
    console.log(`     - Data points: ${data.dataPoints}`);
  }

  // Group by year for yearly breakdown
  const yearlyData: any = {};

  allEmissions?.forEach(e => {
    const year = new Date(e.period_start).getFullYear();
    if (!yearlyData[year]) {
      yearlyData[year] = { emissions: 0, count: 0 };
    }
    yearlyData[year].emissions += e.co2e_emissions || 0;
    yearlyData[year].count++;
  });

  console.log('\n📈 YEARLY BREAKDOWN:\n');
  const years = Object.keys(yearlyData).sort();
  let cumulativeTotal = 0;

  for (const year of years) {
    const yearEmissions = yearlyData[year].emissions / 1000;
    cumulativeTotal += yearEmissions;
    const yearIntensity = totalArea > 0 ? (yearlyData[year].emissions / totalArea) : 0;
    const percentOfTotal = (yearEmissions / allTimeTotalTons) * 100;

    console.log(`   ${year}:`);
    console.log(`     - Emissions: ${Math.round(yearEmissions * 10) / 10} tCO2e (${Math.round(percentOfTotal)}% of all-time)`);
    console.log(`     - Intensity: ${Math.round(yearIntensity * 10) / 10} kgCO2e/m²`);
    console.log(`     - Cumulative: ${Math.round(cumulativeTotal * 10) / 10} tCO2e`);
    console.log(`     - Data points: ${yearlyData[year].count}`);
  }

  // Monthly average
  const monthsRange = years.length * 12; // Approximate
  const monthlyAverage = allTimeTotalTons / monthsRange;

  console.log('\n📊 AVERAGES:\n');
  console.log(`   Per year: ${Math.round((allTimeTotalTons / years.length) * 10) / 10} tCO2e`);
  console.log(`   Per month: ${Math.round(monthlyAverage * 10) / 10} tCO2e`);
  console.log(`   Per day: ${Math.round((allTimeTotalTons / (years.length * 365)) * 100) / 100} tCO2e`);

  // Performance summary
  let performance: string;
  if (allTimeIntensity <= 20) {
    performance = 'excellent';
  } else if (allTimeIntensity <= 40) {
    performance = 'good';
  } else if (allTimeIntensity <= 60) {
    performance = 'warning';
  } else {
    performance = 'poor';
  }

  console.log('\n🎯 OVERALL PERFORMANCE:\n');
  console.log(`   All-time intensity: ${Math.round(allTimeIntensity * 10) / 10} kgCO2e/m²`);
  console.log(`   Performance rating: ${performance.toUpperCase()}`);

  // Projection for full 2025 (if partial year)
  const emissions2025 = yearlyData['2025'];
  if (emissions2025) {
    const monthsIn2025 = 8; // Data through August
    const projectedFull2025 = (emissions2025.emissions / monthsIn2025) * 12 / 1000;
    console.log('\n📮 2025 PROJECTION (based on Jan-Aug):\n');
    console.log(`   Actual (8 months): ${Math.round((emissions2025.emissions / 1000) * 10) / 10} tCO2e`);
    console.log(`   Projected (12 months): ${Math.round(projectedFull2025 * 10) / 10} tCO2e`);
  }

  process.exit(0);
}

calculateAllTimeEmissions().catch(console.error);