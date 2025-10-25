-- Universal Sustainability Metrics System
-- Flexible framework for tracking ALL possible sustainability metrics
-- Organizations select only what applies to them

-- ============================================
-- METRICS CATALOG (All Possible Metrics)
-- ============================================
CREATE TABLE IF NOT EXISTS metrics_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g., 'scope1_fleet_diesel', 'scope3_business_travel_air'
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('scope_1', 'scope_2', 'scope_3')),
  category TEXT NOT NULL, -- e.g., 'energy', 'travel', 'waste', 'water', 'supply_chain'
  subcategory TEXT, -- e.g., 'air_travel', 'rail_travel', 'fleet_vehicles'
  unit TEXT NOT NULL, -- 'km', 'kWh', 'liters', 'kg', 'tonnes', 'currency'
  emission_factor DECIMAL, -- kg CO2e per unit (for automatic calculation)
  data_type TEXT DEFAULT 'numeric' CHECK (data_type IN ('numeric', 'boolean', 'text', 'json')),
  gri_standard TEXT[], -- Related GRI standards e.g., ['305-1', '305-2']
  description TEXT,
  calculation_method TEXT, -- Formula or methodology
  metadata JSONB DEFAULT '{}', -- Additional configuration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORGANIZATION METRICS (Which Metrics They Track)
-- ============================================
CREATE TABLE IF NOT EXISTS organization_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES metrics_catalog(id),
  is_enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  target_value DECIMAL, -- Optional target/goal
  threshold_warning DECIMAL, -- Alert if exceeds
  threshold_critical DECIMAL, -- Critical alert if exceeds
  custom_emission_factor DECIMAL, -- Override catalog emission factor if needed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, metric_id)
);

-- ============================================
-- METRICS DATA (Actual Values Entered)
-- ============================================
CREATE TABLE IF NOT EXISTS metrics_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id), -- Optional: site-specific data
  metric_id UUID NOT NULL REFERENCES metrics_catalog(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  emissions_calculated DECIMAL, -- Auto-calculated CO2e
  data_quality TEXT DEFAULT 'estimated' CHECK (data_quality IN ('measured', 'calculated', 'estimated')),
  source TEXT, -- Where data came from (invoice, meter, estimate, etc.)
  evidence_url TEXT, -- Link to supporting document
  metadata JSONB DEFAULT '{}', -- Additional data (breakdown by type, etc.)
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INSERT COMPREHENSIVE METRICS CATALOG
-- ============================================

-- SCOPE 1: Direct Emissions
INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, emission_factor, gri_standard) VALUES
-- Stationary Combustion
('scope1_natural_gas', 'Natural Gas Consumption', 'scope_1', 'energy', 'stationary_combustion', 'kWh', 0.18, ARRAY['305-1']),
('scope1_diesel_generator', 'Diesel Generator', 'scope_1', 'energy', 'stationary_combustion', 'liters', 2.68, ARRAY['305-1']),
('scope1_propane', 'Propane Heating', 'scope_1', 'energy', 'stationary_combustion', 'kg', 2.98, ARRAY['305-1']),

-- Mobile Combustion (Fleet)
('scope1_fleet_gasoline', 'Fleet - Gasoline Vehicles', 'scope_1', 'transport', 'fleet', 'liters', 2.31, ARRAY['305-1']),
('scope1_fleet_diesel', 'Fleet - Diesel Vehicles', 'scope_1', 'transport', 'fleet', 'liters', 2.68, ARRAY['305-1']),
('scope1_fleet_hybrid', 'Fleet - Hybrid Vehicles', 'scope_1', 'transport', 'fleet', 'km', 0.12, ARRAY['305-1']),
('scope1_fleet_electric', 'Fleet - Electric Vehicles', 'scope_1', 'transport', 'fleet', 'kWh', 0.0, ARRAY['305-1']),

-- Refrigerants & Fugitive Emissions
('scope1_refrigerant_r410a', 'Refrigerant R-410A Leakage', 'scope_1', 'refrigerants', 'hvac', 'kg', 2088, ARRAY['305-1']),
('scope1_refrigerant_r134a', 'Refrigerant R-134a Leakage', 'scope_1', 'refrigerants', 'hvac', 'kg', 1430, ARRAY['305-1']),
('scope1_refrigerant_r32', 'Refrigerant R-32 Leakage', 'scope_1', 'refrigerants', 'hvac', 'kg', 675, ARRAY['305-1']),

-- Process Emissions
('scope1_industrial_process', 'Industrial Process Emissions', 'scope_1', 'industrial', 'process', 'tonnes_co2', 1000, ARRAY['305-1']),

-- SCOPE 2: Indirect Emissions (Energy)
('scope2_electricity_grid', 'Grid Electricity', 'scope_2', 'energy', 'electricity', 'kWh', 0.385, ARRAY['305-2']),
('scope2_electricity_renewable', 'Renewable Electricity (RECs)', 'scope_2', 'energy', 'electricity', 'kWh', 0.0, ARRAY['305-2']),
('scope2_district_heating', 'District Heating', 'scope_2', 'energy', 'heating', 'kWh', 0.215, ARRAY['305-2']),
('scope2_district_cooling', 'District Cooling', 'scope_2', 'energy', 'cooling', 'kWh', 0.195, ARRAY['305-2']),
('scope2_steam_purchased', 'Purchased Steam', 'scope_2', 'energy', 'steam', 'kg', 0.19, ARRAY['305-2']),

-- SCOPE 3: Value Chain Emissions
-- Category 1: Purchased Goods & Services
('scope3_purchased_goods', 'Purchased Goods', 'scope_3', 'supply_chain', 'goods', 'currency', 0.38, ARRAY['305-3']),
('scope3_purchased_services', 'Purchased Services', 'scope_3', 'supply_chain', 'services', 'currency', 0.22, ARRAY['305-3']),
('scope3_cloud_computing', 'Cloud Computing Services', 'scope_3', 'supply_chain', 'it_services', 'currency', 0.15, ARRAY['305-3']),
('scope3_software_licenses', 'Software Licenses', 'scope_3', 'supply_chain', 'it_services', 'currency', 0.08, ARRAY['305-3']),

-- Category 2: Capital Goods
('scope3_capital_goods', 'Capital Goods', 'scope_3', 'supply_chain', 'capital', 'currency', 0.42, ARRAY['305-3']),
('scope3_building_construction', 'Building Construction', 'scope_3', 'supply_chain', 'capital', 'currency', 0.38, ARRAY['305-3']),

-- Category 3: Fuel & Energy Related
('scope3_fuel_upstream', 'Upstream Fuel Production', 'scope_3', 'energy', 'upstream', 'kWh', 0.05, ARRAY['305-3']),
('scope3_transmission_losses', 'Electricity T&D Losses', 'scope_3', 'energy', 'transmission', 'kWh', 0.03, ARRAY['305-3']),

-- Category 4: Upstream Transportation
('scope3_inbound_logistics_road', 'Inbound Logistics - Road', 'scope_3', 'transport', 'logistics', 'tonne_km', 0.12, ARRAY['305-3']),
('scope3_inbound_logistics_sea', 'Inbound Logistics - Sea', 'scope_3', 'transport', 'logistics', 'tonne_km', 0.01, ARRAY['305-3']),
('scope3_inbound_logistics_air', 'Inbound Logistics - Air', 'scope_3', 'transport', 'logistics', 'tonne_km', 1.2, ARRAY['305-3']),

-- Category 5: Waste
('scope3_waste_landfill', 'Waste to Landfill', 'scope_3', 'waste', 'disposal', 'tonnes', 467, ARRAY['305-3', '306-2']),
('scope3_waste_recycling', 'Waste Recycling', 'scope_3', 'waste', 'recycling', 'tonnes', 21, ARRAY['305-3', '306-2']),
('scope3_waste_composting', 'Organic Waste Composting', 'scope_3', 'waste', 'composting', 'tonnes', 10, ARRAY['305-3', '306-2']),
('scope3_waste_incineration', 'Waste Incineration', 'scope_3', 'waste', 'incineration', 'tonnes', 892, ARRAY['305-3', '306-2']),
('scope3_wastewater', 'Wastewater Treatment', 'scope_3', 'waste', 'water', 'm3', 0.78, ARRAY['305-3', '303-4']),

-- Category 6: Business Travel
('scope3_travel_air_domestic', 'Air Travel - Domestic', 'scope_3', 'travel', 'air', 'km', 0.255, ARRAY['305-3']),
('scope3_travel_air_short', 'Air Travel - Short Haul (<463km)', 'scope_3', 'travel', 'air', 'km', 0.297, ARRAY['305-3']),
('scope3_travel_air_medium', 'Air Travel - Medium Haul (463-3700km)', 'scope_3', 'travel', 'air', 'km', 0.195, ARRAY['305-3']),
('scope3_travel_air_long', 'Air Travel - Long Haul (>3700km)', 'scope_3', 'travel', 'air', 'km', 0.165, ARRAY['305-3']),
('scope3_travel_rail', 'Rail Travel', 'scope_3', 'travel', 'rail', 'km', 0.041, ARRAY['305-3']),
('scope3_travel_bus', 'Bus Travel', 'scope_3', 'travel', 'bus', 'km', 0.089, ARRAY['305-3']),
('scope3_travel_car_rental', 'Rental Car', 'scope_3', 'travel', 'car', 'km', 0.171, ARRAY['305-3']),
('scope3_travel_taxi', 'Taxi/Rideshare', 'scope_3', 'travel', 'taxi', 'km', 0.205, ARRAY['305-3']),
('scope3_accommodation', 'Hotel Accommodation', 'scope_3', 'travel', 'accommodation', 'nights', 31.1, ARRAY['305-3']),

-- Category 7: Employee Commuting
('scope3_commute_car', 'Employee Commute - Car', 'scope_3', 'commuting', 'car', 'km', 0.171, ARRAY['305-3']),
('scope3_commute_public', 'Employee Commute - Public Transport', 'scope_3', 'commuting', 'public', 'km', 0.065, ARRAY['305-3']),
('scope3_commute_bike', 'Employee Commute - Bicycle', 'scope_3', 'commuting', 'bike', 'km', 0.0, ARRAY['305-3']),
('scope3_commute_walk', 'Employee Commute - Walking', 'scope_3', 'commuting', 'walk', 'km', 0.0, ARRAY['305-3']),
('scope3_remote_work', 'Remote Work Emissions', 'scope_3', 'commuting', 'remote', 'days', 2.3, ARRAY['305-3']),

-- Category 8: Upstream Leased Assets
('scope3_leased_buildings', 'Leased Buildings Energy', 'scope_3', 'leased', 'buildings', 'kWh', 0.385, ARRAY['305-3']),
('scope3_leased_vehicles', 'Leased Vehicles', 'scope_3', 'leased', 'vehicles', 'km', 0.171, ARRAY['305-3']),
('scope3_data_centers', 'Data Center Energy', 'scope_3', 'leased', 'it', 'kWh', 0.385, ARRAY['305-3']),

-- Category 11: Use of Sold Products
('scope3_product_use_energy', 'Product Use - Energy', 'scope_3', 'downstream', 'product_use', 'kWh', 0.385, ARRAY['305-3']),
('scope3_product_use_water', 'Product Use - Water', 'scope_3', 'downstream', 'product_use', 'm3', 0.344, ARRAY['305-3']),

-- Category 12: End of Life
('scope3_product_disposal', 'Product End-of-Life Disposal', 'scope_3', 'downstream', 'disposal', 'tonnes', 467, ARRAY['305-3']),
('scope3_product_recycling', 'Product End-of-Life Recycling', 'scope_3', 'downstream', 'recycling', 'tonnes', 21, ARRAY['305-3']),

-- Other Environmental Metrics (Beyond Carbon)
('water_consumption', 'Water Consumption', 'scope_3', 'water', 'consumption', 'm3', 0.344, ARRAY['303-5']),
('water_discharge', 'Water Discharge', 'scope_3', 'water', 'discharge', 'm3', 0.708, ARRAY['303-4']),
('paper_consumption', 'Paper Consumption', 'scope_3', 'resources', 'paper', 'kg', 1.84, ARRAY['301-1']),
('plastic_consumption', 'Plastic Consumption', 'scope_3', 'resources', 'plastic', 'kg', 6.0, ARRAY['301-1'])
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_metrics_catalog_scope ON metrics_catalog(scope);
CREATE INDEX idx_metrics_catalog_category ON metrics_catalog(category);
CREATE INDEX idx_metrics_catalog_active ON metrics_catalog(is_active);
CREATE INDEX idx_organization_metrics_org ON organization_metrics(organization_id);
CREATE INDEX idx_metrics_data_org ON metrics_data(organization_id);
CREATE INDEX idx_metrics_data_period ON metrics_data(period_start, period_end);
CREATE INDEX idx_metrics_data_metric ON metrics_data(metric_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE metrics_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_data ENABLE ROW LEVEL SECURITY;

-- Metrics catalog is public read
CREATE POLICY "Anyone can view metrics catalog" ON metrics_catalog
  FOR SELECT USING (true);

-- Organization metrics - organization members only
CREATE POLICY "Organization members can view their metrics" ON organization_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage organization metrics" ON organization_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager')
    )
  );

-- Metrics data - organization members can view
CREATE POLICY "Organization members can view metrics data" ON metrics_data
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

-- Metrics data - specific roles can insert/update
CREATE POLICY "Authorized users can manage metrics data" ON metrics_data
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager', 'analyst')
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate emissions automatically
CREATE OR REPLACE FUNCTION calculate_emissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Get emission factor from catalog or organization override
  SELECT COALESCE(om.custom_emission_factor, mc.emission_factor)
  INTO NEW.emissions_calculated
  FROM metrics_catalog mc
  LEFT JOIN organization_metrics om ON om.metric_id = mc.id
    AND om.organization_id = NEW.organization_id
  WHERE mc.id = NEW.metric_id;

  -- Calculate emissions
  NEW.emissions_calculated := NEW.value * COALESCE(NEW.emissions_calculated, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_emissions_on_insert
  BEFORE INSERT OR UPDATE ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION calculate_emissions();

-- ============================================
-- AGGREGATION VIEWS
-- ============================================

-- View for total emissions by scope
CREATE OR REPLACE VIEW emissions_by_scope AS
SELECT
  md.organization_id,
  mc.scope,
  DATE_TRUNC('month', md.period_start) as month,
  SUM(md.emissions_calculated) as total_emissions_kg_co2e
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
GROUP BY md.organization_id, mc.scope, DATE_TRUNC('month', md.period_start);

-- View for emissions by category
CREATE OR REPLACE VIEW emissions_by_category AS
SELECT
  md.organization_id,
  mc.scope,
  mc.category,
  DATE_TRUNC('month', md.period_start) as month,
  SUM(md.emissions_calculated) as total_emissions_kg_co2e
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
GROUP BY md.organization_id, mc.scope, mc.category, DATE_TRUNC('month', md.period_start);