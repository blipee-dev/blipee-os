-- ============================================================================
-- RLS POLICY CHECK QUERIES
-- Run these in Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. TABLES WITH RLS ENABLED
-- ============================================================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- 2. ALL ACTIVE RLS POLICIES
-- ============================================================================
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  CASE
    WHEN LENGTH(qual::text) > 100 THEN LEFT(qual::text, 100) || '...'
    ELSE qual::text
  END as using_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. POLICY COUNT BY TABLE
-- ============================================================================
SELECT
  tablename,
  COUNT(*) as policy_count,
  array_agg(DISTINCT cmd ORDER BY cmd) as commands_covered
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- 4. TABLES WITHOUT RLS (SECURITY ISSUE!)
-- ============================================================================
SELECT
  t.tablename,
  'WARNING: No RLS enabled!' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
  AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
  AND t.rowsecurity = false
ORDER BY t.tablename;

-- 5. TABLES WITH RLS BUT NO POLICIES (SECURITY ISSUE!)
-- ============================================================================
SELECT
  t.tablename,
  'WARNING: RLS enabled but no policies!' as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- 6. DETAILED POLICY INFORMATION FOR KEY TABLES
-- ============================================================================

-- app_users policies
SELECT 'app_users' as table_name, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'app_users'
ORDER BY policyname;

-- organizations policies
SELECT 'organizations' as table_name, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'organizations'
ORDER BY policyname;

-- organization_members policies
SELECT 'organization_members' as table_name, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'organization_members'
ORDER BY policyname;

-- user_access policies
SELECT 'user_access' as table_name, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_access'
ORDER BY policyname;

-- metrics_data policies
SELECT 'metrics_data' as table_name, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'metrics_data'
ORDER BY policyname;

-- 7. CHECK JWT CLAIMS FUNCTION EXISTS
-- ============================================================================
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'custom_access_token_hook';

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%') as tables_without_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tables_with_policies;
