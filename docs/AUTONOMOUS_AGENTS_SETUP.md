# Autonomous Agents Setup Guide

This guide will help you set up the autonomous agents system in your Supabase database.

## Prerequisites

- Access to your Supabase project dashboard
- The main blipee-os schema already created

## Step 1: Apply the Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (quovvwrwyfkzhgqdeham)

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the entire contents of `/supabase/migrations/AUTONOMOUS_AGENTS_MIGRATION.sql`
   - Paste it into the SQL editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

The migration will create:
- 13 new tables for the agent system
- All necessary indexes for performance
- Row Level Security policies
- Trigger functions for timestamps

## Step 2: Verify Installation

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'agent_%'
ORDER BY table_name;
```

You should see:
- agent_alerts
- agent_analyses
- agent_approvals
- agent_configs
- agent_errors
- agent_events
- agent_knowledge
- agent_knowledge_base
- agent_outcomes
- agent_patterns
- agent_results
- agent_scheduled_tasks

## Step 3: Configure Environment

Ensure your `.env.local` has the service key:

```bash
SUPABASE_SERVICE_KEY=your-service-key-here
```

⚠️ **Important**: The service key is required for autonomous operations as agents need elevated permissions.

## Step 4: Initialize Your First Agent

### Option A: Manual Configuration

Run this SQL to create an ESG Chief of Staff agent for your organization:

```sql
-- Replace 'YOUR_ORG_ID' with an actual organization ID
INSERT INTO agent_configs (
  organization_id,
  agent_id,
  agent_type,
  capabilities,
  max_autonomy_level,
  execution_interval,
  enabled
) VALUES (
  'YOUR_ORG_ID', -- Replace with your organization ID
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
  4, -- Max autonomy level (1-5)
  3600000, -- Run every hour (in milliseconds)
  true -- Enabled
);
```

### Option B: Programmatic Initialization

In your application code:

```typescript
import { initializeAgentSystem } from '@/lib/ai/autonomous-agents';

// Initialize agents for an organization
const { manager, scheduler } = await initializeAgentSystem('your-org-id');

// The ESG Chief of Staff agent will start automatically
```

## Step 5: Create Scheduled Tasks

Add recurring tasks for the agent:

```sql
-- Daily metrics analysis at 8 AM
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
  'YOUR_ORG_ID',
  'analyze_metrics',
  '0 8 * * *', -- Cron pattern: 8 AM daily
  'high',
  '{"period": "daily", "depth": "comprehensive"}'::jsonb,
  false,
  true
);

-- Weekly report generation on Mondays at 9 AM
INSERT INTO agent_scheduled_tasks (
  agent_id,
  organization_id,
  task_type,
  schedule_pattern,
  '0 9 * * 1', -- Cron pattern: Monday 9 AM
  'high',
  '{"type": "executive_summary", "recipients": ["ceo", "board"], "period": "weekly"}'::jsonb,
  false,
  true
);
```

## Step 6: Monitor Agent Activity

### View Agent Events

```sql
SELECT 
  agent_id,
  event,
  details,
  created_at
FROM agent_events
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Task Results

```sql
SELECT 
  agent_id,
  task_id,
  success,
  insights,
  created_at
FROM agent_results
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC;
```

### View Pending Approvals

```sql
SELECT 
  id,
  agent_id,
  task->>'type' as task_type,
  status,
  created_at
FROM agent_approvals
WHERE organization_id = 'YOUR_ORG_ID'
AND status = 'pending';
```

## Step 7: Set Up Monitoring Dashboard

You can create views for easier monitoring:

```sql
-- Agent health overview
CREATE VIEW agent_health_view AS
SELECT 
  ac.organization_id,
  ac.agent_id,
  ac.enabled,
  ac.max_autonomy_level,
  COUNT(DISTINCT ar.id) as total_tasks_24h,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.success = true) as successful_tasks_24h,
  COUNT(DISTINCT ae.id) as errors_24h,
  MAX(ar.created_at) as last_activity
FROM agent_configs ac
LEFT JOIN agent_results ar ON 
  ac.agent_id = ar.agent_id 
  AND ac.organization_id = ar.organization_id
  AND ar.created_at > NOW() - INTERVAL '24 hours'
LEFT JOIN agent_errors ae ON 
  ac.agent_id = ae.agent_id 
  AND ac.organization_id = ae.organization_id
  AND ae.created_at > NOW() - INTERVAL '24 hours'
GROUP BY ac.organization_id, ac.agent_id, ac.enabled, ac.max_autonomy_level;
```

## Troubleshooting

### Agent Not Starting

1. Check the service key is correctly set
2. Verify the organization exists
3. Check agent_errors table for issues:

```sql
SELECT * FROM agent_errors 
WHERE organization_id = 'YOUR_ORG_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Tasks Not Executing

1. Verify agent is enabled:

```sql
SELECT * FROM agent_configs 
WHERE organization_id = 'YOUR_ORG_ID';
```

2. Check scheduled tasks:

```sql
SELECT * FROM agent_scheduled_tasks 
WHERE organization_id = 'YOUR_ORG_ID' 
AND enabled = true;
```

### Permission Issues

Check RLS policies are working:

```sql
-- This should return results if you're logged in as a team member
SELECT * FROM agent_events WHERE organization_id = 'YOUR_ORG_ID';
```

## Next Steps

1. **Configure Notifications**: Set up a notifications table if not already present
2. **Create Dashboards**: Build UI components to visualize agent activity
3. **Add More Agents**: Implement Compliance Guardian, Carbon Hunter, etc.
4. **Fine-tune Learning**: Monitor agent patterns and adjust confidence thresholds

## Security Notes

- Never expose the service key in client-side code
- Regularly review agent_approvals for sensitive operations
- Monitor agent_errors for suspicious activity
- Set appropriate autonomy levels based on risk tolerance

## Support

For issues or questions:
1. Check the agent logs in agent_events and agent_errors
2. Review the README in `/src/lib/ai/autonomous-agents/`
3. Check the test files for usage examples