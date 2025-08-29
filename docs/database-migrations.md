# Database Migration System

## Overview

The database migration system provides a robust way to manage database schema changes with version control, validation, and rollback capabilities. It integrates with Supabase migrations while adding additional features for tracking and management.

## Features

- **Version Control**: Track all schema changes with timestamps
- **Checksum Validation**: Ensure migration integrity
- **Execution Tracking**: Monitor who ran migrations and when
- **Transaction Safety**: Rollback on failure
- **CLI and API Access**: Manage migrations via command line or REST API
- **Admin Dashboard**: Visual interface for migration management
- **Validation**: Detect issues before running migrations

## File Structure

```
supabase/migrations/
├── 20250828_initial_schema.sql
├── 20250828_optimization_functions.sql
├── 20250828_query_monitoring.sql
├── 20250828_backup_functions.sql
└── [timestamp]_[migration_name].sql
```

## CLI Usage

### Run Pending Migrations
```bash
npm run migrate:run
# or
npm run migrate run
```

### Check Migration Status
```bash
npm run migrate:status
```

### Create New Migration
```bash
npm run migrate:create "add user preferences table"
# Creates: 20250829120000_add_user_preferences_table.sql
```

### Validate Migrations
```bash
npm run migrate validate
```

### List All Migrations
```bash
npm run migrate list
```

## API Endpoints

### GET /api/migrations
Get current migration status including applied and pending migrations.

### POST /api/migrations
Run migrations or validate:
```json
{
  "action": "run"  // or "validate"
}
```

## Writing Migrations

### Best Practices

1. **Use Transactions**: Wrap changes in BEGIN/COMMIT
2. **Make Idempotent**: Use IF NOT EXISTS/IF EXISTS
3. **Add Comments**: Document the purpose
4. **Test First**: Run on development database
5. **Keep Atomic**: One logical change per migration

### Example Migration

```sql
-- Migration: Add user preferences
-- Date: 2025-08-28
-- Description: Add table for storing user preferences

BEGIN;

-- Create preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

## Migration Tracking

The system tracks migrations in the `schema_migrations` table:

```sql
CREATE TABLE public.schema_migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version BIGINT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  applied_at TIMESTAMPTZ,
  executed_by UUID,
  execution_time_ms INTEGER,
  status TEXT,
  error_message TEXT,
  metadata JSONB
);
```

## Admin Dashboard

Import the migration dashboard component:

```tsx
import { MigrationDashboard } from '@/components/admin/migration-dashboard';

export function AdminPage() {
  return <MigrationDashboard />;
}
```

Features:
- Visual migration status
- Run pending migrations
- Validate migrations
- View execution history
- Monitor migration health

## Validation Rules

The system validates:
1. **Checksum Integrity**: Detects modified migrations
2. **Version Duplicates**: No duplicate version numbers
3. **Version Gaps**: Warns about large gaps
4. **File Existence**: Applied migrations must have files

## Troubleshooting

### Migration Fails
1. Check error in `schema_migrations` table
2. Review SQL syntax
3. Verify permissions
4. Check for conflicts

### Checksum Mismatch
- Migration file was modified after being applied
- Restore original content or create new migration

### Version Conflicts
- Ensure unique timestamps
- Use current timestamp when creating

### Transaction Errors
- Some DDL statements can't be in transactions
- Split into multiple migrations if needed

## Security

- Only admin users can run migrations
- All executions are logged
- Restricted SQL execution functions
- No direct database access

## Integration with Supabase

The system works alongside Supabase CLI:

1. **Create migrations locally**: Use our CLI
2. **Apply to remote**: Use Supabase CLI
3. **Track execution**: Automatic tracking

```bash
# Create with our system
npm run migrate:create "new feature"

# Apply with Supabase
npx supabase db push
```

## Rollback Strategy

While automatic rollback isn't implemented, follow these steps:

1. Create a reverse migration
2. Test thoroughly
3. Apply during maintenance window
4. Have backups ready

## Best Practices Summary

1. **Test First**: Always test on development
2. **Small Changes**: Keep migrations focused
3. **Document Well**: Add clear descriptions
4. **Version Control**: Commit migration files
5. **Review**: Have migrations reviewed
6. **Backup**: Take backup before major changes
7. **Monitor**: Check execution times
8. **Validate**: Run validation regularly