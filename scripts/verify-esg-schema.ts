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

async function verifyESGSchema() {
  console.log('🔍 Verifying ESG database schema...\n');

  const expectedTables = [
    'materiality_assessments',
    'esg_governance',
    'pollution_emissions',
    'biodiversity_sites',
    'circular_economy_flows',
    'workforce_demographics',
    'employee_development',
    'health_safety_metrics',
    'labor_relations',
    'pay_equity',
    'supplier_social_assessment',
    'community_engagement',
    'human_rights_assessment',
    'business_conduct',
    'board_composition',
    'eu_taxonomy_alignment',
    'climate_risks',
    'sustainability_targets',
    'product_footprints',
    'esg_reports'
  ];

  console.log('📊 Checking table existence...\n');
  
  for (const table of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Available (${count || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err}`);
    }
  }

  // Check views
  console.log('\n📈 Checking views...');
  const views = ['esg_dashboard', 'csrd_data_completeness'];
  
  for (const view of views) {
    try {
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ View ${view}: ${error.message}`);
      } else {
        console.log(`✅ View ${view}: Available`);
      }
    } catch (err) {
      console.log(`❌ View ${view}: ${err}`);
    }
  }

  // Check enhanced emissions_data columns
  console.log('\n🔬 Checking enhanced emissions_data columns...');
  try {
    const { data, error } = await supabase
      .from('emissions_data')
      .select('ghg_type, co2_kg, ch4_kg, location_based_co2e, market_based_co2e')
      .limit(1);
    
    if (error) {
      console.log(`❌ Enhanced emissions columns: ${error.message}`);
    } else {
      console.log(`✅ Enhanced emissions columns: Available`);
    }
  } catch (err) {
    console.log(`❌ Enhanced emissions columns: ${err}`);
  }

  // Test materiality_assessments structure
  console.log('\n🔍 Testing materiality_assessments structure...');
  try {
    const testData = {
      organization_id: '2274271e-679f-49d1-bda8-c92c77ae1d0c',
      assessment_date: '2024-01-01',
      material_topics: [{ topic: 'test', impact_score: 1 }]
    };

    const { error } = await supabase
      .from('materiality_assessments')
      .insert(testData);

    if (error) {
      console.log(`❌ Insert test: ${error.message}`);
    } else {
      console.log(`✅ Insert test: Successful`);
      // Clean up
      await supabase
        .from('materiality_assessments')
        .delete()
        .eq('assessment_date', '2024-01-01');
    }
  } catch (err) {
    console.log(`❌ Insert test: ${err}`);
  }

  console.log('\n📋 Schema verification completed!');
}

verifyESGSchema();