-- Add enabled field to user_mfa_config
ALTER TABLE user_mfa_config 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_mfa_config_enabled 
ON user_mfa_config(user_id, enabled) 
WHERE enabled = true;