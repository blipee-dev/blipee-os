import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

// All 74 metrics
const metrics = [
  // SCOPE 1
  { code: 'scope1_natural_gas', name: 'Natural Gas Consumption', scope: 'scope_1', category: 'Stationary Combustion', subcategory: 'Heating', unit: 'm³', description: 'Natural gas used for heating and operations', emission_factor: 1.8788, emission_factor_unit: 'kgCO2e/m³' },
  { code: 'scope1_diesel_generators', name: 'Diesel for Generators', scope: 'scope_1', category: 'Stationary Combustion', subcategory: 'Backup Power', unit: 'liters', description: 'Diesel fuel used in backup generators', emission_factor: 2.68, emission_factor_unit: 'kgCO2e/liter' },
  { code: 'scope1_heating_oil', name: 'Heating Oil', scope: 'scope_1', category: 'Stationary Combustion', subcategory: 'Heating', unit: 'liters', description: 'Heating oil for building operations', emission_factor: 2.52, emission_factor_unit: 'kgCO2e/liter' },
  { code: 'scope1_propane', name: 'Propane', scope: 'scope_1', category: 'Stationary Combustion', subcategory: 'Heating', unit: 'kg', description: 'Propane gas consumption', emission_factor: 2.98, emission_factor_unit: 'kgCO2e/kg' },
  { code: 'scope1_coal', name: 'Coal', scope: 'scope_1', category: 'Stationary Combustion', subcategory: 'Industrial', unit: 'kg', description: 'Coal used in industrial processes', emission_factor: 2.42, emission_factor_unit: 'kgCO2e/kg' },
  { code: 'scope1_biomass', name: 'Biomass', scope: 'scope_1', category: 'Stationary Combustion', subcategory: 'Renewable', unit: 'kg', description: 'Biomass fuel consumption', emission_factor: 0.0, emission_factor_unit: 'kgCO2e/kg' },
  { code: 'scope1_fleet_gasoline', name: 'Fleet Gasoline', scope: 'scope_1', category: 'Mobile Combustion', subcategory: 'Vehicles', unit: 'liters', description: 'Gasoline for company vehicles', emission_factor: 2.31, emission_factor_unit: 'kgCO2e/liter' },
  { code: 'scope1_fleet_diesel', name: 'Fleet Diesel', scope: 'scope_1', category: 'Mobile Combustion', subcategory: 'Vehicles', unit: 'liters', description: 'Diesel for company vehicles', emission_factor: 2.68, emission_factor_unit: 'kgCO2e/liter' },
  { code: 'scope1_fleet_lpg', name: 'Fleet LPG', scope: 'scope_1', category: 'Mobile Combustion', subcategory: 'Vehicles', unit: 'liters', description: 'LPG for company vehicles', emission_factor: 1.51, emission_factor_unit: 'kgCO2e/liter' },
  { code: 'scope1_fleet_cng', name: 'Fleet CNG', scope: 'scope_1', category: 'Mobile Combustion', subcategory: 'Vehicles', unit: 'm³', description: 'Compressed natural gas for vehicles', emission_factor: 1.89, emission_factor_unit: 'kgCO2e/m³' },
  { code: 'scope1_fleet_biodiesel', name: 'Fleet Biodiesel', scope: 'scope_1', category: 'Mobile Combustion', subcategory: 'Vehicles', unit: 'liters', description: 'Biodiesel for company vehicles', emission_factor: 0.0, emission_factor_unit: 'kgCO2e/liter' },
  { code: 'scope1_fleet_ethanol', name: 'Fleet Ethanol', scope: 'scope_1', category: 'Mobile Combustion', subcategory: 'Vehicles', unit: 'liters', description: 'Ethanol for company vehicles', emission_factor: 0.0, emission_factor_unit: 'kgCO2e/liter' },
  { code: 'scope1_refrigerant_r410a', name: 'Refrigerant R410A Leakage', scope: 'scope_1', category: 'Fugitive Emissions', subcategory: 'HVAC', unit: 'kg', description: 'R410A refrigerant leakage from HVAC', emission_factor: 2088, emission_factor_unit: 'kgCO2e/kg' },
  { code: 'scope1_refrigerant_r134a', name: 'Refrigerant R134A Leakage', scope: 'scope_1', category: 'Fugitive Emissions', subcategory: 'HVAC', unit: 'kg', description: 'R134A refrigerant leakage', emission_factor: 1430, emission_factor_unit: 'kgCO2e/kg' },
  { code: 'scope1_refrigerant_r404a', name: 'Refrigerant R404A Leakage', scope: 'scope_1', category: 'Fugitive Emissions', subcategory: 'HVAC', unit: 'kg', description: 'R404A refrigerant leakage', emission_factor: 3922, emission_factor_unit: 'kgCO2e/kg' },
  { code: 'scope1_fire_suppression', name: 'Fire Suppression Systems', scope: 'scope_1', category: 'Fugitive Emissions', subcategory: 'Safety', unit: 'kg', description: 'Fire suppression system emissions', emission_factor: 1.0, emission_factor_unit: 'kgCO2e/kg' },
  { code: 'scope1_industrial_process', name: 'Industrial Process Emissions', scope: 'scope_1', category: 'Process Emissions', subcategory: 'Manufacturing', unit: 'tCO2e', description: 'Direct emissions from industrial processes', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e' },
  { code: 'scope1_wastewater_treatment', name: 'Wastewater Treatment', scope: 'scope_1', category: 'Process Emissions', subcategory: 'Waste', unit: 'tCO2e', description: 'Emissions from onsite wastewater treatment', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e' },

  // SCOPE 2
  { code: 'scope2_electricity_grid', name: 'Grid Electricity', scope: 'scope_2', category: 'Electricity', subcategory: 'Purchased', unit: 'kWh', description: 'Electricity from the grid', emission_factor: 0.4, emission_factor_unit: 'kgCO2e/kWh' },
  { code: 'scope2_electricity_renewable', name: 'Renewable Electricity', scope: 'scope_2', category: 'Electricity', subcategory: 'Renewable', unit: 'kWh', description: 'Certified renewable electricity', emission_factor: 0.0, emission_factor_unit: 'kgCO2e/kWh' },
  { code: 'scope2_electricity_solar', name: 'Solar Electricity Generated', scope: 'scope_2', category: 'Electricity', subcategory: 'Onsite Generation', unit: 'kWh', description: 'Solar panels electricity generation', emission_factor: 0.0, emission_factor_unit: 'kgCO2e/kWh' },
  { code: 'scope2_electricity_wind', name: 'Wind Electricity Generated', scope: 'scope_2', category: 'Electricity', subcategory: 'Onsite Generation', unit: 'kWh', description: 'Wind turbine electricity generation', emission_factor: 0.0, emission_factor_unit: 'kgCO2e/kWh' },
  { code: 'scope2_purchased_heating', name: 'Purchased Heating', scope: 'scope_2', category: 'Purchased Energy', subcategory: 'Thermal', unit: 'kWh', description: 'Purchased heat energy', emission_factor: 0.2, emission_factor_unit: 'kgCO2e/kWh' },
  { code: 'scope2_purchased_cooling', name: 'Purchased Cooling', scope: 'scope_2', category: 'Purchased Energy', subcategory: 'Thermal', unit: 'kWh', description: 'Purchased cooling energy', emission_factor: 0.2, emission_factor_unit: 'kgCO2e/kWh' },
  { code: 'scope2_purchased_steam', name: 'Purchased Steam', scope: 'scope_2', category: 'Purchased Energy', subcategory: 'Thermal', unit: 'kWh', description: 'Purchased steam energy', emission_factor: 0.2, emission_factor_unit: 'kgCO2e/kWh' },
  { code: 'scope2_district_heating', name: 'District Heating', scope: 'scope_2', category: 'Purchased Energy', subcategory: 'District', unit: 'kWh', description: 'District heating network', emission_factor: 0.15, emission_factor_unit: 'kgCO2e/kWh' },
  { code: 'scope2_district_cooling', name: 'District Cooling', scope: 'scope_2', category: 'Purchased Energy', subcategory: 'District', unit: 'kWh', description: 'District cooling network', emission_factor: 0.15, emission_factor_unit: 'kgCO2e/kWh' },

  // SCOPE 3
  { code: 'scope3_purchased_goods', name: 'Purchased Goods', scope: 'scope_3', category: 'Purchased Goods & Services', subcategory: 'Physical Goods', unit: 'EUR', description: 'Emissions from purchased physical goods', emission_factor: 0.5, emission_factor_unit: 'kgCO2e/EUR', ghg_protocol_category: '1' },
  { code: 'scope3_purchased_services', name: 'Purchased Services', scope: 'scope_3', category: 'Purchased Goods & Services', subcategory: 'Services', unit: 'EUR', description: 'Emissions from purchased services', emission_factor: 0.2, emission_factor_unit: 'kgCO2e/EUR', ghg_protocol_category: '1' },
  { code: 'scope3_cloud_computing', name: 'Cloud Computing Services', scope: 'scope_3', category: 'Purchased Goods & Services', subcategory: 'IT Services', unit: 'EUR', description: 'Cloud and SaaS services emissions', emission_factor: 0.3, emission_factor_unit: 'kgCO2e/EUR', ghg_protocol_category: '1' },
  { code: 'scope3_software_licenses', name: 'Software Licenses', scope: 'scope_3', category: 'Purchased Goods & Services', subcategory: 'IT Services', unit: 'EUR', description: 'Software licensing emissions', emission_factor: 0.1, emission_factor_unit: 'kgCO2e/EUR', ghg_protocol_category: '1' },
  { code: 'scope3_capital_goods', name: 'Capital Goods', scope: 'scope_3', category: 'Capital Goods', subcategory: 'General', unit: 'EUR', description: 'Emissions from capital purchases', emission_factor: 0.4, emission_factor_unit: 'kgCO2e/EUR', ghg_protocol_category: '2' },
  { code: 'scope3_buildings', name: 'Buildings Construction', scope: 'scope_3', category: 'Capital Goods', subcategory: 'Construction', unit: 'EUR', description: 'Building construction emissions', emission_factor: 0.6, emission_factor_unit: 'kgCO2e/EUR', ghg_protocol_category: '2' },
  { code: 'scope3_machinery', name: 'Machinery & Equipment', scope: 'scope_3', category: 'Capital Goods', subcategory: 'Equipment', unit: 'EUR', description: 'Machinery and equipment purchases', emission_factor: 0.5, emission_factor_unit: 'kgCO2e/EUR', ghg_protocol_category: '2' },
  { code: 'scope3_it_equipment', name: 'IT Equipment', scope: 'scope_3', category: 'Capital Goods', subcategory: 'IT Hardware', unit: 'EUR', description: 'Computers and IT hardware', emission_factor: 0.8, emission_factor_unit: 'kgCO2e/EUR', ghg_protocol_category: '2' },
  { code: 'scope3_upstream_emissions', name: 'Upstream Fuel Emissions', scope: 'scope_3', category: 'Fuel & Energy Related', subcategory: 'Well-to-Tank', unit: 'tCO2e', description: 'Upstream emissions from fuel production', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e', ghg_protocol_category: '3' },
  { code: 'scope3_transmission_losses', name: 'T&D Losses', scope: 'scope_3', category: 'Fuel & Energy Related', subcategory: 'Grid Losses', unit: 'kWh', description: 'Transmission and distribution losses', emission_factor: 0.04, emission_factor_unit: 'kgCO2e/kWh', ghg_protocol_category: '3' },
  { code: 'scope3_upstream_transport_road', name: 'Upstream Road Transport', scope: 'scope_3', category: 'Upstream Transportation', subcategory: 'Road', unit: 'ton-km', description: 'Road freight transport upstream', emission_factor: 0.1, emission_factor_unit: 'kgCO2e/ton-km', ghg_protocol_category: '4' },
  { code: 'scope3_upstream_transport_air', name: 'Upstream Air Transport', scope: 'scope_3', category: 'Upstream Transportation', subcategory: 'Air', unit: 'ton-km', description: 'Air freight transport upstream', emission_factor: 1.2, emission_factor_unit: 'kgCO2e/ton-km', ghg_protocol_category: '4' },
  { code: 'scope3_upstream_transport_sea', name: 'Upstream Sea Transport', scope: 'scope_3', category: 'Upstream Transportation', subcategory: 'Sea', unit: 'ton-km', description: 'Sea freight transport upstream', emission_factor: 0.01, emission_factor_unit: 'kgCO2e/ton-km', ghg_protocol_category: '4' },
  { code: 'scope3_upstream_transport_rail', name: 'Upstream Rail Transport', scope: 'scope_3', category: 'Upstream Transportation', subcategory: 'Rail', unit: 'ton-km', description: 'Rail freight transport upstream', emission_factor: 0.03, emission_factor_unit: 'kgCO2e/ton-km', ghg_protocol_category: '4' },
  { code: 'scope3_waste_landfill', name: 'Waste to Landfill', scope: 'scope_3', category: 'Waste', subcategory: 'Disposal', unit: 'tons', description: 'Waste sent to landfill', emission_factor: 467, emission_factor_unit: 'kgCO2e/ton', ghg_protocol_category: '5' },
  { code: 'scope3_waste_recycling', name: 'Waste Recycled', scope: 'scope_3', category: 'Waste', subcategory: 'Recycling', unit: 'tons', description: 'Waste sent for recycling', emission_factor: 21, emission_factor_unit: 'kgCO2e/ton', ghg_protocol_category: '5' },
  { code: 'scope3_waste_composting', name: 'Waste Composted', scope: 'scope_3', category: 'Waste', subcategory: 'Composting', unit: 'tons', description: 'Organic waste composted', emission_factor: 10, emission_factor_unit: 'kgCO2e/ton', ghg_protocol_category: '5' },
  { code: 'scope3_waste_incineration', name: 'Waste Incinerated', scope: 'scope_3', category: 'Waste', subcategory: 'Incineration', unit: 'tons', description: 'Waste incinerated', emission_factor: 883, emission_factor_unit: 'kgCO2e/ton', ghg_protocol_category: '5' },
  { code: 'scope3_wastewater', name: 'Wastewater', scope: 'scope_3', category: 'Waste', subcategory: 'Water', unit: 'm³', description: 'Wastewater treatment emissions', emission_factor: 0.7, emission_factor_unit: 'kgCO2e/m³', ghg_protocol_category: '5' },
  { code: 'scope3_business_travel_air', name: 'Air Travel', scope: 'scope_3', category: 'Business Travel', subcategory: 'Air', unit: 'km', description: 'Employee air travel', emission_factor: 0.15, emission_factor_unit: 'kgCO2e/km', ghg_protocol_category: '6' },
  { code: 'scope3_business_travel_rail', name: 'Rail Travel', scope: 'scope_3', category: 'Business Travel', subcategory: 'Rail', unit: 'km', description: 'Employee rail travel', emission_factor: 0.04, emission_factor_unit: 'kgCO2e/km', ghg_protocol_category: '6' },
  { code: 'scope3_business_travel_road', name: 'Road Travel', scope: 'scope_3', category: 'Business Travel', subcategory: 'Road', unit: 'km', description: 'Employee road travel', emission_factor: 0.17, emission_factor_unit: 'kgCO2e/km', ghg_protocol_category: '6' },
  { code: 'scope3_hotel_nights', name: 'Hotel Nights', scope: 'scope_3', category: 'Business Travel', subcategory: 'Accommodation', unit: 'nights', description: 'Hotel accommodation emissions', emission_factor: 20.0, emission_factor_unit: 'kgCO2e/night', ghg_protocol_category: '6' },
  { code: 'scope3_employee_commute_car', name: 'Employee Car Commute', scope: 'scope_3', category: 'Employee Commuting', subcategory: 'Car', unit: 'km', description: 'Employee commute by car', emission_factor: 0.17, emission_factor_unit: 'kgCO2e/km', ghg_protocol_category: '7' },
  { code: 'scope3_employee_commute_public', name: 'Public Transport Commute', scope: 'scope_3', category: 'Employee Commuting', subcategory: 'Public Transport', unit: 'km', description: 'Employee public transport commute', emission_factor: 0.08, emission_factor_unit: 'kgCO2e/km', ghg_protocol_category: '7' },
  { code: 'scope3_employee_commute_bike', name: 'Bicycle Commute', scope: 'scope_3', category: 'Employee Commuting', subcategory: 'Bicycle', unit: 'km', description: 'Employee bicycle commute', emission_factor: 0.0, emission_factor_unit: 'kgCO2e/km', ghg_protocol_category: '7' },
  { code: 'scope3_remote_work', name: 'Remote Work Days', scope: 'scope_3', category: 'Employee Commuting', subcategory: 'Remote', unit: 'days', description: 'Work from home emissions', emission_factor: 2.5, emission_factor_unit: 'kgCO2e/day', ghg_protocol_category: '7' },
  { code: 'scope3_leased_buildings', name: 'Leased Buildings Energy', scope: 'scope_3', category: 'Upstream Leased Assets', subcategory: 'Buildings', unit: 'kWh', description: 'Energy from leased buildings', emission_factor: 0.4, emission_factor_unit: 'kgCO2e/kWh', ghg_protocol_category: '8' },
  { code: 'scope3_leased_vehicles', name: 'Leased Vehicles Fuel', scope: 'scope_3', category: 'Upstream Leased Assets', subcategory: 'Vehicles', unit: 'liters', description: 'Fuel from leased vehicles', emission_factor: 2.5, emission_factor_unit: 'kgCO2e/liter', ghg_protocol_category: '8' },
  { code: 'scope3_downstream_transport', name: 'Downstream Transportation', scope: 'scope_3', category: 'Downstream Transportation', subcategory: 'Distribution', unit: 'ton-km', description: 'Product distribution emissions', emission_factor: 0.1, emission_factor_unit: 'kgCO2e/ton-km', ghg_protocol_category: '9' },
  { code: 'scope3_product_distribution', name: 'Product Distribution', scope: 'scope_3', category: 'Downstream Transportation', subcategory: 'Logistics', unit: 'ton-km', description: 'Product logistics emissions', emission_factor: 0.1, emission_factor_unit: 'kgCO2e/ton-km', ghg_protocol_category: '9' },
  { code: 'scope3_processing_sold_products', name: 'Processing of Sold Products', scope: 'scope_3', category: 'Processing of Sold Products', subcategory: 'Manufacturing', unit: 'tCO2e', description: 'Downstream processing emissions', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e', ghg_protocol_category: '10' },
  { code: 'scope3_use_sold_products', name: 'Use of Sold Products', scope: 'scope_3', category: 'Use of Sold Products', subcategory: 'Product Use', unit: 'tCO2e', description: 'Emissions from product use phase', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e', ghg_protocol_category: '11' },
  { code: 'scope3_product_energy_use', name: 'Product Energy Consumption', scope: 'scope_3', category: 'Use of Sold Products', subcategory: 'Energy', unit: 'kWh', description: 'Energy consumed by sold products', emission_factor: 0.4, emission_factor_unit: 'kgCO2e/kWh', ghg_protocol_category: '11' },
  { code: 'scope3_product_disposal', name: 'Product End-of-Life', scope: 'scope_3', category: 'End-of-Life', subcategory: 'Disposal', unit: 'tons', description: 'Product disposal emissions', emission_factor: 467, emission_factor_unit: 'kgCO2e/ton', ghg_protocol_category: '12' },
  { code: 'scope3_product_recycling', name: 'Product Recycling Rate', scope: 'scope_3', category: 'End-of-Life', subcategory: 'Recycling', unit: '%', description: 'Percentage of products recycled', emission_factor: 0.0, emission_factor_unit: 'kgCO2e/%', ghg_protocol_category: '12' },
  { code: 'scope3_downstream_leased', name: 'Downstream Leased Assets', scope: 'scope_3', category: 'Downstream Leased Assets', subcategory: 'Assets', unit: 'tCO2e', description: 'Emissions from leased out assets', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e', ghg_protocol_category: '13' },
  { code: 'scope3_franchises', name: 'Franchise Operations', scope: 'scope_3', category: 'Franchises', subcategory: 'Operations', unit: 'tCO2e', description: 'Emissions from franchise operations', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e', ghg_protocol_category: '14' },
  { code: 'scope3_investments', name: 'Investment Emissions', scope: 'scope_3', category: 'Investments', subcategory: 'Financial', unit: 'tCO2e', description: 'Emissions from investments', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e', ghg_protocol_category: '15' },
  { code: 'scope3_financed_emissions', name: 'Financed Emissions', scope: 'scope_3', category: 'Investments', subcategory: 'Banking', unit: 'tCO2e', description: 'Emissions from financed activities', emission_factor: 1.0, emission_factor_unit: 'tCO2e/tCO2e', ghg_protocol_category: '15' }
];

async function insertMetrics() {
  console.log('🚀 Inserting all 74 sustainability metrics...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const metric of metrics) {
    try {
      const { error } = await supabase
        .from('metrics_catalog')
        .upsert(metric, { onConflict: 'code' });

      if (error) {
        console.error(`❌ Error inserting ${metric.code}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Inserted: ${metric.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error with ${metric.code}:`, err);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully inserted: ${successCount} metrics`);
  console.log(`   ❌ Failed: ${errorCount} metrics`);

  // Verify total count
  const { count } = await supabase
    .from('metrics_catalog')
    .select('*', { count: 'exact', head: true });

  console.log(`   📈 Total in database: ${count} metrics`);
}

insertMetrics();