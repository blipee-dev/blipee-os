-- Add appearance_settings column to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS appearance_settings JSONB DEFAULT '{
  "theme": "system",
  "accentGradient": "from-purple-500 to-pink-500",
  "fontSize": "medium",
  "interfaceDensity": "comfortable",
  "reduceMotion": false,
  "highContrast": false,
  "autoCollapseSidebar": true
}'::jsonb;

-- Add index for faster queries on appearance settings
CREATE INDEX IF NOT EXISTS idx_app_users_appearance_settings 
ON app_users USING GIN (appearance_settings);

-- Add comment for documentation
COMMENT ON COLUMN app_users.appearance_settings IS 'User appearance preferences including theme, colors, accessibility options, etc';