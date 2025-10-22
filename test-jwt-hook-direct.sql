-- Test the JWT hook function directly to see the actual error
-- Run this in Supabase SQL Editor

-- Test with your actual user ID
SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', 'd5708d9c-34fb-4c85-90ec-34faad9e2896',  -- Your auth_user_id
    'claims', '{}'::jsonb
  )
) AS result;

-- This will show you the actual error if the function fails
