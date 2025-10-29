-- Add avatar_url and bio columns to app_users table if they don't exist
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Note: Storage bucket creation and policies need to be set up in Supabase Dashboard
-- Go to Storage section and create a new bucket called 'profile-images' with:
-- - Public access enabled
-- - 5MB file size limit
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp