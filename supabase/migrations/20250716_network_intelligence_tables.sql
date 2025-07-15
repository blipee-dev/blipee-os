-- Network Intelligence Tables for Stream D
-- Complete implementation of network features

-- =====================================================
-- 1. SUPPLIERS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  location JSONB,
  size VARCHAR(50),
  certifications TEXT[],
  esg_score DECIMAL(5,2),
  products TEXT[],
  capabilities TEXT[],
  volume DECIMAL(10,2),
  volume_unit VARCHAR(50),
  reliability JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. NETWORK GRAPH TABLES
-- =====================================================

-- Network nodes (organizations, suppliers, facilities)
CREATE TABLE IF NOT EXISTS network_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  node_type VARCHAR(50) NOT NULL, -- 'organization', 'supplier', 'facility', 'product'
  node_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  location JSONB,
  size_category VARCHAR(50),
  esg_score DECIMAL(5,2),
  risk_level VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Network edges (relationships)
CREATE TABLE IF NOT EXISTS network_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id UUID NOT NULL REFERENCES network_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES network_nodes(id) ON DELETE CASCADE,
  edge_type VARCHAR(50) NOT NULL, -- 'supplies', 'owns', 'operates', 'transports'
  relationship_strength DECIMAL(3,2), -- 0-1 scale
  weight DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id, edge_type)
);

-- =====================================================
-- 3. PEER BENCHMARKING TABLES
-- =====================================================

-- Benchmark contributions (anonymized)
CREATE TABLE IF NOT EXISTS benchmark_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  industry VARCHAR(100) NOT NULL,
  size VARCHAR(50) NOT NULL,
  region VARCHAR(100) NOT NULL,
  metrics JSONB NOT NULL,
  privacy_applied BOOLEAN DEFAULT true,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Benchmark cohorts
CREATE TABLE IF NOT EXISTS benchmark_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'industry', 'size', 'region', 'custom'
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Cohort members
CREATE TABLE IF NOT EXISTS cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES benchmark_cohorts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  UNIQUE(cohort_id, organization_id)
);

-- =====================================================
-- 4. ESG DATA MARKETPLACE TABLES
-- =====================================================

-- Data listings
CREATE TABLE IF NOT EXISTS data_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  industry TEXT[],
  geography TEXT[],
  time_range JSONB,
  update_frequency VARCHAR(50),
  quality JSONB,
  pricing JSONB,
  access JSONB,
  privacy_guarantees JSONB,
  metadata JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data transactions
CREATE TABLE IF NOT EXISTS data_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES data_listings(id),
  consumer_id UUID NOT NULL REFERENCES organizations(id),
  provider_id UUID NOT NULL REFERENCES organizations(id),
  transaction_type VARCHAR(50) NOT NULL,
  credits INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) NOT NULL,
  access_details JSONB
);

-- Data contributions
CREATE TABLE IF NOT EXISTS data_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES organizations(id),
  category VARCHAR(50) NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  quality_score DECIMAL(5,2),
  privacy_applied BOOLEAN DEFAULT true,
  anonymization_metadata JSONB,
  time_range JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace accounts
CREATE TABLE IF NOT EXISTS marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  credits INTEGER DEFAULT 0,
  reputation_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data exchange agreements
CREATE TABLE IF NOT EXISTS data_exchange_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES organizations(id),
  consumer_id UUID NOT NULL REFERENCES organizations(id),
  description TEXT,
  terms JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- =====================================================
-- 5. SUPPLIER DISCOVERY TABLES
-- =====================================================

-- Global supplier database
CREATE TABLE IF NOT EXISTS global_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  location JSONB,
  size VARCHAR(50),
  certifications TEXT[],
  esg_score JSONB,
  capabilities TEXT[],
  products TEXT[],
  capacity JSONB,
  reliability JSONB,
  verified BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier assessments
CREATE TABLE IF NOT EXISTS supplier_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  scores JSONB NOT NULL,
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT[],
  peer_comparison JSONB,
  assessment_date TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. NETWORK ANALYTICS TABLES
-- =====================================================

-- Network benchmarks
CREATE TABLE IF NOT EXISTS network_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  statistics JSONB NOT NULL,
  confidence_level DECIMAL(3,2),
  sample_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Network data marketplace
CREATE TABLE IF NOT EXISTS network_data_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_name VARCHAR(255) NOT NULL,
  description TEXT,
  dataset_type VARCHAR(50),
  quality_score DECIMAL(3,2),
  price_credits INTEGER DEFAULT 0,
  industry_relevance TEXT[],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_network_nodes_org ON network_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_network_nodes_type ON network_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_network_edges_source ON network_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_network_edges_target ON network_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_contributions_org ON benchmark_contributions(organization_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_contributions_industry ON benchmark_contributions(industry);
CREATE INDEX IF NOT EXISTS idx_data_listings_provider ON data_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_data_listings_category ON data_listings(category);
CREATE INDEX IF NOT EXISTS idx_data_transactions_consumer ON data_transactions(consumer_id);
CREATE INDEX IF NOT EXISTS idx_global_suppliers_industry ON global_suppliers(industry);
CREATE INDEX IF NOT EXISTS idx_global_suppliers_verified ON global_suppliers(verified);

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exchange_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_data_marketplace ENABLE ROW LEVEL SECURITY;

-- Suppliers: Organizations can only see their own suppliers
CREATE POLICY "Organizations can view own suppliers"
  ON suppliers FOR SELECT
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_members om
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Organizations can manage own suppliers"
  ON suppliers FOR ALL
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_members om
    WHERE om.user_id = auth.uid() AND om.role IN ('account_owner', 'sustainability_lead', 'admin')
  ));

-- Network nodes: Public read for verified nodes
CREATE POLICY "Public can view verified network nodes"
  ON network_nodes FOR SELECT
  USING (true);

CREATE POLICY "Organizations can manage own nodes"
  ON network_nodes FOR ALL
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_members om
    WHERE om.user_id = auth.uid()
  ));

-- Benchmark contributions: Write own, no read (privacy)
CREATE POLICY "Organizations can contribute benchmarks"
  ON benchmark_contributions FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT om.organization_id FROM organization_members om
    WHERE om.user_id = auth.uid()
  ));

-- Data listings: Public read, authenticated write
CREATE POLICY "Public can view active listings"
  ON data_listings FOR SELECT
  USING (active = true);

CREATE POLICY "Organizations can manage own listings"
  ON data_listings FOR ALL
  USING (provider_id IN (
    SELECT om.organization_id FROM organization_members om
    WHERE om.user_id = auth.uid()
  ));

-- Global suppliers: Public read
CREATE POLICY "Public can view verified suppliers"
  ON global_suppliers FOR SELECT
  USING (verified = true AND active = true);

-- =====================================================
-- 9. FUNCTIONS FOR MARKETPLACE
-- =====================================================

-- Function to deduct marketplace credits
CREATE OR REPLACE FUNCTION deduct_marketplace_credits(
  p_consumer_id UUID,
  p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_accounts
  SET credits = credits - p_amount,
      updated_at = NOW()
  WHERE organization_id = p_consumer_id
    AND credits >= p_amount;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award marketplace credits
CREATE OR REPLACE FUNCTION award_marketplace_credits(
  p_provider_id UUID,
  p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO marketplace_accounts (organization_id, credits)
  VALUES (p_provider_id, p_amount)
  ON CONFLICT (organization_id)
  DO UPDATE SET 
    credits = marketplace_accounts.credits + p_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_nodes_updated_at BEFORE UPDATE ON network_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_listings_updated_at BEFORE UPDATE ON data_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_suppliers_updated_at BEFORE UPDATE ON global_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_accounts_updated_at BEFORE UPDATE ON marketplace_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();