-- Add annual_revenue column to organizations table for ESRS E1 compliance
-- ESRS E1 requires mandatory reporting of GHG intensity per net revenue (tCO2e/M€)

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS annual_revenue DECIMAL(15, 2);

COMMENT ON COLUMN organizations.annual_revenue IS 'Annual revenue in euros - required for ESRS E1 mandatory GHG intensity metric (tCO2e/M€ revenue)';
