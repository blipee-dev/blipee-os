# Phase 2 & 3 Database Schema Migration

## Overview

This migration creates the complete database schema for all Phase 2 & 3 services:

### Phase 2 Services
- **Weather Data Service**: Location columns, weather history, weather alerts
- **Optimization Opportunities**: Cost-saving and efficiency opportunities
- **Database Optimization**: Performance reports and query analysis
- **Notification Queue**: Notification tracking columns

### Phase 3 Services
- **Report Generation**: Sustainability reports table
- **ML Model Training**: Model configs, evaluations, training logs
- **Prompt Optimization**: Conversation analytics, pattern insights

## What's Included

The migration file `20250127_complete_phase2_phase3_schema.sql` contains:

1. **Site Location Columns** (Weather Service)
   - `latitude`, `longitude`, `address`, `city`, `country`

2. **Notification Columns** (Notification Queue)
   - `notification_importance`, `notification_sent`, `notification_sent_at`

3. **12 New Tables**:
   - `ai_conversation_analytics` - Conversation data for prompt optimization
   - `ai_pattern_insights` - Identified patterns from analysis
   - `weather_history` - Historical weather data
   - `weather_alerts` - Extreme weather alerts
   - `optimization_opportunities` - Cost-saving opportunities
   - `database_optimization_reports` - DB performance reports
   - `sustainability_reports` - Monthly sustainability reports
   - `ml_models` - ML model configurations
   - `ml_evaluations` - Model performance evaluations
   - `ml_training_logs` - Training history

4. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Organization-based access control
   - Service role has full access for worker operations

5. **Indexes**
   - Performance indexes on all critical queries
   - Composite indexes for organization + timestamp queries

## How to Apply the Migration

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your Blipee project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration

1. Click **New Query** button
2. Open the file `supabase/migrations/20250127_complete_phase2_phase3_schema.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** button

### Step 3: Verify Success

After running the migration, verify it succeeded:

```sql
-- Check that all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'ai_conversation_analytics',
  'ai_pattern_insights',
  'weather_history',
  'weather_alerts',
  'optimization_opportunities',
  'database_optimization_reports',
  'sustainability_reports',
  'ml_models',
  'ml_evaluations',
  'ml_training_logs'
)
ORDER BY table_name;
```

You should see all 10 tables listed.

```sql
-- Check that site columns were added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'sites'
AND column_name IN ('latitude', 'longitude', 'address', 'city', 'country');
```

You should see all 5 columns.

```sql
-- Check that notification columns were added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'agent_task_results'
AND column_name IN ('notification_importance', 'notification_sent', 'notification_sent_at');
```

You should see all 3 columns.

### Step 4: Restart Railway Service

After the migration succeeds:

1. Go to Railway dashboard
2. Select the `ai-agents-worker` service
3. Click **Restart** button (or redeploy)

This will restart the worker with the new schema in place.

### Step 5: Monitor Logs

Check Railway logs to confirm all services start without schema errors:

```
✅ [Metrics Service] Started
✅ [Cleanup Service] Started
✅ [Notification Service] Started
✅ [Optimization] Started
✅ [Database Optimization] Started
✅ [Weather Service] Started
✅ [Reports] Started
✅ [ML Training] Started
```

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
