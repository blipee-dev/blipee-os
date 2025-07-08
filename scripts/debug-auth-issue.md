# Supabase Auth SignUp 500 Error - Debug Results

## Issue Summary

The auth.signUp is failing with a 500 error because:

1. **Missing Column**: The `handle_new_user()` trigger function (from migration 003) tries to update `user_profiles.metadata` column, but this column was never created in the original schema.

2. **Missing Columns**: The function also references `preferred_language` and `timezone` columns that don't exist.

3. **Dropped Constraint**: Migration 011 dropped the foreign key constraint between `user_profiles.id` and `auth.users.id`, which might cause referential integrity issues.

## Root Cause

When a new user signs up:
1. Supabase creates a record in `auth.users`
2. The `on_auth_user_created` trigger fires
3. The `handle_new_user()` function tries to insert/update `user_profiles`
4. The function fails because it references non-existent columns
5. This causes the entire signup transaction to rollback with a 500 error

## Solution

I've created a migration file to fix this issue: `/workspaces/blipee-os/supabase/migrations/021_fix_auth_signup_error.sql`

This migration:
- Adds the missing `metadata`, `preferred_language`, and `timezone` columns
- Re-adds the foreign key constraint
- Updates the trigger function to be more robust with error handling
- Ensures the function won't fail if there are issues

## How to Apply the Fix

Run the following command to apply the migration to your Supabase instance:

```bash
npx supabase db push
```

Or if you want to apply just this specific migration:

```bash
npx supabase migration up --file supabase/migrations/021_fix_auth_signup_error.sql
```

## Alternative Quick Fix (Direct SQL)

If you need to fix this immediately without going through migrations, you can run the SQL directly in the Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `/workspaces/blipee-os/scripts/fix-auth-signup-error.sql`
4. Execute the SQL

## Verification

After applying the fix, test signup with:

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'TestPassword123!',
  options: {
    data: {
      full_name: 'Test User',
      preferred_language: 'en',
      timezone: 'UTC'
    }
  }
});
```

The signup should now work without the 500 error.