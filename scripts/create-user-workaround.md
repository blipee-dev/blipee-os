# Workaround for Phone Constraint Error

## The Problem
Supabase's `auth.users` table has a UNIQUE constraint on the `phone` column. This causes issues when:
1. Multiple users try to sign up without a phone (NULL values)
2. The same phone number is used twice
3. The auth system tries to set a default phone value

## Solutions

### Option 1: Use Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this query to create the user directly:

```sql
-- Create user bypassing phone constraint
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
BEGIN
    -- Insert into auth.users with NULL phone
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
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
        crypt('demo123456', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Demo User"}',
        now(),
        now()
    );
    
    -- Create user profile
    INSERT INTO user_profiles (
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
    );
    
    RAISE NOTICE 'User created with ID: %', new_user_id;
    RAISE NOTICE 'You can now sign in with demo@blipee.com';
END $$;
```

### Option 2: Use Different Email
Try signing up with a different email that hasn't been used:
- `demo2@blipee.com`
- `test@blipee.com`
- `admin@blipee.com`

### Option 3: Fix Existing User
If the user already exists but can't sign in:

```sql
-- Reset existing user
UPDATE auth.users 
SET 
    phone = NULL,
    encrypted_password = crypt('demo123456', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'demo@blipee.com';
```

### Option 4: Check Supabase Auth Settings
In Supabase Dashboard → Authentication → Providers → Email:
1. Ensure "Enable Email Signup" is ON
2. Turn OFF "Enable Email Confirmations" for testing
3. Check there are no email domain restrictions

## After Creating User

Once the user is created via SQL, you can:
1. Sign in normally at `/signin`
2. Run the admin privileges script to upgrade the user

## Development Mode (Skip Auth)

If auth continues to fail, add this to your `.env.local`:
```
NEXT_PUBLIC_BYPASS_AUTH=true
NEXT_PUBLIC_DEMO_USER_ID=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```

Then modify your auth context to skip auth in development.