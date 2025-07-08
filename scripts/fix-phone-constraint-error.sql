-- Fix Phone Constraint Error in Supabase Auth
-- The issue: auth.users has a UNIQUE constraint on phone column

-- 1. First, check if any users have the same phone number
SELECT id, email, phone, created_at 
FROM auth.users 
WHERE phone IS NOT NULL
ORDER BY created_at DESC;

-- 2. Check if there are users with NULL phone (this can also cause issues)
SELECT COUNT(*) as users_with_null_phone
FROM auth.users 
WHERE phone IS NULL;

-- 3. Update the signup to not include phone number
-- The error is likely happening because the signup form is sending a phone number

-- 4. For existing demo user, clear the phone
UPDATE auth.users 
SET phone = NULL 
WHERE email = 'demo@blipee.com';

-- 5. Alternative: Create user with unique phone
DO $$
DECLARE
    new_user_id uuid;
    unique_phone text;
BEGIN
    -- Generate unique phone number
    unique_phone := '+1555' || LPAD(FLOOR(RANDOM() * 10000000)::text, 7, '0');
    
    -- Generate new UUID
    new_user_id := gen_random_uuid();
    
    -- Create user with unique phone
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        phone,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'demo@blipee.com',
        NULL,  -- Set phone to NULL to avoid constraint
        crypt('demo123456', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Demo User"}',
        now(),
        now()
    ) ON CONFLICT (email) 
    DO UPDATE SET 
        phone = NULL,  -- Clear phone if user exists
        updated_at = now();
    
    -- Create profile
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'demo@blipee.com',
        'Demo User',
        now(),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'User created/updated with ID: %', COALESCE(new_user_id, (SELECT id FROM auth.users WHERE email = 'demo@blipee.com'));
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint violation - trying to fix...';
        -- If phone constraint fails, try updating existing user
        UPDATE auth.users 
        SET phone = NULL 
        WHERE email = 'demo@blipee.com';
        RAISE NOTICE 'Cleared phone for existing user';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 6. Verify the user was created
SELECT 
    id,
    email,
    phone,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'demo@blipee.com';

-- 7. IMPORTANT: Check your signup form!
-- Make sure your signup form is NOT sending a phone field
-- Or ensure each signup uses a unique phone number