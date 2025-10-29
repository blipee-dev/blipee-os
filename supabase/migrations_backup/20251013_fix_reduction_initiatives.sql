-- Fix reduction_initiatives table - Add missing columns
-- This ensures the table matches the schema from 20251004235000_create_reduction_initiatives.sql

-- Add implementation_year column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reduction_initiatives'
    AND column_name = 'implementation_year'
  ) THEN
    ALTER TABLE reduction_initiatives
    ADD COLUMN implementation_year INTEGER NOT NULL DEFAULT 2024;

    RAISE NOTICE 'Added implementation_year column';
  END IF;
END $$;

-- Add other potentially missing columns from the original migration

-- Timeline columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reduction_initiatives'
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE reduction_initiatives
    ADD COLUMN start_date DATE;

    RAISE NOTICE 'Added start_date column';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reduction_initiatives'
    AND column_name = 'completion_date'
  ) THEN
    ALTER TABLE reduction_initiatives
    ADD COLUMN completion_date DATE;

    RAISE NOTICE 'Added completion_date column';
  END IF;
END $$;

-- Scope coverage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reduction_initiatives'
    AND column_name = 'scopes'
  ) THEN
    ALTER TABLE reduction_initiatives
    ADD COLUMN scopes TEXT[];

    RAISE NOTICE 'Added scopes column';
  END IF;
END $$;

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reduction_initiatives'
    AND column_name = 'verified'
  ) THEN
    ALTER TABLE reduction_initiatives
    ADD COLUMN verified BOOLEAN DEFAULT false;

    RAISE NOTICE 'Added verified column';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reduction_initiatives'
    AND column_name = 'verification_method'
  ) THEN
    ALTER TABLE reduction_initiatives
    ADD COLUMN verification_method TEXT;

    RAISE NOTICE 'Added verification_method column';
  END IF;
END $$;

-- Create index on implementation_year if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_reduction_initiatives_year
  ON reduction_initiatives(implementation_year);

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ reduction_initiatives table fixed';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Missing columns have been added.';
  RAISE NOTICE 'The table now matches the expected schema.';
  RAISE NOTICE '';
END $$;
