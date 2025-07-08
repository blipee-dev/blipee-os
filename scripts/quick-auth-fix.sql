
-- Quick fix for auth signup error
-- Just add the missing columns

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('metadata', 'preferred_language', 'timezone');
