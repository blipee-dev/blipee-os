-- Sustainability Metrics System
-- Implements GHG Protocol Scopes 1, 2, 3 with flexible metric selection

-- 1. Metrics Catalog (All possible metrics)
CREATE TABLE IF NOT EXISTS metrics_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('scope_1', 'scope_2', 'scope_3')),
  category TEXT NOT NULL,
  subcategory TEXT,
  unit TEXT NOT NULL,
  description TEXT,
  calculation_method TEXT,
  emission_factor DECIMAL,
  emission_factor_unit TEXT,
  emission_factor_source TEXT,
  ghg_protocol_category TEXT, -- For Scope 3 categories (1-15)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organization Selected Metrics
CREATE TABLE IF NOT EXISTS organization_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false,
  target_value DECIMAL,
  target_year INTEGER,
  baseline_value DECIMAL,
  baseline_year INTEGER,
  reporting_frequency TEXT CHECK (reporting_frequency IN ('monthly', 'quarterly', 'annually')),
  data_source TEXT, -- Manual, IoT, API, etc.
  responsible_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, metric_id)
);

-- 3. Metrics Data (Actual values)
CREATE TABLE IF NOT EXISTS metrics_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id), -- Optional: link to specific site
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  co2e_emissions DECIMAL, -- Calculated CO2 equivalent
  data_quality TEXT CHECK (data_quality IN ('measured', 'calculated', 'estimated')),
  verification_status TEXT CHECK (verification_status IN ('unverified', 'verified', 'audited')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  evidence_url TEXT, -- Link to supporting documents
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Emission Factors (Region and time-specific)
CREATE TABLE IF NOT EXISTS emission_factors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_code TEXT REFERENCES metrics_catalog(code),
  region TEXT NOT NULL, -- Country or region code
  year INTEGER NOT NULL,
  factor DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL, -- EPA, DEFRA, etc.
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_code, region, year)
);

-- 5. Metrics Templates (Industry-specific bundles)
CREATE TABLE IF NOT EXISTS metrics_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  gri_standard TEXT, -- GRI 11-17
  metric_ids UUID[] NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_org_metrics_org_id ON organization_metrics(organization_id);
CREATE INDEX idx_metrics_data_org_id ON metrics_data(organization_id);
CREATE INDEX idx_metrics_data_metric_id ON metrics_data(metric_id);
CREATE INDEX idx_metrics_data_period ON metrics_data(period_start, period_end);
CREATE INDEX idx_metrics_data_site_id ON metrics_data(site_id);
CREATE INDEX idx_emission_factors_metric ON emission_factors(metric_code);

-- Enable Row Level Security
ALTER TABLE organization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_metrics
CREATE POLICY "Users can view their organization's metrics" ON organization_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage organization metrics" ON organization_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'sustainability_manager')
    )
  );

-- RLS Policies for metrics_data
CREATE POLICY "Users can view their organization's data" ON metrics_data
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert data for their organization" ON metrics_data
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'sustainability_manager', 'facility_manager', 'analyst')
    )
  );

CREATE POLICY "Users can update their organization's data" ON metrics_data
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- Function to calculate CO2e emissions
CREATE OR REPLACE FUNCTION calculate_co2e_emissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the emission factor for this metric
  SELECT
    NEW.value * COALESCE(
      -- Try to get region and year specific factor
      (SELECT factor FROM emission_factors
       WHERE metric_code = (SELECT code FROM metrics_catalog WHERE id = NEW.metric_id)
       AND region = COALESCE(
         (SELECT country FROM sites WHERE id = NEW.site_id),
         'GLOBAL'
       )
       AND year = EXTRACT(YEAR FROM NEW.period_start)
       AND is_active = true
       LIMIT 1),
      -- Fall back to catalog default
      (SELECT emission_factor FROM metrics_catalog WHERE id = NEW.metric_id),
      0
    )
  INTO NEW.co2e_emissions;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate CO2e
CREATE TRIGGER calculate_emissions_trigger
  BEFORE INSERT OR UPDATE ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION calculate_co2e_emissions();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_metrics_catalog_updated_at BEFORE UPDATE ON metrics_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_metrics_updated_at BEFORE UPDATE ON organization_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_data_updated_at BEFORE UPDATE ON metrics_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();