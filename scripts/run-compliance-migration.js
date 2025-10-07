const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function runMigration() {
  console.log('=== RUNNING COMPLIANCE MIGRATION ===\n');

  // Note: Supabase JS client doesn't support ALTER TABLE
  // This script documents what needs to be run via Supabase Dashboard SQL Editor
  // or via direct PostgreSQL connection

  const sql = `
-- Add Dual Reporting Columns to metrics_data
ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS emissions_location_based DECIMAL(15,3);

ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS emissions_market_based DECIMAL(15,3);

ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS grid_region VARCHAR(100);

ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS emission_factor_source VARCHAR(255);

ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS data_quality VARCHAR(50);

-- Add Energy Classification Columns to metrics_catalog
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS energy_source_type VARCHAR(50);

ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS fuel_source VARCHAR(100);

ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS energy_type VARCHAR(50);

ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS generation_type VARCHAR(50);

ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS is_renewable BOOLEAN DEFAULT FALSE;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_metrics_data_scope2_method
ON metrics_data(scope2_method)
WHERE scope2_method IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_data_grid_region
ON metrics_data(grid_region)
WHERE grid_region IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_catalog_energy_source_type
ON metrics_catalog(energy_source_type)
WHERE energy_source_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_catalog_is_renewable
ON metrics_catalog(is_renewable)
WHERE is_renewable = TRUE;
  `;

  console.log('📋 SQL Migration Script:');
  console.log('========================================');
  console.log(sql);
  console.log('========================================\n');

  console.log('⚠️  IMPORTANT:');
  console.log('This script cannot run ALTER TABLE via Supabase JS client.');
  console.log('Please run this SQL manually in one of these ways:\n');
  console.log('Option 1: Supabase Dashboard');
  console.log('  1. Go to https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Click "SQL Editor" in left sidebar');
  console.log('  4. Paste the SQL above');
  console.log('  5. Click "Run"\n');

  console.log('Option 2: Direct PostgreSQL Connection');
  console.log('  Use the DATABASE_URL from your .env.local\n');

  console.log('After running the migration, verify with:');
  console.log('  node scripts/check-compliance-tables.js\n');
}

runMigration();
