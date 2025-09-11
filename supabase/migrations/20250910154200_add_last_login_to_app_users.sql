-- Add last_login column to app_users table
ALTER TABLE app_users 
ADD COLUMN last_login TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN app_users.last_login IS 'Timestamp of the user''s last successful login';

-- Add index for better performance when querying by last_login
CREATE INDEX idx_app_users_last_login ON app_users(last_login);