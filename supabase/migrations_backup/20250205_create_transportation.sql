-- Migration: Create transportation tables
-- Date: 2025-02-05
-- Description: Creates fleet_vehicles and business_travel tables for Transportation Dashboard

-- Fleet Vehicles table
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'van', 'truck', 'bus', 'motorcycle', 'electric', 'hybrid')),
  fuel_type TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  is_electric BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fleet Usage Records
CREATE TABLE IF NOT EXISTS public.fleet_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  distance_km DECIMAL(20, 4) NOT NULL,
  fuel_consumed_liters DECIMAL(20, 4),
  emissions_tco2e DECIMAL(20, 4),
  cost DECIMAL(20, 4),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Travel Records
CREATE TABLE IF NOT EXISTS public.business_travel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('air', 'rail', 'road', 'hotel')),
  distance_km DECIMAL(20, 4),
  class TEXT,
  emissions_tco2e DECIMAL(20, 4),
  cost DECIMAL(20, 4),
  traveler_id UUID,
  trip_purpose TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_fleet_vehicles_org ON public.fleet_vehicles(organization_id);
CREATE INDEX idx_fleet_usage_org ON public.fleet_usage(organization_id);
CREATE INDEX idx_fleet_usage_vehicle ON public.fleet_usage(vehicle_id);
CREATE INDEX idx_fleet_usage_period ON public.fleet_usage(period_start, period_end);
CREATE INDEX idx_business_travel_org ON public.business_travel(organization_id);
CREATE INDEX idx_business_travel_period ON public.business_travel(period_start, period_end);

-- Create updated_at triggers
CREATE TRIGGER update_fleet_vehicles_updated_at BEFORE UPDATE ON public.fleet_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fleet_usage_updated_at BEFORE UPDATE ON public.fleet_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_travel_updated_at BEFORE UPDATE ON public.business_travel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_travel ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view fleet in their organization" ON public.fleet_vehicles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view fleet usage in their organization" ON public.fleet_usage
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view business travel in their organization" ON public.business_travel
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.fleet_vehicles IS 'Stores organization fleet vehicle information';
COMMENT ON TABLE public.fleet_usage IS 'Stores fleet vehicle usage and emissions records';
COMMENT ON TABLE public.business_travel IS 'Stores business travel records and emissions';
