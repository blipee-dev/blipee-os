-- Add missing fields to buildings table
ALTER TABLE public.buildings 
ADD COLUMN IF NOT EXISTS address VARCHAR(500),
ADD COLUMN IF NOT EXISTS size_sqft INTEGER,
ADD COLUMN IF NOT EXISTS floors INTEGER,
ADD COLUMN IF NOT EXISTS age_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS occupancy_types JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending_setup', 'inactive'));