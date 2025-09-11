-- =============================================
-- Cleanup Old RBAC System (Optional)
-- =============================================
-- Run this migration only after confirming the new system works perfectly

-- Drop the backup table (contains old user_organizations data)
-- Uncomment to execute:
-- DROP TABLE IF EXISTS user_access_backup CASCADE;

-- Drop any old views that might reference the old system
-- Uncomment if needed:
-- DROP VIEW IF EXISTS user_access_profile CASCADE;

-- Note: Keep this commented out until you're 100% sure you don't need the backup