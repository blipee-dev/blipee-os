-- Direct fix for missing enum values
-- This migration adds the missing 'sustainability_manager' and other role values

-- Add missing enum values one by one (safest approach)
-- PostgreSQL doesn't support IF NOT EXISTS for enum values, so we use exception handling

DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'sustainability_manager';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value sustainability_manager already exists in user_role enum';
END $$;

DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'sustainability_lead';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value sustainability_lead already exists in user_role enum';
END $$;

DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'platform_admin';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value platform_admin already exists in user_role enum';
END $$;

-- Ensure all standard roles exist
DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'account_owner';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value account_owner already exists in user_role enum';
END $$;

DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'admin';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value admin already exists in user_role enum';
END $$;

DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'facility_manager';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value facility_manager already exists in user_role enum';
END $$;

DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'analyst';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value analyst already exists in user_role enum';
END $$;

DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'reporter';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value reporter already exists in user_role enum';
END $$;

DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE 'viewer';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Value viewer already exists in user_role enum';
END $$;

-- Verify the enum now has all required values
DO $$
DECLARE
    enum_values TEXT[];
BEGIN
    -- Get current enum values
    SELECT array_agg(enumlabel::text ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role';
    
    RAISE NOTICE '✅ user_role enum values after migration: %', array_to_string(enum_values, ', ');
    
    -- Check that critical values exist
    IF array_to_string(enum_values, ',') LIKE '%sustainability_manager%' THEN
        RAISE NOTICE '✅ SUCCESS: sustainability_manager is now in the user_role enum';
    ELSE
        RAISE EXCEPTION '❌ FAILED: sustainability_manager was not added to user_role enum';
    END IF;
END $$;