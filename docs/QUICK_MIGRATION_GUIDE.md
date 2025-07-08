# Quick Migration Guide - Fortune 10 Schema

## Option 1: Automated Script (Easiest) 🚀

```bash
# Run the migration script
./scripts/migrate-to-v2.sh
```

This will:
1. Create a backup
2. DROP all existing tables
3. Create the Fortune 10 schema
4. Add demo data
5. Generate TypeScript types

## Option 2: Manual SQL Execution 📝

```bash
# 1. Get your database password
echo $SUPABASE_DB_PASSWORD

# 2. Connect to database
cd supabase/migrations
psql postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 3. Run the migration
\i DROP_AND_CREATE_V2.sql

# 4. Exit psql
\q
```

## Option 3: Using Supabase Dashboard 🖥️

1. Go to your Supabase project
2. Click on "SQL Editor"
3. Copy contents of `DROP_AND_CREATE_V2.sql`
4. Paste and run

## What Gets Created

### 150+ Tables including:
- ✅ Complete emissions tracking (Scopes 1, 2, 3)
- ✅ Energy, water, waste management
- ✅ Biodiversity and species monitoring
- ✅ Supply chain and Scope 3 tracking
- ✅ Human rights and social metrics
- ✅ Governance and compliance
- ✅ Financial integration (EU Taxonomy, TCFD)
- ✅ AI insights and recommendations
- ✅ Document management with versioning
- ✅ Complete audit trail

### Demo Data:
- 1 Organization (Demo Corporation)
- 3 Facilities (New York, London, Singapore)
- 15 Emission sources
- 12 months of emissions data
- Energy consumption data
- Sustainability targets

## After Migration

### 1. Update TypeScript Types
```bash
# Generate new types
npx supabase gen types typescript --project-id [PROJECT-REF] > src/types/database.ts
```

### 2. Update Your Code
The main tables have changed:
- `emissions` → Now requires `emission_sources`
- `buildings` → Now called `facilities`
- `conversations` → Now has threading support

### 3. Test the Application
```bash
npm run dev
```

## Rollback If Needed

```bash
# Restore from backup
psql postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres < backup/pre-v2-migration-[TIMESTAMP].sql
```

## Need Help?

The migration creates a Fortune 10-level schema that's probably overkill for most users. You can:
1. Use only the tables you need
2. The schema is designed to grow with you
3. All tables have proper indexes and partitioning

## Performance Note

The new schema is optimized for:
- 100,000+ facilities
- Millions of data points
- Real-time analytics
- Global scale operations

Even if you're starting small, the schema won't slow you down!