# How to Apply Baseline Restatement Migration

The baseline restatement system requires a database migration to create the necessary tables and functions.

## Option 1: Supabase Dashboard (Recommended - Easiest)

1. Open your browser and go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `/supabase/migrations/20251012_baseline_restatement.sql`
6. Copy the entire contents
7. Paste into the SQL Editor
8. Click **Run** button (or press Cmd+Enter / Ctrl+Enter)
9. Wait for confirmation: "Success. No rows returned"

## Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
npx supabase db push
```

This will automatically apply all pending migrations.

## Option 3: Direct PostgreSQL Connection

If you have `psql` installed:

```bash
# Set the password as environment variable
export PGPASSWORD="MG5faEtcGRvBWkn1"

# Run the migration
psql -h aws-0-eu-central-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.yrbmmymayojycyszUnis \
     -d postgres \
     -f supabase/migrations/20251012_baseline_restatement.sql
```

Note: `psql` is not currently installed on your system, so use Option 1 or 2.

## Verify Migration Success

After applying, verify the tables were created:

1. Go to Supabase Dashboard → **Table Editor**
2. Look for these new tables:
   - `baseline_restatements`
   - `metric_tracking_history`

Or run this SQL query in the SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('baseline_restatements', 'metric_tracking_history');
```

You should see 2 rows returned.

## What This Migration Creates

### Tables
- `baseline_restatements` - Tracks baseline restatement events
- `metric_tracking_history` - Records when metrics started being tracked

### Functions
- `detect_new_metrics(p_organization_id, p_baseline_year)` - Detects metrics added after baseline
- `calculate_restated_baseline(p_organization_id, p_target_id, p_new_metrics)` - Calculates new baseline

### Security
- Row Level Security (RLS) policies for both tables
- Users can only view/edit restatements for their organization
- Sustainability managers can create/update restatements

### Indexes
- Performance indexes on organization_id, target_id, status, and dates

## Troubleshooting

### Error: "relation already exists"
This means the tables were already created. You can safely ignore this error or drop the tables first:

```sql
DROP TABLE IF EXISTS baseline_restatements CASCADE;
DROP TABLE IF EXISTS metric_tracking_history CASCADE;
DROP FUNCTION IF EXISTS detect_new_metrics;
DROP FUNCTION IF EXISTS calculate_restated_baseline;
```

Then re-run the migration.

### Error: "permission denied"
Make sure you're using the service role key, not the anon key. The migration needs elevated permissions.

### Error: "function does not exist"
The API endpoints are designed to work even if the database functions don't exist yet. They will fall back to manual queries. However, for best performance, make sure to apply the migration.

## Next Steps

Once the migration is applied:

1. Test the detection API:
   ```bash
   curl "http://localhost:3000/api/sustainability/baseline/detect-new-metrics?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&baselineYear=2023"
   ```

2. The system will automatically detect new metrics when users view their targets

3. Users will see a notification if baseline restatement is recommended

For detailed documentation, see `/docs/BASELINE_RESTATEMENT.md`
