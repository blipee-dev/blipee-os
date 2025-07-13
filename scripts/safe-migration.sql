-- Safe Migration: Create missing tables for Blipee OS
-- This version checks for existing objects before creating

-- 1. Buildings table (for multi-building support)
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  square_footage INTEGER,
  year_built INTEGER,
  building_type TEXT,
  occupancy_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Emissions data table
CREATE TABLE IF NOT EXISTS public.emissions_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('1', '2', '3')),
  category TEXT NOT NULL,
  subcategory TEXT,
  activity_data DECIMAL(20, 4) NOT NULL,
  activity_unit TEXT NOT NULL,
  emission_factor DECIMAL(20, 8) NOT NULL,
  emission_factor_unit TEXT NOT NULL,
  co2e_kg DECIMAL(20, 4) NOT NULL,
  data_source TEXT,
  calculation_method TEXT,
  evidence_url TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Waste data table
CREATE TABLE IF NOT EXISTS public.waste_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL,
  disposal_method TEXT NOT NULL,
  quantity DECIMAL(20, 4) NOT NULL,
  unit TEXT NOT NULL,
  recycling_rate DECIMAL(5, 2),
  diverted_from_landfill BOOLEAN DEFAULT FALSE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Water usage table
CREATE TABLE IF NOT EXISTS public.water_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  water_source TEXT NOT NULL,
  usage_type TEXT NOT NULL,
  volume_liters DECIMAL(20, 4) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_recycled BOOLEAN DEFAULT FALSE,
  treatment_type TEXT,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sustainability reports table
CREATE TABLE IF NOT EXISTS public.sustainability_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_year INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
  framework TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  total_emissions_scope1 DECIMAL(20, 4),
  total_emissions_scope2 DECIMAL(20, 4),
  total_emissions_scope3 DECIMAL(20, 4),
  emissions_intensity DECIMAL(20, 4),
  energy_consumption DECIMAL(20, 4),
  renewable_energy_percentage DECIMAL(5, 2),
  water_consumption DECIMAL(20, 4),
  waste_generated DECIMAL(20, 4),
  waste_recycled_percentage DECIMAL(5, 2),
  published_at TIMESTAMPTZ,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Document uploads table
CREATE TABLE IF NOT EXISTS public.document_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  extracted_data JSONB DEFAULT '{}',
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  uploaded_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_buildings_org ON public.buildings(organization_id);
CREATE INDEX IF NOT EXISTS idx_emissions_org_building ON public.emissions_data(organization_id, building_id);
CREATE INDEX IF NOT EXISTS idx_emissions_period ON public.emissions_data(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_waste_org_building ON public.waste_data(organization_id, building_id);
CREATE INDEX IF NOT EXISTS idx_water_org_building ON public.water_usage(organization_id, building_id);
CREATE INDEX IF NOT EXISTS idx_reports_org_year ON public.sustainability_reports(organization_id, report_year);
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.document_uploads(organization_id);

-- Enable Row Level Security
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emissions_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;