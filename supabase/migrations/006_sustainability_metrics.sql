-- Sustainability metrics tables for GRI/CSRD compliance

-- Building metrics time series data
CREATE TABLE IF NOT EXISTS public.building_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(20, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT unique_building_metric UNIQUE(building_id, timestamp, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_building_metrics_building_timestamp 
    ON public.building_metrics(building_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_building_metrics_type 
    ON public.building_metrics(metric_type);

-- Weather data for correlation
CREATE TABLE IF NOT EXISTS public.weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    pressure DECIMAL(7, 2),
    wind_speed DECIMAL(5, 2),
    wind_direction INTEGER,
    cloud_cover DECIMAL(5, 2),
    precipitation DECIMAL(6, 2),
    solar_irradiance DECIMAL(6, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_weather_reading UNIQUE(building_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_weather_data_building_timestamp 
    ON public.weather_data(building_id, timestamp DESC);

-- Equipment and maintenance tracking
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    model VARCHAR(255),
    serial_number VARCHAR(255),
    installation_date DATE,
    expected_lifetime_years INTEGER,
    specifications JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'operational',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_building ON public.equipment(building_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON public.equipment(type);

-- Maintenance logs
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- preventive, corrective, emergency
    description TEXT,
    performed_by VARCHAR(255),
    performed_at TIMESTAMPTZ NOT NULL,
    next_maintenance_date DATE,
    cost DECIMAL(10, 2),
    parts_replaced JSONB DEFAULT '[]',
    downtime_hours DECIMAL(6, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_logs_building ON public.maintenance_logs(building_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equipment ON public.maintenance_logs(equipment_id);

-- Transportation and commuting data
CREATE TABLE IF NOT EXISTS public.transportation_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL, -- commute, business_travel
    mode VARCHAR(50) NOT NULL, -- car, ev, public_transit, bike, walk, plane
    distance_km DECIMAL(10, 2),
    emissions_kg_co2 DECIMAL(10, 3),
    employee_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transportation_data_building_date 
    ON public.transportation_data(building_id, date DESC);

-- Waste management data
CREATE TABLE IF NOT EXISTS public.waste_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    waste_type VARCHAR(50) NOT NULL, -- general, recycling, organic, hazardous
    subtype VARCHAR(50), -- paper, plastic, glass, metal, electronic, medical
    quantity_kg DECIMAL(10, 2),
    disposal_method VARCHAR(50), -- landfill, recycling, composting, incineration
    diversion_rate DECIMAL(5, 2), -- percentage diverted from landfill
    cost DECIMAL(10, 2),
    contractor VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_data_building_date 
    ON public.waste_data(building_id, date DESC);

-- Compliance and reporting
CREATE TABLE IF NOT EXISTS public.compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- GRI, CSRD, EU_Taxonomy
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    metrics JSONB NOT NULL,
    certifications JSONB DEFAULT '[]',
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_org 
    ON public.compliance_reports(organization_id);

-- Sustainability goals and targets
CREATE TABLE IF NOT EXISTS public.sustainability_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id),
    goal_type VARCHAR(50) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    baseline_value DECIMAL(20, 4),
    baseline_year INTEGER,
    target_value DECIMAL(20, 4),
    target_year INTEGER,
    current_value DECIMAL(20, 4),
    unit VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_goals_org 
    ON public.sustainability_goals(organization_id);

-- RLS Policies for metrics tables
ALTER TABLE public.building_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_goals ENABLE ROW LEVEL SECURITY;

-- Building metrics policies
DROP POLICY IF EXISTS "Users can view metrics for their buildings" ON public.building_metrics;
CREATE POLICY "Users can view metrics for their buildings" ON public.building_metrics
    FOR SELECT USING (
        building_id IN (
            SELECT b.id FROM buildings b
            INNER JOIN building_assignments ba ON b.id = ba.building_id
            WHERE ba.user_id = auth.uid()
        )
    );

-- Similar policies for other tables
DROP POLICY IF EXISTS "Users can view weather for their buildings" ON public.weather_data;
CREATE POLICY "Users can view weather for their buildings" ON public.weather_data
    FOR SELECT USING (
        building_id IN (
            SELECT b.id FROM buildings b
            INNER JOIN building_assignments ba ON b.id = ba.building_id
            WHERE ba.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view equipment for their buildings" ON public.equipment;
CREATE POLICY "Users can view equipment for their buildings" ON public.equipment
    FOR SELECT USING (
        building_id IN (
            SELECT b.id FROM buildings b
            INNER JOIN building_assignments ba ON b.id = ba.building_id
            WHERE ba.user_id = auth.uid()
        )
    );

-- Function to calculate emissions based on Portuguese factors
CREATE OR REPLACE FUNCTION calculate_emissions(
    energy_kwh DECIMAL,
    energy_type VARCHAR,
    year INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    emission_factor DECIMAL;
BEGIN
    -- Portuguese grid emission factors by year
    IF energy_type = 'electricity' THEN
        CASE year
            WHEN 2022 THEN emission_factor := 0.195; -- kg CO2/kWh
            WHEN 2023 THEN emission_factor := 0.165;
            WHEN 2024 THEN emission_factor := 0.140;
            WHEN 2025 THEN emission_factor := 0.125;
            ELSE emission_factor := 0.150; -- default
        END CASE;
    ELSIF energy_type = 'natural_gas' THEN
        emission_factor := 0.202; -- kg CO2/kWh for natural gas
    ELSIF energy_type = 'diesel' THEN
        emission_factor := 2.68; -- kg CO2/liter
    ELSE
        emission_factor := 0;
    END IF;
    
    RETURN energy_kwh * emission_factor;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate degree days (Portuguese climate)
CREATE OR REPLACE FUNCTION calculate_degree_days(
    avg_temp DECIMAL,
    base_temp DECIMAL DEFAULT 18.0,
    type VARCHAR DEFAULT 'heating'
) RETURNS DECIMAL AS $$
BEGIN
    IF type = 'heating' AND avg_temp < base_temp THEN
        RETURN base_temp - avg_temp;
    ELSIF type = 'cooling' AND avg_temp > base_temp THEN
        RETURN avg_temp - base_temp;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;