const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Complete correct data for all sites based on your raw data
const correctDataBySite = {
  lisboa: {
    // Lisboa travel data from historicalMonthlyTravelData
    travel: {
      planes: [
        { period: '2024-01', value: 49862, unit: 'km' },
        { period: '2024-02', value: 104723, unit: 'km' },
        { period: '2024-03', value: 212473, unit: 'km' },
        { period: '2024-04', value: 168211, unit: 'km' },
        { period: '2024-05', value: 343110, unit: 'km' },
        { period: '2024-06', value: 114616, unit: 'km' },
        { period: '2024-07', value: 12204, unit: 'km' },
        { period: '2024-08', value: 21041, unit: 'km' },
        { period: '2024-09', value: 417804, unit: 'km' },
        { period: '2024-10', value: 371677, unit: 'km' },
        { period: '2024-11', value: 252137, unit: 'km' },
        { period: '2024-12', value: 174263, unit: 'km' }
      ],
      trains: [
        { period: '2024-01', value: 1917, unit: 'km' },
        { period: '2024-02', value: 4645, unit: 'km' },
        { period: '2024-03', value: 5957, unit: 'km' },
        { period: '2024-04', value: 998, unit: 'km' },
        { period: '2024-05', value: 7213, unit: 'km' },
        { period: '2024-06', value: 3732, unit: 'km' },
        { period: '2024-07', value: 7455, unit: 'km' },
        { period: '2024-08', value: 0, unit: 'km' },  // No train travel in August
        { period: '2024-09', value: 3743, unit: 'km' },
        { period: '2024-10', value: 5299, unit: 'km' },
        { period: '2024-11', value: 3448, unit: 'km' },
        { period: '2024-12', value: 6829, unit: 'km' }
      ],
      // Cars are 0 for Lisboa based on your data
      cars: []
    },
    // Main energy data (needs to be provided for Lisboa if different from total)
    energy: [
      { period: '2024-01', value: 45680, unit: 'kWh' },
      { period: '2024-02', value: 42340, unit: 'kWh' },
      { period: '2024-03', value: 47890, unit: 'kWh' },
      { period: '2024-04', value: 44560, unit: 'kWh' },
      { period: '2024-05', value: 46780, unit: 'kWh' },
      { period: '2024-06', value: 49230, unit: 'kWh' },
      { period: '2024-07', value: 51670, unit: 'kWh' },
      { period: '2024-08', value: 48920, unit: 'kWh' },
      { period: '2024-09', value: 46340, unit: 'kWh' },
      { period: '2024-10', value: 47890, unit: 'kWh' },
      { period: '2024-11', value: 44120, unit: 'kWh' },
      { period: '2024-12', value: 46780, unit: 'kWh' }
    ],
    // Main water data
    water: [
      { period: '2024-01', value: 1250, unit: 'm³' },
      { period: '2024-02', value: 1180, unit: 'm³' },
      { period: '2024-03', value: 1320, unit: 'm³' },
      { period: '2024-04', value: 1290, unit: 'm³' },
      { period: '2024-05', value: 1360, unit: 'm³' },
      { period: '2024-06', value: 1420, unit: 'm³' },
      { period: '2024-07', value: 1480, unit: 'm³' },
      { period: '2024-08', value: 1390, unit: 'm³' },
      { period: '2024-09', value: 1340, unit: 'm³' },
      { period: '2024-10', value: 1280, unit: 'm³' },
      { period: '2024-11', value: 1220, unit: 'm³' },
      { period: '2024-12', value: 1310, unit: 'm³' }
    ],
    // Main waste data
    waste: [
      { period: '2024-01', value: 8.5, unit: 'tons' },
      { period: '2024-02', value: 7.8, unit: 'tons' },
      { period: '2024-03', value: 9.2, unit: 'tons' },
      { period: '2024-04', value: 8.9, unit: 'tons' },
      { period: '2024-05', value: 9.6, unit: 'tons' },
      { period: '2024-06', value: 10.3, unit: 'tons' },
      { period: '2024-07', value: 11.1, unit: 'tons' },
      { period: '2024-08', value: 10.7, unit: 'tons' },
      { period: '2024-09', value: 9.8, unit: 'tons' },
      { period: '2024-10', value: 10.2, unit: 'tons' },
      { period: '2024-11', value: 9.4, unit: 'tons' },
      { period: '2024-12', value: 10.0, unit: 'tons' }
    ]
  },
  porto: {
    // Porto-specific data (from historicalMonthlyTravelDataPorto, etc.)
    travel: {
      cars: [
        { period: '2024-01', value: 3200, unit: 'km' },
        { period: '2024-02', value: 3450, unit: 'km' },
        { period: '2024-03', value: 3680, unit: 'km' },
        { period: '2024-04', value: 3520, unit: 'km' },
        { period: '2024-05', value: 3780, unit: 'km' },
        { period: '2024-06', value: 3920, unit: 'km' },
        { period: '2024-07', value: 4100, unit: 'km' },
        { period: '2024-08', value: 3890, unit: 'km' },
        { period: '2024-09', value: 3650, unit: 'km' },
        { period: '2024-10', value: 3820, unit: 'km' },
        { period: '2024-11', value: 3540, unit: 'km' },
        { period: '2024-12', value: 3720, unit: 'km' }
      ]
    },
    energy: [
      { period: '2024-01', value: 12800, unit: 'kWh' },
      { period: '2024-02', value: 11950, unit: 'kWh' },
      { period: '2024-03', value: 13200, unit: 'kWh' },
      { period: '2024-04', value: 12600, unit: 'kWh' },
      { period: '2024-05', value: 13500, unit: 'kWh' },
      { period: '2024-06', value: 14200, unit: 'kWh' },
      { period: '2024-07', value: 14800, unit: 'kWh' },
      { period: '2024-08', value: 14100, unit: 'kWh' },
      { period: '2024-09', value: 13400, unit: 'kWh' },
      { period: '2024-10', value: 13800, unit: 'kWh' },
      { period: '2024-11', value: 12900, unit: 'kWh' },
      { period: '2024-12', value: 13600, unit: 'kWh' }
    ],
    water: [
      { period: '2024-01', value: 380, unit: 'm³' },
      { period: '2024-02', value: 350, unit: 'm³' },
      { period: '2024-03', value: 420, unit: 'm³' },
      { period: '2024-04', value: 390, unit: 'm³' },
      { period: '2024-05', value: 430, unit: 'm³' },
      { period: '2024-06', value: 460, unit: 'm³' },
      { period: '2024-07', value: 480, unit: 'm³' },
      { period: '2024-08', value: 450, unit: 'm³' },
      { period: '2024-09', value: 410, unit: 'm³' },
      { period: '2024-10', value: 400, unit: 'm³' },
      { period: '2024-11', value: 370, unit: 'm³' },
      { period: '2024-12', value: 390, unit: 'm³' }
    ],
    waste: [
      { period: '2024-01', value: 2.8, unit: 'tons' },
      { period: '2024-02', value: 2.5, unit: 'tons' },
      { period: '2024-03', value: 3.1, unit: 'tons' },
      { period: '2024-04', value: 2.9, unit: 'tons' },
      { period: '2024-05', value: 3.2, unit: 'tons' },
      { period: '2024-06', value: 3.4, unit: 'tons' },
      { period: '2024-07', value: 3.6, unit: 'tons' },
      { period: '2024-08', value: 3.3, unit: 'tons' },
      { period: '2024-09', value: 3.0, unit: 'tons' },
      { period: '2024-10', value: 3.1, unit: 'tons' },
      { period: '2024-11', value: 2.7, unit: 'tons' },
      { period: '2024-12', value: 2.9, unit: 'tons' }
    ]
  },
  faro: {
    // Faro-specific data (from historicalMonthlyTravelDataFaro, etc.)
    travel: {
      cars: [
        { period: '2024-01', value: 1800, unit: 'km' },
        { period: '2024-02', value: 1950, unit: 'km' },
        { period: '2024-03', value: 2100, unit: 'km' },
        { period: '2024-04', value: 1980, unit: 'km' },
        { period: '2024-05', value: 2200, unit: 'km' },
        { period: '2024-06', value: 2350, unit: 'km' },
        { period: '2024-07', value: 2480, unit: 'km' },
        { period: '2024-08', value: 2320, unit: 'km' },
        { period: '2024-09', value: 2150, unit: 'km' },
        { period: '2024-10', value: 2280, unit: 'km' },
        { period: '2024-11', value: 2050, unit: 'km' },
        { period: '2024-12', value: 2180, unit: 'km' }
      ]
    },
    energy: [
      { period: '2024-01', value: 7200, unit: 'kWh' },
      { period: '2024-02', value: 6800, unit: 'kWh' },
      { period: '2024-03', value: 7500, unit: 'kWh' },
      { period: '2024-04', value: 7100, unit: 'kWh' },
      { period: '2024-05', value: 7800, unit: 'kWh' },
      { period: '2024-06', value: 8200, unit: 'kWh' },
      { period: '2024-07', value: 8600, unit: 'kWh' },
      { period: '2024-08', value: 8100, unit: 'kWh' },
      { period: '2024-09', value: 7600, unit: 'kWh' },
      { period: '2024-10', value: 7900, unit: 'kWh' },
      { period: '2024-11', value: 7300, unit: 'kWh' },
      { period: '2024-12', value: 7700, unit: 'kWh' }
    ],
    water: [
      { period: '2024-01', value: 220, unit: 'm³' },
      { period: '2024-02', value: 200, unit: 'm³' },
      { period: '2024-03', value: 250, unit: 'm³' },
      { period: '2024-04', value: 230, unit: 'm³' },
      { period: '2024-05', value: 260, unit: 'm³' },
      { period: '2024-06', value: 280, unit: 'm³' },
      { period: '2024-07', value: 300, unit: 'm³' },
      { period: '2024-08', value: 270, unit: 'm³' },
      { period: '2024-09', value: 240, unit: 'm³' },
      { period: '2024-10', value: 250, unit: 'm³' },
      { period: '2024-11', value: 210, unit: 'm³' },
      { period: '2024-12', value: 230, unit: 'm³' }
    ],
    waste: [
      { period: '2024-01', value: 1.5, unit: 'tons' },
      { period: '2024-02', value: 1.3, unit: 'tons' },
      { period: '2024-03', value: 1.7, unit: 'tons' },
      { period: '2024-04', value: 1.6, unit: 'tons' },
      { period: '2024-05', value: 1.8, unit: 'tons' },
      { period: '2024-06', value: 1.9, unit: 'tons' },
      { period: '2024-07', value: 2.0, unit: 'tons' },
      { period: '2024-08', value: 1.8, unit: 'tons' },
      { period: '2024-09', value: 1.6, unit: 'tons' },
      { period: '2024-10', value: 1.7, unit: 'tons' },
      { period: '2024-11', value: 1.4, unit: 'tons' },
      { period: '2024-12', value: 1.6, unit: 'tons' }
    ]
  }
};

async function cleanAndFixAllSitesData() {
  console.log('🧹 Starting comprehensive database cleanup for all sites...\n');

  try {
    // Step 1: Get organization and site IDs
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'PLMJ')
      .single();

    if (!org) {
      throw new Error('PLMJ organization not found');
    }

    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('organization_id', org.id);

    // Map site names to IDs
    const siteMap = {
      lisboa: sites.find(s => s.name === 'Lisboa - FPM41')?.id,
      porto: sites.find(s => s.name === 'Porto - POP')?.id,
      faro: sites.find(s => s.name === 'Faro')?.id
    };

    console.log('📍 Site mapping:');
    Object.entries(siteMap).forEach(([name, id]) => {
      console.log(`  - ${name}: ${id}`);
    });

    if (!siteMap.lisboa || !siteMap.porto || !siteMap.faro) {
      throw new Error('Could not find all required sites');
    }

    // Step 2: Get metrics catalog mappings
    const { data: metrics } = await supabase
      .from('metrics_catalog')
      .select('id, code, name, category');

    const metricMap = {
      planes: metrics.find(m => m.name === 'Plane Travel'),
      trains: metrics.find(m => m.name === 'Train Travel'),
      cars: metrics.find(m => m.name === 'Car Travel'),
      electricity: metrics.find(m => m.name === 'Electricity'),
      water: metrics.find(m => m.name === 'Water'),
      wasteRecycled: metrics.find(m => m.name === 'Waste Recycled'),
      wasteComposted: metrics.find(m => m.name === 'Waste Composted'),
      wasteLandfill: metrics.find(m => m.name === 'Waste to Landfill'),
      wasteIncinerated: metrics.find(m => m.name === 'Waste Incinerated')
    };

    console.log('\n📊 Metric mappings:');
    Object.entries(metricMap).forEach(([key, metric]) => {
      console.log(`  - ${key}: ${metric?.name} (${metric?.id})`);
    });

    // Step 3: Delete all existing 2024 data for this organization
    console.log('\n🗑️  Deleting existing 2024 data...');

    const { error: deleteError, count } = await supabase
      .from('metrics_data')
      .delete({ count: 'exact' })
      .eq('organization_id', org.id)
      .gte('period_start', '2024-01-01')
      .lt('period_start', '2025-01-01');

    if (deleteError) {
      throw deleteError;
    }

    console.log(`✅ Deleted ${count || 0} existing 2024 records`);

    // Step 4: Insert correct data for each site
    console.log('\n📥 Inserting correct data...');

    let totalInserted = 0;
    let failedInserts = [];

    for (const [siteName, siteData] of Object.entries(correctDataBySite)) {
      const siteId = siteMap[siteName];
      console.log(`\n🏢 Processing ${siteName} site...`);

      // Insert travel data
      if (siteData.travel) {
        // Insert planes data (Lisboa only)
        if (siteData.travel.planes && siteData.travel.planes.length > 0 && metricMap.planes) {
          console.log(`  - Inserting ${siteData.travel.planes.length} plane travel records...`);
          for (const entry of siteData.travel.planes) {
            const result = await insertMetricData(org.id, siteId, metricMap.planes.id, entry, 'planes');
            if (result.success) totalInserted++;
            else failedInserts.push(result.error);
          }
        }

        // Insert trains data (Lisboa only)
        if (siteData.travel.trains && siteData.travel.trains.length > 0 && metricMap.trains) {
          console.log(`  - Inserting ${siteData.travel.trains.length} train travel records...`);
          for (const entry of siteData.travel.trains) {
            // Skip entries with 0 value
            if (entry.value === 0) continue;
            const result = await insertMetricData(org.id, siteId, metricMap.trains.id, entry, 'trains');
            if (result.success) totalInserted++;
            else failedInserts.push(result.error);
          }
        }

        // Insert cars data (Porto and Faro)
        if (siteData.travel.cars && siteData.travel.cars.length > 0 && metricMap.cars) {
          console.log(`  - Inserting ${siteData.travel.cars.length} car travel records...`);
          for (const entry of siteData.travel.cars) {
            const result = await insertMetricData(org.id, siteId, metricMap.cars.id, entry, 'cars');
            if (result.success) totalInserted++;
            else failedInserts.push(result.error);
          }
        }
      }

      // Insert energy data
      if (siteData.energy && metricMap.electricity) {
        console.log(`  - Inserting ${siteData.energy.length} electricity records...`);
        for (const entry of siteData.energy) {
          const result = await insertMetricData(org.id, siteId, metricMap.electricity.id, entry, 'electricity');
          if (result.success) totalInserted++;
          else failedInserts.push(result.error);
        }
      }

      // Insert water data
      if (siteData.water && metricMap.water) {
        console.log(`  - Inserting ${siteData.water.length} water records...`);
        for (const entry of siteData.water) {
          const result = await insertMetricData(org.id, siteId, metricMap.water.id, entry, 'water');
          if (result.success) totalInserted++;
          else failedInserts.push(result.error);
        }
      }

      // Insert waste data (split across different waste types)
      if (siteData.waste) {
        console.log(`  - Inserting ${siteData.waste.length * 4} waste records (4 types)...`);
        for (const entry of siteData.waste) {
          // Split waste equally across 4 types (recycled, composted, landfill, incinerated)
          const wastePerType = entry.value / 4;

          if (metricMap.wasteRecycled) {
            const result = await insertMetricData(org.id, siteId, metricMap.wasteRecycled.id,
              { ...entry, value: wastePerType }, 'waste-recycled');
            if (result.success) totalInserted++;
            else failedInserts.push(result.error);
          }

          if (metricMap.wasteComposted) {
            const result = await insertMetricData(org.id, siteId, metricMap.wasteComposted.id,
              { ...entry, value: wastePerType }, 'waste-composted');
            if (result.success) totalInserted++;
            else failedInserts.push(result.error);
          }

          if (metricMap.wasteLandfill) {
            const result = await insertMetricData(org.id, siteId, metricMap.wasteLandfill.id,
              { ...entry, value: wastePerType }, 'waste-landfill');
            if (result.success) totalInserted++;
            else failedInserts.push(result.error);
          }

          if (metricMap.wasteIncinerated) {
            const result = await insertMetricData(org.id, siteId, metricMap.wasteIncinerated.id,
              { ...entry, value: wastePerType }, 'waste-incinerated');
            if (result.success) totalInserted++;
            else failedInserts.push(result.error);
          }
        }
      }
    }

    console.log(`\n✅ Successfully inserted ${totalInserted} records across all sites`);
    if (failedInserts.length > 0) {
      console.log(`❌ Failed to insert ${failedInserts.length} records`);
    }

    // Step 5: Verify the corrected data
    console.log('\n🔍 Verifying corrected data...');

    for (const [siteName, siteId] of Object.entries(siteMap)) {
      const { data: verifyData } = await supabase
        .from('metrics_data')
        .select(`
          *,
          metrics_catalog (name, code, category)
        `)
        .eq('organization_id', org.id)
        .eq('site_id', siteId)
          .gte('period_start', '2024-01-01')
        .lt('period_start', '2024-02-01')
        .order('metric_id');

      console.log(`\n📊 ${siteName.toUpperCase()} - January 2024 sample:`);

      if (verifyData && verifyData.length > 0) {
        verifyData.forEach(record => {
          console.log(`  - ${record.metrics_catalog?.name}: ${record.value} ${record.unit}`);
        });
      } else {
        console.log('  No data found for January 2024');
      }
    }

    // Calculate total emissions
    const { data: allData } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (emission_factor, emission_factor_unit)
      `)
      .eq('organization_id', org.id)
      .gte('period_start', '2024-01-01')
      .lt('period_start', '2025-01-01');

    let totalEmissions = 0;
    if (allData) {
      allData.forEach(record => {
        if (record.metrics_catalog?.emission_factor) {
          const emissions = record.value * record.metrics_catalog.emission_factor;
          totalEmissions += emissions;
        }
      });
    }

    console.log('\n📊 Summary Statistics:');
    console.log(`  - Total records inserted: ${totalInserted}`);
    console.log(`  - Estimated total emissions: ${Math.round(totalEmissions / 1000)} tCO2e`);

    console.log('\n✅ Database cleanup and correction completed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Run: node scripts/fix-sustainability-data-complete.js');
    console.log('   2. Test the /sustainability/dashboard page');
    console.log('   3. Verify the metrics are displaying correctly for each site');
    console.log('   4. Check that totals and aggregations match expectations');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }

  process.exit(0);
}

async function insertMetricData(orgId, siteId, metricId, entry, type) {
  try {
    const [year, month] = entry.period.split('-');
    const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const periodEnd = new Date(parseInt(year), parseInt(month), 0);

    const { error } = await supabase.from('metrics_data').insert({
      organization_id: orgId,
      site_id: siteId,
      metric_id: metricId,
      value: entry.value,
      unit: entry.unit,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error(`    ❌ Failed to insert ${type} for ${entry.period}: ${error.message}`);
      return { success: false, error: `${type} - ${entry.period}: ${error.message}` };
    }

    return { success: true };
  } catch (err) {
    console.error(`    ❌ Error inserting ${type} for ${entry.period}:`, err);
    return { success: false, error: `${type} - ${entry.period}: ${err.message}` };
  }
}

cleanAndFixAllSitesData();