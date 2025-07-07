import { createClient } from '@supabase/supabase-js';
import { parse } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types for our data
interface MonthlyData {
  month: string; // YYYY-MM
  electricity_kwh: number;
  natural_gas_kwh: number;
  water_gallons: number;
  waste_total_kg: number;
  waste_recycled_kg: number;
  scope1_emissions: number;
  scope2_emissions: number;
  scope3_emissions: number;
  production_units?: number;
  occupancy_count?: number;
}

interface SiteData {
  name: string;
  type: string;
  location: {
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  monthlyData: MonthlyData[];
}

// Generate realistic monthly patterns
function generateMonthlyPattern(
  baseValue: number,
  seasonalPattern: number[],
  yearOverYearReduction: number,
  monthIndex: number,
  yearIndex: number
): number {
  const seasonal = baseValue * seasonalPattern[monthIndex % 12];
  const trend = seasonal * Math.pow(1 - yearOverYearReduction, yearIndex);
  const randomVariation = trend * (1 + (Math.random() - 0.5) * 0.1); // ±5% random variation
  return Math.round(randomVariation);
}

// Seasonal patterns (multipliers for each month)
const patterns = {
  energy: [1.15, 1.12, 1.08, 1.02, 0.95, 0.88, 0.85, 0.87, 0.92, 0.98, 1.05, 1.13], // Higher in winter
  water: [0.95, 0.95, 0.98, 1.02, 1.08, 1.15, 1.18, 1.17, 1.10, 1.02, 0.98, 0.92], // Higher in summer
  production: [0.95, 1.00, 1.05, 1.08, 1.10, 1.08, 0.90, 0.92, 1.05, 1.10, 1.08, 0.85], // Lower in summer/december
  office: [1.05, 1.08, 1.10, 1.08, 1.05, 1.00, 0.85, 0.82, 1.00, 1.08, 1.05, 0.90], // Lower in summer
};

// Generate data for Global Sustainable Corp
function generateCompanyData(): { company: any; sites: SiteData[] } {
  const company = {
    name: "Global Sustainable Corp",
    slug: "global-sustainable-corp",
    subscription_tier: "enterprise",
    subscription_status: "active",
    settings: {
      reporting_framework: ["GRI", "CSRD", "TCFD"],
      fiscal_year_start: "01-01",
      sustainability_goals: {
        net_zero_target: 2040,
        renewable_energy_target: 100,
        waste_diversion_target: 90,
      },
    },
    metadata: {
      industry: "Diversified Manufacturing & Services",
      employees: 12500,
      revenue: "€2.5B",
      description: "A global leader in sustainable manufacturing and services, committed to achieving net-zero emissions by 2040.",
    },
  };

  // Site 1: Manufacturing Facility
  const manufacturingSite: SiteData = {
    name: "Detroit Manufacturing Plant",
    type: "manufacturing",
    location: {
      address: "1234 Industrial Blvd",
      city: "Detroit",
      country: "US",
      latitude: 42.3314,
      longitude: -83.0458,
    },
    monthlyData: [],
  };

  // Site 2: Corporate Headquarters
  const hqSite: SiteData = {
    name: "European Headquarters",
    type: "office",
    location: {
      address: "100 Sustainability Plaza",
      city: "Amsterdam",
      country: "NL",
      latitude: 52.3676,
      longitude: 4.9041,
    },
    monthlyData: [],
  };

  // Site 3: Distribution Center
  const distributionSite: SiteData = {
    name: "Frankfurt Distribution Hub",
    type: "warehouse",
    location: {
      address: "50 Logistics Way",
      city: "Frankfurt",
      country: "DE",
      latitude: 50.1109,
      longitude: 8.6821,
    },
    monthlyData: [],
  };

  // Generate monthly data for each site (Jan 2022 - Dec 2024)
  const startYear = 2022;
  const endYear = 2024;
  
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const yearIndex = year - startYear;
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      
      // Manufacturing site data
      manufacturingSite.monthlyData.push({
        month: monthStr,
        electricity_kwh: generateMonthlyPattern(850000, patterns.energy, 0.05, month - 1, yearIndex),
        natural_gas_kwh: generateMonthlyPattern(450000, patterns.energy, 0.08, month - 1, yearIndex),
        water_gallons: generateMonthlyPattern(250000, patterns.water, 0.04, month - 1, yearIndex),
        waste_total_kg: generateMonthlyPattern(45000, patterns.production, 0.06, month - 1, yearIndex),
        waste_recycled_kg: generateMonthlyPattern(35000, patterns.production, -0.03, month - 1, yearIndex), // Increasing recycling
        scope1_emissions: generateMonthlyPattern(180, patterns.energy, 0.07, month - 1, yearIndex),
        scope2_emissions: generateMonthlyPattern(350, patterns.energy, 0.08, month - 1, yearIndex),
        scope3_emissions: generateMonthlyPattern(1200, patterns.production, 0.05, month - 1, yearIndex),
        production_units: generateMonthlyPattern(50000, patterns.production, -0.02, month - 1, yearIndex),
      });

      // HQ site data
      hqSite.monthlyData.push({
        month: monthStr,
        electricity_kwh: generateMonthlyPattern(120000, patterns.office, 0.06, month - 1, yearIndex),
        natural_gas_kwh: generateMonthlyPattern(35000, patterns.energy, 0.10, month - 1, yearIndex),
        water_gallons: generateMonthlyPattern(15000, patterns.office, 0.03, month - 1, yearIndex),
        waste_total_kg: generateMonthlyPattern(3500, patterns.office, 0.08, month - 1, yearIndex),
        waste_recycled_kg: generateMonthlyPattern(2800, patterns.office, -0.05, month - 1, yearIndex),
        scope1_emissions: generateMonthlyPattern(15, patterns.energy, 0.09, month - 1, yearIndex),
        scope2_emissions: generateMonthlyPattern(25, patterns.office, 0.12, month - 1, yearIndex), // Faster reduction due to renewable energy
        scope3_emissions: generateMonthlyPattern(180, patterns.office, 0.04, month - 1, yearIndex),
        occupancy_count: generateMonthlyPattern(500, patterns.office, -0.01, month - 1, yearIndex),
      });

      // Distribution site data
      distributionSite.monthlyData.push({
        month: monthStr,
        electricity_kwh: generateMonthlyPattern(280000, patterns.production, 0.04, month - 1, yearIndex),
        natural_gas_kwh: generateMonthlyPattern(85000, patterns.energy, 0.07, month - 1, yearIndex),
        water_gallons: generateMonthlyPattern(25000, patterns.water, 0.02, month - 1, yearIndex),
        waste_total_kg: generateMonthlyPattern(12000, patterns.production, 0.05, month - 1, yearIndex),
        waste_recycled_kg: generateMonthlyPattern(10200, patterns.production, -0.04, month - 1, yearIndex),
        scope1_emissions: generateMonthlyPattern(45, patterns.energy, 0.06, month - 1, yearIndex),
        scope2_emissions: generateMonthlyPattern(110, patterns.production, 0.07, month - 1, yearIndex),
        scope3_emissions: generateMonthlyPattern(850, patterns.production, 0.03, month - 1, yearIndex),
      });
    }
  }

  return {
    company,
    sites: [manufacturingSite, hqSite, distributionSite],
  };
}

// Main function to populate database
async function populateDatabase() {
  try {
    console.log('🚀 Starting database population...');

    // Generate company data
    const { company, sites } = generateCompanyData();

    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert(company)
      .select()
      .single();

    if (orgError) throw orgError;
    console.log('✅ Created organization:', org.name);

    // 2. Create buildings for each site
    const buildings = [];
    for (const site of sites) {
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert({
          organization_id: org.id,
          name: site.name,
          slug: site.name.toLowerCase().replace(/\s+/g, '-'),
          address_line1: site.location.address,
          city: site.location.city,
          country: site.location.country,
          latitude: site.location.latitude,
          longitude: site.location.longitude,
          metadata: {
            type: site.type,
            size_sqft: site.type === 'manufacturing' ? 250000 : site.type === 'office' ? 50000 : 150000,
            year_built: site.type === 'manufacturing' ? 1985 : site.type === 'office' ? 2010 : 1995,
          },
        })
        .select()
        .single();

      if (buildingError) throw buildingError;
      buildings.push({ building, site });
      console.log('✅ Created building:', building.name);
    }

    // 3. Create monthly emissions data
    for (const { building, site } of buildings) {
      const emissionsData = [];
      
      for (const monthData of site.monthlyData) {
        const emissionDate = `${monthData.month}-15`; // Use middle of month
        
        // Electricity emissions (Scope 2)
        emissionsData.push({
          organization_id: org.id,
          emission_date: emissionDate,
          source_type: 'building',
          source_id: building.id,
          source_details: { building_name: building.name },
          module_id: 'buildings',
          scope: 2,
          category: 'electricity',
          activity_data: monthData.electricity_kwh,
          activity_unit: 'kWh',
          emission_factor: 0.433, // US average
          emissions_amount: monthData.electricity_kwh * 0.433,
          emissions_unit: 'kgCO2e',
          data_quality: 'measured',
          data_source: 'utility_bill',
          confidence_score: 0.95,
        });

        // Natural gas emissions (Scope 1)
        emissionsData.push({
          organization_id: org.id,
          emission_date: emissionDate,
          source_type: 'building',
          source_id: building.id,
          source_details: { building_name: building.name },
          module_id: 'buildings',
          scope: 1,
          category: 'natural_gas',
          activity_data: monthData.natural_gas_kwh,
          activity_unit: 'kWh',
          emission_factor: 0.185, // Natural gas factor
          emissions_amount: monthData.natural_gas_kwh * 0.185,
          emissions_unit: 'kgCO2e',
          data_quality: 'measured',
          data_source: 'utility_bill',
          confidence_score: 0.95,
        });

        // Supply chain emissions (Scope 3) - simplified
        if (site.type === 'manufacturing' || site.type === 'warehouse') {
          emissionsData.push({
            organization_id: org.id,
            emission_date: emissionDate,
            source_type: 'supply_chain',
            source_id: building.id,
            source_details: { 
              building_name: building.name,
              category: 'purchased_goods_services'
            },
            module_id: 'supply_chain',
            scope: 3,
            category: 'purchased_goods',
            activity_data: monthData.production_units || 1000,
            activity_unit: 'units',
            emission_factor: monthData.scope3_emissions / (monthData.production_units || 1000),
            emissions_amount: monthData.scope3_emissions * 1000, // Convert to kg
            emissions_unit: 'kgCO2e',
            data_quality: 'estimated',
            data_source: 'supplier_data',
            confidence_score: 0.75,
          });
        }
      }

      // Batch insert emissions
      const { error: emissionsError } = await supabase
        .from('emissions')
        .insert(emissionsData);

      if (emissionsError) throw emissionsError;
      console.log(`✅ Created ${emissionsData.length} emission records for ${building.name}`);
    }

    // 4. Create ESG metrics
    const esgMetrics = [];
    for (const { building, site } of buildings) {
      for (const monthData of site.monthlyData) {
        const metricDate = `${monthData.month}-15`;
        
        // Water usage metric
        esgMetrics.push({
          organization_id: org.id,
          metric_date: metricDate,
          pillar: 'E',
          category: 'water',
          metric_name: 'Water Consumption',
          metric_value: monthData.water_gallons,
          metric_unit: 'gallons',
          framework: 'GRI',
          framework_indicator: 'GRI 303-5',
        });

        // Waste diversion rate
        const diversionRate = (monthData.waste_recycled_kg / monthData.waste_total_kg) * 100;
        esgMetrics.push({
          organization_id: org.id,
          metric_date: metricDate,
          pillar: 'E',
          category: 'waste',
          metric_name: 'Waste Diversion Rate',
          metric_value: diversionRate,
          metric_unit: '%',
          framework: 'GRI',
          framework_indicator: 'GRI 306-4',
        });
      }
    }

    const { error: esgError } = await supabase
      .from('esg_metrics')
      .insert(esgMetrics);

    if (esgError) throw esgError;
    console.log(`✅ Created ${esgMetrics.length} ESG metrics`);

    // 5. Create sustainability targets
    const targets = [
      {
        organization_id: org.id,
        target_name: 'Net Zero Emissions by 2040',
        target_type: 'net_zero',
        target_category: 'emissions',
        scope_coverage: [1, 2, 3],
        baseline_year: 2022,
        baseline_value: 25000,
        baseline_unit: 'tCO2e',
        target_year: 2040,
        target_value: 0,
        target_unit: 'tCO2e',
        framework: 'SBTi',
        validation_status: 'validated',
        public_commitment: true,
        commitment_date: '2023-01-15',
        description: 'Achieve net-zero greenhouse gas emissions across all scopes by 2040',
      },
      {
        organization_id: org.id,
        target_name: '100% Renewable Energy by 2030',
        target_type: 'renewable',
        target_category: 'energy',
        scope_coverage: [2],
        baseline_year: 2022,
        baseline_value: 25,
        baseline_unit: '%',
        target_year: 2030,
        target_value: 100,
        target_unit: '%',
        framework: 'RE100',
        validation_status: 'approved',
        public_commitment: true,
        commitment_date: '2023-03-01',
      },
    ];

    const { error: targetsError } = await supabase
      .from('sustainability_targets')
      .insert(targets);

    if (targetsError) throw targetsError;
    console.log('✅ Created sustainability targets');

    console.log('\n🎉 Database population complete!');
    console.log(`Organization: ${org.name} (ID: ${org.id})`);
    console.log(`Buildings: ${buildings.map(b => b.building.name).join(', ')}`);
    console.log('\nYou can now use this data to test blipee OS features!');

  } catch (error) {
    console.error('❌ Error populating database:', error);
    process.exit(1);
  }
}

// Run the script
populateDatabase();