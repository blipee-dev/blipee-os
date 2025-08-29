-- Simple and direct fix for the missing enum value
-- This is the minimal fix needed to resolve the immediate error

-- Add the missing 'sustainability_manager' value
ALTER TYPE user_role ADD VALUE 'sustainability_manager';

-- That's it! This single line fixes the immediate error.
-- The enum value will be added and all subsequent migrations will work.