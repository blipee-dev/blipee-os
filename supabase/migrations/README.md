# Supabase Migrations

The `supabase/migrations` directory now reflects the autonomous agent
schema shipped with this repository. Key files:

- `20250122_agent_tables.sql` – core agent task/approval/learning tables
- `20251024000000_agent_learning_insights.sql` – V2 learning insights
- `20251025120000_add_missing_autonomous_agent_tables.sql` – activity,
  decision, workload, and collaboration tables referenced by the agent
  orchestrator
- Additional domain-specific migrations (automation, semantic cache,
  sector intelligence, etc.) are timestamped and self-describing.

## Applying the migrations

```bash
# 1. Install dependencies
npm install

# 2. Set Supabase credentials
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...

# 3. Push the schema
npx supabase db push
```

Or execute individual files with the SQL editor if you prefer manual
control. Every migration is idempotent and guards with
`CREATE TABLE IF NOT EXISTS` to support repeated deployments.

## Good to know

- Old single-file dumps (`FINAL_FORTUNE10_MIGRATION.sql`) have been
  removed; the live schema is driven by the timestamped migrations above.
- Keep the SQL files in chronological order so Supabase can apply them
  deterministically.
- When adding new tables for agents, update both the migration and
  `src/types/supabase.ts` / generated client types to stay in sync.
