const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Energy source classification mappings
const energyClassifications = {
  // Electricity - Grid (fossil-dominated)
  'electricity-grid': {
    energy_source_type: 'fossil', // Portugal grid is ~40% fossil
    fuel_source: 'grid_mix',
    energy_type: 'electricity',
    generation_type: 'grid',
    is_renewable: false
  },
  'electricity-consumption': {
    energy_source_type: 'fossil',
    fuel_source: 'grid_mix',
    energy_type: 'electricity',
    generation_type: 'grid',
    is_renewable: false
  },

  // Renewable Electricity
  'electricity-solar': {
    energy_source_type: 'renewable',
    fuel_source: 'solar',
    energy_type: 'electricity',
    generation_type: 'self_generated',
    is_renewable: true
  },
  'electricity-wind': {
    energy_source_type: 'renewable',
    fuel_source: 'wind',
    energy_type: 'electricity',
    generation_type: 'purchased',
    is_renewable: true
  },
  'electricity-hydro': {
    energy_source_type: 'renewable',
    fuel_source: 'hydro',
    energy_type: 'electricity',
    generation_type: 'purchased',
    is_renewable: true
  },
  'electricity-renewable': {
    energy_source_type: 'renewable',
    fuel_source: 'renewable_mix',
    energy_type: 'electricity',
    generation_type: 'purchased',
    is_renewable: true
  },

  // Natural Gas
  'natural-gas': {
    energy_source_type: 'fossil',
    fuel_source: 'natural_gas',
    energy_type: 'fuel',
    generation_type: 'purchased',
    is_renewable: false
  },
  'gas-consumption': {
    energy_source_type: 'fossil',
    fuel_source: 'natural_gas',
    energy_type: 'fuel',
    generation_type: 'purchased',
    is_renewable: false
  },

  // Heating Oil / Diesel
  'heating-oil': {
    energy_source_type: 'fossil',
    fuel_source: 'oil',
    energy_type: 'fuel',
    generation_type: 'purchased',
    is_renewable: false
  },
  'diesel': {
    energy_source_type: 'fossil',
    fuel_source: 'diesel',
    energy_type: 'fuel',
    generation_type: 'purchased',
    is_renewable: false
  },

  // District Heating/Cooling
  'district-heating': {
    energy_source_type: 'fossil', // Typically fossil unless specified
    fuel_source: 'district_heating',
    energy_type: 'heating',
    generation_type: 'purchased',
    is_renewable: false
  },
  'district-cooling': {
    energy_source_type: 'fossil',
    fuel_source: 'district_cooling',
    energy_type: 'cooling',
    generation_type: 'purchased',
    is_renewable: false
  },

  // Biomass
  'biomass': {
    energy_source_type: 'renewable',
    fuel_source: 'biomass',
    energy_type: 'fuel',
    generation_type: 'purchased',
    is_renewable: true
  },

  // Coal
  'coal': {
    energy_source_type: 'fossil',
    fuel_source: 'coal',
    energy_type: 'fuel',
    generation_type: 'purchased',
    is_renewable: false
  }
};

async function classifyEnergyMetrics() {
  console.log('=== CLASSIFYING ENERGY METRICS ===\n');

  // Get all metrics from metrics_catalog
  const { data: metrics, error: fetchError } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id, code, name, category');

  if (fetchError) {
    console.error('❌ Error fetching metrics:', fetchError);
    return;
  }

  console.log(`Found ${metrics.length} metrics in catalog\n`);

  let updated = 0;
  let skipped = 0;

  for (const metric of metrics) {
    // Try to find a matching classification based on code or name
    let classification = null;

    // Match by exact code
    if (energyClassifications[metric.code]) {
      classification = energyClassifications[metric.code];
    } else {
      // Match by keywords in code or name
      const searchText = `${metric.code} ${metric.name}`.toLowerCase();

      if (searchText.includes('solar')) {
        classification = energyClassifications['electricity-solar'];
      } else if (searchText.includes('wind')) {
        classification = energyClassifications['electricity-wind'];
      } else if (searchText.includes('hydro')) {
        classification = energyClassifications['electricity-hydro'];
      } else if (searchText.includes('renewable') && searchText.includes('electric')) {
        classification = energyClassifications['electricity-renewable'];
      } else if (searchText.includes('natural') && searchText.includes('gas')) {
        classification = energyClassifications['natural-gas'];
      } else if (searchText.includes('gas') && !searchText.includes('emission')) {
        classification = energyClassifications['gas-consumption'];
      } else if (searchText.includes('diesel')) {
        classification = energyClassifications['diesel'];
      } else if (searchText.includes('heating') && searchText.includes('oil')) {
        classification = energyClassifications['heating-oil'];
      } else if (searchText.includes('district') && searchText.includes('heat')) {
        classification = energyClassifications['district-heating'];
      } else if (searchText.includes('district') && searchText.includes('cool')) {
        classification = energyClassifications['district-cooling'];
      } else if (searchText.includes('biomass')) {
        classification = energyClassifications['biomass'];
      } else if (searchText.includes('coal')) {
        classification = energyClassifications['coal'];
      } else if (searchText.includes('electric')) {
        classification = energyClassifications['electricity-grid'];
      } else if (searchText.includes('heating') && !searchText.includes('oil')) {
        classification = energyClassifications['district-heating'];
      } else if (searchText.includes('cooling')) {
        classification = energyClassifications['district-cooling'];
      } else if (searchText.includes('steam')) {
        classification = {
          energy_source_type: 'fossil',
          fuel_source: 'steam',
          energy_type: 'steam',
          generation_type: 'purchased',
          is_renewable: false
        };
      }
    }

    if (classification) {
      // Update the metric with classification
      const { error: updateError } = await supabaseAdmin
        .from('metrics_catalog')
        .update(classification)
        .eq('id', metric.id);

      if (updateError) {
        console.error(`❌ Error updating ${metric.code}:`, updateError);
      } else {
        console.log(`✅ ${metric.code}: ${classification.energy_source_type} - ${classification.fuel_source}`);
        updated++;
      }
    } else {
      console.log(`⏭️  ${metric.code}: No classification (skipped)`);
      skipped++;
    }
  }

  console.log('\n=== CLASSIFICATION SUMMARY ===');
  console.log(`Total metrics: ${metrics.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);

  // Show breakdown by energy source type
  const { data: breakdown } = await supabaseAdmin
    .from('metrics_catalog')
    .select('energy_source_type, is_renewable')
    .not('energy_source_type', 'is', null);

  if (breakdown) {
    const fossil = breakdown.filter(m => m.energy_source_type === 'fossil').length;
    const renewable = breakdown.filter(m => m.energy_source_type === 'renewable').length;
    const nuclear = breakdown.filter(m => m.energy_source_type === 'nuclear').length;

    console.log('\n=== ENERGY SOURCE BREAKDOWN ===');
    console.log(`Fossil: ${fossil}`);
    console.log(`Renewable: ${renewable}`);
    console.log(`Nuclear: ${nuclear}`);
  }
}

classifyEnergyMetrics();
