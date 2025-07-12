-- =====================================================
-- CHECK IF RLS POLICIES ARE IMPLEMENTED
-- Run this script to verify which policies exist
-- =====================================================

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'organizations',
    'facilities', 
    'emissions',
    'emission_sources',
    'energy_consumption',
    'water_consumption',
    'waste_generation',
    'sustainability_targets',
    'material_topics',
    'suppliers',
    'compliance_frameworks',
    'team_members',
    'organization_members'
)
ORDER BY tablename;

-- Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'organizations',
    'facilities',
    'emissions',
    'emission_sources',
    'energy_consumption',
    'water_consumption',
    'waste_generation',
    'sustainability_targets',
    'material_topics',
    'suppliers',
    'compliance_frameworks',
    'team_members',
    'organization_members'
)
ORDER BY tablename, policyname;

-- Check if helper functions exist
SELECT 
    proname as function_name,
    pronargs as num_args,
    proargtypes
FROM pg_proc
WHERE proname IN ('is_organization_member', 'has_organization_role')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check if the organization_members table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_members'
) as organization_members_exists;

-- Check if team_members table exists (alternative name)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'team_members'
) as team_members_exists;

-- Count policies by table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;