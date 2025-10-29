-- Auto-populate grid mix using Supabase webhooks
-- When new energy record is inserted, call API to fetch grid mix

-- Create webhook configuration
-- Note: This needs to be configured in Supabase Dashboard → Database → Webhooks
-- Or use Supabase CLI: supabase functions deploy

-- For now, we'll use pg_net extension to make HTTP requests from triggers

-- Enable pg_net extension (allows HTTP requests from PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call auto-populate API
CREATE OR REPLACE FUNCTION auto_populate_grid_mix_webhook()
RETURNS TRIGGER AS $$
DECLARE
  api_url TEXT;
  request_id BIGINT;
BEGIN
  -- Only process electricity metrics
  IF NEW.metric_id IN (
    SELECT id FROM metrics_catalog WHERE energy_type = 'electricity'
  ) THEN
    -- Skip if already has grid mix with sources
    IF NEW.metadata IS NOT NULL
       AND NEW.metadata ? 'grid_mix'
       AND jsonb_array_length(COALESCE(NEW.metadata->'grid_mix'->'sources', '[]'::jsonb)) > 0 THEN
      RETURN NEW;
    END IF;

    -- Build API URL (use environment variable or hardcode for now)
    -- In production, set this via Supabase secrets
    api_url := current_setting('app.settings.api_url', true);

    IF api_url IS NULL OR api_url = '' THEN
      -- Fallback to localhost for development
      api_url := 'http://host.docker.internal:3000';
    END IF;

    -- Make async HTTP request to auto-populate endpoint
    -- This won't block the INSERT
    SELECT net.http_post(
      url := api_url || '/api/energy/auto-populate-mix',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id::text,
          'metric_id', NEW.metric_id::text,
          'value', NEW.value,
          'period_start', NEW.period_start::text,
          'site_id', NEW.site_id::text,
          'metadata', COALESCE(NEW.metadata, '{}'::jsonb)
        )
      )
    ) INTO request_id;

    -- Log the request (optional)
    RAISE NOTICE 'Auto-populate grid mix request sent: % for record %', request_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (AFTER INSERT to not block the insert)
CREATE TRIGGER trigger_auto_populate_grid_mix
  AFTER INSERT ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_grid_mix_webhook();

COMMENT ON FUNCTION auto_populate_grid_mix_webhook IS 'Automatically fetches grid mix from Electricity Maps API for new electricity records via webhook';
COMMENT ON TRIGGER trigger_auto_populate_grid_mix ON metrics_data IS 'Calls auto-populate API after inserting new energy records';

-- Set API URL configuration
-- In production, set this via: ALTER DATABASE postgres SET app.settings.api_url = 'https://your-domain.com';
-- For development:
ALTER DATABASE postgres SET app.settings.api_url = 'http://localhost:3000';
