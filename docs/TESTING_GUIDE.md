# Testing Guide for Blipee OS Multi-Tenant System

## 🚀 Quick Start Testing on Vercel

Since you're deployed on Vercel, here's how to test the multi-tenant authentication system:

### 1. **Access Your Deployment**
Go to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

### 2. **Test Sign Up Flow**

1. You should be automatically redirected to `/signin`
2. Click **"Start your free trial"** to go to signup
3. Fill in the form:
   ```
   Full name: Your Name
   Email: test@example.com
   Company: Test Company
   Password: TestPass123!
   ```
4. After signup, you'll be redirected to the onboarding flow

### 3. **Test Onboarding (2 minutes)**

The subscription owner onboarding includes:

1. **Company Essentials** (30s)
   - Company name (pre-filled)
   - Industry selection
   - Company size

2. **Add Buildings** (45s)
   - Bulk input format:
   ```
   Main Office, San Francisco
   Warehouse, Oakland
   Branch Office, San Jose
   ```

3. **Invite Managers** (40s) - Optional
   - Format:
   ```
   john@company.com = Main Office
   mary@company.com = Warehouse
   ```

4. **Choose Plan** (10s)
   - Select Professional (recommended)

### 4. **Test Dashboard Features**

After onboarding, test:

- **Building Selector**: Top navigation - switch between buildings
- **Organization Switcher**: If you create multiple organizations
- **Conversation Interface**: Now includes building context

### 5. **Test Different User Roles**

Create accounts with different email addresses to test each role:

- **Site Manager**: Gets 5-minute onboarding with building details
- **Technician**: Gets 3-minute onboarding with work areas
- **Group Manager**: Gets 4-minute onboarding with team setup
- **Tenant**: Gets 2-minute simple onboarding

### 6. **Test Demo Account**

Click **"Try Demo Account"** on the signin page to:
- Create a temporary demo account automatically
- Skip manual signup
- Experience the full onboarding flow

## 🧪 Testing Checklist

- [ ] Sign up creates organization and user profile
- [ ] Onboarding flow completes in under 7 minutes
- [ ] Building selector shows created buildings
- [ ] Conversation interface shows building context
- [ ] Sign out redirects to signin page
- [ ] Protected routes redirect when not authenticated

## 🐛 Troubleshooting

### "Demo sign in failed"
- The demo account creation might be blocked by Supabase policies
- Use manual signup instead

### "Not authenticated" errors
- Check browser console for specific errors
- Ensure cookies are enabled
- Try clearing browser cache

### Building selector empty
- Complete the onboarding flow
- Add buildings during onboarding
- Check Supabase dashboard for data

## 📊 Verify in Supabase Dashboard

1. Go to your Supabase project
2. Check these tables:
   - `user_profiles`: Should have your user
   - `organizations`: Should have your company
   - `buildings`: Should have your buildings
   - `organization_members`: Should link user to org

## 🔑 Environment Variables on Vercel

Ensure these are set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

## 🎯 Next Steps

After testing basic auth flow:
1. Test building management features
2. Test role-based permissions
3. Test AI conversation with building context
4. Invite team members to test multi-user scenarios