-- Migration: Create API Keys table for external integrations (Power BI, etc)
-- Created: 2025-01-13

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Key details
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL, -- Friendly name (e.g., "Power BI Production")
  description TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,

  -- Rate limiting (opcional, para futuro)
  rate_limit_per_hour INTEGER DEFAULT 1000,

  -- Permissions (opcional, para futuro)
  allowed_endpoints TEXT[], -- Ex: ['/api/powerbi/*', '/api/export/*']

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ, -- Opcional: keys que expiram automaticamente

  -- Audit
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes para performance
CREATE INDEX idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key ON api_keys(key) WHERE is_active = true;
CREATE INDEX idx_api_keys_active ON api_keys(organization_id, is_active);

-- RLS (Row Level Security)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see API keys from their organization
CREATE POLICY "Users can view their organization's API keys"
  ON api_keys
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Only admins can create API keys
CREATE POLICY "Admins can create API keys"
  ON api_keys
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy: Only admins can update API keys
CREATE POLICY "Admins can update API keys"
  ON api_keys
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy: Only admins can delete API keys
CREATE POLICY "Admins can delete API keys"
  ON api_keys
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Function to generate secure API keys
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Formato: sk_live_<random-uuid>
  -- Prefixo 'sk_' = secret key
  -- 'live' vs 'test' para diferentes ambientes
  RETURN 'sk_live_' || replace(gen_random_uuid()::text, '-', '');
END;
$$;

-- Function to update last_used_at when key is used
CREATE OR REPLACE FUNCTION update_api_key_usage(api_key_value TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE api_keys
  SET
    last_used_at = NOW(),
    total_requests = total_requests + 1
  WHERE key = api_key_value
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_api_keys_timestamp
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for external integrations (Power BI, webhooks, etc)';
COMMENT ON COLUMN api_keys.key IS 'The actual API key (should be kept secret)';
COMMENT ON COLUMN api_keys.name IS 'Friendly name for the key (e.g., "Power BI Production")';
COMMENT ON COLUMN api_keys.is_active IS 'Whether the key is currently active and can be used';
COMMENT ON COLUMN api_keys.last_used_at IS 'Last time this key was successfully used';
COMMENT ON COLUMN api_keys.total_requests IS 'Total number of API requests made with this key';
COMMENT ON COLUMN api_keys.rate_limit_per_hour IS 'Maximum requests per hour (for future rate limiting)';
COMMENT ON COLUMN api_keys.allowed_endpoints IS 'Whitelist of allowed API endpoints (for future fine-grained permissions)';

-- Example: Insert a test API key (remove in production)
-- INSERT INTO api_keys (organization_id, key, name, description)
-- VALUES (
--   'your-org-id',
--   generate_api_key(),
--   'Power BI Integration',
--   'Used for Power BI dashboards to fetch emissions data'
-- );
