-- Fix all remaining schema issues to allow data population

-- 1. Remove the auth.users foreign key constraint from user_profiles temporarily
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 2. Add missing columns to equipment table
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';

-- 3. Add missing columns and ensure proper defaults
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.ui_components
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Add any missing columns to match seed data
ALTER TABLE public.invitations
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 5. Create a simple function to allow demo user creation
CREATE OR REPLACE FUNCTION create_demo_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT,
    user_phone TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, email, full_name, phone, 
        onboarding_completed, preferred_language, timezone
    ) VALUES (
        user_id, user_email, user_full_name, user_phone,
        true, 'en', 'Europe/Lisbon'
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Ensure audit_logs table can accept demo data
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';