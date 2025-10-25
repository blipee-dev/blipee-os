/**
 * Fetch 2025 Grid Mix from Electricity Maps API
 *
 * Replaces hardcoded projection with actual API data
 * Validates against EDP Q4 2025 reference
 */

import { createClient } from '@supabase/supabase-js';
import {
  getHistoricalPowerBreakdown,
  getHistoricalCarbonIntensity,
  convertToEnergyMix
} from './src/lib/external/electricity-maps';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const zone = 'PT'; // Portugal

// EDP Q4 2025 Reference for validation
const EDP_Q4_2025 = {
  renewable_percentage: 56.99,
  carbon_intensity: 127.52,
  sources: {
    hydro: 31.22,
    wind: 11.38,
    'other renewables': 10.71,
    'renewable cogeneration': 3.39,
    gas: 28.35,
    nuclear: 10.57,
    'fossil fuel cogeneration': 3.23,
    coal: 0.58,
    waste: 0.58
  }
};

async function fetchGridMixFromAPI() {
  console.log('⚡ Fetching 2025 Grid Mix from Electricity Maps API\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Step 1: Get all 2025 electricity records
  console.log('📋 Step 1: Fetching 2025 electricity records...\n');

  const { data: records } = await supabase
    .from('metrics_data')
    .select('id, metric_id, period_start, value, metadata')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start');

  if (!records || records.length === 0) {
    console.error('❌ No 2025 records found');
    return;
  }

  // Filter only electricity records (need to check metric names)
  const { data: metricsData } = await supabase
    .from('metrics_catalog')
    .select('id, name, category')
    .in('id', [...new Set(records.map(r => r.metric_id))]);

  const electricityMetricIds = new Set(
    metricsData
      ?.filter(m =>
        m.category === 'Electricity' ||
        m.name.toLowerCase().includes('electricity') ||
        m.name.toLowerCase().includes('ev charging')
      )
      .map(m => m.id) || []
  );

  const electricityRecords = records.filter(r => electricityMetricIds.has(r.metric_id));

  console.log(`✅ Found ${electricityRecords.length} electricity records for 2025\n`);

  // Step 2: Fetch grid mix for each unique month from API
  console.log('🌐 Step 2: Fetching grid mix from Electricity Maps API...\n');

  const uniqueMonths = [...new Set(electricityRecords.map(r => r.period_start.substring(0, 7)))];
  uniqueMonths.sort();

  console.log(`Months to fetch: ${uniqueMonths.join(', ')}\n`);

  const gridMixByMonth = new Map<string, any>();
  let apiCallsSuccessful = 0;
  let apiCallsFailed = 0;

  for (const month of uniqueMonths) {
    // Use mid-month date at noon UTC for representative data
    const datetime = `${month}-15T12:00:00Z`;

    try {
      console.log(`  Fetching ${month}...`);

      const [breakdownResponse, carbonData] = await Promise.all([
        getHistoricalPowerBreakdown(zone, datetime),
        getHistoricalCarbonIntensity(zone, datetime)
      ]);

      if (!breakdownResponse) {
        console.log(`    ⚠️  No breakdown data for ${month}`);
        apiCallsFailed++;
        continue;
      }

      // The historical endpoint returns {history: [...]} so extract the first item
      const breakdown = (breakdownResponse as any).history?.[0] || breakdownResponse;

      if (!breakdown || !breakdown.powerConsumptionBreakdown) {
        console.log(`    ⚠️  Invalid breakdown format for ${month}`);
        apiCallsFailed++;
        continue;
      }

      // Convert to our energy mix format
      const energyMix = convertToEnergyMix(breakdown);

      const gridMix = {
        year: parseInt(month.split('-')[0]),
        month: parseInt(month.split('-')[1]),
        zone,
        provider: 'Electricity Maps API',
        datetime,
        renewable_percentage: energyMix.renewable_percentage,
        non_renewable_percentage: 100 - energyMix.renewable_percentage,
        sources: energyMix.sources,
        carbon_intensity_scope2: carbonData?.carbonIntensity || null,
        carbon_intensity_lifecycle: carbonData?.fossilFreePercentage
          ? (carbonData.carbonIntensity * (100 - carbonData.fossilFreePercentage) / 100)
          : null,
        fetched_at: new Date().toISOString()
      };

      gridMixByMonth.set(month, gridMix);

      console.log(`    ✅ ${energyMix.renewable_percentage.toFixed(2)}% renewable, ${carbonData?.carbonIntensity || 'N/A'} gCO2/kWh`);
      apiCallsSuccessful++;

      // Rate limiting: wait 100ms between calls
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`    ❌ Error fetching ${month}:`, error);
      apiCallsFailed++;
    }
  }

  console.log(`\n✅ Successfully fetched: ${apiCallsSuccessful} months`);
  console.log(`❌ Failed to fetch: ${apiCallsFailed} months\n`);

  if (apiCallsSuccessful === 0) {
    console.error('❌ No data fetched from API, aborting');
    return;
  }

  // Step 3: Validate against EDP Q4 2025 reference
  console.log('📊 Step 3: Validating against EDP Q4 2025 reference...\n');

  const q4Months = ['2025-10', '2025-11', '2025-12'];
  const q4Data = q4Months
    .map(m => gridMixByMonth.get(m))
    .filter(Boolean);

  if (q4Data.length > 0) {
    const avgRenewable = q4Data.reduce((sum, d) => sum + d.renewable_percentage, 0) / q4Data.length;
    const avgCarbon = q4Data
      .filter(d => d.carbon_intensity_scope2)
      .reduce((sum, d) => sum + d.carbon_intensity_scope2, 0) / q4Data.filter(d => d.carbon_intensity_scope2).length;

    console.log('EDP Q4 2025 Reference:');
    console.log(`  Renewable: ${EDP_Q4_2025.renewable_percentage}%`);
    console.log(`  Carbon Intensity: ${EDP_Q4_2025.carbon_intensity} gCO2/kWh\n`);

    console.log('API Q4 2025 Average:');
    console.log(`  Renewable: ${avgRenewable.toFixed(2)}%`);
    console.log(`  Carbon Intensity: ${avgCarbon ? avgCarbon.toFixed(2) : 'N/A'} gCO2/kWh\n`);

    const renewableDiff = Math.abs(avgRenewable - EDP_Q4_2025.renewable_percentage);
    const carbonDiff = avgCarbon ? Math.abs(avgCarbon - EDP_Q4_2025.carbon_intensity) : null;

    console.log('Difference:');
    console.log(`  Renewable: ${renewableDiff.toFixed(2)}% ${renewableDiff < 5 ? '✅' : '⚠️'}`);
    if (carbonDiff) {
      console.log(`  Carbon: ${carbonDiff.toFixed(2)} gCO2/kWh ${carbonDiff < 20 ? '✅' : '⚠️'}\n`);
    }
  } else {
    console.log('⚠️  No Q4 data available for validation\n');
  }

  // Step 4: Update records with API-fetched grid mix
  console.log('💾 Step 4: Updating records with API data...\n');

  let recordsUpdated = 0;
  let recordsSkipped = 0;

  for (const record of electricityRecords) {
    const month = record.period_start.substring(0, 7);
    const gridMix = gridMixByMonth.get(month);

    if (!gridMix) {
      recordsSkipped++;
      continue;
    }

    // Calculate renewable/non-renewable kWh from consumption
    const consumption = record.value || 0;
    const renewable_kwh = consumption * (gridMix.renewable_percentage / 100);
    const non_renewable_kwh = consumption * (gridMix.non_renewable_percentage / 100);

    const updatedMetadata = {
      ...(record.metadata || {}),
      grid_mix: {
        ...gridMix,
        renewable_kwh,
        non_renewable_kwh,
        consumption_kwh: consumption
      }
    };

    const { error } = await supabase
      .from('metrics_data')
      .update({ metadata: updatedMetadata })
      .eq('id', record.id);

    if (error) {
      console.error(`  ❌ Error updating record ${record.id}:`, error);
    } else {
      recordsUpdated++;
    }
  }

  console.log(`\n✅ Updated ${recordsUpdated} records`);
  console.log(`⏭️  Skipped ${recordsSkipped} records (no API data)\n`);

  // Summary
  console.log('=' + '='.repeat(79));
  console.log('🎉 Grid Mix Update Complete!\n');
  console.log('Summary:');
  console.log(`  Total electricity records: ${electricityRecords.length}`);
  console.log(`  Months fetched from API: ${apiCallsSuccessful}/${uniqueMonths.length}`);
  console.log(`  Records updated: ${recordsUpdated}`);
  console.log(`  Records skipped: ${recordsSkipped}`);
  console.log(`  Data source: Electricity Maps API (${zone})`);
  console.log(`  Validation: ${q4Data.length > 0 ? 'EDP Q4 2025 reference checked' : 'No Q4 data'}\n`);
}

fetchGridMixFromAPI().catch(console.error);
