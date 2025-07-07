-- Update buildings table to match multi-tenant schema
-- This migration adds missing columns to the buildings table

-- Add missing columns to buildings table
ALTER TABLE public.buildings 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state_province VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US',
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS systems_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS baseline_data JSONB DEFAULT '{}';

-- Add unique constraint for org+slug if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'buildings_organization_id_slug_key'
    ) THEN
        ALTER TABLE public.buildings 
        ADD CONSTRAINT buildings_organization_id_slug_key UNIQUE(organization_id, slug);
    END IF;
END $$;

-- Update any existing buildings to have a slug if they don't have one
UPDATE public.buildings 
SET slug = LOWER(REPLACE(name, ' ', '-'))
WHERE slug IS NULL;

-- Make slug NOT NULL after populating it
ALTER TABLE public.buildings 
ALTER COLUMN slug SET NOT NULL;