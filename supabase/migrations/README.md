# Phase 2 & 3 Database Schema Migration

## ⚠️ IMPORTANT: Production Database Compatibility

The production database (quovvwrwyfkzhgqdeham) already has some tables with **different schemas** than originally designed. This migration has been split into two parts to work with the existing production schema:

1. **Missing Tables Only** - Creates 5 new tables that don't exist
2. **Missing Columns** - Adds columns needed by Railway worker to existing tables

## Overview

### Phase 2 Services
- **Weather Data Service**: Location columns, weather history, weather alerts
- **Database Optimization**: Performance reports and query analysis
- **Notification Queue**: Notification tracking columns

### Phase 3 Services
- **Prompt Optimization**: Conversation analytics, pattern insights

## What's Included

### Migration 1: `20250127_phase2_phase3_missing_tables_only.sql`

Creates **5 new tables** that don't exist in production:
- `weather_history` - Historical weather data for sites
- `weather_alerts` - Extreme weather event alerts
- `database_optimization_reports` - DB performance analysis
- `ai_conversation_analytics` - Conversation data for prompt optimization
- `ai_pattern_insights` - AI usage pattern insights

Also includes:
- Row Level Security (RLS) policies
- Performance indexes
- Organization-based access control

### Migration 2: `20250127_add_missing_columns_to_existing_tables.sql`

Adds **missing columns** to existing tables:

**sites table:**
- `latitude`, `longitude`, `city`, `country` (for weather API integration)

**agent_task_results table:**
- `notification_importance`, `notification_sent`, `notification_sent_at` (for notification queue)

## How to Apply the Migrations

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your **Blipee project** (quovvwrwyfkzhgqdeham)
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run Migration 1 (Missing Tables)

1. Click **New Query** button
2. Open the file `supabase/migrations/20250127_phase2_phase3_missing_tables_only.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** button
6. Wait for "Success. No rows returned" message

### Step 3: Run Migration 2 (Missing Columns)

1. Click **New Query** button (or clear the previous query)
2. Open the file `supabase/migrations/20250127_add_missing_columns_to_existing_tables.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** button
6. Wait for "Success. No rows returned" message

### Step 4: Verify Success

After running both migrations, verify they succeeded:

```sql
-- Check that new tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'ai_conversation_analytics',
  'ai_pattern_insights',
  'weather_history',
  'weather_alerts',
  'database_optimization_reports'
)
ORDER BY table_name;
```

You should see all 5 new tables listed.

```sql
-- Check that site location columns were added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'sites'
AND column_name IN ('latitude', 'longitude', 'city', 'country');
```

You should see all 4 location columns.

```sql
-- Check that notification columns were added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'agent_task_results'
AND column_name IN ('notification_importance', 'notification_sent', 'notification_sent_at');
```

You should see all 3 notification columns.

### Step 5: Restart Railway Service

After both migrations succeed:

1. Go to Railway dashboard
2. Select the `ai-agents-worker` service
3. Click **Restart** button (or redeploy)

This will restart the worker with the new schema in place.

### Step 6: Monitor Logs

Check Railway logs to confirm services start without schema errors. You should see log messages like:

```
✅ [Weather Service] Started
✅ [Database Optimization] Started
✅ [Notification Service] Started
✅ [Prompt Optimization] Started
```

And NO error messages about missing columns or tables.

## Notes About Existing Tables

The production database already has these tables with their own schemas. The migrations do NOT modify them:
- `ml_models` - Uses `id` (UUID) as primary key, has different column structure
- `ml_evaluations` - References `model_type` instead of `model_id`
- `ml_training_logs` - References `model_type` instead of `model_id`
- `optimization_opportunities` - Has different column names (area, improvement_potential, etc.)
- `sustainability_reports` - Has different column structure

The Railway worker services will use these existing tables as-is.

## Troubleshooting

### Error: "relation already exists"

This is safe to ignore - the migration uses `CREATE TABLE IF NOT EXISTS` and will skip tables that already exist.

### Error: "column already exists"

This is safe to ignore - the migration uses `ADD COLUMN IF NOT EXISTS` and will skip columns that already exist.

### Error: "policy already exists"

The migration handles this by using `DROP POLICY IF EXISTS` before creating policies. If you still see this error, you can manually drop the policy:

```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

Then re-run that specific `CREATE POLICY` statement.

### Error: "permission denied"

Make sure you're logged in as the project owner or have admin permissions in Supabase.

### Schema errors persist in Railway logs

1. Double-check that the migration ran successfully
2. Verify all tables exist using the SQL queries above
3. Restart the Railway service
4. Check that environment variable `SUPABASE_SERVICE_ROLE_KEY` is set correctly in Railway

## What Happens After Migration

Once the migration is applied and Railway service restarted:

1. **Weather Service** will start polling weather data for sites with lat/long
2. **Optimization Service** will begin analyzing data for cost-saving opportunities
3. **ML Training** will prepare for monthly model training cycles
4. **Reports** will generate monthly sustainability reports
5. **Prompt Optimization** will start collecting conversation analytics

## Optional: Add Test Data

### Add a test site location for weather tracking:

```sql
-- Update a test site with location (replace with real data)
UPDATE sites
SET
  latitude = 37.7749,
  longitude = -122.4194,
  city = 'San Francisco',
  country = 'USA'
WHERE id = 'your-site-id';
```

### Create a test ML model configuration:

```sql
-- Insert test ML model
INSERT INTO ml_models (model_id, model_type, organization_id, hyperparameters)
VALUES (
  'test-emissions-forecast',
  'emissions_forecast',
  'your-org-id',
  '{"learning_rate": 0.001, "epochs": 100}'::jsonb
);
```

## Need Help?

If you encounter issues:

1. Check the Supabase SQL Editor error messages
2. Review the Railway logs for specific error details
3. Verify environment variables are set correctly
4. Ensure the service role key has proper permissions

## Schema Documentation

For detailed schema documentation, see the comments in the migration file or query:

```sql
SELECT
  table_name,
  obj_description((table_schema||'.'||table_name)::regclass) as description
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'ai_%' OR table_name LIKE 'weather_%' OR table_name LIKE 'ml_%'
ORDER BY table_name;
```
