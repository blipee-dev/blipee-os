const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================================================
// RAW DATA FROM YOUR TABLES
// ============================================================================

// LISBOA TRAVEL DATA (2022-2024)
const lisboaTravelData = {
  2022: [
    { month: 1, planes: 10, trains: 1221 },
    { month: 2, planes: 24988, trains: 0 },
    { month: 3, planes: 48770, trains: 0 },
    { month: 4, planes: 100556, trains: 0 },
    { month: 5, planes: 19187, trains: 0 },
    { month: 6, planes: 69854, trains: 0 },
    { month: 7, planes: 85860, trains: 0 },
    { month: 8, planes: 866, trains: 0 },
    { month: 9, planes: 97966, trains: 1328 },
    { month: 10, planes: 224557, trains: 2656 },
    { month: 11, planes: 37998, trains: 3123 },
    { month: 12, planes: 0, trains: 3977 }
  ],
  2023: [
    { month: 1, planes: 16301, trains: 3606 },
    { month: 2, planes: 72743, trains: 1276 },
    { month: 3, planes: 17728, trains: 1930 },
    { month: 4, planes: 15554, trains: 550 },
    { month: 5, planes: 127790, trains: 0 },
    { month: 6, planes: 82093, trains: 3095 },
    { month: 7, planes: 72972, trains: 3095 },
    { month: 8, planes: 2520, trains: 1075 },
    { month: 9, planes: 96228, trains: 5095 },
    { month: 10, planes: 84456, trains: 3402 },
    { month: 11, planes: 109725, trains: 8774 },
    { month: 12, planes: 116077, trains: 3987 }
  ],
  2024: [
    { month: 1, planes: 49862, trains: 1917 },
    { month: 2, planes: 104723, trains: 4645 },
    { month: 3, planes: 212473, trains: 5957 },
    { month: 4, planes: 168211, trains: 998 },
    { month: 5, planes: 343110, trains: 7213 },
    { month: 6, planes: 114616, trains: 3732 },
    { month: 7, planes: 12204, trains: 7455 },
    { month: 8, planes: 21041, trains: 0 },
    { month: 9, planes: 417804, trains: 3743 },
    { month: 10, planes: 371677, trains: 5299 },
    { month: 11, planes: 252137, trains: 3448 },
    { month: 12, planes: 174263, trains: 6829 }
  ]
};

// WATER CONSUMPTION DATA (m³) - All sites
const waterData = {
  lisboa: {
    2022: [
      { month: 1, human: 18.4, sanitary: 5.3 },
      { month: 2, human: 10.4, sanitary: 3.0 },
      { month: 3, human: 18.1, sanitary: 5.3 },
      { month: 4, human: 24.0, sanitary: 7.0 },
      { month: 5, human: 29.5, sanitary: 8.6 },
      { month: 6, human: 26.6, sanitary: 7.7 },
      { month: 7, human: 30.7, sanitary: 8.9 },
      { month: 8, human: 19.6, sanitary: 5.7 },
      { month: 9, human: 31.6, sanitary: 9.2 },
      { month: 10, human: 29.3, sanitary: 8.5 },
      { month: 11, human: 31.4, sanitary: 9.1 },
      { month: 12, human: 23.8, sanitary: 6.9 }
    ],
    2023: [
      { month: 1, human: 32.1, sanitary: 9.3 },
      { month: 2, human: 28.2, sanitary: 8.2 },
      { month: 3, human: 30.5, sanitary: 8.9 },
      { month: 4, human: 21.4, sanitary: 6.2 },
      { month: 5, human: 27.1, sanitary: 7.9 },
      { month: 6, human: 23.8, sanitary: 6.9 },
      { month: 7, human: 28.5, sanitary: 8.3 },
      { month: 8, human: 18.4, sanitary: 5.3 },
      { month: 9, human: 29.4, sanitary: 8.5 },
      { month: 10, human: 7.8, sanitary: 2.3 },
      { month: 11, human: 34.4, sanitary: 10.0 },
      { month: 12, human: 25.0, sanitary: 7.3 }
    ],
    2024: [
      { month: 1, human: 28.8, sanitary: 8.3 },
      { month: 2, human: 24.4, sanitary: 6.7 },
      { month: 3, human: 28.6, sanitary: 8.3 },
      { month: 4, human: 24.5, sanitary: 7.1 },
      { month: 5, human: 28.4, sanitary: 8.2 },
      { month: 6, human: 25.1, sanitary: 7.3 },
      { month: 7, human: 29.1, sanitary: 8.6 },
      { month: 8, human: 18.8, sanitary: 5.5 },
      { month: 9, human: 30.0, sanitary: 8.8 },
      { month: 10, human: 18.9, sanitary: 5.4 },
      { month: 11, human: 32.5, sanitary: 9.5 },
      { month: 12, human: 24.4, sanitary: 7.1 }
    ]
  },
  porto: {
    2022: [
      { month: 1, human: 4.9, sanitary: 2.1 },
      { month: 2, human: 5.6, sanitary: 2.4 },
      { month: 3, human: 7.0, sanitary: 3.0 },
      { month: 4, human: 8.4, sanitary: 3.6 },
      { month: 5, human: 5.6, sanitary: 2.4 },
      { month: 6, human: 9.1, sanitary: 3.9 },
      { month: 7, human: 8.4, sanitary: 3.6 },
      { month: 8, human: 6.3, sanitary: 2.7 },
      { month: 9, human: 7.0, sanitary: 3.0 },
      { month: 10, human: 7.0, sanitary: 3.0 },
      { month: 11, human: 8.4, sanitary: 3.6 },
      { month: 12, human: 3.5, sanitary: 1.5 }
    ],
    2023: [
      { month: 1, human: 5.6, sanitary: 2.4 },
      { month: 2, human: 7.0, sanitary: 3.0 },
      { month: 3, human: 8.4, sanitary: 3.6 },
      { month: 4, human: 10.5, sanitary: 4.5 },
      { month: 5, human: 6.3, sanitary: 2.7 },
      { month: 6, human: 10.5, sanitary: 4.5 },
      { month: 7, human: 9.8, sanitary: 4.2 },
      { month: 8, human: 7.7, sanitary: 3.3 },
      { month: 9, human: 7.7, sanitary: 3.3 },
      { month: 10, human: 8.4, sanitary: 3.6 },
      { month: 11, human: 9.8, sanitary: 4.2 },
      { month: 12, human: 4.2, sanitary: 1.8 }
    ],
    2024: [
      { month: 1, human: 5.6, sanitary: 2.4 },
      { month: 2, human: 7.0, sanitary: 3.0 },
      { month: 3, human: 8.4, sanitary: 3.6 },
      { month: 4, human: 10.5, sanitary: 4.5 },
      { month: 5, human: 6.3, sanitary: 2.7 },
      { month: 6, human: 10.5, sanitary: 4.5 },
      { month: 7, human: 9.8, sanitary: 4.2 },
      { month: 8, human: 7.7, sanitary: 3.3 },
      { month: 9, human: 8.4, sanitary: 3.6 },
      { month: 10, human: 7.1, sanitary: 3.0 },
      { month: 11, human: 7.9, sanitary: 3.4 },
      { month: 12, human: 6.8, sanitary: 2.9 }
    ]
  },
  faro: {
    2022: [
      { month: 1, human: 4, sanitary: 1 },
      { month: 2, human: 4, sanitary: 1 },
      { month: 3, human: 5, sanitary: 2 },
      { month: 4, human: 6, sanitary: 2 },
      { month: 5, human: 4, sanitary: 1 },
      { month: 6, human: 7, sanitary: 1 },
      { month: 7, human: 6, sanitary: 2 },
      { month: 8, human: 5, sanitary: 1 },
      { month: 9, human: 5, sanitary: 2 },
      { month: 10, human: 5, sanitary: 2 },
      { month: 11, human: 6, sanitary: 2 },
      { month: 12, human: 3, sanitary: 0 }
    ],
    2023: [
      { month: 1, human: 4, sanitary: 1 },
      { month: 2, human: 5, sanitary: 1 },
      { month: 3, human: 6, sanitary: 2 },
      { month: 4, human: 7, sanitary: 2 },
      { month: 5, human: 5, sanitary: 1 },
      { month: 6, human: 8, sanitary: 2 },
      { month: 7, human: 7, sanitary: 2 },
      { month: 8, human: 5, sanitary: 2 },
      { month: 9, human: 6, sanitary: 2 },
      { month: 10, human: 6, sanitary: 2 },
      { month: 11, human: 7, sanitary: 2 },
      { month: 12, human: 3, sanitary: 1 }
    ],
    2024: [
      { month: 1, human: 4, sanitary: 2 },
      { month: 2, human: 5, sanitary: 1 },
      { month: 3, human: 6, sanitary: 2 },
      { month: 4, human: 8, sanitary: 2 },
      { month: 5, human: 5, sanitary: 1 },
      { month: 6, human: 8, sanitary: 2 },
      { month: 7, human: 8, sanitary: 2 },
      { month: 8, human: 6, sanitary: 1 },
      { month: 9, human: 6, sanitary: 2 },
      { month: 10, human: 6, sanitary: 2 },
      { month: 11, human: 8, sanitary: 2 },
      { month: 12, human: 3, sanitary: 1 }
    ]
  }
};

// ELECTRICITY CONSUMPTION DATA (kWh) - All sites
const electricityData = {
  lisboa: {
    2022: [33906, 32902, 38464, 33171, 39109, 32733, 38208, 35826, 40988, 37745, 34248, 27981],
    2023: [36902, 29198, 28723, 26842, 29847, 28397, 30200, 28144, 28671, 29761, 28066, 20308],
    2024: [25671, 22771, 26535, 34201, 34134, 32327, 37193, 34738, 36910, 38106, 28918, 36363]
  },
  porto: {
    2022: [2388, 4479, 4983, 4437, 4739, 4636, 5188, 4924, 5000, 4734, 3242, 5470],
    2023: [3567, 5364, 5308, 4962, 5166, 5200, 5595, 5434, 5030, 5166, 5004, 5601],
    2024: [5601, 2103, 10514, 4805, 4682, 5601, 5473, 5281, 4072, 3880, 3816, 4110]
  },
  faro: {
    2022: [814, 847, 1247, 815, 1372, 1243, 1446, 1449, 1483, 1754, 1447, 1347],
    2023: [1455, 766, 1017, 934, 1234, 1430, 1442, 1496, 1447, 1715, 1342, 941],
    2024: [1349, 1000, 1211, 1359, 1395, 1422, 1685, 1914, 1647, 1531, 1224, 1343]
  }
};

// HEATING DATA (kWh) - Lisboa and Porto only
const heatingData = {
  lisboa: {
    2022: [18164, 11317, 10655, 8556, 2725, 1638, 873, 868, 771, 1216, 3373, 6415],
    2023: [12678, 7187, 4742, 1125, 774, 533, 786, 489, 1058, 1830, 4021, 15464],
    2024: [15701, 9801, 10766, 4015, 3476, 250, 743, 255, 1475, 2894, 4882, 25065]
  },
  porto: {
    2022: [18131, 12855, 13620, 9030, 3084, 2633, 1627, 1492, 2760, 7264, 12408, 14672],
    2023: [18765, 12786, 10867, 5500, 2562, 1827, 2888, 2180, 3167, 4189, 10018, 16629],
    2024: [13814, 8314, 9, 2201, 126, 2, 7, 15, 18, 24, 654, 6263]
  }
};

// COOLING DATA (kWh) - Lisboa and Porto only
const coolingData = {
  lisboa: {
    2022: [11481, 16980, 18129, 20392, 47774, 45247, 73926, 61105, 51064, 39154, 19574, 8877],
    2023: [9283, 30380, 10655, 21976, 35574, 48198, 53685, 53485, 42591, 38719, 14180, 7783],
    2024: [8953, 10408, 11023, 28691, 31284, 51792, 40892, 49047, 37366, 41728, 10261, 6726]
  },
  porto: {
    2022: [8877, 8258, 6792, 8170, 11388, 13527, 17740, 16208, 16739, 12732, 7910, 5898],
    2023: [7582, 8047, 8465, 12000, 15885, 20038, 21405, 22027, 16512, 12860, 6066, 7089],
    2024: [7058, 6836, 7998, 8783, 8498, 11675, 15304, 13313, 16000, 4556, 3768, 3986]
  }
};

// EV CHARGER DATA (kWh) - 2024 only, Lisboa and Porto
const evChargerData = {
  lisboa: {
    2024: [2593.4, 2139.3, 2376.1, 2611.2, 2475.2, 1944.1, 2357.2, 1806.2, 3079.7, 2063.6, 1822.3, 1785.6]
  },
  porto: {
    2024: [455.3, 361.7, 318.6, 341.0, 313.5, 372.9, 345.4, 146.8, 368.0, 489.8, 579.6, 450.9]
  }
};

// WASTE DATA (kg) - All sites
const wasteData = {
  lisboa: {
    2022: [
      { month: 1, organic: 258.1, paper: 709 },
      { month: 2, organic: 233.1, paper: 641 },
      { month: 3, organic: 258.1, paper: 709 },
      { month: 4, organic: 249.8, paper: 686 },
      { month: 5, organic: 258.1, paper: 709 },
      { month: 6, organic: 249.8, paper: 686 },
      { month: 7, organic: 258.1, paper: 709 },
      { month: 8, organic: 258.1, paper: 709 },
      { month: 9, organic: 249.8, paper: 686 },
      { month: 10, organic: 258.1, paper: 709 },
      { month: 11, organic: 249.8, paper: 686 },
      { month: 12, organic: 258.1, paper: 709 }
    ],
    2023: [
      { month: 1, organic: 266.6, paper: 331 },
      { month: 2, organic: 240.8, paper: 299 },
      { month: 3, organic: 266.6, paper: 331 },
      { month: 4, organic: 258.0, paper: 320 },
      { month: 5, organic: 266.6, paper: 331 },
      { month: 6, organic: 258.0, paper: 320 },
      { month: 7, organic: 266.6, paper: 331 },
      { month: 8, organic: 266.6, paper: 331 },
      { month: 9, organic: 258.0, paper: 320 },
      { month: 10, organic: 266.6, paper: 331 },
      { month: 11, organic: 258.0, paper: 320 },
      { month: 12, organic: 266.6, paper: 331 }
    ],
    2024: [
      { month: 1, organic: 194.0, paper: 298.02, ewaste: 1.08, construction: 670, bulky: 467.5, dvd: 9.83 },
      { month: 2, organic: 174.6, paper: 269.18, ewaste: 1.08, construction: 670, bulky: 467.5, dvd: 9.83 },
      { month: 3, organic: 213.4, paper: 298.02, ewaste: 1.08, construction: 670, bulky: 467.5, dvd: 9.83 },
      { month: 4, organic: 193.8, paper: 288.41, ewaste: 1.08, construction: 670, bulky: 467.5, dvd: 9.83 },
      { month: 5, organic: 203.7, paper: 298.02, ewaste: 1.08, construction: 670, bulky: 467.5, dvd: 9.83 },
      { month: 6, organic: 184.3, paper: 288.41, ewaste: 1.08, construction: 670, bulky: 467.5, dvd: 9.83 },
      { month: 7, organic: 174.6, paper: 298.02, ewaste: 1.08, construction: 670, bulky: 467.5, dvd: 9.83 },
      { month: 8, organic: 155.2, paper: 298.02, ewaste: 1.08, construction: 670, bulky: 467.5, dvd: 9.83 },
      { month: 9, organic: 203.7, paper: 288.41, ewaste: 1.08, construction: 0, bulky: 0, dvd: 9.83 },
      { month: 10, organic: 223.1, paper: 298.02, ewaste: 1.08, construction: 0, bulky: 0, dvd: 9.83 },
      { month: 11, organic: 203.7, paper: 288.41, ewaste: 1.08, construction: 0, bulky: 0, dvd: 9.83 },
      { month: 12, organic: 174.6, paper: 298.02, ewaste: 1.08, construction: 0, bulky: 0, dvd: 9.83 }
    ]
  },
  porto: {
    2024: [
      { month: 1, organic: 23.9, paper: 60 },
      { month: 2, organic: 21.4, paper: 60 },
      { month: 3, organic: 23.9, paper: 60 },
      { month: 4, organic: 23.9, paper: 60 },
      { month: 5, organic: 23.9, paper: 60 },
      { month: 6, organic: 23.9, paper: 60 },
      { month: 7, organic: 16.7, paper: 60 },
      { month: 8, organic: 15.8, paper: 60 },
      { month: 9, organic: 23.9, paper: 60 },
      { month: 10, organic: 23.9, paper: 60 },
      { month: 11, organic: 23.9, paper: 60 },
      { month: 12, organic: 23.9, paper: 65 }
    ]
  },
  faro: {
    2024: [
      { month: 1, organic: 5.3, paper: 18 },
      { month: 2, organic: 4.8, paper: 18 },
      { month: 3, organic: 5.3, paper: 18 },
      { month: 4, organic: 5.3, paper: 18 },
      { month: 5, organic: 5.3, paper: 18 },
      { month: 6, organic: 5.3, paper: 18 },
      { month: 7, organic: 3.7, paper: 18 },
      { month: 8, organic: 3.5, paper: 18 },
      { month: 9, organic: 5.3, paper: 18 },
      { month: 10, organic: 5.3, paper: 18 },
      { month: 11, organic: 5.3, paper: 18 },
      { month: 12, organic: 5.3, paper: 19 }
    ]
  }
};

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

async function importAllData() {
  console.log('🚀 Starting complete historical data import (2022-2024)...\n');

  try {
    // Step 1: Get organization and sites
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

    const siteMap = {
      lisboa: sites.find(s => s.name === 'Lisboa - FPM41')?.id,
      porto: sites.find(s => s.name === 'Porto - POP')?.id,
      faro: sites.find(s => s.name === 'Faro')?.id
    };

    console.log('📍 Organization and sites found:');
    console.log(`  - Organization: ${org.id}`);
    Object.entries(siteMap).forEach(([name, id]) => {
      console.log(`  - ${name}: ${id}`);
    });

    // Step 2: Get metric IDs
    const { data: metrics } = await supabase
      .from('metrics_catalog')
      .select('id, code, name');

    const metricMap = {
      planes: metrics.find(m => m.name === 'Plane Travel')?.id,
      trains: metrics.find(m => m.name === 'Train Travel')?.id,
      electricity: metrics.find(m => m.name === 'Electricity')?.id,
      water: metrics.find(m => m.name === 'Water')?.id,
      wastewater: metrics.find(m => m.name === 'Wastewater')?.id,
      heating: metrics.find(m => m.name === 'Purchased Heating')?.id,
      cooling: metrics.find(m => m.name === 'Purchased Cooling')?.id,
      evCharging: metrics.find(m => m.name === 'EV Charging')?.id,
      wasteOrganic: metrics.find(m => m.name === 'Waste Composted')?.id,
      wastePaper: metrics.find(m => m.name === 'Waste Recycled')?.id,
      wasteEwaste: metrics.find(m => m.name === 'E-Waste')?.id,
      wasteConstruction: metrics.find(m => m.name === 'Waste to Landfill')?.id,
      wasteBulky: metrics.find(m => m.name === 'Waste Incinerated')?.id
    };

    console.log('\n📊 Metrics found:');
    Object.entries(metricMap).forEach(([key, id]) => {
      console.log(`  - ${key}: ${id}`);
    });

    // Step 3: Delete ALL existing data from 2022-2024
    console.log('\n🗑️  Deleting all existing 2022-2024 data...');

    const { error: deleteError, count } = await supabase
      .from('metrics_data')
      .delete({ count: 'exact' })
      .eq('organization_id', org.id)
      .gte('period_start', '2022-01-01')
      .lt('period_start', '2025-01-01');

    if (deleteError) throw deleteError;
    console.log(`✅ Deleted ${count || 0} existing records`);

    // Step 4: Import all data
    console.log('\n📥 Importing all historical data...');
    let totalInserted = 0;

    // Import travel data (Lisboa only)
    console.log('\n✈️ Importing travel data...');
    for (const year of [2022, 2023, 2024]) {
      for (const monthData of lisboaTravelData[year]) {
        // Planes
        if (monthData.planes > 0 && metricMap.planes) {
          await insertMetric(org.id, siteMap.lisboa, metricMap.planes, year, monthData.month, monthData.planes, 'km');
          totalInserted++;
        }
        // Trains
        if (monthData.trains > 0 && metricMap.trains) {
          await insertMetric(org.id, siteMap.lisboa, metricMap.trains, year, monthData.month, monthData.trains, 'km');
          totalInserted++;
        }
      }
    }

    // Import water data (all sites)
    console.log('\n💧 Importing water data...');
    for (const site of ['lisboa', 'porto', 'faro']) {
      for (const year of [2022, 2023, 2024]) {
        if (waterData[site][year]) {
          for (const monthData of waterData[site][year]) {
            const total = monthData.human + monthData.sanitary;
            if (total > 0 && metricMap.water) {
              await insertMetric(org.id, siteMap[site], metricMap.water, year, monthData.month, total, 'm³');
              totalInserted++;
            }
            // Also add as wastewater (same amount)
            if (total > 0 && metricMap.wastewater) {
              await insertMetric(org.id, siteMap[site], metricMap.wastewater, year, monthData.month, total, 'm³');
              totalInserted++;
            }
          }
        }
      }
    }

    // Import electricity data (all sites)
    console.log('\n⚡ Importing electricity data...');
    for (const site of ['lisboa', 'porto', 'faro']) {
      for (const year of [2022, 2023, 2024]) {
        const yearData = electricityData[site][year];
        for (let month = 1; month <= 12; month++) {
          const value = yearData[month - 1];
          if (value > 0 && metricMap.electricity) {
            await insertMetric(org.id, siteMap[site], metricMap.electricity, year, month, value, 'kWh');
            totalInserted++;
          }
        }
      }
    }

    // Import heating data (Lisboa and Porto)
    console.log('\n🔥 Importing heating data...');
    for (const site of ['lisboa', 'porto']) {
      for (const year of [2022, 2023, 2024]) {
        const yearData = heatingData[site][year];
        for (let month = 1; month <= 12; month++) {
          const value = yearData[month - 1];
          if (value > 0 && metricMap.heating) {
            await insertMetric(org.id, siteMap[site], metricMap.heating, year, month, value, 'kWh');
            totalInserted++;
          }
        }
      }
    }

    // Import cooling data (Lisboa and Porto)
    console.log('\n❄️  Importing cooling data...');
    for (const site of ['lisboa', 'porto']) {
      for (const year of [2022, 2023, 2024]) {
        const yearData = coolingData[site][year];
        for (let month = 1; month <= 12; month++) {
          const value = yearData[month - 1];
          if (value > 0 && metricMap.cooling) {
            await insertMetric(org.id, siteMap[site], metricMap.cooling, year, month, value, 'kWh');
            totalInserted++;
          }
        }
      }
    }

    // Import EV charger data (2024 only, Lisboa and Porto)
    console.log('\n🔌 Importing EV charger data...');
    for (const site of ['lisboa', 'porto']) {
      if (evChargerData[site][2024]) {
        const yearData = evChargerData[site][2024];
        for (let month = 1; month <= 12; month++) {
          const value = yearData[month - 1];
          if (value > 0 && metricMap.evCharging) {
            await insertMetric(org.id, siteMap[site], metricMap.evCharging, 2024, month, value, 'kWh');
            totalInserted++;
          }
        }
      }
    }

    // Import waste data
    console.log('\n♻️  Importing waste data...');
    for (const site of ['lisboa', 'porto', 'faro']) {
      for (const year of [2022, 2023, 2024]) {
        if (wasteData[site][year]) {
          for (const monthData of wasteData[site][year]) {
            // Organic waste
            if (monthData.organic > 0 && metricMap.wasteOrganic) {
              await insertMetric(org.id, siteMap[site], metricMap.wasteOrganic, year, monthData.month, monthData.organic, 'kg');
              totalInserted++;
            }
            // Paper waste
            if (monthData.paper > 0 && metricMap.wastePaper) {
              await insertMetric(org.id, siteMap[site], metricMap.wastePaper, year, monthData.month, monthData.paper, 'kg');
              totalInserted++;
            }
            // E-waste (2024 Lisboa only)
            if (monthData.ewaste > 0 && metricMap.wasteEwaste) {
              await insertMetric(org.id, siteMap[site], metricMap.wasteEwaste, year, monthData.month, monthData.ewaste, 'kg');
              totalInserted++;
            }
            // Construction waste (2024 Lisboa only)
            if (monthData.construction > 0 && metricMap.wasteConstruction) {
              await insertMetric(org.id, siteMap[site], metricMap.wasteConstruction, year, monthData.month, monthData.construction, 'kg');
              totalInserted++;
            }
            // Bulky waste (2024 Lisboa only)
            if (monthData.bulky > 0 && metricMap.wasteBulky) {
              await insertMetric(org.id, siteMap[site], metricMap.wasteBulky, year, monthData.month, monthData.bulky, 'kg');
              totalInserted++;
            }
          }
        }
      }
    }

    console.log(`\n✅ Successfully imported ${totalInserted} records!`);

    // Step 5: Verify the import
    console.log('\n🔍 Verifying imported data...');

    const { data: verifyData, count: finalCount } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: false })
      .eq('organization_id', org.id)
      .gte('period_start', '2022-01-01')
      .lt('period_start', '2025-01-01')
      .limit(5);

    console.log(`\n📊 Total records in database (2022-2024): ${finalCount}`);
    console.log('\n✅ Data import completed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Test the /sustainability/dashboard page');
    console.log('   2. Verify metrics are displaying correctly');
    console.log('   3. Check historical comparisons');

  } catch (error) {
    console.error('❌ Error during import:', error);
  }

  process.exit(0);
}

async function insertMetric(orgId, siteId, metricId, year, month, value, unit) {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);

  const { error } = await supabase.from('metrics_data').insert({
    organization_id: orgId,
    site_id: siteId,
    metric_id: metricId,
    value: value,
    unit: unit,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error(`❌ Failed to insert ${year}-${month}: ${error.message}`);
  }
}

// Run the import
importAllData();