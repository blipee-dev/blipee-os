# Complete Migration Guide for blipee-os

This guide will help you apply all necessary migrations to set up the complete blipee-os system with autonomous agents.

## Prerequisites

- Access to your Supabase project dashboard
- Database password: `postgresblipeeos`
- Project URL: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham

## Migration Order

The migrations must be applied in this specific order:

### 1. Base ESG RLS Policies (REQUIRED FIRST)

**File**: `/supabase/migrations/APPLY_ESG_RLS_POLICIES.sql`

This migration:
- Enables Row Level Security on all ESG tables
- Creates proper access policies using `organization_members` table
- Sets up helper functions for permission checking

### 2. Autonomous Agents Tables

**File**: `/supabase/migrations/AUTONOMOUS_AGENTS_MIGRATION.sql`

This migration creates:
- 13 tables for the autonomous agent system
- All necessary indexes and RLS policies
- Trigger functions for timestamps

## Step-by-Step Instructions

### Step 1: Apply ESG RLS Policies

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new
   - You may need to enter the database password: `postgresblipeeos`

2. **Copy and Run the ESG RLS Migration**
   - Copy the entire contents of `/supabase/migrations/APPLY_ESG_RLS_POLICIES.sql`
   - Paste into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Verify RLS is Enabled**
   - The last part of the script will show verification queries
   - All tables should show `rowsecurity = true`

### Step 2: Apply Autonomous Agents Migration

1. **In the Same SQL Editor**
   - Clear the editor (or open a new query tab)
   - Copy the entire contents of `/supabase/migrations/AUTONOMOUS_AGENTS_MIGRATION.sql`
   - Paste and run

2. **Verify Agent Tables Created**
   Run this query to confirm:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'agent_%'
   ORDER BY table_name;
   ```

### Step 3: Initialize Your First Agent

After migrations are complete, run this to set up the ESG Chief of Staff agent:

```sql
-- First, get an organization ID (replace with your actual org ID)
SELECT id, name FROM organizations LIMIT 1;

-- Then insert agent config (replace YOUR_ORG_ID with the actual ID)
INSERT INTO agent_configs (
  organization_id,
  agent_id,
  agent_type,
  capabilities,
  max_autonomy_level,
  execution_interval,
  enabled
) VALUES (
  'YOUR_ORG_ID', -- Replace this!
  'esg-chief-of-staff',
  'ESGChiefOfStaffAgent',
  '[
    {
      "name": "analyze_metrics",
      "description": "Analyze ESG metrics and identify trends",
      "requiredPermissions": ["read:emissions", "read:targets", "read:energy"],
      "maxAutonomyLevel": 5
    },
    {
      "name": "generate_reports",
      "description": "Create stakeholder reports",
      "requiredPermissions": ["read:all", "write:reports"],
      "maxAutonomyLevel": 4
    },
    {
      "name": "send_alerts",
      "description": "Send proactive alerts and insights",
      "requiredPermissions": ["read:all", "write:notifications"],
      "maxAutonomyLevel": 3
    },
    {
      "name": "optimize_operations",
      "description": "Suggest and implement optimizations",
      "requiredPermissions": ["read:all", "write:recommendations"],
      "maxAutonomyLevel": 2
    }
  ]'::jsonb,
  4,
  3600000,
  true
);
```

### Step 4: Create Initial Scheduled Tasks

```sql
-- Daily analysis task
INSERT INTO agent_scheduled_tasks (
  agent_id,
  organization_id,
  task_type,
  schedule_pattern,
  priority,
  data,
  requires_approval,
  enabled
) VALUES (
  'esg-chief-of-staff',
  'YOUR_ORG_ID', -- Same org ID as above
  'analyze_metrics',
  '0 8 * * *',
  'high',
  '{"period": "daily", "depth": "comprehensive"}'::jsonb,
  false,
  true
);

-- Weekly report task
INSERT INTO agent_scheduled_tasks (
  agent_id,
  organization_id,
  task_type,
  schedule_pattern,
  '0 9 * * 1',
  'high',
  '{"type": "executive_summary", "recipients": ["ceo", "board"], "period": "weekly"}'::jsonb,
  false,
  true
);
```

## Verification Checklist

Run these queries to verify everything is set up correctly:

### 1. Check RLS Status
```sql
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'organizations', 'facilities', 'emissions',
    'agent_configs', 'agent_events', 'agent_results'
)
ORDER BY tablename;
```

### 2. Check Policy Count
```sql
SELECT 
    tablename as "Table",
    COUNT(*) as "Number of Policies"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
```

### 3. Check Agent Configuration
```sql
SELECT 
    agent_id,
    agent_type,
    max_autonomy_level,
    enabled,
    created_at
FROM agent_configs;
```

### 4. Check Scheduled Tasks
```sql
SELECT 
    agent_id,
    task_type,
    schedule_pattern,
    priority,
    enabled,
    next_run
FROM agent_scheduled_tasks
ORDER BY created_at;
```

## Troubleshooting

### "Permission denied" errors
- Make sure RLS policies were applied correctly
- Verify the user has proper role in `organization_members` table

### "Table does not exist" errors
- Run migrations in the correct order
- Check for typos in table names

### Agent not starting
- Verify `SUPABASE_SERVICE_KEY` is set in your `.env.local`
- Check agent_errors table for specific issues

### RLS not working
- Ensure you're not using the service key for client requests
- Verify policies were created (check policy count query above)

## Next Steps

1. **Start the Agent System**
   In your application:
   ```typescript
   import { initializeAgentSystem } from '@/lib/ai/autonomous-agents';
   
   const { manager, scheduler } = await initializeAgentSystem('your-org-id');
   ```

2. **Monitor Agent Activity**
   - Check `agent_events` table for activity logs
   - Review `agent_results` for task outcomes
   - Monitor `agent_alerts` for critical issues

3. **Add More Agents**
   - Compliance Guardian
   - Carbon Hunter
   - Supply Chain Investigator

## Important Notes

- The service key (`SUPABASE_SERVICE_KEY`) is required for agents to operate autonomously
- Never expose the service key in client-side code
- Regularly check `agent_approvals` for pending requests
- Monitor `agent_errors` for any issues

## Support

For issues:
1. Check the SQL editor for error messages
2. Review agent logs in the database
3. Consult the documentation in `/docs/`