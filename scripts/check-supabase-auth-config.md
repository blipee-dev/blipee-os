# Supabase Auth Configuration Checklist

## Common Causes of "Database error saving new user"

### 1. **Email Already Exists**
Even if you don't see the user in the dashboard, they might exist in a deleted state.

**Solution:**
```sql
-- Check for any user with this email (including deleted)
SELECT id, email, created_at, deleted_at 
FROM auth.users 
WHERE email = 'demo@blipee.com';
```

### 2. **Auth Settings in Supabase Dashboard**

Go to your Supabase Dashboard → Authentication → Settings and check:

- ✅ **Enable Email Signups** is ON
- ✅ **Confirm Email** is OFF (for testing)
- ✅ **Minimum Password Length** is 6 or less
- ✅ **Password Requirements** match what you're using

### 3. **Database Connection Issues**

Check your environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 4. **RLS (Row Level Security) Blocking**

RLS policies might be preventing user creation. The fix script above temporarily disables RLS.

### 5. **Quota Exceeded**

Free Supabase projects have limits:
- 500MB database
- 50,000 monthly active users
- 2GB file storage

Check your usage in Supabase Dashboard → Settings → Usage.

## Quick Fixes to Try:

### Option 1: Use a Different Email
```
Email: test@example.com
Password: test123456
```

### Option 2: Reset Your Supabase Auth
In Supabase Dashboard:
1. Go to Authentication → Users
2. Delete any existing demo@blipee.com user
3. Go to SQL Editor
4. Run: `DELETE FROM auth.users WHERE email = 'demo@blipee.com';`

### Option 3: Create User via Supabase Dashboard
1. Go to Authentication → Users
2. Click "Add User" → "Create New User"
3. Enter email and password
4. Uncheck "Auto Confirm Email"

### Option 4: Use Supabase CLI
```bash
npx supabase db reset
```
This will reset your entire database (WARNING: deletes all data!)

## Alternative Development Setup

If auth continues to fail, you can bypass it for development:

1. Create a `.env.development` file:
```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_USER_ID=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```

2. Update your auth check to use demo mode when this env var is set.

This allows you to develop without needing working auth.