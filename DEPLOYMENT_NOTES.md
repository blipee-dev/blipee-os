# Deployment Notes

## Important: Table Name Changes

We've recently updated the database schema from using `user_organizations` to `organization_members`. If you're seeing 404 errors related to `user_organizations`, please follow these steps:

### 1. Clear Build Cache
```bash
# For Vercel
vercel --force

# For local builds
rm -rf .next
npm run build
```

### 2. Clear Browser Cache
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
- Clear site data in Developer Tools > Application > Storage > Clear site data

### 3. Clear CDN Cache (if applicable)
- Cloudflare: Purge cache from dashboard
- Vercel: Automatic on new deployment

### 4. Environment Variables
Ensure these are set in your deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

### 5. Database Schema
The correct table is `organization_members`, not `user_organizations`. All code has been updated to use the new table name.

### Compatibility
We've added a compatibility layer that handles both table names, but for best performance, ensure your deployment uses the latest code that references `organization_members` directly.

## Troubleshooting

If you continue to see 404 errors:

1. Check the diagnostic endpoint: `/api/auth/fix-table-references`
2. Verify your Supabase database has the `organization_members` table
3. Ensure all JavaScript bundles are rebuilt and not cached
4. Check for any custom SQL queries or RPC functions that might reference the old table

## Migration SQL (if needed)

If your database still has `user_organizations` and needs to be migrated:

```sql
-- Rename table
ALTER TABLE user_organizations RENAME TO organization_members;

-- Add missing columns if needed
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'accepted',
ADD COLUMN IF NOT EXISTS invited_at timestamptz,
ADD COLUMN IF NOT EXISTS invited_by uuid;

-- Update foreign key constraints
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS user_organizations_organization_id_fkey,
ADD CONSTRAINT organization_members_organization_id_fkey 
  FOREIGN KEY (organization_id) 
  REFERENCES organizations(id) 
  ON DELETE CASCADE;
```