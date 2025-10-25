import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const ELECTRICITY_MAPS_KEY = process.env.ELECTRICITY_MAPS_API_KEY || 'T4xEjR2XyjTyEmfqRYh1';

async function fetchGridMixForMonth(zone: string, year: number, month: number) {
  try {
    // Fetch entire month using past-range endpoint
    const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')} 23:59`;

    console.log(`📡 Fetching grid mix for ${zone} ${year}-${String(month).padStart(2, '0')}...`);

    // Fetch electricity mix using past-range endpoint
    const mixUrl = `https://api.electricitymaps.com/v3/electricity-mix/past-range?zone=${zone}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;

    const mixResponse = await fetch(mixUrl, {
      headers: {
        'auth-token': ELECTRICITY_MAPS_KEY
      }
    });

    if (!mixResponse.ok) {
      console.log(`   ❌ API error: ${mixResponse.status} ${mixResponse.statusText}`);
      return null;
    }

    const mixData = await mixResponse.json();

    if (!mixData.data || mixData.data.length === 0) {
      console.log(`   ❌ No data returned for ${year}-${month}`);
      return null;
    }

    console.log(`   ✓ Fetched ${mixData.data.length} hourly data points`);

    // Fetch carbon intensity for the same range
    const carbonUrl = `https://api.electricitymaps.com/v3/carbon-intensity/past-range?zone=${zone}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;

    const carbonResponse = await fetch(carbonUrl, {
      headers: {
        'auth-token': ELECTRICITY_MAPS_KEY
      }
    });

    let carbonIntensities: number[] = [];
    if (carbonResponse.ok) {
      const carbonData = await carbonResponse.json();
      if (carbonData.data && Array.isArray(carbonData.data)) {
        carbonIntensities = carbonData.data
          .map((d: any) => d.carbonIntensity)
          .filter((val: any) => typeof val === 'number' && val > 0);
      }
    }

    // Aggregate hourly samples into monthly averages
    const renewableSources = ['solar', 'wind', 'hydro', 'geothermal', 'biomass'];
    const fossilSources = ['coal', 'gas', 'oil'];
    const nuclearSources = ['nuclear'];

    const sourceAggregates: { [key: string]: { totalMW: number; count: number; renewable: boolean } } = {};
    let totalRenewableMW = 0;
    let totalFossilFreeMW = 0;
    let totalMW = 0;

    // Aggregate all hourly data points from mixData.data
    mixData.data.forEach((hourlyData: any) => {
      const mix = hourlyData.mix;
      let hourTotal = 0;
      let hourRenewable = 0;
      let hourFossilFree = 0;

      // First pass: calculate hourly totals
      Object.entries(mix).forEach(([source, mw]: [string, any]) => {
        if (typeof mw === 'number' && mw > 0) {
          hourTotal += mw;

          const sourceNormalized = source.toLowerCase().replace(/\s+/g, '');
          const isRenewable = renewableSources.some(rs => sourceNormalized.includes(rs));
          const isNuclear = nuclearSources.some(ns => sourceNormalized.includes(ns));

          if (isRenewable) hourRenewable += mw;
          if (isRenewable || isNuclear) hourFossilFree += mw;
        }
      });

      // Second pass: aggregate by source
      Object.entries(mix).forEach(([source, mw]: [string, any]) => {
        if (typeof mw === 'number' && mw > 0) {
          if (!sourceAggregates[source]) {
            const sourceNormalized = source.toLowerCase().replace(/\s+/g, '');
            sourceAggregates[source] = {
              totalMW: 0,
              count: 0,
              renewable: renewableSources.some(rs => sourceNormalized.includes(rs))
            };
          }
          sourceAggregates[source].totalMW += mw;
          sourceAggregates[source].count++;
        }
      });

      // Accumulate totals
      totalMW += hourTotal;
      totalRenewableMW += hourRenewable;
      totalFossilFreeMW += hourFossilFree;
    });

    // Calculate overall percentages from cumulative MW totals
    const renewablePercentage = totalMW > 0 ? (totalRenewableMW / totalMW) * 100 : 0;
    const fossilFreePercentage = totalMW > 0 ? (totalFossilFreeMW / totalMW) * 100 : 0;

    // Build sources array with percentages from cumulative MW
    const sources = Object.entries(sourceAggregates).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      percentage: totalMW > 0 ? (data.totalMW / totalMW) * 100 : 0,
      renewable: data.renewable
    }));

    // Sort by percentage descending
    sources.sort((a, b) => b.percentage - a.percentage);

    // Calculate average carbon intensity
    const carbonIntensity = carbonIntensities.length > 0
      ? carbonIntensities.reduce((sum, val) => sum + val, 0) / carbonIntensities.length
      : 0;

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

async function addGridMixTo2025Forecast() {
  console.log('🔄 Adding Grid Mix Data to 2025 Forecast\n');
  console.log('='.repeat(80));

  try {
    // Get Electricity metric
    const { data: electricityMetric } = await supabase
      .from('metrics_catalog')
      .select('id, name')
      .eq('name', 'Electricity')
      .single();

    if (!electricityMetric) {
      console.log('❌ No Electricity metric found');
      return;
    }

    console.log(`\n📊 Electricity Metric ID: ${electricityMetric.id}`);

    // Get 2025 electricity records
    const { data: records2025 } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('metric_id', electricityMetric.id)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31')
      .order('period_start', { ascending: true });

    if (!records2025 || records2025.length === 0) {
      console.log('❌ No 2025 electricity records found');
      return;
    }

    console.log(`\n📈 Found ${records2025.length} records to update\n`);

    let updatedCount = 0;

    // Process each month - fetch data from 2024 as baseline (SAME MONTH for seasonal accuracy)
    for (const record of records2025) {
      const month = parseInt(record.period_start.substring(5, 7));
      const monthName = new Date(2025, month - 1).toLocaleString('default', { month: 'short' });

      // Use 2025 monthly data (actual year) for grid mix
      // This provides realistic seasonal variation (higher solar in summer, more hydro in winter)
      const gridMix = await fetchGridMixForMonth('PT', 2025, month);

      if (!gridMix) {
        console.log(`⚠️  Skipping ${monthName} 2025 - no grid mix data available`);
        continue;
      }

      const consumption = parseFloat(record.value) || 0;
      const renewableKwh = (consumption * gridMix.renewablePercentage) / 100;
      const nonRenewableKwh = consumption - renewableKwh;

      // Calculate emissions (kgCO2e)
      const emissionsScope2 = (consumption * gridMix.carbonIntensity) / 1000; // Convert gCO2/kWh to kgCO2e

      // Create grid mix metadata
      const gridMixMetadata = {
        grid_mix: {
          zone: 'PT',
          year: 2025,
          month: month,
          period: record.period_start.substring(0, 7),
          provider: 'Electricity Maps',
          renewable_percentage: gridMix.renewablePercentage,
          non_renewable_percentage: 100 - gridMix.renewablePercentage,
          fossil_free_percentage: gridMix.fossilFreePercentage,
          renewable_kwh: renewableKwh,
          non_renewable_kwh: nonRenewableKwh,
          carbon_intensity_lifecycle: gridMix.carbonIntensity,
          carbon_intensity_scope2: gridMix.carbonIntensity * 0.85, // 85% direct
          carbon_intensity_scope3_cat3: gridMix.carbonIntensity * 0.15, // 15% upstream
          sources: gridMix.sources,
          reference_year: 2025,
          reference_month: month,
          note: `Based on ${monthName} 2025 grid mix data from Electricity Maps`,
          fetched_at: new Date().toISOString()
        }
      };

      // Merge with existing metadata
      const existingMetadata = record.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        ...gridMixMetadata
      };

      // Update co2e_emissions if not set
      const updatedEmissions = record.co2e_emissions || emissionsScope2;

      // Update record
      const { error: updateError } = await supabase
        .from('metrics_data')
        .update({
          metadata: updatedMetadata,
          co2e_emissions: updatedEmissions
        })
        .eq('id', record.id);

      if (updateError) {
        console.error(`❌ Error updating record ${record.id}:`, updateError);
      } else {
        console.log(`✅ ${monthName} 2025: ${gridMix.renewablePercentage.toFixed(1)}% renewable, ${gridMix.carbonIntensity} gCO2/kWh`);
        updatedCount++;
      }

      // Rate limiting - wait 2 seconds between months (10 API calls per month with daily sampling)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`   ✅ Records updated: ${updatedCount}/${records2025.length}`);
    console.log('='.repeat(80));
    console.log('✅ Grid mix data added to 2025 forecast!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addGridMixTo2025Forecast();
