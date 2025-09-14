-- Performance optimization indexes for sustainability metrics system
-- Date: 2025-09-14

-- Critical performance indexes for metrics_data table
-- This table will grow large with time-series data and needs optimized queries

-- Composite index for organization + time range queries (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_data_org_time_range
ON metrics_data (organization_id, period_start DESC, period_end DESC);

-- Index for CO2e emissions aggregations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_data_co2e_emissions
ON metrics_data (co2e_emissions) WHERE co2e_emissions IS NOT NULL;

-- Composite index for organization + metric + time (for specific metric queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_data_org_metric_time
ON metrics_data (organization_id, metric_id, period_start DESC);

-- Index for verification status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_data_verification_status
ON metrics_data (verification_status) WHERE verification_status IS NOT NULL;

-- Index for data quality filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_data_data_quality
ON metrics_data (data_quality);

-- Partial index for unverified data (common admin query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_data_unverified
ON metrics_data (organization_id, created_at DESC)
WHERE verification_status = 'unverified';

-- Organization members query optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_user_org
ON organization_members (user_id, organization_id, role);

-- Sites query optimization for organization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sites_organization_active
ON sites (organization_id, is_active) WHERE is_active = true;

-- Metrics catalog query optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_catalog_scope_category
ON metrics_catalog (scope, category, is_active) WHERE is_active = true;

-- Organization metrics optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_metrics_org_metric
ON organization_metrics (organization_id, metric_id);

-- Emission factors lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emission_factors_lookup
ON emission_factors (metric_code, region, year DESC);

-- Add table-level optimizations
-- Set aggressive autovacuum for high-churn metrics_data table
ALTER TABLE metrics_data SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 1000,
  autovacuum_analyze_threshold = 1000
);

-- Optimize organization_members for frequent access
ALTER TABLE organization_members SET (
  fillfactor = 90
);

-- Add comments for maintenance
COMMENT ON INDEX idx_metrics_data_org_time_range IS 'Primary index for dashboard queries - organization + time range';
COMMENT ON INDEX idx_metrics_data_co2e_emissions IS 'Aggregation index for emissions calculations';
COMMENT ON INDEX idx_metrics_data_org_metric_time IS 'Specific metric tracking over time';
COMMENT ON INDEX idx_metrics_data_unverified IS 'Admin workflow - unverified data queue';