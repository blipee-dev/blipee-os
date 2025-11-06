-- Add business metrics to organizations table for intensity calculations
-- These are required for GRI 305-4, 302-3, 303, and 306 intensity reporting

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS annual_revenue DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS revenue_currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS floor_area_m2 DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS business_metrics_year INTEGER,
ADD COLUMN IF NOT EXISTS business_metrics_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN organizations.annual_revenue IS 'Annual revenue for intensity calculations (GRI 305-4, 302-3)';
COMMENT ON COLUMN organizations.revenue_currency IS 'Currency code for revenue (ISO 4217)';
COMMENT ON COLUMN organizations.employee_count IS 'Full-time equivalent (FTE) employees for per-employee intensity metrics';
COMMENT ON COLUMN organizations.floor_area_m2 IS 'Total floor area in square meters for per-m² intensity metrics';
COMMENT ON COLUMN organizations.business_metrics_year IS 'Year these business metrics apply to';
COMMENT ON COLUMN organizations.business_metrics_updated_at IS 'Last update timestamp for business metrics';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_organizations_business_metrics_year
ON organizations(business_metrics_year);
