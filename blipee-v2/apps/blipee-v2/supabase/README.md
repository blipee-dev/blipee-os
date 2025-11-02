# Supabase Database Migrations

This directory contains database migrations for the Blipee V2 application.

## Prerequisites

Install the Supabase CLI:

```bash
npm install -g supabase
```

## Creating a New Migration

1. **Create a new migration file**:

```bash
supabase migration new your_migration_name
```

This creates a new file in `supabase/migrations/` with a timestamp prefix.

2. **Write your SQL**:

Edit the newly created migration file with your SQL statements:

```sql
-- Example: Add a new table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);
```

## Applying Migrations

### Development (Local)

1. **Start local Supabase**:

```bash
supabase start
```

2. **Apply migrations**:

```bash
supabase db push
```

### Production

1. **Link to your production project**:

```bash
supabase link --project-ref quovvwrwyfkzhgqdeham
```

2. **Apply migrations**:

```bash
supabase db push
```

## Viewing Migration Status

Check which migrations have been applied:

```bash
supabase migration list
```

## Rolling Back (Use with Caution)

```bash
# Reset database to a specific migration
supabase db reset
```

## Best Practices

1. **Always use migrations** - Never make schema changes directly in production
2. **Test locally first** - Run migrations on local Supabase before production
3. **Make migrations reversible** - Include DROP statements or document rollback steps
4. **Use transactions** - Wrap complex migrations in BEGIN/COMMIT blocks
5. **Version control** - Commit migration files to git

## Example Migration Workflow

```bash
# 1. Create migration
supabase migration new add_user_preferences

# 2. Edit the generated file
# supabase/migrations/20231201000000_add_user_preferences.sql

# 3. Test locally
supabase start
supabase db push

# 4. Verify changes
supabase db diff

# 5. Commit to git
git add supabase/migrations/
git commit -m "Add user preferences table"

# 6. Deploy to production (via CI/CD or manually)
supabase link --project-ref quovvwrwyfkzhgqdeham
supabase db push
```

## Existing Migrations

- `20241101000000_consent_log.sql` - Consent logging table for GDPR compliance

## Useful Commands

```bash
# View database schema
supabase db diff

# Generate types from database
supabase gen types typescript --local > src/types/supabase.ts

# Access database directly
supabase db psql

# View logs
supabase functions serve

# Stop local Supabase
supabase stop
```

## Environment Variables

Make sure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://quovvwrwyfkzhgqdeham.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Migration fails with "relation already exists"

Use `IF NOT EXISTS` in your CREATE statements:

```sql
CREATE TABLE IF NOT EXISTS public.my_table (...);
```

### Need to modify existing table

Create a new migration with ALTER statements:

```sql
ALTER TABLE public.my_table ADD COLUMN IF NOT EXISTS new_column TEXT;
```

### Local and production out of sync

```bash
# Pull production schema
supabase db pull

# This creates a new migration with the diff
```

## Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations Guide](https://supabase.com/docs/guides/cli/local-development)
- [SQL Reference](https://www.postgresql.org/docs/current/sql.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
