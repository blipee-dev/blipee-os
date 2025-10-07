import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  console.log('Applying trigger fix directly...\n');

  const sql = `
    -- Update calculate_co2e_emissions trigger to use grid_mix metadata when available
    DROP FUNCTION IF EXISTS calculate_co2e_emissions() CASCADE;

    CREATE OR REPLACE FUNCTION calculate_co2e_emissions()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Check if this is an electricity record with grid_mix metadata
      IF NEW.metadata IS NOT NULL AND
         NEW.metadata->'grid_mix' IS NOT NULL AND
         NEW.metadata->'grid_mix'->>'calculated_emissions_total_kgco2e' IS NOT NULL THEN
        -- Use the accurate emission calculation from grid_mix metadata
        NEW.co2e_emissions := (NEW.metadata->'grid_mix'->>'calculated_emissions_total_kgco2e')::numeric;
      ELSE
        -- Fall back to traditional emission factor lookup for non-electricity metrics
        SELECT
          NEW.value * COALESCE(
            (SELECT factor_value
             FROM emission_factors
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

    -- Recreate trigger
    DROP TRIGGER IF EXISTS trigger_calculate_co2e_emissions ON metrics_data;

    CREATE TRIGGER trigger_calculate_co2e_emissions
      BEFORE INSERT OR UPDATE ON metrics_data
      FOR EACH ROW
      EXECUTE FUNCTION calculate_co2e_emissions();

    -- Now update all existing electricity records to use their metadata emissions
    UPDATE metrics_data
    SET updated_at = updated_at -- Trigger the trigger
    WHERE metadata->'grid_mix'->>'calculated_emissions_total_kgco2e' IS NOT NULL;
  `;

  console.log('Executing SQL...');

  // Split into individual statements
  const statements = sql.split(';').filter(s => s.trim());

  for (const statement of statements) {
    if (!statement.trim()) continue;

    console.log(`\nExecuting: ${statement.substring(0, 80)}...`);

    const { error } = await supabase.rpc('execute_sql', {
      query: statement
    });

    if (error) {
      console.log(`Error: ${error.message}`);
    } else {
      console.log('✓ Success');
    }
  }

  console.log('\n\nDone! Now checking totals...');

  const { data: records } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .not('metadata->grid_mix->calculated_emissions_total_kgco2e', 'is', null);

  const total = records?.reduce((sum, r) => sum + (parseFloat(r.co2e_emissions) || 0), 0) || 0;

  console.log(`\nTotal emissions: ${total.toFixed(2)} kgCO2e (${(total / 1000).toFixed(2)} tCO2e)`);
}

applyFix();
