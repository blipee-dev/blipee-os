# Database Cleanup Analysis
Generated: 2025-10-29

## Executive Summary

**Total Tables**: 273 tables
**Empty Tables**: 192 tables (70.3%)
**Tables with Data**: 81 tables
**Total Database Size**: ~30 MB

### Key Findings

1. **70% of tables are completely empty** and have never been accessed
2. **2 duplicate base tables** exist alongside their partitioned versions
3. **Large empty tables** consuming significant space (conversation_memory: 1.6MB, metric_targets_monthly: 712KB)
4. **Multiple unused feature areas**: ML/AI (16 empty tables), Agent system (25 empty tables)

---

## Critical Issues

### 1. Duplicate/Obsolete Tables

#### Base Tables with Partitioned Versions (Recommended for Deletion)
| Table | Rows | Size | Issue |
|-------|------|------|-------|
| `emissions` | 0 | 0 bytes | Replaced by emissions_2023/2024/2025 |
| `energy_consumption` | 0 | 0 bytes | Replaced by energy_consumption_2024/2025 |

**Recommendation**: These base tables can be safely dropped as data is now in partitioned tables.

---

## Empty Tables by Category

### Agent Tables (25 empty tables)
These appear to be for an autonomous agent system that may not be in use:

- `agent_alerts` (112 kB)
- `agent_energy_consumption` (72 kB)
- `agent_performance` (64 kB)
- `agent_tasks` (64 kB)
- `agent_task_queue` (80 kB)
- `agent_learnings` (56 kB)
- `agent_rules` (32 kB)
- `agent_coordinations` (16 kB)
- `agent_workflow_executions` (16 kB)
- `agent_energy_analyses` (16 kB)
- `agent_cost_initiatives` (16 kB)
- `agent_cost_opportunities` (32 kB)
- `agent_operational_costs` (40 kB)
- ...and 12 more

**Total Size**: ~800 kB
**Status**: Never accessed

### ML/AI Tables (16 empty tables)
Machine learning infrastructure that appears unused:

- `ml_models` (56 kB)
- `ml_predictions` (48 kB)
- `ml_deployments` (40 kB)
- `ml_ab_tests` (32 kB)
- `ml_deployment_metrics` (24 kB)
- `ml_model_metadata` (24 kB)
- `ml_deployment_events` (24 kB)
- `ml_training_logs` (32 kB)
- `ml_evaluations` (32 kB)
- `ml_hyperparameters` (24 kB)
- ...and 6 more

**Total Size**: ~500 kB
**Status**: Never accessed

### Conversation/Chat Tables (7 empty tables)
Chat and conversation features that may be planned but not implemented:

- `conversation_memory` (1648 kB) ⚠️ **LARGEST EMPTY TABLE**
- `conversation_memories` (104 kB)
- `conversation_preferences` (64 kB)
- `conversation_contexts` (48 kB)
- `conversation_state` (48 kB)
- `conversation_feedback` (48 kB)
- `conversation_analytics` (40 kB)

**Total Size**: ~2 MB
**Status**: Never accessed
**Note**: The `conversations` and `messages` tables DO have data (42 conversations, 266 messages)

### SSO/Authentication Tables (4 empty tables)
Single Sign-On features not currently in use:

- `sso_configurations` (48 kB)
- `sso_users` (48 kB)
- `sso_sessions` (40 kB)
- `sso_auth_requests` (40 kB)

**Total Size**: ~176 kB
**Status**: Never accessed

### Device/IoT Tables (3 empty tables)
- `device_telemetry` (80 kB)
- `device_health_metrics` (72 kB)
- `device_data` (40 kB)

**Total Size**: ~192 kB
**Status**: Never accessed
**Note**: Main `devices` table has 8 entries with 160 kB

### Security & Audit Tables (Multiple empty)
- `audit_logs` (160 kB) - Empty but `audit_events` has 2,505 rows
- `auth_audit_log` (48 kB)
- `role_audit_log` (40 kB)
- `security_events` (48 kB)
- `ai_security_events` (56 kB)

### API/Webhooks (6 empty tables)
- `api_keys` (64 kB)
- `api_usage` (56 kB)
- `api_usage_hourly` (32 kB)
- `api_quotas` (24 kB)
- `webhook_endpoints` (48 kB)
- `webhook_deliveries` (48 kB)

### Compliance & Regulatory (5 empty tables)
- `compliance_alerts` (32 kB)
- `compliance_tasks` (32 kB)
- `compliance_action_plans` (16 kB)
- `compliance_automations` (16 kB)
- `compliance_reports` (24 kB)

---

## Tables with Minimal Usage (< 5 rows)

### Active But Underused
| Table | Rows | Size | Purpose |
|-------|------|------|---------|
| `super_admins` | 1 | 48 kB | System admin |
| `health_check` | 1 | 24 kB | Health monitoring |
| `ml_training_cycles` | 1 | 56 kB | ML training |
| `sector_benchmarks` | 1 | 64 kB | Benchmarking |
| `sustainability_targets` | 2 | 224 kB | Sustainability goals |
| `organizations` | 5 | 192 kB | Company records |
| `app_users` | 4 | 480 kB | User accounts |

---

## Partitioned Tables Analysis

### Emissions Data (Partitioned by Year)
| Table | Rows | Size | Status |
|-------|------|------|--------|
| `emissions` | 0 | 0 bytes | **DELETE - Base table** |
| `emissions_2023` | 0 | 80 kB | Empty partition |
| `emissions_2024` | 75 | 216 kB | Active |
| `emissions_2025` | 105 | 224 kB | Active |

### Energy Consumption (Partitioned by Year)
| Table | Rows | Size | Status |
|-------|------|------|--------|
| `energy_consumption` | 0 | 0 bytes | **DELETE - Base table** |
| `energy_consumption_2024` | 0 | 32 kB | Empty partition |
| `energy_consumption_2025` | 0 | 32 kB | Empty partition |

**Note**: All energy data appears to be in `metrics_data` table (2,975 rows, 3MB)

---

## Top 10 Tables by Row Count

| Table | Rows | Size | Notes |
|-------|------|------|-------|
| emissions_data | 10,832 | 3.1 MB | Primary emissions data |
| waste_data | 3,952 | 872 KB | Waste tracking |
| metrics_data | 2,975 | 3 MB | Unified metrics |
| audit_events | 2,505 | 4.5 MB | Audit trail (largest size!) |
| water_usage | 2,236 | 536 KB | Water consumption |
| messages | 266 | 1.2 MB | Chat messages |
| metrics_catalog | 121 | 232 KB | Metric definitions |
| agent_task_executions | 120 | 128 KB | Agent tasks |
| emissions_2025 | 105 | 224 KB | Current year emissions |
| mv_org_dashboard_metrics | 92 | 48 KB | Materialized view |

---

## Cleanup Recommendations

### Priority 1: Immediate Deletion (Safe & High Impact)

#### Obsolete Base Tables
```sql
-- These are replaced by partitioned versions
DROP TABLE IF EXISTS public.emissions CASCADE;
DROP TABLE IF EXISTS public.energy_consumption CASCADE;
```

#### Empty Year Partitions
```sql
-- No data for 2023
DROP TABLE IF EXISTS public.emissions_2023 CASCADE;

-- Energy consumption partitions are empty (data is in metrics_data)
DROP TABLE IF EXISTS public.energy_consumption_2024 CASCADE;
DROP TABLE IF EXISTS public.energy_consumption_2025 CASCADE;
```

**Space Saved**: ~144 KB

---

### Priority 2: Feature Cleanup (Unused Features)

#### ML/AI Infrastructure (if not planning to use)
```sql
-- 16 tables, ~500 KB
DROP TABLE IF EXISTS public.ml_deployments CASCADE;
DROP TABLE IF EXISTS public.ml_ab_tests CASCADE;
DROP TABLE IF EXISTS public.ml_deployment_metrics CASCADE;
DROP TABLE IF EXISTS public.ml_model_metadata CASCADE;
DROP TABLE IF EXISTS public.ml_deployment_events CASCADE;
DROP TABLE IF EXISTS public.ml_training_logs CASCADE;
DROP TABLE IF EXISTS public.ml_evaluations CASCADE;
DROP TABLE IF EXISTS public.ml_hyperparameters CASCADE;
DROP TABLE IF EXISTS public.ml_training_jobs CASCADE;
DROP TABLE IF EXISTS public.ml_features CASCADE;
DROP TABLE IF EXISTS public.ml_experiments CASCADE;
DROP TABLE IF EXISTS public.ml_datasets CASCADE;
DROP TABLE IF EXISTS public.ml_model_performance CASCADE;
DROP TABLE IF EXISTS public.ml_model_versions CASCADE;
-- Note: Keep ml_models, ml_training_cycles, ml_predictions, ml_model_storage if planning to use
```

**Space Saved**: ~300 KB

#### SSO Infrastructure (if using only email/password auth)
```sql
-- 4 tables, ~176 KB
DROP TABLE IF EXISTS public.sso_configurations CASCADE;
DROP TABLE IF EXISTS public.sso_users CASCADE;
DROP TABLE IF EXISTS public.sso_sessions CASCADE;
DROP TABLE IF EXISTS public.sso_auth_requests CASCADE;
```

**Space Saved**: ~176 KB

#### Advanced Conversation Features (if not implementing)
```sql
-- Keep conversations and messages tables (they have data)
-- Remove advanced features if not used:
DROP TABLE IF EXISTS public.conversation_memory CASCADE;
DROP TABLE IF EXISTS public.conversation_memories CASCADE;
DROP TABLE IF EXISTS public.conversation_preferences CASCADE;
DROP TABLE IF EXISTS public.conversation_contexts CASCADE;
DROP TABLE IF EXISTS public.conversation_state CASCADE;
DROP TABLE IF EXISTS public.conversation_feedback CASCADE;
DROP TABLE IF EXISTS public.conversation_analytics CASCADE;
```

**Space Saved**: ~2 MB

---

### Priority 3: Consider Cleanup (25+ Agent Tables)

These tables support autonomous agent functionality. If not using this feature:

```sql
-- Agent core tables (keep if using agents)
-- DROP TABLE IF EXISTS public.agent_definitions;
-- DROP TABLE IF EXISTS public.agent_instances;
-- DROP TABLE IF EXISTS public.agent_configs;

-- Agent monitoring (empty, safe to drop)
DROP TABLE IF EXISTS public.agent_alerts CASCADE;
DROP TABLE IF EXISTS public.agent_performance CASCADE;
DROP TABLE IF EXISTS public.agent_energy_consumption CASCADE;
DROP TABLE IF EXISTS public.agent_operational_costs CASCADE;
DROP TABLE IF EXISTS public.agent_cost_initiatives CASCADE;
DROP TABLE IF EXISTS public.agent_cost_opportunities CASCADE;
DROP TABLE IF EXISTS public.agent_energy_analyses CASCADE;

-- Agent workflow (empty)
DROP TABLE IF EXISTS public.agent_tasks CASCADE;
DROP TABLE IF EXISTS public.agent_task_queue CASCADE;
DROP TABLE IF EXISTS public.agent_rules CASCADE;
DROP TABLE IF EXISTS public.agent_coordinations CASCADE;
DROP TABLE IF EXISTS public.agent_workflow_executions CASCADE;

-- Agent learning (empty)
DROP TABLE IF EXISTS public.agent_learnings CASCADE;
DROP TABLE IF EXISTS public.agent_learning_insights CASCADE;
DROP TABLE IF EXISTS public.agent_learning_patterns CASCADE;
DROP TABLE IF EXISTS public.agent_knowledge CASCADE;
DROP TABLE IF EXISTS public.agent_knowledge_base CASCADE;

-- Agent collaboration
DROP TABLE IF EXISTS public.agent_collaborations CASCADE;
DROP TABLE IF EXISTS public.agent_approvals CASCADE;
DROP TABLE IF EXISTS public.agent_decisions CASCADE;
DROP TABLE IF EXISTS public.agent_analyses CASCADE;
DROP TABLE IF EXISTS public.agent_outcomes CASCADE;
DROP TABLE IF EXISTS public.agent_patterns CASCADE;
DROP TABLE IF EXISTS public.agent_scheduled_tasks CASCADE;

-- Agent optimization (may want to keep)
-- DROP TABLE IF EXISTS public.agent_task_executions; -- Has 120 rows
-- DROP TABLE IF EXISTS public.agent_task_results; -- Has 55 rows
```

**Space Saved**: ~800 KB

---

### Priority 4: Consolidation Opportunities

#### Audit Tables
Currently you have:
- `audit_events` (2,505 rows, 4.5 MB) ✅ ACTIVE
- `audit_logs` (0 rows, 160 KB) - Empty duplicate?
- `audit_event_types` (81 rows, 128 KB) ✅ ACTIVE
- `auth_audit_log` (0 rows, 48 KB) - Empty
- `role_audit_log` (0 rows, 40 KB) - Empty
- `access_audit_log` (7 rows, 96 KB) ✅ ACTIVE

**Recommendation**: Consider dropping empty audit tables if `audit_events` covers all use cases.

---

## Summary of Cleanup Potential

| Category | Tables | Space | Risk Level |
|----------|--------|-------|------------|
| Obsolete base tables | 2 | ~0 KB | **None** - Safe to delete |
| Empty partitions | 3 | 144 KB | **Low** - Can recreate if needed |
| ML/AI infrastructure | 16 | 500 KB | **Medium** - Drop if not using ML |
| Conversation advanced | 7 | 2 MB | **Medium** - Keep basic conversations |
| Agent system | 25 | 800 KB | **Medium** - Drop if not using agents |
| SSO tables | 4 | 176 KB | **Low** - Drop if not using SSO |
| Device/IoT unused | 3 | 192 KB | **Low** - Keep main devices table |
| Empty audit logs | 3 | 248 KB | **Low** - Keep main audit_events |
| API/Webhook unused | 6 | 272 KB | **Low** - Drop if not using API |

**Total Potential Space Savings**: ~4-5 MB
**Total Tables to Consider**: 69 empty tables

---

## What to Keep (Definitely Used)

These tables have significant data and should NOT be deleted:

1. **Core Data** (27 MB total)
   - `emissions_data` (10,832 rows, 3.1 MB)
   - `metrics_data` (2,975 rows, 3 MB)
   - `audit_events` (2,505 rows, 4.5 MB)
   - `waste_data` (3,952 rows, 872 KB)
   - `water_usage` (2,236 rows, 536 KB)
   - `messages` (266 rows, 1.2 MB)
   - `query_cache` (30 rows, 2.2 MB)
   - `sector_company_reports` (52 rows, 1.3 MB)

2. **User & Organization**
   - `app_users` (4 rows)
   - `organizations` (5 rows)
   - `organization_members` (3 rows)
   - `user_profiles` (4 rows)
   - `sessions` (60 rows)

3. **Configuration**
   - `metrics_catalog` (121 rows)
   - `framework_mappings` (51 rows)
   - `industry_materiality` (62 rows)
   - `emission_sources` (15 rows)

---

## Action Plan

### Step 1: Backup First
```bash
pg_dump "postgresql://postgres:PASSWORD@db.quovvwrwyfkzhgqdeham.supabase.co:5432/postgres" > backup_before_cleanup.sql
```

### Step 2: Start with Safe Deletions
Run Priority 1 SQL commands (obsolete base tables and empty partitions)

### Step 3: Evaluate Features
Decide which features you're NOT using:
- [ ] ML/AI capabilities
- [ ] SSO authentication
- [ ] Advanced conversation memory
- [ ] Autonomous agents
- [ ] Device IoT telemetry
- [ ] API management
- [ ] Webhooks

### Step 4: Drop Unused Feature Tables
Based on your evaluation, run appropriate SQL from Priority 2-3

### Step 5: Monitor
After cleanup, monitor for any application errors indicating a needed table was dropped

---

## Questions to Consider

1. **Agent System**: Are you planning to use autonomous agents? If not, 25 empty tables can be removed.

2. **ML Features**: Do you plan to train/deploy ML models in the app? If not, 16 tables can go.

3. **Conversation Features**: Do you need conversation memory, context, and preferences? Or is basic chat enough?

4. **SSO**: Will you implement SSO (Google, Microsoft, etc.) or stick with email/password?

5. **IoT/Devices**: The main devices table has data (8 devices), but telemetry tables are empty. Planning to collect telemetry?

6. **API Management**: Do you need API key management and usage tracking?

---

## Next Steps

Would you like me to:
1. Generate a cleanup SQL script based on your priorities?
2. Help you decide which features you're actually using?
3. Create a safe rollback plan?
4. Test dropping tables in a safe way?
