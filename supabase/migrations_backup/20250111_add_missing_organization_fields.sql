-- Add missing fields to organizations table to match the OrganizationModal
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_company BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stock_ticker TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gri_sector_id INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_classification_id INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_confidence NUMERIC DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_seats INTEGER DEFAULT 10;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS data_residency_region TEXT DEFAULT 'us-east-1';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{"primary": "var(--accent-primary)", "secondary": "var(--accent-secondary)", "accent": "var(--accent-primary)"}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_settings JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS api_settings JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_public_company ON organizations(public_company);

-- Add comments for documentation
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for the organization';
COMMENT ON COLUMN organizations.logo_url IS 'URL to the organization logo image';
COMMENT ON COLUMN organizations.public_company IS 'Whether the organization is publicly traded';
COMMENT ON COLUMN organizations.stock_ticker IS 'Stock ticker symbol if publicly traded';
COMMENT ON COLUMN organizations.billing_address IS 'JSON object containing billing address details';
COMMENT ON COLUMN organizations.gri_sector_id IS 'GRI Sector Standards identifier';
COMMENT ON COLUMN organizations.industry_classification_id IS 'Industry classification system ID';
COMMENT ON COLUMN organizations.industry_confidence IS 'Confidence level in industry classification (0-100)';
COMMENT ON COLUMN organizations.subscription_seats IS 'Number of licensed seats in subscription';
COMMENT ON COLUMN organizations.subscription_started_at IS 'When the current subscription period started';
COMMENT ON COLUMN organizations.subscription_expires_at IS 'When the current subscription expires';
COMMENT ON COLUMN organizations.data_residency_region IS 'AWS region for data storage';
COMMENT ON COLUMN organizations.brand_colors IS 'Custom brand colors for the organization';
COMMENT ON COLUMN organizations.custom_settings IS 'Organization-specific settings and preferences';
COMMENT ON COLUMN organizations.feature_flags IS 'Feature toggles specific to this organization';
COMMENT ON COLUMN organizations.api_settings IS 'API configuration and rate limits';