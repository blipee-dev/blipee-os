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
  // Higher consumption in summer (cooling) and winter (heating)
  const seasonalFactor = month >= 5 && month <= 8 ? 1.2 : month >= 11 || month <= 2 ? 1.15 : 1;
  const randomVariance = 1 + (Math.random() - 0.5) * variance;
  return baseValue * seasonalFactor * randomVariance;
}

// Helper to occasionally add anomalies
function addAnomaly(value: number, probability: number = 0.05): number {
  if (Math.random() < probability) {
    // 5% chance of anomaly (spike or drop)
    return value * (Math.random() > 0.5 ? 1.5 : 0.7);
  }
  return value;
}

async function seedComprehensiveData() {
  console.log('🌱 Starting comprehensive data seeding from Jan 2022 to July 2025...\n');

  try {
    // Clear existing data (except agent definitions)
    console.log('🗑️  Clearing existing test data...');
    await supabase.from('emissions_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('water_usage').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('waste_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('buildings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('sustainability_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('document_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Get existing organization or create test organizations
    const { data: existingOrgs } = await supabase.from('organizations').select('*');
    
    let organizations = existingOrgs || [];
    
    // Create test organizations if needed
    if (organizations.length < 3) {
      console.log('📦 Creating test organizations...');
      
      const newOrgs = [
        {
          name: 'TechCorp Industries',
          slug: 'techcorp',
          settings: {
            industry: 'technology',
            size: 'enterprise',
            locations: 5,
            employees: 5000,
            target_net_zero: 2040,
            frameworks: ['GRI', 'TCFD', 'CDP']
          }
        },
        {
          name: 'Global Manufacturing Co',
          slug: 'global-manufacturing',
          settings: {
            industry: 'manufacturing',
            size: 'large',
            locations: 8,
            employees: 12000,
            target_net_zero: 2035,
            frameworks: ['GRI', 'SASB', 'CSRD']
          }
        },
        {
          name: 'Sustainable Retail Group',
          slug: 'sustainable-retail',
          settings: {
            industry: 'retail',
            size: 'medium',
            locations: 25,
            employees: 3000,
            target_net_zero: 2030,
            frameworks: ['GRI', 'CDP', 'TCFD']
          }
        }
      ];
      
      for (const org of newOrgs) {
        const { data } = await supabase.from('organizations').insert(org).select().single();
        if (data) organizations.push(data);
      }
    }
    
    console.log(`✅ Working with ${organizations.length} organizations\n`);
    
    // Create buildings for each organization
    console.log('🏢 Creating buildings...');
    const buildings: any[] = [];
    
    for (const org of organizations) {
      const buildingCount = Math.floor(Math.random() * 3) + 2; // 2-4 buildings per org
      
      for (let i = 0; i < buildingCount; i++) {
        const building = {
          organization_id: org.id,
          name: `${org.name} - ${faker.location.city()} ${['HQ', 'Office', 'Facility', 'Plant', 'Warehouse'][i] || 'Site'}`,
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          country: faker.location.country(),
          postal_code: faker.location.zipCode(),
          latitude: parseFloat(faker.location.latitude()),
          longitude: parseFloat(faker.location.longitude()),
          square_footage: Math.floor(Math.random() * 50000) + 10000,
          year_built: 2000 + Math.floor(Math.random() * 20),
          building_type: ['office', 'manufacturing', 'warehouse', 'retail', 'mixed'][Math.floor(Math.random() * 5)],
          occupancy_type: ['owner', 'tenant', 'mixed'][Math.floor(Math.random() * 3)],
          metadata: {
            energy_star_score: Math.floor(Math.random() * 30) + 70,
            leed_certification: ['Gold', 'Silver', 'Platinum', null][Math.floor(Math.random() * 4)],
            renewable_energy: Math.random() > 0.5
          }
        };
        
        const { data } = await supabase.from('buildings').insert(building).select().single();
        if (data) buildings.push(data);
      }
    }
    
    console.log(`✅ Created ${buildings.length} buildings\n`);
    
    // Generate monthly data from Jan 2022 to July 2025
    const months = getMonthlyDates('2022-01-01', '2025-07-31');
    console.log(`📅 Generating data for ${months.length} months...\n`);
    
    // Generate emissions data
    console.log('🏭 Generating emissions data...');
    let emissionsCount = 0;
    
    for (const building of buildings) {
      for (const date of months) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0);
        
        // Base emissions values (adjust based on building type)
        const baseScope1 = building.building_type === 'manufacturing' ? 500 : 100;
        const baseScope2 = building.square_footage * 0.005; // 0.005 tCO2e per sq ft
        const baseScope3 = baseScope1 + baseScope2 * 2; // Scope 3 typically larger
        
        // Scope 1 emissions (direct)
        const scope1Sources = [
          { category: 'natural_gas', subcategory: 'heating', factor: 0.7 },
          { category: 'fleet', subcategory: 'company_vehicles', factor: 0.2 },
          { category: 'refrigerants', subcategory: 'hvac', factor: 0.1 }
        ];
        
        for (const source of scope1Sources) {
          const activityValue = addAnomaly(addSeasonalVariation(baseScope1 * source.factor, month));
          
          await supabase.from('emissions_data').insert({
            organization_id: building.organization_id,
            building_id: building.id,
            scope: '1',
            category: source.category,
            subcategory: source.subcategory,
            activity_data: activityValue,
            activity_unit: 'MWh',
            emission_factor: 0.18391, // Natural gas emission factor
            emission_factor_unit: 'tCO2e/MWh',
            co2e_kg: activityValue * 183.91, // Convert to kg
            data_source: 'meter_reading',
            calculation_method: 'direct_measurement',
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            metadata: {
              confidence_level: 'high',
              data_quality_score: 0.95
            }
          });
          emissionsCount++;
        }
        
        // Scope 2 emissions (electricity)
        const electricityUse = addAnomaly(addSeasonalVariation(baseScope2, month));
        
        await supabase.from('emissions_data').insert({
          organization_id: building.organization_id,
          building_id: building.id,
          scope: '2',
          category: 'electricity',
          subcategory: 'grid_electricity',
          activity_data: electricityUse,
          activity_unit: 'MWh',
          emission_factor: 0.429, // Average grid emission factor
          emission_factor_unit: 'tCO2e/MWh',
          co2e_kg: electricityUse * 429,
          data_source: 'utility_bill',
          calculation_method: 'location_based',
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          metadata: {
            renewable_percentage: year >= 2024 ? 25 : 10,
            peak_demand_kw: electricityUse * 0.15
          }
        });
        emissionsCount++;
        
        // Scope 3 emissions (selected categories)
        const scope3Categories = [
          { category: 'business_travel', subcategory: 'air_travel', factor: 0.15 },
          { category: 'employee_commuting', subcategory: 'all_modes', factor: 0.25 },
          { category: 'waste_generated', subcategory: 'landfill', factor: 0.1 },
          { category: 'purchased_goods', subcategory: 'office_supplies', factor: 0.2 }
        ];
        
        for (const cat of scope3Categories) {
          const activityValue = addAnomaly(addSeasonalVariation(baseScope3 * cat.factor, month, 0.3));
          
          await supabase.from('emissions_data').insert({
            organization_id: building.organization_id,
            building_id: building.id,
            scope: '3',
            category: cat.category,
            subcategory: cat.subcategory,
            activity_data: activityValue,
            activity_unit: 'tCO2e',
            emission_factor: 1,
            emission_factor_unit: 'tCO2e/tCO2e',
            co2e_kg: activityValue * 1000,
            data_source: 'estimated',
            calculation_method: 'spend_based',
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            metadata: {
              confidence_level: 'medium',
              data_gaps: Math.random() > 0.8
            }
          });
          emissionsCount++;
        }
      }
    }
    
    console.log(`✅ Created ${emissionsCount} emissions records\n`);
    
    // Generate water usage data
    console.log('💧 Generating water usage data...');
    let waterCount = 0;
    
    for (const building of buildings) {
      for (const date of months) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0);
        
        // Base water usage (liters)
        const baseWaterUsage = building.square_footage * 50; // 50 liters per sq ft per month
        
        const waterSources = [
          { source: 'municipal', type: 'potable', factor: 0.7 },
          { source: 'rainwater', type: 'harvested', factor: 0.1 },
          { source: 'recycled', type: 'greywater', factor: 0.2 }
        ];
        
        for (const water of waterSources) {
          const usage = addAnomaly(addSeasonalVariation(baseWaterUsage * water.factor, month, 0.15));
          
          await supabase.from('water_usage').insert({
            organization_id: building.organization_id,
            building_id: building.id,
            water_source: water.source,
            usage_type: water.type,
            volume_liters: usage,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            is_recycled: water.source === 'recycled',
            treatment_type: water.source === 'recycled' ? 'biological' : null,
            metadata: {
              cost_usd: usage * 0.003,
              quality_score: Math.random() * 0.2 + 0.8
            }
          });
          waterCount++;
        }
      }
    }
    
    console.log(`✅ Created ${waterCount} water usage records\n`);
    
    // Generate waste data
    console.log('♻️  Generating waste data...');
    let wasteCount = 0;
    
    for (const building of buildings) {
      for (const date of months) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0);
        
        // Base waste generation (kg)
        const baseWaste = building.square_footage * 0.5; // 0.5 kg per sq ft per month
        
        const wasteTypes = [
          { type: 'general_waste', method: 'landfill', recyclingRate: 0, factor: 0.4 },
          { type: 'recyclables', method: 'recycling', recyclingRate: 85, factor: 0.3 },
          { type: 'organics', method: 'composting', recyclingRate: 95, factor: 0.2 },
          { type: 'hazardous', method: 'special_treatment', recyclingRate: 0, factor: 0.1 }
        ];
        
        for (const waste of wasteTypes) {
          const quantity = addAnomaly(addSeasonalVariation(baseWaste * waste.factor, month, 0.2));
          
          await supabase.from('waste_data').insert({
            organization_id: building.organization_id,
            building_id: building.id,
            waste_type: waste.type,
            disposal_method: waste.method,
            quantity: quantity,
            unit: 'kg',
            recycling_rate: waste.recyclingRate,
            diverted_from_landfill: waste.recyclingRate > 0,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            metadata: {
              cost_usd: quantity * 0.05,
              contamination_rate: Math.random() * 0.1
            }
          });
          wasteCount++;
        }
      }
    }
    
    console.log(`✅ Created ${wasteCount} waste records\n`);
    
    // Generate annual sustainability reports
    console.log('📊 Generating sustainability reports...');
    let reportCount = 0;
    
    for (const org of organizations) {
      for (const year of [2022, 2023, 2024]) {
        // Calculate annual totals
        const { data: annualEmissions } = await supabase
          .from('emissions_data')
          .select('scope, co2e_kg')
          .eq('organization_id', org.id)
          .gte('period_start', `${year}-01-01`)
          .lte('period_end', `${year}-12-31`);
        
        let scope1Total = 0, scope2Total = 0, scope3Total = 0;
        
        annualEmissions?.forEach(emission => {
          const co2e = emission.co2e_kg / 1000; // Convert to tonnes
          if (emission.scope === '1') scope1Total += co2e;
          else if (emission.scope === '2') scope2Total += co2e;
          else if (emission.scope === '3') scope3Total += co2e;
        });
        
        const report = {
          organization_id: org.id,
          report_type: 'annual_sustainability',
          report_year: year,
          status: year === 2024 ? 'draft' : 'published',
          framework: ['GRI', 'TCFD', 'CDP'][Math.floor(Math.random() * 3)],
          content: {
            executive_summary: `${org.name} sustainability report for ${year}`,
            key_achievements: [
              `Reduced emissions by ${Math.floor(Math.random() * 10 + 5)}%`,
              `Increased renewable energy to ${Math.floor(Math.random() * 20 + 10)}%`,
              `Achieved ${Math.floor(Math.random() * 30 + 70)}% waste diversion`
            ],
            challenges: [
              'Supply chain emissions tracking',
              'Data quality improvements needed',
              'Employee engagement'
            ]
          },
          total_emissions_scope1: scope1Total,
          total_emissions_scope2: scope2Total,
          total_emissions_scope3: scope3Total,
          emissions_intensity: (scope1Total + scope2Total) / (org.settings?.employees || 1000),
          energy_consumption: scope2Total * 2.33, // Rough conversion
          renewable_energy_percentage: 10 + (year - 2022) * 5,
          water_consumption: Math.random() * 100000 + 50000,
          waste_generated: Math.random() * 5000 + 2000,
          waste_recycled_percentage: 65 + (year - 2022) * 5,
          published_at: year < 2024 ? new Date(year + 1, 2, 15).toISOString() : null,
          metadata: {
            assurance_provider: 'KPMG',
            assurance_level: 'limited',
            report_url: `/reports/${org.slug}-${year}-sustainability-report.pdf`
          }
        };
        
        await supabase.from('sustainability_reports').insert(report);
        reportCount++;
      }
    }
    
    console.log(`✅ Created ${reportCount} sustainability reports\n`);
    
    // Generate document uploads
    console.log('📄 Generating document uploads...');
    let docCount = 0;
    
    const docTypes = [
      { type: 'utility_bill', prefix: 'electricity-bill' },
      { type: 'waste_invoice', prefix: 'waste-invoice' },
      { type: 'travel_report', prefix: 'travel-emissions' },
      { type: 'sustainability_report', prefix: 'sustainability-report' }
    ];
    
    for (const building of buildings.slice(0, 5)) { // Just first 5 buildings
      for (let i = 0; i < 10; i++) {
        const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
        const uploadDate = faker.date.between({ from: '2022-01-01', to: '2025-07-31' });
        
        const doc = {
          organization_id: building.organization_id,
          building_id: building.id,
          document_type: docType.type,
          file_name: `${docType.prefix}-${uploadDate.toISOString().split('T')[0]}.pdf`,
          file_path: `/uploads/${building.organization_id}/${faker.string.uuid()}.pdf`,
          file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          mime_type: 'application/pdf',
          extracted_data: {
            extracted: true,
            confidence: 0.85 + Math.random() * 0.15,
            values: {
              total_kwh: Math.floor(Math.random() * 10000),
              total_cost: Math.floor(Math.random() * 5000),
              period: uploadDate.toISOString().slice(0, 7)
            }
          },
          processing_status: 'completed',
          metadata: {
            ocr_used: true,
            processing_time_ms: Math.floor(Math.random() * 5000) + 1000
          },
          created_at: uploadDate.toISOString()
        };
        
        await supabase.from('document_uploads').insert(doc);
        docCount++;
      }
    }
    
    console.log(`✅ Created ${docCount} document uploads\n`);
    
    // Generate agent task executions for recent months
    console.log('🤖 Generating agent task executions...');
    let taskCount = 0;
    
    const { data: agentInstances } = await supabase
      .from('agent_instances')
      .select('*')
      .limit(4);
    
    if (agentInstances) {
      const recentMonths = months.slice(-6); // Last 6 months
      
      for (const agent of agentInstances) {
        for (const date of recentMonths) {
          // Generate 5-10 tasks per month per agent
          const taskCount = Math.floor(Math.random() * 5) + 5;
          
          for (let i = 0; i < taskCount; i++) {
            const taskDate = new Date(date);
            taskDate.setDate(Math.floor(Math.random() * 28) + 1);
            
            const taskTypes = {
              'esg_chief_of_staff': ['daily_analysis', 'executive_report', 'anomaly_detection', 'trend_analysis'],
              'compliance_guardian': ['regulation_check', 'deadline_monitoring', 'framework_update', 'gap_analysis'],
              'carbon_hunter': ['emission_scan', 'reduction_opportunity', 'supplier_analysis', 'offset_recommendation'],
              'supply_chain_investigator': ['supplier_assessment', 'risk_evaluation', 'performance_tracking', 'alternative_search']
            };
            
            const agentType = agent.agent_definition_id as keyof typeof taskTypes;
            const tasks = taskTypes[agentType] || ['general_task'];
            const taskType = tasks[Math.floor(Math.random() * tasks.length)];
            
            const duration = Math.floor(Math.random() * 3600000) + 60000; // 1 min to 1 hour
            const success = Math.random() > 0.1; // 90% success rate
            
            await supabase.from('agent_task_executions').insert({
              agent_instance_id: agent.id,
              task_type: taskType,
              task_name: `${taskType.replace(/_/g, ' ')} - ${taskDate.toISOString().split('T')[0]}`,
              status: 'completed',
              priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
              input_data: {
                target_date: taskDate.toISOString().split('T')[0],
                parameters: { threshold: 0.1, confidence: 0.8 }
              },
              output_data: success ? {
                findings: Math.floor(Math.random() * 10),
                recommendations: Math.floor(Math.random() * 5),
                impact_score: Math.random()
              } : {},
              error_message: success ? null : 'Insufficient data for analysis',
              started_at: taskDate.toISOString(),
              completed_at: new Date(taskDate.getTime() + duration).toISOString(),
              duration_ms: duration,
              created_at: taskDate.toISOString()
            });
            taskCount++;
          }
        }
      }
    }
    
    console.log(`✅ Created ${taskCount} agent task executions\n`);
    
    console.log('🎉 Comprehensive test data seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`- Organizations: ${organizations.length}`);
    console.log(`- Buildings: ${buildings.length}`);
    console.log(`- Emissions records: ${emissionsCount}`);
    console.log(`- Water usage records: ${waterCount}`);
    console.log(`- Waste records: ${wasteCount}`);
    console.log(`- Sustainability reports: ${reportCount}`);
    console.log(`- Document uploads: ${docCount}`);
    console.log(`- Agent task executions: ${taskCount}`);
    console.log(`\n✨ Database is ready for comprehensive testing!`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run the seeding
seedComprehensiveData();