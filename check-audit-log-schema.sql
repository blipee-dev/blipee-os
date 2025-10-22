-- Check actual schema of access_audit_log table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'access_audit_log'
ORDER BY ordinal_position;
