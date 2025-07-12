#!/usr/bin/env node

/**
 * Test ESG Components Database Integration
 * 
 * This script tests that all ESG components work correctly with the database schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmissionsTable() {
  console.log('\n🧪 Testing emissions table...');
  
  try {
    // Test insert with correct schema
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000', // placeholder UUID
      source_id: null,
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      activity_value: 1000,
      activity_unit: 'kWh',
      activity_description: 'Test electricity consumption',
      emission_factor: 0.433,
      emission_factor_unit: 'kgCO2e/kWh',
      emission_factor_source: 'EPA',
      co2e_tonnes: 0.433,
      data_quality: 'measured',
      verification_status: 'unverified',
      notes: 'Test emission record',
      created_by: '00000000-0000-0000-0000-000000000000'
    };

    const { data, error } = await supabase
      .from('emissions')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Emissions insert failed:', error.message);
      console.error('   Details:', error);
    } else {
      console.log('✅ Emissions table schema is correct');
      // Clean up test data
      if (data && data[0]) {
        if (data && data[0] && data[0].id) {
        await supabase.from('emissions').delete().eq('id', data[0].id);
      }
      }
    }
  } catch (err) {
    console.error('❌ Emissions test error:', err);
  }
}

async function testEnergyConsumptionTable() {
  console.log('\n🧪 Testing energy_consumption table...');
  
  try {
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      facility_id: null,
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      energy_type: 'electricity',
      consumption_value: 5000,
      consumption_unit: 'kWh',
      consumption_kwh: 5000,
      cost_amount: 750,
      cost_currency: 'USD',
      renewable_percentage: 25,
      grid_mix_percentage: 75,
      created_by: '00000000-0000-0000-0000-000000000000'
    };

    const { data, error } = await supabase
      .from('energy_consumption')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Energy consumption insert failed:', error.message);
    } else {
      console.log('✅ Energy consumption table schema is correct');
      if (data && data[0]) {
        if (data && data[0] && data[0].id) {
        await supabase.from('energy_consumption').delete().eq('id', data[0].id);
      }
      }
    }
  } catch (err) {
    console.error('❌ Energy consumption test error:', err);
  }
}

async function testWaterConsumptionTable() {
  console.log('\n🧪 Testing water_consumption table...');
  
  try {
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      facility_id: null,
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      water_source: 'municipal',
      consumption_m3: 100,
      discharge_m3: 80,
      recycled_m3: 0,
      cost_amount: 250,
      cost_currency: 'USD',
      water_stress_area: 'medium',
      created_by: '00000000-0000-0000-0000-000000000000'
    };

    const { data, error } = await supabase
      .from('water_consumption')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Water consumption insert failed:', error.message);
    } else {
      console.log('✅ Water consumption table schema is correct');
      if (data && data[0]) {
        if (data && data[0] && data[0].id) {
        await supabase.from('water_consumption').delete().eq('id', data[0].id);
      }
      }
    }
  } catch (err) {
    console.error('❌ Water consumption test error:', err);
  }
}

async function testWasteGenerationTable() {
  console.log('\n🧪 Testing waste_generation table...');
  
  try {
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      facility_id: null,
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      waste_type: 'msw',
      quantity_tonnes: 0.5,
      disposal_method: 'landfill',
      recovery_rate: 0,
      hazardous: false,
      diverted_from_disposal: 0,
      cost_amount: 125,
      cost_currency: 'USD',
      created_by: '00000000-0000-0000-0000-000000000000'
    };

    const { data, error } = await supabase
      .from('waste_generation')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Waste generation insert failed:', error.message);
    } else {
      console.log('✅ Waste generation table schema is correct');
      if (data && data[0]) {
        if (data && data[0] && data[0].id) {
        await supabase.from('waste_generation').delete().eq('id', data[0].id);
      }
      }
    }
  } catch (err) {
    console.error('❌ Waste generation test error:', err);
  }
}

async function testSustainabilityTargetsTable() {
  console.log('\n🧪 Testing sustainability_targets table...');
  
  try {
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Net Zero Target',
      description: 'Test target for net zero emissions',
      target_type: 'absolute_reduction',
      scopes: ['scope_1', 'scope_2'],
      baseline_year: 2023,
      baseline_value: 10000,
      baseline_unit: 'tCO2e',
      target_year: 2030,
      target_value: 0,
      target_unit: 'tCO2e',
      status: 'active',
      is_science_based: true,
      created_by: '00000000-0000-0000-0000-000000000000'
    };

    const { data, error } = await supabase
      .from('sustainability_targets')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Sustainability targets insert failed:', error.message);
    } else {
      console.log('✅ Sustainability targets table schema is correct');
      if (data && data[0]) {
        if (data && data[0] && data[0].id) {
        await supabase.from('sustainability_targets').delete().eq('id', data[0].id);
      }
      }
    }
  } catch (err) {
    console.error('❌ Sustainability targets test error:', err);
  }
}

async function testEmissionSourcesTable() {
  console.log('\n🧪 Testing emission_sources table...');
  
  try {
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Electricity Grid',
      code: 'test_grid',
      description: 'Test emission source',
      scope: 'scope_2',
      category: 'purchased_electricity',
      is_active: true
    };

    const { data, error } = await supabase
      .from('emission_sources')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Emission sources insert failed:', error.message);
    } else {
      console.log('✅ Emission sources table schema is correct');
      if (data && data[0]) {
        if (data && data[0] && data[0].id) {
        await supabase.from('emission_sources').delete().eq('id', data[0].id);
      }
      }
    }
  } catch (err) {
    console.error('❌ Emission sources test error:', err);
  }
}

async function testMaterialTopicsTable() {
  console.log('\n🧪 Testing material_topics table...');
  
  try {
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      topic_name: 'Climate Change',
      category: 'environmental',
      description: 'Climate change impacts and mitigation',
      business_impact_score: 4.5,
      stakeholder_concern_score: 5.0,
      is_material: true
    };

    const { data, error } = await supabase
      .from('material_topics')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Material topics insert failed:', error.message);
    } else {
      console.log('✅ Material topics table schema is correct');
      if (data && data[0]) {
        if (data && data[0] && data[0].id) {
        await supabase.from('material_topics').delete().eq('id', data[0].id);
      }
      }
    }
  } catch (err) {
    console.error('❌ Material topics test error:', err);
  }
}

async function runAllTests() {
  console.log('🚀 Starting ESG components database tests...\n');
  
  await testEmissionsTable();
  await testEnergyConsumptionTable();
  await testWaterConsumptionTable();
  await testWasteGenerationTable();
  await testSustainabilityTargetsTable();
  await testEmissionSourcesTable();
  await testMaterialTopicsTable();
  
  console.log('\n✨ All tests completed!');
}

// Run tests
runAllTests().catch(console.error);