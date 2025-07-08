# Database Migration Strategy

## Overview

This document outlines the strategy for migrating from the current fragmented migration structure to the new consolidated schema (`001_consolidated_schema.sql`).

## Current State

- **22 migration files** with overlapping and sometimes conflicting changes
- Multiple "fix" migrations indicating iterative problem-solving
- Duplicate table definitions and redundant column additions
- Inconsistent naming and data types

## Target State

- Single consolidated migration that represents the complete, optimized schema
- Proper indexes, constraints, and foreign keys
- Consistent data types and naming conventions
- Comprehensive RLS policies
- Performance optimizations

## Migration Approaches

### Option 1: Fresh Installation (Recommended for New Deployments)

For new deployments or environments where data loss is acceptable:

```bash
# 1. Drop existing schema (WARNING: This will delete all data!)
npx supabase db reset

# 2. Apply the consolidated migration
npx supabase migration up 001_consolidated_schema

# 3. Verify the schema
npx supabase db lint
```

### Option 2: Production Migration (For Existing Data)

For production environments where data must be preserved:

#### Phase 1: Pre-Migration Preparation

1. **Create a full backup**
   ```sql
   -- Use Supabase dashboard or pg_dump
   pg_dump -h your-db-host -U postgres -d your-db-name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Document current schema state**
   ```sql
   -- Export current schema
   pg_dump -h your-db-host -U postgres -d your-db-name --schema-only > current_schema.sql
   ```

3. **Identify data issues**
   ```sql
   -- Check for orphaned records
   SELECT * FROM user_profiles WHERE id NOT IN (SELECT id FROM auth.users);
   SELECT * FROM buildings WHERE organization_id NOT IN (SELECT id FROM organizations);
   -- Add more integrity checks as needed
   ```

#### Phase 2: Create Transition Migration

Create `000_prepare_transition.sql`:

```sql
-- Disable triggers temporarily
ALTER TABLE user_profiles DISABLE TRIGGER ALL;
ALTER TABLE organizations DISABLE TRIGGER ALL;
-- Continue for all tables...

-- Drop conflicting constraints
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
-- Continue for constraints that will be recreated...

-- Rename tables that will be rebuilt
ALTER TABLE equipment RENAME TO equipment_old;
-- Continue for tables with significant changes...
```

#### Phase 3: Apply Consolidated Schema

1. **Apply the transition migration**
   ```bash
   npx supabase migration up 000_prepare_transition
   ```

2. **Apply the consolidated schema**
   ```bash
   npx supabase migration up 001_consolidated_schema
   ```

3. **Create data migration script** `002_migrate_data.sql`:
   ```sql
   -- Migrate data from old tables to new structure
   INSERT INTO equipment (
     id, building_id, name, type, manufacturer, model, 
     serial_number, installation_date, warranty_expiry,
     created_at, updated_at
   )
   SELECT 
     id, building_id, name, type, manufacturer, model,
     serial_number, installation_date, warranty_expiry,
     created_at, updated_at
   FROM equipment_old
   ON CONFLICT (id) DO NOTHING;

   -- Continue for all renamed tables...

   -- Fix any data inconsistencies
   UPDATE buildings SET country = UPPER(country) WHERE country ~ '^[a-z]{2}$';
   
   -- Re-enable triggers
   ALTER TABLE user_profiles ENABLE TRIGGER ALL;
   ALTER TABLE organizations ENABLE TRIGGER ALL;
   ```

4. **Apply data migration**
   ```bash
   npx supabase migration up 002_migrate_data
   ```

#### Phase 4: Cleanup

Create `003_cleanup_transition.sql`:

```sql
-- Drop old tables
DROP TABLE IF EXISTS equipment_old;
-- Continue for all renamed tables...

-- Verify constraints
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, contype, conname;

-- Update statistics
ANALYZE;
```

### Option 3: Side-by-Side Migration (Safest for Critical Systems)

1. **Create new schema**
   ```sql
   CREATE SCHEMA blipee_v2;
   SET search_path TO blipee_v2;
   -- Run consolidated migration in new schema
   ```

2. **Set up data sync**
   - Use logical replication or triggers to sync data
   - Run both schemas in parallel during transition

3. **Gradual migration**
   - Update application to use new schema gradually
   - Monitor for issues
   - Full cutover when stable

## Rollback Strategy

### Preparation

1. **Create rollback script** `999_rollback.sql`:
   ```sql
   -- This script reverts to the previous schema state
   -- It should be auto-generated from the backup
   ```

2. **Test rollback in staging**
   - Apply migration
   - Test rollback
   - Verify data integrity

### Rollback Procedure

1. **Immediate rollback** (if migration fails):
   ```bash
   # Restore from backup
   psql -h your-db-host -U postgres -d your-db-name < backup_TIMESTAMP.sql
   ```

2. **Planned rollback** (if issues discovered later):
   ```bash
   # Apply rollback migration
   npx supabase migration up 999_rollback
   ```

## Testing Strategy

### Pre-Production Testing

1. **Schema Validation**
   ```sql
   -- Check all tables exist
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
   
   -- Check all expected columns
   SELECT table_name, column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   ORDER BY table_name, ordinal_position;
   ```

2. **Constraint Testing**
   ```sql
   -- Test foreign key constraints
   INSERT INTO buildings (organization_id, name, address, city, country, type) 
   VALUES ('invalid-uuid', 'Test', '123 Main', 'City', 'US', 'office');
   -- Should fail
   ```

3. **RLS Policy Testing**
   ```sql
   -- Test as different user roles
   SET LOCAL role authenticated;
   SET LOCAL request.jwt.claims ->> 'sub' = 'user-uuid';
   SELECT * FROM organizations; -- Should only see authorized orgs
   ```

4. **Performance Testing**
   ```sql
   -- Check query plans for common queries
   EXPLAIN ANALYZE SELECT * FROM emissions 
   WHERE organization_id = 'uuid' 
   AND emission_date >= '2024-01-01' 
   ORDER BY emission_date DESC;
   ```

### Post-Migration Validation

1. **Data Integrity Checks**
   ```sql
   -- Count records in all tables
   SELECT 
     schemaname,
     tablename,
     n_live_tup as row_count
   FROM pg_stat_user_tables
   ORDER BY n_live_tup DESC;
   
   -- Check for orphaned records
   -- Run integrity check queries
   ```

2. **Application Testing**
   - Run full test suite
   - Manual testing of critical workflows
   - Performance benchmarking

## Monitoring

### During Migration

1. **Monitor locks**
   ```sql
   SELECT * FROM pg_locks WHERE NOT granted;
   ```

2. **Monitor long-running queries**
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
   ```

### Post-Migration

1. **Monitor error logs**
   - Check Supabase logs for any errors
   - Monitor application error rates

2. **Performance metrics**
   - Query response times
   - Database CPU and memory usage
   - Connection pool utilization

## Timeline

### For Fresh Installation
- Duration: 5-10 minutes
- Downtime: Full duration

### For Production Migration
- Preparation: 1-2 days
- Testing: 2-3 days  
- Migration execution: 2-4 hours
- Downtime: 30-60 minutes (can be reduced with Option 3)
- Monitoring period: 1 week

## Risk Mitigation

1. **Always test in staging first**
2. **Have rollback plan ready**
3. **Schedule during low-traffic period**
4. **Have DBA support available**
5. **Communicate with stakeholders**
6. **Monitor closely for 24-48 hours post-migration**

## Success Criteria

- [ ] All tables created successfully
- [ ] All data migrated without loss
- [ ] All constraints and indexes in place
- [ ] RLS policies working correctly
- [ ] Application functioning normally
- [ ] No performance degradation
- [ ] No increase in error rates

## Notes

- The consolidated schema includes all optimizations and fixes
- Custom types ensure consistency across the schema
- Comprehensive indexes improve query performance
- RLS policies provide row-level security
- The schema is designed for multi-tenant SaaS architecture