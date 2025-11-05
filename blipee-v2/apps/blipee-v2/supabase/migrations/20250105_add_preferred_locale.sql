-- Add preferred_locale column to user_profiles table
-- Stores user's manually selected language preference
-- This is the highest priority locale setting

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(10) CHECK (preferred_locale IN ('en-US', 'es-ES', 'pt-PT'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_locale
ON user_profiles(preferred_locale);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.preferred_locale IS
'User manually selected language preference. Priority #1 for locale detection. Values: en-US, es-ES, pt-PT';

-- Add preferred_locale column to organizations table
-- Stores organization's default language
-- Used for new users invited to the organization

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(10) DEFAULT 'en-US' CHECK (preferred_locale IN ('en-US', 'es-ES', 'pt-PT'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_preferred_locale
ON organizations(preferred_locale);

-- Add comment for documentation
COMMENT ON COLUMN organizations.preferred_locale IS
'Organization default language. Used for invitations and as fallback. Values: en-US, es-ES, pt-PT. Default: en-US';

-- Update existing organizations to have default locale
UPDATE organizations
SET preferred_locale = 'en-US'
WHERE preferred_locale IS NULL;
