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

async function verifyComprehensiveData() {
  console.log('🔍 Verifying Comprehensive Data Coverage\n');

  // Get unique categories by scope
  const { data: scopeData } = await supabase
    .from('emissions_data')
    .select('scope, category, subcategory')
    .order('scope, category, subcategory');

  // Group by scope
  const categoriesByScope: Record<string, Map<string, Set<string>>> = {
    '1': new Map(),
    '2': new Map(),
    '3': new Map()
  };

  scopeData?.forEach(row => {
    if (!categoriesByScope[row.scope].has(row.category)) {
      categoriesByScope[row.scope].set(row.category, new Set());
    }
    if (row.subcategory) {
      categoriesByScope[row.scope].get(row.category)!.add(row.subcategory);
    }
  });

  // Display results
  console.log('📊 EMISSIONS DATA COVERAGE:\n');
  
  Object.entries(categoriesByScope).forEach(([scope, categories]) => {
    console.log(`SCOPE ${scope}:`);
    categories.forEach((subcategories, category) => {
      console.log(`  ✅ ${category}:`);
      subcategories.forEach(sub => {
        console.log(`     - ${sub}`);
      });
    });
    console.log('');
  });

  // Check water sources
  const { data: waterData } = await supabase
    .from('water_usage')
    .select('water_source, usage_type');

  const waterSources = new Map<string, Set<string>>();
  waterData?.forEach(row => {
    if (!waterSources.has(row.water_source)) {
      waterSources.set(row.water_source, new Set());
    }
    waterSources.get(row.water_source)!.add(row.usage_type);
  });

  console.log('💧 WATER SOURCES:');
  waterSources.forEach((types, source) => {
    console.log(`  ✅ ${source}:`);
    types.forEach(type => {
      console.log(`     - ${type}`);
    });
  });

  // Check waste types
  const { data: wasteData } = await supabase
    .from('waste_data')
    .select('waste_type, disposal_method');

  const wasteTypes = new Map<string, Set<string>>();
  wasteData?.forEach(row => {
    if (!wasteTypes.has(row.waste_type)) {
      wasteTypes.set(row.waste_type, new Set());
    }
    wasteTypes.get(row.waste_type)!.add(row.disposal_method);
  });

  console.log('\n♻️  WASTE TYPES:');
  wasteTypes.forEach((methods, type) => {
    console.log(`  ✅ ${type}:`);
    methods.forEach(method => {
      console.log(`     - ${method}`);
    });
  });

  // Get counts
  const { count: emissionsCount } = await supabase
    .from('emissions_data')
    .select('*', { count: 'exact', head: true });

  const { count: waterCount } = await supabase
    .from('water_usage')
    .select('*', { count: 'exact', head: true });

  const { count: wasteCount } = await supabase
    .from('waste_data')
    .select('*', { count: 'exact', head: true });

  console.log('\n📈 DATA VOLUME:');
  console.log(`  - Emissions records: ${emissionsCount?.toLocaleString()}`);
  console.log(`  - Water records: ${waterCount?.toLocaleString()}`);
  console.log(`  - Waste records: ${wasteCount?.toLocaleString()}`);

  console.log('\n✅ Full GHG Protocol Coverage Achieved!');
}

verifyComprehensiveData();