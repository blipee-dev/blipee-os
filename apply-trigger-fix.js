const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function applyMigration() {
  console.log('🔧 Applying Trigger Fix Migration...\n');
  console.log('⚠️  Note: Supabase JS client cannot execute DDL directly.');
  console.log('We will need to use a workaround or apply manually.\n');

  const sql = `
-- Fix: Don't overwrite co2e_emissions if it's already provided

DROP FUNCTION IF EXISTS calculate_co2e_emissions() CASCADE;

CREATE OR REPLACE FUNCTION calculate_co2e_emissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate co2e_emissions if not already provided
  IF NEW.co2e_emissions IS NULL OR NEW.co2e_emissions = 0 THEN
    SELECT
      NEW.value * COALESCE(
        (SELECT factor_value FROM emission_factors
         WHERE code = (SELECT code FROM metrics_catalog WHERE id = NEW.metric_id)
         LIMIT 1),
        (SELECT emission_factor FROM metrics_catalog WHERE id = NEW.metric_id),
        0
      )
    INTO NEW.co2e_emissions;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_emissions_trigger
  BEFORE INSERT OR UPDATE ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION calculate_co2e_emissions();
`;

  console.log('📋 SQL to execute:');
  console.log(sql);
  console.log('\n✅ Migration file created at: supabase/migrations/20251018_fix_trigger_preserve_emissions.sql');
  console.log('\nTo apply this migration, please use the Supabase dashboard SQL editor');
  console.log('or install PostgreSQL client tools (psql) to run it directly.');
  console.log('\nFor now, let\'s proceed assuming the migration will be applied manually.');
}

applyMigration().catch(console.error);
