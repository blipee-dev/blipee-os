import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ELECTRICITY_MAPS_KEY = process.env.ELECTRICITY_MAPS_API_KEY || 'T4xEjR2XyjTyEmfqRYh1';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface GridMixData {
  renewablePercentage: number;
  carbonIntensity: number; // gCO2eq/kWh
  sources: Array<{
    name: string;
    percentage: number;
    renewable: boolean;
  }>;
  fossilFreePercentage: number;
}

/**
 * Fetch grid mix data from Electricity Maps for a specific date and zone
 */
async function fetchGridMixForDate(zone: string, date: string): Promise<GridMixData | null> {
  try {
    // Electricity Maps API endpoint for past power breakdown
    const url = `https://api.electricitymap.org/v3/power-breakdown/past?zone=${zone}&datetime=${date}T12:00:00Z`;

    console.log(`📡 Fetching grid mix for ${zone} on ${date}...`);

    const response = await fetch(url, {
      headers: {
        'auth-token': ELECTRICITY_MAPS_KEY
      }
    });

    if (!response.ok) {
      console.error(`❌ API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Calculate renewable percentage from power breakdown
    const powerProduction = data.powerConsumptionBreakdown || data.powerProductionBreakdown || {};

    const renewableSources = ['solar', 'wind', 'hydro', 'geothermal', 'biomass'];
    const fossilSources = ['coal', 'gas', 'oil'];
    const nuclearSources = ['nuclear'];

    let totalPower = 0;
    let renewablePower = 0;
    let fossilPower = 0;
    let nuclearPower = 0;
    const sources: Array<{ name: string; percentage: number; renewable: boolean; value: number }> = [];

    Object.entries(powerProduction).forEach(([source, value]: [string, any]) => {
      if (typeof value === 'number' && value > 0) {
        totalPower += value;

        const isRenewable = renewableSources.includes(source);
        const isFossil = fossilSources.includes(source);
        const isNuclear = nuclearSources.includes(source);

        if (isRenewable) renewablePower += value;
        if (isFossil) fossilPower += value;
        if (isNuclear) nuclearPower += value;

        sources.push({
          name: source.charAt(0).toUpperCase() + source.slice(1),
          percentage: 0, // Will calculate after
          renewable: isRenewable,
          value
        });
      }
    });

    // Calculate percentages
    sources.forEach(s => {
      s.percentage = totalPower > 0 ? (s.value / totalPower) * 100 : 0;
    });

    // Sort by percentage descending
    sources.sort((a, b) => b.percentage - a.percentage);

    const renewablePercentage = totalPower > 0 ? (renewablePower / totalPower) * 100 : 0;
    const fossilFreePercentage = totalPower > 0 ? ((renewablePower + nuclearPower) / totalPower) * 100 : 0;

    // Get carbon intensity
    const carbonIntensity = data.carbonIntensity || 0;

    return {
      renewablePercentage,
      carbonIntensity,
      sources: sources.map(s => ({
        name: s.name,
        percentage: s.percentage,
        renewable: s.renewable
      })),
      fossilFreePercentage
    };

  } catch (error) {
    console.error(`❌ Error fetching grid mix:`, error);
    return null;
  }
}

/**
 * Backfill grid mix data for electricity records
 */
async function backfillGridMix() {
  console.log('🔄 Starting grid mix backfill...\n');

  // Get all electricity records that need grid mix data
  const { data: records, error } = await supabase
    .from('metrics_data')
    .select('id, period_start, value, metadata, metrics_catalog!inner(code, category)')
    .eq('organization_id', ORG_ID)
    .in('metrics_catalog.category', ['Electricity', 'Purchased Energy'])
    .gte('period_start', '2022-01-01')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error fetching records:', error);
    return;
  }

  console.log(`📊 Found ${records?.length} electricity records to process\n`);

  // Group by date to avoid duplicate API calls
  const dateGroups = new Map<string, any[]>();
  records?.forEach(record => {
    const date = record.period_start.split('T')[0];
    if (!dateGroups.has(date)) {
      dateGroups.set(date, []);
    }
    dateGroups.get(date)!.push(record);
  });

  console.log(`📅 Processing ${dateGroups.size} unique dates\n`);

  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  // Process each date
  for (const [date, dateRecords] of dateGroups.entries()) {
    // Determine zone based on site - default to PT (Portugal)
    const zone = 'PT'; // Portugal

    // Fetch grid mix for this date
    const gridMix = await fetchGridMixForDate(zone, date);

    if (!gridMix) {
      console.log(`⚠️  Skipping ${date} - no grid mix data available`);
      errorCount++;
      continue;
    }

    console.log(`✅ ${date}: ${gridMix.renewablePercentage.toFixed(1)}% renewable, ${gridMix.carbonIntensity} gCO2/kWh`);

    // Update all records for this date
    for (const record of dateRecords) {
      const consumption = parseFloat(record.value) || 0;
      const renewableKwh = (consumption * gridMix.renewablePercentage) / 100;
      const nonRenewableKwh = consumption - renewableKwh;

      // Create grid mix metadata
      const gridMixMetadata = {
        grid_mix: {
          zone,
          year: new Date(date).getFullYear(),
          provider: 'Electricity Maps',
          renewable_percentage: gridMix.renewablePercentage,
          fossil_free_percentage: gridMix.fossilFreePercentage,
          renewable_kwh: renewableKwh,
          non_renewable_kwh: nonRenewableKwh,
          carbon_intensity_lifecycle: gridMix.carbonIntensity,
          carbon_intensity_scope2: gridMix.carbonIntensity,
          carbon_intensity_scope3_cat3: 0,
          sources: gridMix.sources,
          fetched_at: new Date().toISOString()
        }
      };

      // Merge with existing metadata
      const existingMetadata = record.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        ...gridMixMetadata
      };

      // Update record
      const { error: updateError } = await supabase
        .from('metrics_data')
        .update({ metadata: updatedMetadata })
        .eq('id', record.id);

      if (updateError) {
        console.error(`❌ Error updating record ${record.id}:`, updateError);
        errorCount++;
      } else {
        updatedCount++;
      }
    }

    processedCount++;

    // Rate limiting - Electricity Maps has rate limits
    if (processedCount % 10 === 0) {
      console.log(`\n⏸️  Processed ${processedCount}/${dateGroups.size} dates, updated ${updatedCount} records. Pausing...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause every 10 dates
    }
  }

  console.log('\n✅ Backfill complete!');
  console.log(`📊 Summary:`);
  console.log(`  - Total dates processed: ${processedCount}`);
  console.log(`  - Records updated: ${updatedCount}`);
  console.log(`  - Errors: ${errorCount}`);
}

// Run the backfill
backfillGridMix().catch(console.error);
