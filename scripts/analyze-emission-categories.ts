import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Comprehensive GHG Protocol categories
const REQUIRED_CATEGORIES = {
  scope1: [
    'stationary_combustion', // Natural gas, oil, coal for heating
    'mobile_combustion', // Company vehicles, fleet
    'process_emissions', // Industrial processes
    'fugitive_emissions' // Refrigerants, gas leaks
  ],
  scope2: [
    'purchased_electricity',
    'purchased_steam',
    'purchased_heating',
    'purchased_cooling'
  ],
  scope3: [
    'purchased_goods_services', // Category 1
    'capital_goods', // Category 2
    'fuel_energy_activities', // Category 3
    'upstream_transportation', // Category 4
    'waste_generated', // Category 5
    'business_travel', // Category 6
    'employee_commuting', // Category 7
    'upstream_leased_assets', // Category 8
    'downstream_transportation', // Category 9
    'processing_sold_products', // Category 10
    'use_of_sold_products', // Category 11
    'end_of_life_treatment', // Category 12
    'downstream_leased_assets', // Category 13
    'franchises', // Category 14
    'investments' // Category 15
  ]
};

async function analyzeEmissionCategories() {
  console.log('🔍 Analyzing Emission Categories Coverage\n');

  // Get all unique categories from database
  const { data: emissions } = await supabase
    .from('emissions_data')
    .select('scope, category, subcategory')
    .order('scope');

  // Group by scope and category
  const categoriesByScope: Record<string, Set<string>> = {
    '1': new Set(),
    '2': new Set(),
    '3': new Set()
  };

  const subcategoriesByCategory: Record<string, Set<string>> = {};

  emissions?.forEach(e => {
    categoriesByScope[e.scope].add(e.category);
    if (!subcategoriesByCategory[e.category]) {
      subcategoriesByCategory[e.category] = new Set();
    }
    if (e.subcategory) {
      subcategoriesByCategory[e.category].add(e.subcategory);
    }
  });

  // Display current coverage
  console.log('📊 Current Database Coverage:\n');
  
  console.log('SCOPE 1 (Direct Emissions):');
  console.log('✅ Have:');
  Array.from(categoriesByScope['1']).forEach(cat => {
    const subcats = Array.from(subcategoriesByCategory[cat] || []);
    console.log(`   - ${cat}${subcats.length > 0 ? ': ' + subcats.join(', ') : ''}`);
  });
  console.log('❌ Missing:');
  REQUIRED_CATEGORIES.scope1.forEach(cat => {
    if (!Array.from(categoriesByScope['1']).some(c => c.includes(cat.split('_')[0]))) {
      console.log(`   - ${cat}`);
    }
  });

  console.log('\nSCOPE 2 (Indirect - Energy):');
  console.log('✅ Have:');
  Array.from(categoriesByScope['2']).forEach(cat => {
    const subcats = Array.from(subcategoriesByCategory[cat] || []);
    console.log(`   - ${cat}${subcats.length > 0 ? ': ' + subcats.join(', ') : ''}`);
  });
  console.log('❌ Missing:');
  REQUIRED_CATEGORIES.scope2.forEach(cat => {
    if (!Array.from(categoriesByScope['2']).some(c => c.includes(cat.split('_')[0]))) {
      console.log(`   - ${cat}`);
    }
  });

  console.log('\nSCOPE 3 (Other Indirect):');
  console.log('✅ Have:');
  Array.from(categoriesByScope['3']).forEach(cat => {
    const subcats = Array.from(subcategoriesByCategory[cat] || []);
    console.log(`   - ${cat}${subcats.length > 0 ? ': ' + subcats.join(', ') : ''}`);
  });
  console.log('❌ Missing:');
  const missingScope3 = REQUIRED_CATEGORIES.scope3.filter(cat => 
    !Array.from(categoriesByScope['3']).some(c => c === cat || c.includes(cat.split('_')[0]))
  );
  missingScope3.forEach(cat => {
    console.log(`   - ${cat}`);
  });

  // Check water data
  console.log('\n💧 Water Data:');
  const { data: waterSources } = await supabase
    .from('water_usage')
    .select('water_source, usage_type')
    .limit(100);
  
  const uniqueWaterSources = new Set(waterSources?.map(w => `${w.water_source} (${w.usage_type})`));
  console.log('✅ Have:');
  Array.from(uniqueWaterSources).forEach(source => {
    console.log(`   - ${source}`);
  });

  // Check waste data
  console.log('\n♻️  Waste Data:');
  const { data: wasteTypes } = await supabase
    .from('waste_data')
    .select('waste_type, disposal_method')
    .limit(100);
  
  const uniqueWasteTypes = new Set(wasteTypes?.map(w => `${w.waste_type} → ${w.disposal_method}`));
  console.log('✅ Have:');
  Array.from(uniqueWasteTypes).forEach(type => {
    console.log(`   - ${type}`);
  });

  // Summary
  console.log('\n📈 Coverage Summary:');
  console.log(`   Scope 1: ${categoriesByScope['1'].size} categories`);
  console.log(`   Scope 2: ${categoriesByScope['2'].size} categories`);
  console.log(`   Scope 3: ${categoriesByScope['3'].size}/${REQUIRED_CATEGORIES.scope3.length} categories`);
  
  console.log('\n⚠️  Critical Missing Categories for Full GHG Protocol:');
  console.log('   Scope 1: Process emissions, Fugitive emissions');
  console.log('   Scope 2: Purchased steam, heating, cooling');
  console.log('   Scope 3: Most categories (11 of 15 missing)');
  console.log('\n💡 Recommendation: Add more diverse emission categories for comprehensive reporting');
}

analyzeEmissionCategories();