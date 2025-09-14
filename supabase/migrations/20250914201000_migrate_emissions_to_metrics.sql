-- Migrate data from old emissions system to new metrics system
-- This migration transfers existing data from emissions_data to metrics_data

-- First, ensure we have corresponding metrics in the catalog for existing emission categories
INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, emission_factor, emission_factor_unit, is_active)
SELECT DISTINCT
  LOWER(REPLACE(COALESCE(subcategory, category), ' ', '_')) as code,
  COALESCE(subcategory, category) as name,
  scope,
  category,
  subcategory,
  activity_unit,
  emission_factor,
  emission_factor_unit,
  true
FROM emissions_data
WHERE NOT EXISTS (
  SELECT 1 FROM metrics_catalog mc
  WHERE mc.code = LOWER(REPLACE(COALESCE(emissions_data.subcategory, emissions_data.category), ' ', '_'))
)
ON CONFLICT (code) DO NOTHING;

-- Migrate the actual emission data
INSERT INTO metrics_data (
  organization_id,
  metric_id,
  site_id,
  period_start,
  period_end,
  value,
  unit,
  co2e_emissions,
  data_quality,
  verification_status,
  evidence_url,
  notes,
  metadata,
  created_by,
  created_at,
  updated_at
)
SELECT
  ed.organization_id,
  mc.id as metric_id,
  -- Map building_id to site_id if you have a buildings-to-sites mapping
  (SELECT id FROM sites WHERE organization_id = ed.organization_id LIMIT 1) as site_id,
  ed.period_start,
  ed.period_end,
  ed.activity_data as value,
  ed.activity_unit as unit,
  ed.co2e_kg / 1000 as co2e_emissions, -- Convert kg to tons
  CASE
    WHEN ed.calculation_method = 'measured' THEN 'measured'
    WHEN ed.calculation_method = 'estimated' THEN 'estimated'
    ELSE 'calculated'
  END as data_quality,
  'unverified' as verification_status,
  ed.evidence_url,
  NULL as notes,
  ed.metadata,
  ed.created_by,
  ed.created_at,
  ed.updated_at
FROM emissions_data ed
JOIN metrics_catalog mc ON mc.code = LOWER(REPLACE(COALESCE(ed.subcategory, ed.category), ' ', '_'))
WHERE NOT EXISTS (
  -- Don't duplicate if already migrated
  SELECT 1 FROM metrics_data md
  WHERE md.organization_id = ed.organization_id
  AND md.period_start = ed.period_start
  AND md.period_end = ed.period_end
  AND md.metric_id = mc.id
);

-- Add organization metrics entries for all metrics that have data
INSERT INTO organization_metrics (organization_id, metric_id, is_required, is_active, reporting_frequency)
SELECT DISTINCT
  md.organization_id,
  md.metric_id,
  false as is_required,
  true as is_active,
  'monthly' as reporting_frequency
FROM metrics_data md
WHERE NOT EXISTS (
  SELECT 1 FROM organization_metrics om
  WHERE om.organization_id = md.organization_id
  AND om.metric_id = md.metric_id
)
ON CONFLICT (organization_id, metric_id) DO NOTHING;

-- Create a summary view to verify the migration
CREATE OR REPLACE VIEW migration_summary AS
SELECT
  'emissions_data' as source_table,
  COUNT(*) as record_count,
  COUNT(DISTINCT organization_id) as org_count,
  MIN(period_start) as earliest_date,
  MAX(period_end) as latest_date,
  SUM(co2e_kg) as total_co2e_kg
FROM emissions_data
UNION ALL
SELECT
  'metrics_data' as source_table,
  COUNT(*) as record_count,
  COUNT(DISTINCT organization_id) as org_count,
  MIN(period_start) as earliest_date,
  MAX(period_end) as latest_date,
  SUM(co2e_emissions * 1000) as total_co2e_kg -- Convert back to kg for comparison
FROM metrics_data;

-- Add comment explaining the migration
COMMENT ON TABLE emissions_data IS 'DEPRECATED: Old emissions tracking table. Data has been migrated to metrics_data. Keep for historical reference but do not use for new features.';
COMMENT ON TABLE metrics_data IS 'PRIMARY: Main table for sustainability metrics data. Use this for all new features and queries.';