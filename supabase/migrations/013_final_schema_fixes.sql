-- Final schema fixes to ensure all tables have required columns

-- Add missing columns to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add missing columns to audit_logs (if needed)
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to onboarding_progress
ALTER TABLE public.onboarding_progress
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';