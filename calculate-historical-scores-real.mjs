#!/usr/bin/env node
/**
 * Calculate REAL historical performance scores using actual historical data
 * 
 * For each time period, we'll:
 * 1. Query metrics_data within that specific date range
 * 2. Calculate what the score would have been at that time
 * 3. Save it with the appropriate historical timestamp
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Historical periods to calculate
const periods = [
  { 
    label: '2022', 
    startDate: '2022-01-01', 
    endDate: '2022-12-31',
    calculatedAt: '2022-12-31T23:59:59Z',
    description: 'Full year 2022 performance'
  },
  { 
    label: '2023', 
    startDate: '2023-01-01', 
    endDate: '2023-12-31',
    calculatedAt: '2023-12-31T23:59:59Z',
    description: 'Full year 2023 performance'
  },
  { 
    label: 'Q1 2024', 
    startDate: '2024-01-01', 
    endDate: '2024-03-31',
    calculatedAt: '2024-03-31T23:59:59Z',
    description: 'Q1 2024 performance'
  },
  { 
    label: 'Q2 2024', 
    startDate: '2024-04-01', 
    endDate: '2024-06-30',
    calculatedAt: '2024-06-30T23:59:59Z',
    description: 'Q2 2024 performance'
  },
  { 
    label: 'Q3 2024', 
    startDate: '2024-07-01', 
    endDate: '2024-09-30',
    calculatedAt: '2024-09-30T23:59:59Z',
    description: 'Q3 2024 performance'
  },
];

async function calculateHistoricalScores() {
  console.log('🔍 Finding PLMJ organization...\n');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  console.log(`📊 Organization: ${org.name}`);
  console.log(`🆔 ID: ${org.id}\n`);

  // Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id);

  console.log(`🏗️  Sites: ${sites.length} (${sites.map(s => s.name).join(', ')})\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📅 Calculating REAL historical scores using actual data');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const period of periods) {
    console.log(`\n🔄 Period: ${period.label}`);
    console.log(`   Date range: ${period.startDate} to ${period.endDate}`);
    console.log(`   ${period.description}\n`);

    // Check if we have data for this period
    const { count: dataCount } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .in('site_id', sites.map(s => s.id))
      .gte('period_start', period.startDate)
      .lte('period_start', period.endDate);

    console.log(`   📊 Found ${dataCount || 0} metric records for this period`);

    if (!dataCount || dataCount === 0) {
      console.log(`   ⚠️  No data for this period, skipping...\n`);
      continue;
    }

    // For each period, we would calculate the score using ONLY data from that time window
    // The scoring engine would need to be modified to accept start/end dates
    // For now, let's show what the approach would be:

    console.log(`   ✅ Would calculate score using:`);
    console.log(`      - Energy consumption from ${period.startDate} to ${period.endDate}`);
    console.log(`      - Water usage from ${period.startDate} to ${period.endDate}`);
    console.log(`      - Waste data from ${period.startDate} to ${period.endDate}`);
    console.log(`      - Transportation from ${period.startDate} to ${period.endDate}`);
    console.log(`   ✅ Then save with timestamp: ${period.calculatedAt}\n`);

    // Sample data from this period
    const { data: sampleData } = await supabase
      .from('metrics_data')
      .select('period_start, value, co2e_emissions, metrics_catalog(name, category)')
      .in('site_id', sites.map(s => s.id))
      .gte('period_start', period.startDate)
      .lte('period_start', period.endDate)
      .limit(5);

    if (sampleData && sampleData.length > 0) {
      console.log(`   📋 Sample data from this period:`);
      sampleData.forEach(d => {
        console.log(`      ${d.period_start}: ${d.metrics_catalog?.name} = ${d.value} (${d.co2e_emissions?.toFixed(2)} kg CO2e)`);
      });
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('💡 IMPLEMENTATION NEEDED');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('To calculate real historical scores, we need to:');
  console.log('');
  console.log('1. Modify the scoring engine to accept date range parameters:');
  console.log('   calculateSiteScore(siteId, { startDate, endDate })');
  console.log('');
  console.log('2. For each historical period:');
  console.log('   - Query ONLY metrics_data within that date range');
  console.log('   - Calculate scores based on that period\'s data');
  console.log('   - Save with historical timestamp');
  console.log('');
  console.log('3. Current scoring logic filters by timeWindow (days)');
  console.log('   We need to change it to filter by absolute dates');
  console.log('');
  console.log('Would you like me to modify the scoring engine to support this?');
}

calculateHistoricalScores();
