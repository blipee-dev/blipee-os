#!/usr/bin/env node

/**
 * Seed ESG Data
 * 
 * This script populates the database with test organizations, facilities,
 * and ESG data for development and testing
 */

const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test organization data
const testOrganizations = [
  {
    name: 'TechCorp Global',
    industry: 'Technology',
    size: 'large',
    country: 'US',
    description: 'Leading technology company focused on sustainable innovation',
    fiscal_year: 'calendar',
    reporting_boundary: 'operational_control'
  },
  {
    name: 'GreenManufacturing Inc',
    industry: 'Manufacturing',
    size: 'medium',
    country: 'DE',
    description: 'Sustainable manufacturing with net-zero commitment',
    fiscal_year: 'calendar',
    reporting_boundary: 'financial_control'
  },
  {
    name: 'EcoRetail Solutions',
    industry: 'Retail',
    size: 'large',
    country: 'UK',
    description: 'Sustainable retail chain with circular economy focus',
    fiscal_year: 'fiscal_april',
    reporting_boundary: 'equity_share'
  }
];

// Test facilities
const facilityTemplates = [
  { name: 'Headquarters', type: 'office', size_sqm: 25000 },
  { name: 'Manufacturing Plant', type: 'industrial', size_sqm: 50000 },
  { name: 'Distribution Center', type: 'warehouse', size_sqm: 35000 },
  { name: 'R&D Facility', type: 'laboratory', size_sqm: 15000 },
  { name: 'Regional Office', type: 'office', size_sqm: 8000 }
];

// Emission sources
const emissionSources = [
  { name: 'Natural Gas - Buildings', scope: 'scope_1', category: 'stationary_combustion', unit: 'm3', factor: 2.02 },
  { name: 'Fleet Vehicles - Gasoline', scope: 'scope_1', category: 'mobile_combustion', unit: 'liters', factor: 2.31 },
  { name: 'Fleet Vehicles - Diesel', scope: 'scope_1', category: 'mobile_combustion', unit: 'liters', factor: 2.68 },
  { name: 'Electricity - Grid', scope: 'scope_2', category: 'purchased_electricity', unit: 'kWh', factor: 0.433 },
  { name: 'Business Travel - Air', scope: 'scope_3', category: 'business_travel', unit: 'km', factor: 0.255 },
  { name: 'Employee Commute', scope: 'scope_3', category: 'employee_commute', unit: 'km', factor: 0.171 },
  { name: 'Purchased Goods', scope: 'scope_3', category: 'purchased_goods', unit: 'USD', factor: 0.38 },
  { name: 'Waste - Landfill', scope: 'scope_3', category: 'waste', unit: 'tonnes', factor: 467.0 }
];

// Material topics
const materialTopics = [
  { name: 'Climate Change', category: 'environmental', business_impact: 5, stakeholder_concern: 5 },
  { name: 'Energy Management', category: 'environmental', business_impact: 4.5, stakeholder_concern: 4 },
  { name: 'Water Management', category: 'environmental', business_impact: 3.5, stakeholder_concern: 4 },
  { name: 'Waste & Circular Economy', category: 'environmental', business_impact: 3, stakeholder_concern: 3.5 },
  { name: 'Employee Health & Safety', category: 'social', business_impact: 4.5, stakeholder_concern: 5 },
  { name: 'Diversity & Inclusion', category: 'social', business_impact: 4, stakeholder_concern: 4.5 },
  { name: 'Data Privacy & Security', category: 'governance', business_impact: 5, stakeholder_concern: 4.5 },
  { name: 'Business Ethics', category: 'governance', business_impact: 4.5, stakeholder_concern: 5 },
  { name: 'Supply Chain Management', category: 'social', business_impact: 4, stakeholder_concern: 4 }
];

async function clearExistingData() {
  console.log('🧹 Clearing existing test data...');
  
  // Delete in reverse order of dependencies
  const tables = [
    'emissions',
    'energy_consumption',
    'water_consumption',
    'waste_generation',
    'emission_sources',
    'sustainability_targets',
    'material_topics',
    'facilities',
    'organizations'
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .in('name', testOrganizations.map(o => o.name));
    
    if (error && !error.message.includes('no rows')) {
      console.log(`   ⚠️  Could not clear ${table}: ${error.message}`);
    }
  }
}

async function seedOrganizations() {
  console.log('\n🏢 Creating organizations...');
  const organizations = [];

  for (const orgData of testOrganizations) {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        ...orgData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to create ${orgData.name}: ${error.message}`);
      continue;
    }

    console.log(`   ✅ Created ${orgData.name}`);
    organizations.push(data);
  }

  return organizations;
}

async function seedFacilities(organizations) {
  console.log('\n🏭 Creating facilities...');
  const facilities = [];

  for (const org of organizations) {
    // Create 2-3 facilities per organization
    const numFacilities = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numFacilities && i < facilityTemplates.length; i++) {
      const template = facilityTemplates[i];
      const facilityData = {
        organization_id: org.id,
        name: `${template.name} - ${faker.location.city()}`,
        type: template.type,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.countryCode(),
        size_sqm: template.size_sqm,
        employee_count: Math.floor(template.size_sqm / 50),
        operating_hours: '08:00-18:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('facilities')
        .insert([facilityData])
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed to create facility: ${error.message}`);
        continue;
      }

      console.log(`   ✅ Created ${facilityData.name} for ${org.name}`);
      facilities.push({ ...data, organization });
    }
  }

  return facilities;
}

async function seedEmissionSources(organizations) {
  console.log('\n⚡ Creating emission sources...');
  const sources = [];

  for (const org of organizations) {
    for (const sourceTemplate of emissionSources) {
      const sourceData = {
        organization_id: org.id,
        name: sourceTemplate.name,
        code: sourceTemplate.name.toLowerCase().replace(/\s+/g, '_'),
        description: `${sourceTemplate.name} emissions for ${org.name}`,
        scope: sourceTemplate.scope,
        category: sourceTemplate.category,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('emission_sources')
        .insert([sourceData])
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed to create emission source: ${error.message}`);
        continue;
      }

      sources.push({ ...data, default_unit: sourceTemplate.unit, default_factor: sourceTemplate.factor });
    }
  }

  console.log(`   ✅ Created ${sources.length} emission sources`);
  return sources;
}

async function seedEmissions(facilities, sources) {
  console.log('\n💨 Creating emissions data...');
  let totalEmissions = 0;

  // Generate monthly data for the last 12 months
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date);
  }

  for (const facility of facilities) {
    const orgSources = sources.filter(s => s.organization_id === facility.organization_id);

    for (const month of months) {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      // Create 3-5 emission records per facility per month
      const numRecords = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numRecords && i < orgSources.length; i++) {
        const source = orgSources[i];
        const activityValue = Math.random() * 1000 + 100;
        const co2eKg = activityValue * source.default_factor;
        const co2eTonnes = co2eKg / 1000;

        const emissionData = {
          organization_id: facility.organization_id,
          source_id: source.id,
          period_start: startDate.toISOString().split('T')[0],
          period_end: endDate.toISOString().split('T')[0],
          activity_value: activityValue,
          activity_unit: source.default_unit,
          activity_description: `${source.name} consumption at ${facility.name}`,
          emission_factor: source.default_factor,
          emission_factor_unit: `kgCO2e/${source.default_unit}`,
          emission_factor_source: 'EPA 2024',
          co2e_tonnes: co2eTonnes,
          data_quality: ['measured', 'calculated', 'estimated'][Math.floor(Math.random() * 3)],
          verification_status: 'unverified',
          created_by: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('emissions')
          .insert([emissionData]);

        if (error) {
          console.error(`   ❌ Failed to create emission record: ${error.message}`);
          continue;
        }

        totalEmissions++;
      }
    }
  }

  console.log(`   ✅ Created ${totalEmissions} emission records`);
}

async function seedEnergyData(facilities) {
  console.log('\n⚡ Creating energy consumption data...');
  let totalRecords = 0;

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date);
  }

  for (const facility of facilities) {
    for (const month of months) {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const consumption = facility.size_sqm * (Math.random() * 5 + 10); // kWh per sqm
      
      const energyData = {
        organization_id: facility.organization_id,
        facility_id: facility.id,
        period_start: startDate.toISOString().split('T')[0],
        period_end: endDate.toISOString().split('T')[0],
        energy_type: 'electricity',
        consumption_value: consumption,
        consumption_unit: 'kWh',
        consumption_kwh: consumption,
        cost_amount: consumption * 0.12,
        cost_currency: 'USD',
        renewable_percentage: Math.floor(Math.random() * 50),
        grid_mix_percentage: 100 - Math.floor(Math.random() * 50),
        created_by: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('energy_consumption')
        .insert([energyData]);

      if (!error) totalRecords++;
    }
  }

  console.log(`   ✅ Created ${totalRecords} energy consumption records`);
}

async function seedMaterialTopics(organizations) {
  console.log('\n🎯 Creating material topics...');
  let totalTopics = 0;

  for (const org of organizations) {
    for (const topic of materialTopics) {
      // Add some variation to scores
      const businessVariation = (Math.random() - 0.5) * 0.5;
      const stakeholderVariation = (Math.random() - 0.5) * 0.5;

      const topicData = {
        organization_id: org.id,
        topic_name: topic.name,
        category: topic.category,
        description: `${topic.name} management and impact for ${org.name}`,
        business_impact_score: Math.max(1, Math.min(5, topic.business_impact + businessVariation)),
        stakeholder_concern_score: Math.max(1, Math.min(5, topic.stakeholder_concern + stakeholderVariation)),
        is_material: topic.business_impact >= 3.5 || topic.stakeholder_concern >= 3.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('material_topics')
        .insert([topicData]);

      if (!error) totalTopics++;
    }
  }

  console.log(`   ✅ Created ${totalTopics} material topics`);
}

async function seedSustainabilityTargets(organizations) {
  console.log('\n🎯 Creating sustainability targets...');
  const targets = [];

  const targetTemplates = [
    {
      name: 'Net Zero Emissions',
      target_type: 'absolute_reduction',
      scopes: ['scope_1', 'scope_2'],
      baseline_year: 2023,
      target_year: 2030,
      reduction: 50,
      unit: 'tCO2e',
      is_science_based: true
    },
    {
      name: '100% Renewable Energy',
      target_type: 'intensity_target',
      scopes: ['scope_2'],
      baseline_year: 2023,
      target_year: 2025,
      target_value: 100,
      unit: '%',
      is_science_based: false
    },
    {
      name: 'Zero Waste to Landfill',
      target_type: 'absolute_target',
      scopes: [],
      baseline_year: 2023,
      target_year: 2027,
      target_value: 0,
      unit: 'tonnes',
      is_science_based: false
    }
  ];

  for (const org of organizations) {
    for (const template of targetTemplates) {
      const baselineValue = template.target_value === 100 ? 25 : 1000 + Math.random() * 5000;
      const targetValue = template.reduction 
        ? baselineValue * (1 - template.reduction / 100)
        : template.target_value;

      const targetData = {
        organization_id: org.id,
        name: template.name,
        description: `${template.name} commitment for ${org.name}`,
        target_type: template.target_type,
        scopes: template.scopes,
        baseline_year: template.baseline_year,
        baseline_value: baselineValue,
        baseline_unit: template.unit,
        target_year: template.target_year,
        target_value: targetValue,
        target_unit: template.unit,
        current_value: baselineValue * (1 - Math.random() * 0.2), // Some progress
        status: 'active',
        is_science_based: template.is_science_based,
        created_by: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sustainability_targets')
        .insert([targetData])
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed to create target: ${error.message}`);
        continue;
      }

      console.log(`   ✅ Created target: ${template.name} for ${org.name}`);
      targets.push(data);
    }
  }

  return targets;
}

async function createTestUser() {
  console.log('\n👤 Creating test user...');
  
  // Note: This would normally be done through Supabase Auth
  // For now, just provide instructions
  console.log('   ℹ️  To create a test user:');
  console.log('   1. Go to your Supabase dashboard');
  console.log('   2. Navigate to Authentication > Users');
  console.log('   3. Click "Invite user" or "Create user"');
  console.log('   4. Use email: test@blipee.com');
  console.log('   5. Set a password');
  console.log('   6. Add the user to an organization via organization_members table');
}

async function main() {
  console.log('🌱 Starting ESG data seeding...\n');

  try {
    // Clear existing test data
    await clearExistingData();

    // Seed data in order
    const organizations = await seedOrganizations();
    if (organizations.length === 0) {
      console.error('❌ No organizations created. Check RLS policies.');
      return;
    }

    const facilities = await seedFacilities(organizations);
    const sources = await seedEmissionSources(organizations);
    
    await seedEmissions(facilities, sources);
    await seedEnergyData(facilities);
    await seedMaterialTopics(organizations);
    await seedSustainabilityTargets(organizations);
    
    await createTestUser();

    console.log('\n✨ Seeding complete!');
    console.log('\nTest organizations created:');
    organizations.forEach(org => {
      console.log(`   - ${org.name} (ID: ${org.id})`);
    });
    
    console.log('\nYou can now:');
    console.log('1. Sign in with a test user');
    console.log('2. Select one of the test organizations');
    console.log('3. Start using the ESG features with real data');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Check if faker is installed
try {
  require('@faker-js/faker');
  main();
} catch (error) {
  console.log('📦 Installing required dependencies...');
  require('child_process').execSync('npm install --save-dev @faker-js/faker', { stdio: 'inherit' });
  console.log('✅ Dependencies installed. Please run the script again.');
}