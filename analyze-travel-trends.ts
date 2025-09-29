#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeBusinessTravel() {
  console.log('✈️ BUSINESS TRAVEL IMPACT ANALYSIS');
  console.log('=' .repeat(70));

  // Get all historical data with category breakdown
  const { data } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog!inner(name, category, subcategory, scope, unit)
    `)
    .gte('period_start', '2022-01-01')
    .order('period_start', { ascending: true });

  // Group by month and category
  const monthlyBreakdown: Record<string, any> = {};

  data?.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyBreakdown[monthKey]) {
      monthlyBreakdown[monthKey] = {
        total: 0,
        travel: 0,
        electricity: 0,
        waste: 0,
        water: 0,
        heating_cooling: 0,
        other: 0,
        travelDetails: {
          air: 0,
          rail: 0,
          road: 0,
          total_km: 0
        }
      };
    }

    const emissions = record.co2e_emissions || 0;
    const category = record.metrics_catalog.category;
    const name = record.metrics_catalog.name;

    monthlyBreakdown[monthKey].total += emissions;

    if (category === 'Business Travel') {
      monthlyBreakdown[monthKey].travel += emissions;

      // Track travel mode details
      if (name.includes('Plane') || name.includes('Air')) {
        monthlyBreakdown[monthKey].travelDetails.air += emissions;
        monthlyBreakdown[monthKey].travelDetails.total_km += record.value || 0;
      } else if (name.includes('Train') || name.includes('Rail')) {
        monthlyBreakdown[monthKey].travelDetails.rail += emissions;
        monthlyBreakdown[monthKey].travelDetails.total_km += record.value || 0;
      } else if (name.includes('Car') || name.includes('Road')) {
        monthlyBreakdown[monthKey].travelDetails.road += emissions;
        monthlyBreakdown[monthKey].travelDetails.total_km += record.value || 0;
      }
    } else if (category === 'Electricity') {
      monthlyBreakdown[monthKey].electricity += emissions;
    } else if (category === 'Waste') {
      monthlyBreakdown[monthKey].waste += emissions;
    } else if (category === 'Purchased Goods & Services' && name.includes('Water')) {
      monthlyBreakdown[monthKey].water += emissions;
    } else if (category === 'Purchased Energy') {
      monthlyBreakdown[monthKey].heating_cooling += emissions;
    } else {
      monthlyBreakdown[monthKey].other += emissions;
    }
  });

  // Analyze by year
  const yearlyStats: Record<string, any> = {};

  Object.entries(monthlyBreakdown).forEach(([month, data]) => {
    const year = month.substring(0, 4);
    if (!yearlyStats[year]) {
      yearlyStats[year] = {
        total: 0,
        travel: 0,
        electricity: 0,
        months: 0,
        travelKm: 0
      };
    }
    yearlyStats[year].total += data.total;
    yearlyStats[year].travel += data.travel;
    yearlyStats[year].electricity += data.electricity;
    yearlyStats[year].travelKm += data.travelDetails.total_km;
    yearlyStats[year].months++;
  });

  // Print yearly summary
  console.log('\n📊 YEARLY SUMMARY:');
  Object.entries(yearlyStats).forEach(([year, stats]) => {
    const travelPercent = (stats.travel / stats.total * 100).toFixed(1);
    const monthlyAvg = stats.total / stats.months;
    console.log(`\n${year}:`);
    console.log(`  Total: ${(stats.total / 1000).toFixed(1)} tCO2e`);
    console.log(`  Monthly avg: ${(monthlyAvg / 1000).toFixed(1)} tCO2e`);
    console.log(`  Travel: ${(stats.travel / 1000).toFixed(1)} tCO2e (${travelPercent}%)`);
    console.log(`  Travel distance: ${(stats.travelKm).toLocaleString()} km`);
  });

  // Find months with highest travel impact
  const monthsArray = Object.entries(monthlyBreakdown)
    .map(([month, data]) => ({
      month,
      total: data.total,
      travel: data.travel,
      travelPercent: (data.travel / data.total * 100),
      airTravel: data.travelDetails.air
    }))
    .sort((a, b) => b.travelPercent - a.travelPercent);

  console.log('\n🔝 TOP TRAVEL IMPACT MONTHS:');
  monthsArray.slice(0, 5).forEach(m => {
    console.log(`  ${m.month}: ${m.travelPercent.toFixed(1)}% travel (${(m.travel/1000).toFixed(2)} tCO2e of ${(m.total/1000).toFixed(2)} total)`);
  });

  // Recent trend analysis
  const recentMonths = monthsArray.filter(m => m.month >= '2025-01').slice(0, 7);
  const avgRecentTravel = recentMonths.reduce((sum, m) => sum + m.travelPercent, 0) / recentMonths.length;

  console.log('\n📈 2025 TRENDS:');
  recentMonths.forEach(m => {
    const bar = '█'.repeat(Math.round(m.travelPercent / 5));
    console.log(`  ${m.month}: ${bar} ${m.travelPercent.toFixed(1)}%`);
  });

  // Category breakdown for latest month
  const latestMonth = monthsArray[0];
  const latestData = monthlyBreakdown[latestMonth.month];

  console.log(`\n📅 LATEST MONTH (${latestMonth.month}) BREAKDOWN:`);
  console.log(`  Electricity: ${(latestData.electricity / latestData.total * 100).toFixed(1)}%`);
  console.log(`  Heating/Cooling: ${(latestData.heating_cooling / latestData.total * 100).toFixed(1)}%`);
  console.log(`  Business Travel: ${(latestData.travel / latestData.total * 100).toFixed(1)}%`);
  console.log(`  Waste: ${(latestData.waste / latestData.total * 100).toFixed(1)}%`);
  console.log(`  Water: ${(latestData.water / latestData.total * 100).toFixed(1)}%`);
  console.log(`  Other: ${(latestData.other / latestData.total * 100).toFixed(1)}%`);

  // Identify patterns
  console.log('\n🔍 KEY INSIGHTS:');

  // Check if travel is increasing
  const firstYear = Object.keys(yearlyStats)[0];
  const lastYear = Object.keys(yearlyStats)[Object.keys(yearlyStats).length - 1];
  const travelGrowth = ((yearlyStats[lastYear].travel - yearlyStats[firstYear].travel) / yearlyStats[firstYear].travel * 100);

  if (travelGrowth > 50) {
    console.log(`  ⚠️ Business travel emissions increased ${travelGrowth.toFixed(0)}% from ${firstYear} to ${lastYear}`);
  }

  if (avgRecentTravel > 15) {
    console.log(`  ⚠️ Travel accounts for ${avgRecentTravel.toFixed(1)}% of recent emissions (above 15% threshold)`);
  }

  // Check for seasonal patterns
  const summerMonths = monthsArray.filter(m => {
    const month = parseInt(m.month.split('-')[1]);
    return month >= 6 && month <= 8;
  });
  const winterMonths = monthsArray.filter(m => {
    const month = parseInt(m.month.split('-')[1]);
    return month <= 2 || month >= 11;
  });

  const avgSummerTravel = summerMonths.reduce((sum, m) => sum + m.travelPercent, 0) / (summerMonths.length || 1);
  const avgWinterTravel = winterMonths.reduce((sum, m) => sum + m.travelPercent, 0) / (winterMonths.length || 1);

  if (Math.abs(avgSummerTravel - avgWinterTravel) > 5) {
    console.log(`  📅 Seasonal pattern detected: Summer travel ${avgSummerTravel.toFixed(1)}% vs Winter ${avgWinterTravel.toFixed(1)}%`);
  }

  // Recommendations
  console.log('\n💡 ML MODEL RECOMMENDATIONS:');
  if (travelGrowth > 20 || avgRecentTravel > 10) {
    console.log('  • Business travel is a significant and variable factor');
    console.log('  • Should track: conference schedule, remote work policies, client locations');
    console.log('  • Consider separate travel prediction model');
    console.log('  • Add features: travel requests, budget cycles, seasonal events');
  }
}

analyzeBusinessTravel().catch(console.error);