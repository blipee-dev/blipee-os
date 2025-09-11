-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into app_users when a new auth user is created
  INSERT INTO public.app_users (
    auth_user_id,
    email,
    name,
    created_at,
    updated_at,
    status,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW(),
    'active',
    'user'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to backfill existing users from auth.users to app_users
CREATE OR REPLACE FUNCTION public.backfill_app_users()
RETURNS void AS $$
BEGIN
  -- Insert all existing auth users into app_users if they don't exist
  INSERT INTO public.app_users (
    auth_user_id,
    email,
    name,
    created_at,
    updated_at,
    status,
    role,
    phone,
    avatar_url
  )
  SELECT 
    au.id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      split_part(au.email, '@', 1)
    ),
    COALESCE(au.created_at, NOW()),
    COALESCE(au.updated_at, NOW()),
    'active',
    'user',
    au.raw_user_meta_data->>'phone',
    au.raw_user_meta_data->>'avatar_url'
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = au.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute backfill for existing users
SELECT public.backfill_app_users();

-- Add RLS policy for users to view and update their own app_users record
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
CREATE POLICY "Users can view own profile" ON app_users
  FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile" ON app_users
  FOR UPDATE USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON app_users;
CREATE POLICY "Users can insert own profile" ON app_users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.app_users TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates app_users entry when new auth user signs up';
COMMENT ON FUNCTION public.backfill_app_users() IS 'One-time function to sync existing auth users to app_users table';