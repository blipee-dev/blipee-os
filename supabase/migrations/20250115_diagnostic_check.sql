-- ============================================================================
-- DIAGNOSTIC CHECK - What's really in organization_members?
-- ============================================================================

-- Check if it's a table or view
SELECT
    schemaname,
    tablename,
    tableowner,
    'TABLE' as type
FROM pg_tables
WHERE tablename = 'organization_members'
UNION ALL
SELECT
    schemaname,
    viewname as tablename,
    viewowner as tableowner,
    'VIEW' as type
FROM pg_views
WHERE viewname = 'organization_members';

-- Check actual columns in the table/view
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'organization_members'
ORDER BY ordinal_position;

-- Check if there's a base table with different name
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'role'
AND table_name LIKE '%member%'
OR table_name LIKE '%org%';

-- Check what's actually in the table
SELECT * FROM organization_members LIMIT 1;

-- Try to see the table definition
SELECT
    'organization_members' as table_name,
    obj_description('organization_members'::regclass, 'pg_class') as description;