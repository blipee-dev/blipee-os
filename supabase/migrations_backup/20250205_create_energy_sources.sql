-- Migration: Create energy sources and related tables
-- Date: 2025-02-05
-- Description: Creates energy_sources, energy_consumption, and energy_intensity tables for Energy Dashboard

-- Energy Sources table (electricity, gas, solar, etc.)
CREATE TABLE IF NOT EXISTS public.energy_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('grid_electricity', 'natural_gas', 'solar', 'wind', 'diesel', 'ev_charging', 'other')),
  unit TEXT NOT NULL DEFAULT 'kWh',
  is_renewable BOOLEAN DEFAULT FALSE,
  emission_factor DECIMAL(10, 6), -- kgCO2e per unit
  cost_per_unit DECIMAL(10, 4), -- currency per unit
  provider TEXT,
  contract_details JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Consumption Records
CREATE TABLE IF NOT EXISTS public.energy_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.energy_sources(id) ON DELETE CASCADE,
  consumption_value DECIMAL(20, 4) NOT NULL,
  unit TEXT NOT NULL,
  emissions_tco2e DECIMAL(20, 4),
  cost DECIMAL(20, 4),
  peak_demand_kw DECIMAL(20, 4),
  off_peak_usage_kwh DECIMAL(20, 4),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Intensity Metrics
CREATE TABLE IF NOT EXISTS public.energy_intensity_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('per_employee', 'per_sqm', 'per_revenue', 'per_production')),
  value DECIMAL(20, 6) NOT NULL,
  unit TEXT NOT NULL,
  trend_percentage DECIMAL(5, 2),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peak Demand Metrics
CREATE TABLE IF NOT EXISTS public.peak_demand_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  peak_demand_kw DECIMAL(20, 4) NOT NULL,
  peak_time TIMESTAMPTZ,
  off_peak_usage_percentage DECIMAL(5, 2),
  off_peak_savings DECIMAL(20, 4),
  load_factor DECIMAL(5, 4),
  load_factor_target DECIMAL(5, 4) DEFAULT 0.85,
  power_factor DECIMAL(5, 4),
  power_factor_target DECIMAL(5, 4) DEFAULT 0.95,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_energy_sources_org ON public.energy_sources(organization_id);
CREATE INDEX idx_energy_sources_building ON public.energy_sources(building_id);
CREATE INDEX idx_energy_consumption_org_building ON public.energy_consumption(organization_id, building_id);
CREATE INDEX idx_energy_consumption_period ON public.energy_consumption(period_start, period_end);
CREATE INDEX idx_energy_consumption_source ON public.energy_consumption(source_id);
CREATE INDEX idx_energy_intensity_org ON public.energy_intensity_metrics(organization_id);
CREATE INDEX idx_energy_intensity_period ON public.energy_intensity_metrics(period_start, period_end);
CREATE INDEX idx_peak_demand_org ON public.peak_demand_metrics(organization_id);
CREATE INDEX idx_peak_demand_period ON public.peak_demand_metrics(period_start, period_end);

-- Create updated_at triggers
CREATE TRIGGER update_energy_sources_updated_at BEFORE UPDATE ON public.energy_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_energy_consumption_updated_at BEFORE UPDATE ON public.energy_consumption
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_energy_intensity_updated_at BEFORE UPDATE ON public.energy_intensity_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_peak_demand_updated_at BEFORE UPDATE ON public.peak_demand_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.energy_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_intensity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peak_demand_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for energy_sources
CREATE POLICY "Users can view energy sources in their organization" ON public.energy_sources
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert energy sources in their organization" ON public.energy_sources
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

CREATE POLICY "Users can update energy sources in their organization" ON public.energy_sources
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- RLS Policies for energy_consumption
CREATE POLICY "Users can view energy consumption in their organization" ON public.energy_consumption
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert energy consumption in their organization" ON public.energy_consumption
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager', 'analyst')
    )
  );

-- RLS Policies for energy_intensity_metrics
CREATE POLICY "Users can view energy intensity in their organization" ON public.energy_intensity_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert energy intensity in their organization" ON public.energy_intensity_metrics
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'analyst')
    )
  );

-- RLS Policies for peak_demand_metrics
CREATE POLICY "Users can view peak demand in their organization" ON public.peak_demand_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert peak demand in their organization" ON public.peak_demand_metrics
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager', 'analyst')
    )
  );

COMMENT ON TABLE public.energy_sources IS 'Stores energy source configurations (electricity, gas, solar, etc.)';
COMMENT ON TABLE public.energy_consumption IS 'Stores energy consumption records with emissions and costs';
COMMENT ON TABLE public.energy_intensity_metrics IS 'Stores energy intensity metrics (per employee, per sqm, etc.)';
COMMENT ON TABLE public.peak_demand_metrics IS 'Stores peak demand and load management metrics';
