-- Sector Intelligence & Benchmarking System
-- Stores company discovery, sustainability reports, and sector benchmarks

-- 1. Sector Company Profiles
-- Discovered companies in each sector
CREATE TABLE IF NOT EXISTS sector_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  website TEXT NOT NULL,
  sector TEXT NOT NULL, -- GRI sector code (GRI-11 to GRI-17)
  industry TEXT,
  company_size TEXT, -- 'small', 'medium', 'large', 'enterprise'
  country TEXT,
  stock_ticker TEXT,

  -- Discovery metadata
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ,

  -- Status
  has_sustainability_report BOOLEAN DEFAULT false,
  report_last_parsed TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_name, sector)
);

-- 2. Company Sustainability Reports
-- Parsed data from sustainability reports
CREATE TABLE IF NOT EXISTS sector_company_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES sector_companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,

  -- Report metadata
  report_year INTEGER NOT NULL,
  report_url TEXT NOT NULL,
  report_type TEXT, -- 'integrated', 'sustainability', 'esg', 'environmental', 'csr'

  -- Emissions data (in tons CO2e)
  scope1_emissions DECIMAL,
  scope2_emissions DECIMAL,
  scope3_emissions DECIMAL,
  total_emissions DECIMAL,

  -- Targets
  carbon_neutral_target INTEGER, -- Year
  net_zero_target INTEGER, -- Year
  emission_reduction_target JSONB, -- { percentage, baselineYear, targetYear }

  -- Renewable energy
  renewable_energy_percent DECIMAL,
  renewable_energy_target JSONB, -- { percentage, targetYear }

  -- Water
  water_withdrawal DECIMAL, -- Megaliters
  water_discharge DECIMAL, -- Megaliters

  -- Waste
  waste_generated DECIMAL, -- Tons
  waste_recycled DECIMAL, -- Tons
  waste_recycling_rate DECIMAL, -- Percentage

  -- Social
  employee_count INTEGER,
  women_in_leadership DECIMAL, -- Percentage
  diversity_metrics JSONB,

  -- Governance
  board_independence DECIMAL, -- Percentage
  esg_linked_compensation BOOLEAN,

  -- Verification
  externally_assured BOOLEAN DEFAULT false,
  assurance_provider TEXT,

  -- Reporting standards used
  reporting_standards TEXT[], -- ['GRI', 'SASB', 'TCFD', etc.]

  -- Raw data
  raw_text TEXT, -- First 50k chars of report for reference

  -- Parsing metadata
  parsed_at TIMESTAMPTZ DEFAULT NOW(),
  parsed_by UUID REFERENCES auth.users(id),
  parser_job_id UUID REFERENCES automation_jobs(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_name, sector, report_year)
);

-- 3. Sector Benchmarks
-- Aggregated benchmarks for each sector
CREATE TABLE IF NOT EXISTS sector_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sector TEXT NOT NULL, -- GRI sector code
  report_year INTEGER NOT NULL,
  company_count INTEGER NOT NULL,

  -- Full benchmark data (JSON)
  benchmark_data JSONB NOT NULL,

  -- Quick access fields (denormalized for performance)
  median_scope1 DECIMAL,
  median_scope2 DECIMAL,
  median_scope3 DECIMAL,
  median_total_emissions DECIMAL,
  median_renewable_percent DECIMAL,
  median_carbon_neutral_target INTEGER,

  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sector, report_year)
);

-- 4. Company Benchmark Positions
-- Cache of where each company ranks within their sector
CREATE TABLE IF NOT EXISTS company_benchmark_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES sector_companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  report_year INTEGER NOT NULL,

  -- Rankings
  overall_score DECIMAL NOT NULL, -- 0-100
  percentile_rank DECIMAL NOT NULL, -- 0-100

  -- Detailed position data (JSON)
  position_data JSONB NOT NULL,

  -- Quick insights
  is_leader BOOLEAN DEFAULT false, -- Top 10%
  is_laggard BOOLEAN DEFAULT false, -- Bottom 10%

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_name, sector, report_year)
);

-- 5. Organization Benchmark Access
-- Track which organizations can access which benchmarks
-- (Some benchmarks may be premium/paid)
CREATE TABLE IF NOT EXISTS organization_benchmark_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sector TEXT NOT NULL,
  access_level TEXT DEFAULT 'basic', -- 'basic', 'premium', 'full'

  -- Access tracking
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL for permanent access

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, sector)
);

-- 6. Benchmark Usage Analytics
-- Track how benchmarks are being used
CREATE TABLE IF NOT EXISTS benchmark_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- What was accessed
  sector TEXT NOT NULL,
  benchmark_type TEXT NOT NULL, -- 'sector_overview', 'company_position', 'comparison'
  company_name TEXT, -- If specific company was viewed

  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_sector_companies_sector ON sector_companies(sector);
CREATE INDEX idx_sector_companies_website ON sector_companies(website);
CREATE INDEX idx_sector_company_reports_sector_year ON sector_company_reports(sector, report_year DESC);
CREATE INDEX idx_sector_company_reports_company ON sector_company_reports(company_name);
CREATE INDEX idx_sector_benchmarks_sector_year ON sector_benchmarks(sector, report_year DESC);
CREATE INDEX idx_company_benchmark_positions_sector ON company_benchmark_positions(sector, percentile_rank DESC);
CREATE INDEX idx_company_benchmark_positions_leaders ON company_benchmark_positions(sector) WHERE is_leader = true;
CREATE INDEX idx_organization_benchmark_access_org ON organization_benchmark_access(organization_id);
CREATE INDEX idx_benchmark_usage_analytics_org ON benchmark_usage_analytics(organization_id, timestamp DESC);

-- Full-text search on company names
CREATE INDEX idx_sector_companies_name_search ON sector_companies USING GIN(to_tsvector('english', company_name));

-- Row Level Security (RLS)
ALTER TABLE sector_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_company_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_benchmark_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_benchmark_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Sector Companies: All authenticated users can view (public benchmarking data)
CREATE POLICY "Authenticated users can view sector companies"
  ON sector_companies FOR SELECT
  TO authenticated
  USING (true);

-- Sector Company Reports: All authenticated users can view
CREATE POLICY "Authenticated users can view sector company reports"
  ON sector_company_reports FOR SELECT
  TO authenticated
  USING (true);

-- Sector Benchmarks: All authenticated users can view
CREATE POLICY "Authenticated users can view sector benchmarks"
  ON sector_benchmarks FOR SELECT
  TO authenticated
  USING (true);

-- Company Benchmark Positions: All authenticated users can view
CREATE POLICY "Authenticated users can view company benchmark positions"
  ON company_benchmark_positions FOR SELECT
  TO authenticated
  USING (true);

-- Organization Benchmark Access: Users can view their own org's access
CREATE POLICY "Users can view their organization's benchmark access"
  ON organization_benchmark_access FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Benchmark Usage Analytics: Users can view their own org's analytics
CREATE POLICY "Users can view their organization's benchmark analytics"
  ON benchmark_usage_analytics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Function to automatically create sector benchmark when enough data is collected
CREATE OR REPLACE FUNCTION trigger_benchmark_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we have enough new reports to refresh the benchmark
  DECLARE
    report_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO report_count
    FROM sector_company_reports
    WHERE sector = NEW.sector
      AND report_year = NEW.report_year;

    -- If we have at least 10 reports and the benchmark hasn't been updated in 7 days
    IF report_count >= 10 THEN
      -- Notify application to refresh benchmark
      PERFORM pg_notify('refresh_benchmark', json_build_object(
        'sector', NEW.sector,
        'report_year', NEW.report_year
      )::text);
    END IF;

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh benchmarks when new reports are added
CREATE TRIGGER benchmark_refresh_trigger
AFTER INSERT ON sector_company_reports
FOR EACH ROW
EXECUTE FUNCTION trigger_benchmark_refresh();

-- View for quick benchmark overview
CREATE OR REPLACE VIEW sector_benchmark_overview AS
SELECT
  sb.sector,
  sb.report_year,
  sb.company_count,
  sb.median_scope1,
  sb.median_scope2,
  sb.median_scope3,
  sb.median_total_emissions,
  sb.median_renewable_percent,
  sb.median_carbon_neutral_target,
  sb.last_updated,
  COUNT(DISTINCT sc.id) as total_companies_in_sector
FROM sector_benchmarks sb
LEFT JOIN sector_companies sc ON sc.sector = sb.sector
GROUP BY sb.id, sb.sector, sb.report_year, sb.company_count,
         sb.median_scope1, sb.median_scope2, sb.median_scope3,
         sb.median_total_emissions, sb.median_renewable_percent,
         sb.median_carbon_neutral_target, sb.last_updated;

-- View for sector leaders
CREATE OR REPLACE VIEW sector_leaders AS
SELECT
  cbp.sector,
  cbp.company_name,
  cbp.overall_score,
  cbp.percentile_rank,
  sc.website,
  sc.stock_ticker,
  cbp.calculated_at
FROM company_benchmark_positions cbp
JOIN sector_companies sc ON sc.company_name = cbp.company_name
WHERE cbp.is_leader = true
ORDER BY cbp.sector, cbp.overall_score DESC;

-- Comments for documentation
COMMENT ON TABLE sector_companies IS 'Companies discovered for sector benchmarking';
COMMENT ON TABLE sector_company_reports IS 'Parsed sustainability report data from companies';
COMMENT ON TABLE sector_benchmarks IS 'Aggregated benchmarks for each sector and year';
COMMENT ON TABLE company_benchmark_positions IS 'Individual company rankings within sector benchmarks';
COMMENT ON TABLE organization_benchmark_access IS 'Controls which organizations can access which sector benchmarks';
COMMENT ON TABLE benchmark_usage_analytics IS 'Tracks how organizations use benchmark data';
