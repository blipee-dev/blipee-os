-- Drop the old auto_add_grid_mix_metadata trigger and function
-- These reference energy_mix_metadata table which we're not using
-- Instead, we backfill data directly from Electricity Maps API

DROP TRIGGER IF EXISTS trigger_auto_add_grid_mix ON metrics_data;
DROP FUNCTION IF EXISTS auto_add_grid_mix_metadata();

-- We'll add a new trigger later that calls the Electricity Maps API
-- For now, we backfill existing data using a script
