-- Migration: Create metric_domain_filters table
-- Purpose: Replace hardcoded domain filters (subcategory = 'Water') with dynamic configuration
-- Date: 2025-10-30

-- Create table for dynamic domain filtering
CREATE TABLE IF NOT EXISTS metric_domain_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL CHECK (domain IN ('energy', 'water', 'waste', 'emissions')),
  filter_column TEXT NOT NULL, -- 'category', 'subcategory', 'name', 'code'
  filter_operator TEXT NOT NULL DEFAULT 'eq' CHECK (filter_operator IN ('eq', 'in', 'ilike')),
  filter_value TEXT NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher priority = applied first
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_metric_domain_filters_domain ON metric_domain_filters(domain) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_metric_domain_filters_priority ON metric_domain_filters(priority DESC);

-- Insert default filters (replaces hardcoded values)
INSERT INTO metric_domain_filters (domain, filter_column, filter_operator, filter_value, priority) VALUES
  -- Water filters
  ('water', 'subcategory', 'eq', 'Water', 100),

  -- Energy filters (for reference)
  ('energy', 'category', 'in', 'Electricity,Purchased Energy,Natural Gas,Heating,Cooling', 100),

  -- Emissions filters (for reference)
  ('emissions', 'category', 'in', 'Scope 1,Scope 2,Scope 3', 100),

  -- Waste filters (for reference)
  ('waste', 'category', 'in', 'Waste,Recycling,Hazardous Waste', 100)
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE metric_domain_filters ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read for authenticated users"
ON metric_domain_filters
FOR SELECT
TO authenticated
USING (true);

-- Only super admins can modify
CREATE POLICY "Allow insert/update for super admins"
ON metric_domain_filters
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.user_id = auth.uid()
    AND app_users.role = 'super_admin'
  )
);

-- Add comments
COMMENT ON TABLE metric_domain_filters IS
'Dynamic configuration for domain-specific metric filtering. Replaces hardcoded filters in application code.';

COMMENT ON COLUMN metric_domain_filters.domain IS
'Sustainability domain: energy, water, waste, or emissions';

COMMENT ON COLUMN metric_domain_filters.filter_column IS
'Column in metrics_catalog to filter on (category, subcategory, name, code)';

COMMENT ON COLUMN metric_domain_filters.filter_operator IS
'Comparison operator: eq (equals), in (in list), ilike (case-insensitive like)';

COMMENT ON COLUMN metric_domain_filters.filter_value IS
'Value to filter by. For "in" operator, use comma-separated list.';

COMMENT ON COLUMN metric_domain_filters.priority IS
'Higher priority filters are applied first. Useful for AND/OR logic.';
