# Supabase Setup Guide for Blipee OS

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Create new project:
   - **Name:** `blipee-os`
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is fine for development

### 2. Run Database Schema

1. Once project is ready, go to **SQL Editor**
2. Click "New query"
3. Copy entire contents of `/supabase/schema.sql`
4. Paste and click "Run"
5. You should see "Success. No rows returned"

### 3. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)
3. **Enable Google Sign-In** (Recommended):
   - Click on **Google** provider
   - Toggle to enable
   - Add your Google OAuth credentials:
     ```
     Client ID: your-client-id.apps.googleusercontent.com
     Client Secret: your-client-secret
     ```
   - Copy the callback URL provided:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
   - Add this callback URL to your Google Cloud Console
   - See [Google Auth Setup Guide](./GOOGLE_AUTH_SETUP.md) for detailed steps
4. Optional: Enable other providers:
   - GitHub (for developers)
   - Microsoft (for enterprise)

### 4. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

### 5. Configure Security

1. Go to **Authentication** → **Policies**
2. Verify RLS policies are active (created by our schema)
3. Go to **Settings** → **API** → **Settings**
4. Add your domains to allowed list:
   - `http://localhost:3000`
   - `https://*.vercel.app`
   - Your production domain

## 🔧 Advanced Configuration

### Enable Realtime

1. Go to **Database** → **Replication**
2. Enable replication for these tables:
   - `devices` (for live device updates)
   - `metrics` (for real-time data)
   - `conversations` (for chat updates)

### Storage Setup (Optional)

For storing reports, images, etc:

1. Go to **Storage**
2. Create buckets:
   - `reports` (for generated PDFs)
   - `building-images` (for 3D models, floor plans)
   - `avatars` (for user profiles)

### Edge Functions (Optional)

For complex AI operations:

```bash
# In your project
supabase functions new ai-chat
supabase functions new generate-report
```

## 🧪 Testing Your Setup

### Quick Test Script

Create `test-supabase.js` in your project:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  // Test auth
  const { data: { user }, error: authError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123'
  })
  
  console.log('Auth test:', user ? 'Success' : authError)
  
  // Test database
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
  
  console.log('Database test:', error ? error : 'Success')
}

testConnection()
```

Run with: `node test-supabase.js`

## 🎯 Environment-Specific Setup

### Development
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Staging
Create separate Supabase project for staging

### Production
- Use Supabase Pro ($25/month) for:
  - No pause after 1 week
  - Daily backups
  - More resources

## 🛡️ Security Best Practices

### 1. API Keys
- Never commit `.env.local`
- Use Vercel environment variables for production
- Rotate keys regularly

### 2. Row Level Security
Our schema includes RLS policies, but always verify:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 3. Service Key Usage
Only use service key server-side:

```typescript
// ❌ Bad: Client-side
const supabase = createClient(url, SERVICE_KEY)

// ✅ Good: Server-side only
// app/api/admin/route.ts
const supabaseAdmin = createClient(url, SERVICE_KEY)
```

## 🔍 Monitoring

### Database Metrics
1. Go to **Reports** → **Database**
2. Monitor:
   - Query performance
   - Storage usage
   - Connection count

### API Usage
1. Go to **Reports** → **API**
2. Track:
   - Request count
   - Bandwidth usage
   - Error rates

## 🚨 Troubleshooting

### "Permission denied for table"
- Check RLS policies
- Verify user is authenticated
- Check user has organization access

### "Too many connections"
- Implement connection pooling
- Use single Supabase client instance
- Check for connection leaks

### "CORS errors"
- Add domain to allowed list
- Check URL configuration
- Verify anon key is correct

## 📊 Demo Data

After setup, create demo data:

```sql
-- Create demo user and data
SELECT create_demo_data(auth.uid());
```

This creates:
- 1 Demo organization
- 1 Demo building
- 3 Demo devices
- 24 hours of metrics data

## 🔗 Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript)
- [Dashboard](https://app.supabase.com)
- [Status Page](https://status.supabase.com)

## ✅ Setup Checklist

- [ ] Project created
- [ ] Schema deployed
- [ ] API keys saved
- [ ] RLS verified
- [ ] Realtime enabled
- [ ] Test connection working
- [ ] Demo data created

Once complete, your Supabase backend is ready for Blipee OS!