-- Web Automation System Tables
-- Stores data from Puppeteer MCP scrapers

-- 1. Automation Jobs Table
-- Tracks all automation job executions
CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'utility-bill', 'regulatory', 'carbon-market', 'supplier-verification', 'competitor-intelligence'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'

  -- Execution tracking
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  result JSONB, -- Store the scraped data
  error TEXT, -- Error message if failed
  execution_time_ms INTEGER, -- How long it took

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Automation Schedules Table
-- Defines recurring automation jobs
CREATE TABLE IF NOT EXISTS automation_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
  next_run TIMESTAMPTZ NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}', -- Job-specific configuration

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Utility Provider Credentials Table
-- Securely stores utility portal credentials (encrypted)
CREATE TABLE IF NOT EXISTS utility_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'pge', 'con-edison', 'duke-energy', etc.
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL, -- Use Supabase Vault for encryption
  account_number TEXT,

  -- Status
  last_successful_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Utility Bills Table
-- Stores extracted utility bill data
CREATE TABLE IF NOT EXISTS utility_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  account_number TEXT,

  -- Billing period
  billing_start DATE NOT NULL,
  billing_end DATE NOT NULL,

  -- Energy usage
  electricity_kwh DECIMAL,
  gas_therms DECIMAL,

  -- Cost
  total_cost DECIMAL,

  -- Emissions (calculated)
  carbon_emissions_kg DECIMAL,

  -- Raw data
  raw_bill_url TEXT, -- PDF download URL
  raw_bill_storage_path TEXT, -- Supabase Storage path

  -- Automation metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  scraper_job_id UUID REFERENCES automation_jobs(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Regulatory Updates Table
-- Stores scraped regulatory intelligence
CREATE TABLE IF NOT EXISTS regulatory_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL, -- 'epa', 'eu-taxonomy', 'sec', 'state-level'
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,

  -- Dates
  effective_date DATE,
  compliance_deadline DATE,

  -- Relevance
  relevant_industries TEXT[], -- GRI sector codes
  severity TEXT, -- 'critical', 'high', 'medium', 'low'

  -- Automation metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  scraper_job_id UUID REFERENCES automation_jobs(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source, url) -- Prevent duplicates
);

-- 6. Organization Regulatory Tracking
-- Track which regulatory updates are relevant to each organization
CREATE TABLE IF NOT EXISTS organization_regulatory_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  regulatory_update_id UUID NOT NULL REFERENCES regulatory_updates(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'in-progress', 'compliant'
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, regulatory_update_id)
);

-- 7. Carbon Market Prices Table
-- Stores carbon credit and REC pricing data
CREATE TABLE IF NOT EXISTS carbon_market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_type TEXT NOT NULL, -- 'carbon-credit', 'rec', 'offset'
  exchange TEXT NOT NULL,

  -- Pricing
  price_usd DECIMAL NOT NULL,
  price_change_24h DECIMAL,
  volume DECIMAL,

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  scraper_job_id UUID REFERENCES automation_jobs(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Supplier Sustainability Data Table
-- Stores verified supplier sustainability information
CREATE TABLE IF NOT EXISTS supplier_sustainability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  website TEXT NOT NULL,

  -- Certifications (JSONB array)
  certifications JSONB DEFAULT '[]', -- [{ type, verified, expiryDate, proofUrl }]

  -- Sustainability report
  sustainability_report JSONB, -- { year, url, scope1, scope2, scope3 }
  esg_score DECIMAL,

  -- Automation metadata
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  scraper_job_id UUID REFERENCES automation_jobs(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, supplier_name)
);

-- 9. Competitor ESG Data Table
-- Stores competitor sustainability benchmarking data
CREATE TABLE IF NOT EXISTS competitor_esg_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  website TEXT NOT NULL,

  -- Metrics (JSONB)
  metrics JSONB DEFAULT '{}', -- { carbonNeutralCommitment, renewableEnergyTarget, etc. }
  public_claims TEXT[],
  reports_published JSONB DEFAULT '[]', -- [{ year, url }]

  -- Tracking
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  scraper_job_id UUID REFERENCES automation_jobs(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, company_name)
);

-- 10. Automation Logs Table
-- Detailed activity logs for audit trails
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_automation_jobs_org ON automation_jobs(organization_id);
CREATE INDEX idx_automation_jobs_type ON automation_jobs(job_type);
CREATE INDEX idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX idx_automation_schedules_next_run ON automation_schedules(next_run) WHERE enabled = true;
CREATE INDEX idx_utility_bills_org ON utility_bills(organization_id);
CREATE INDEX idx_utility_bills_period ON utility_bills(billing_start, billing_end);
CREATE INDEX idx_regulatory_updates_source ON regulatory_updates(source);
CREATE INDEX idx_regulatory_updates_industries ON regulatory_updates USING GIN(relevant_industries);
CREATE INDEX idx_carbon_prices_timestamp ON carbon_market_prices(timestamp DESC);
CREATE INDEX idx_supplier_sustainability_org ON supplier_sustainability(organization_id);
CREATE INDEX idx_competitor_esg_org ON competitor_esg_data(organization_id);
CREATE INDEX idx_automation_logs_org ON automation_logs(organization_id, timestamp DESC);

-- Row Level Security (RLS)
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_regulatory_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_sustainability ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_esg_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Automation Jobs: Users can view their organization's jobs
CREATE POLICY "Users can view their organization's automation jobs"
  ON automation_jobs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Utility Bills: Users can view their organization's bills
CREATE POLICY "Users can view their organization's utility bills"
  ON utility_bills FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Regulatory Updates: All authenticated users can view
CREATE POLICY "Authenticated users can view regulatory updates"
  ON regulatory_updates FOR SELECT
  TO authenticated
  USING (true);

-- Organization Regulatory Tracking: Users can view their organization's tracking
CREATE POLICY "Users can view their organization's regulatory tracking"
  ON organization_regulatory_tracking FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Carbon Market Prices: All authenticated users can view
CREATE POLICY "Authenticated users can view carbon market prices"
  ON carbon_market_prices FOR SELECT
  TO authenticated
  USING (true);

-- Supplier Sustainability: Users can view their organization's supplier data
CREATE POLICY "Users can view their organization's supplier data"
  ON supplier_sustainability FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Competitor ESG Data: Users can view their organization's competitor data
CREATE POLICY "Users can view their organization's competitor data"
  ON competitor_esg_data FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Automation Logs: Users can view their organization's logs
CREATE POLICY "Users can view their organization's automation logs"
  ON automation_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
