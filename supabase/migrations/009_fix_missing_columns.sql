-- Fix missing columns in various tables

-- Add missing columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Add missing columns to organization_members  
ALTER TABLE public.organization_members
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add missing columns to equipment
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS expected_lifetime_years INTEGER;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);