import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { faker } from '@faker-js/faker';

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

// Helper function to generate date range
function getMonthlyDates(startDate: string, endDate: string): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  
  return dates;
}

// Helper to add seasonal variation
function addSeasonalVariation(baseValue: number, month: number, variance: number = 0.2): number {
  const seasonalFactor = month >= 5 && month <= 8 ? 1.2 : month >= 11 || month <= 2 ? 1.15 : 1;
  const randomVariance = 1 + (Math.random() - 0.5) * variance;
  return baseValue * seasonalFactor * randomVariance;
}

// Batch insert helper
async function batchInsert(table: string, data: any[], batchSize: number = 500) {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`Error inserting batch into ${table}:`, error);
      throw error;
    }
  }
}

async function seedBatchData() {
  console.log('🌱 Starting batch data seeding (Jan 2022 - July 2025)...\n');

  try {
    // Clear existing data first
    console.log('🗑️  Clearing existing test data...');
    const tablesToClear = ['emissions_data', 'water_usage', 'waste_data', 'buildings', 
                          'sustainability_reports', 'document_uploads', 'agent_task_executions'];
    
    for (const table of tablesToClear) {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // Get organizations
    const { data: organizations } = await supabase.from('organizations').select('*');
    if (!organizations || organizations.length === 0) {
      throw new Error('No organizations found');
    }
    
    console.log(`✅ Found ${organizations.length} organizations\n`);

    // Create buildings
    console.log('🏢 Creating buildings...');
    const buildings: any[] = [];
    const buildingInserts: any[] = [];
    
    for (const org of organizations) {
      const buildingCount = 3; // 3 buildings per org
      
      for (let i = 0; i < buildingCount; i++) {
        const building = {
          organization_id: org.id,
          name: `${org.name} - ${['HQ', 'Plant', 'Office'][i]}`,
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          country: ['USA', 'UK', 'Germany', 'Japan', 'Australia'][Math.floor(Math.random() * 5)],
          postal_code: faker.location.zipCode(),
          latitude: parseFloat(faker.location.latitude()),
          longitude: parseFloat(faker.location.longitude()),
          square_footage: [50000, 75000, 100000][i],
          year_built: 2010 - i * 5,
          building_type: ['office', 'manufacturing', 'mixed'][i],
          occupancy_type: 'owner',
          metadata: {
            energy_star_score: 75 + i * 5,
            leed_certification: ['Gold', 'Silver', 'Platinum'][i],
            renewable_energy: i === 0
          }
        };
        buildingInserts.push(building);
      }
    }
    
    await batchInsert('buildings', buildingInserts);
    const { data: createdBuildings } = await supabase.from('buildings').select('*');
    buildings.push(...(createdBuildings || []));
    console.log(`✅ Created ${buildings.length} buildings\n`);

    // Generate monthly data
    const months = getMonthlyDates('2022-01-01', '2025-07-31');
    console.log(`📅 Generating data for ${months.length} months...\n`);

    // Prepare batch data
    const emissionsData: any[] = [];
    const waterData: any[] = [];
    const wasteData: any[] = [];

    console.log('📊 Preparing emissions, water, and waste data...');
    
    for (const building of buildings) {
      for (const date of months) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const periodStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const periodEnd = new Date(year, month, 0).toISOString().split('T')[0];

        // Emissions data - simplified to key categories
        const baseEmissions = building.square_footage * 0.01; // Base emissions factor
        
        // Scope 1 - Direct emissions
        emissionsData.push({
          organization_id: building.organization_id,
          building_id: building.id,
          scope: '1',
          category: 'natural_gas',
          subcategory: 'heating',
          activity_data: addSeasonalVariation(baseEmissions * 20, month),
          activity_unit: 'MWh',
          emission_factor: 0.18391,
          emission_factor_unit: 'tCO2e/MWh',
          co2e_kg: addSeasonalVariation(baseEmissions * 20, month) * 183.91,
          data_source: 'meter_reading',
          calculation_method: 'direct_measurement',
          period_start: periodStart,
          period_end: periodEnd
        });

        // Scope 2 - Electricity
        const electricityUse = addSeasonalVariation(baseEmissions * 50, month);
        emissionsData.push({
          organization_id: building.organization_id,
          building_id: building.id,
          scope: '2',
          category: 'electricity',
          subcategory: 'grid_electricity',
          activity_data: electricityUse,
          activity_unit: 'MWh',
          emission_factor: 0.429,
          emission_factor_unit: 'tCO2e/MWh',
          co2e_kg: electricityUse * 429,
          data_source: 'utility_bill',
          calculation_method: 'location_based',
          period_start: periodStart,
          period_end: periodEnd
        });

        // Scope 3 - Key categories
        emissionsData.push({
          organization_id: building.organization_id,
          building_id: building.id,
          scope: '3',
          category: 'business_travel',
          subcategory: 'air_travel',
          activity_data: baseEmissions * 15,
          activity_unit: 'tCO2e',
          emission_factor: 1,
          emission_factor_unit: 'tCO2e/tCO2e',
          co2e_kg: baseEmissions * 15 * 1000,
          data_source: 'estimated',
          calculation_method: 'spend_based',
          period_start: periodStart,
          period_end: periodEnd
        });

        // Water usage
        const waterUsage = building.square_footage * 50; // 50 liters per sq ft
        waterData.push({
          organization_id: building.organization_id,
          building_id: building.id,
          water_source: 'municipal',
          usage_type: 'potable',
          volume_liters: addSeasonalVariation(waterUsage, month, 0.15),
          period_start: periodStart,
          period_end: periodEnd,
          is_recycled: false,
          treatment_type: null
        });

        // Waste data
        const wasteAmount = building.square_footage * 0.5; // 0.5 kg per sq ft
        wasteData.push({
          organization_id: building.organization_id,
          building_id: building.id,
          waste_type: 'general_waste',
          disposal_method: 'landfill',
          quantity: addSeasonalVariation(wasteAmount * 0.4, month, 0.2),
          unit: 'kg',
          recycling_rate: 0,
          diverted_from_landfill: false,
          period_start: periodStart,
          period_end: periodEnd
        });

        wasteData.push({
          organization_id: building.organization_id,
          building_id: building.id,
          waste_type: 'recyclables',
          disposal_method: 'recycling',
          quantity: addSeasonalVariation(wasteAmount * 0.6, month, 0.2),
          unit: 'kg',
          recycling_rate: 85,
          diverted_from_landfill: true,
          period_start: periodStart,
          period_end: periodEnd
        });
      }
    }

    // Batch insert all data
    console.log('💾 Inserting emissions data...');
    await batchInsert('emissions_data', emissionsData);
    console.log(`✅ Created ${emissionsData.length} emissions records`);

    console.log('💾 Inserting water usage data...');
    await batchInsert('water_usage', waterData);
    console.log(`✅ Created ${waterData.length} water usage records`);

    console.log('💾 Inserting waste data...');
    await batchInsert('waste_data', wasteData);
    console.log(`✅ Created ${wasteData.length} waste records`);

    // Generate annual reports
    console.log('\n📊 Generating sustainability reports...');
    const reports: any[] = [];
    
    for (const org of organizations) {
      for (const year of [2022, 2023, 2024]) {
        reports.push({
          organization_id: org.id,
          report_type: 'annual_sustainability',
          report_year: year,
          status: year === 2024 ? 'draft' : 'published',
          framework: 'GRI',
          content: {
            executive_summary: `Annual sustainability report for ${year}`,
            highlights: [`${15 - (2024 - year) * 3}% emission reduction`, `${80 + (year - 2022) * 5}% renewable energy`]
          },
          total_emissions_scope1: 1200 - (year - 2022) * 100,
          total_emissions_scope2: 2400 - (year - 2022) * 200,
          total_emissions_scope3: 8000 - (year - 2022) * 500,
          emissions_intensity: 2.5 - (year - 2022) * 0.2,
          energy_consumption: 5000 - (year - 2022) * 300,
          renewable_energy_percentage: 20 + (year - 2022) * 10,
          water_consumption: 100000 - (year - 2022) * 5000,
          waste_generated: 5000 - (year - 2022) * 500,
          waste_recycled_percentage: 70 + (year - 2022) * 5,
          published_at: year < 2024 ? new Date(year + 1, 2, 15).toISOString() : null
        });
      }
    }
    
    await batchInsert('sustainability_reports', reports);
    console.log(`✅ Created ${reports.length} reports`);

    // Generate recent agent activities
    console.log('\n🤖 Generating agent activities...');
    const { data: agents } = await supabase.from('agent_instances').select('*');
    const taskExecutions: any[] = [];
    
    if (agents) {
      const recentMonths = months.slice(-3); // Last 3 months only
      
      for (const agent of agents) {
        for (const date of recentMonths) {
          // 10 tasks per month per agent
          for (let i = 0; i < 10; i++) {
            const taskDate = new Date(date);
            taskDate.setDate(Math.floor(Math.random() * 28) + 1);
            
            taskExecutions.push({
              agent_instance_id: agent.id,
              task_type: 'analysis',
              task_name: `Automated analysis - ${taskDate.toISOString().split('T')[0]}`,
              status: 'completed',
              priority: 'medium',
              input_data: { date: taskDate.toISOString().split('T')[0] },
              output_data: { findings: Math.floor(Math.random() * 10), success: true },
              started_at: taskDate.toISOString(),
              completed_at: new Date(taskDate.getTime() + 3600000).toISOString(),
              duration_ms: 3600000
            });
          }
        }
      }
      
      await batchInsert('agent_task_executions', taskExecutions);
      console.log(`✅ Created ${taskExecutions.length} agent tasks`);
    }

    console.log('\n🎉 Batch seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`- Organizations: ${organizations.length}`);
    console.log(`- Buildings: ${buildings.length}`);
    console.log(`- Emissions records: ${emissionsData.length}`);
    console.log(`- Water usage records: ${waterData.length}`);
    console.log(`- Waste records: ${wasteData.length}`);
    console.log(`- Sustainability reports: ${reports.length}`);
    console.log(`- Agent task executions: ${taskExecutions.length}`);
    console.log('\n✨ Database is ready for testing!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

seedBatchData();