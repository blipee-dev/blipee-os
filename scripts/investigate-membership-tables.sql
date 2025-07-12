-- =====================================================
-- INVESTIGATE MEMBERSHIP TABLES
-- Run this in Supabase SQL Editor to see what exists
-- =====================================================

-- Check all tables that might contain user-organization relationships
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
AND (
    table_name LIKE '%member%' 
    OR table_name LIKE '%user%' 
    OR table_name LIKE '%organization%'
    OR table_name LIKE '%team%'
)
ORDER BY table_schema, table_name;

-- Check columns of organizations table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there's a junction table for users and organizations
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (
    tc.table_name LIKE '%member%' 
    OR tc.table_name LIKE '%user%'
    OR ccu.table_name = 'organizations'
)
ORDER BY tc.table_name;

-- Try to find any table that links users to organizations
SELECT 
    t.table_name,
    array_agg(c.column_name ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_name IN (
    SELECT DISTINCT table_name 
    FROM information_schema.columns 
    WHERE column_name IN ('user_id', 'organization_id')
    AND table_schema = 'public'
)
GROUP BY t.table_name
HAVING 
    'user_id' = ANY(array_agg(c.column_name))
    AND 'organization_id' = ANY(array_agg(c.column_name))
ORDER BY t.table_name;