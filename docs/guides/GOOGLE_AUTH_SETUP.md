# Google Authentication Setup for Blipee OS

## 🔐 Overview

Enable Google Sign-In for a seamless authentication experience. Users can sign in with their Google accounts using OAuth or One Tap.

## 📋 Prerequisites

- Google Cloud Console account
- Supabase project created
- Vercel deployment ready

## 🚀 Setup Steps

### 1. Google Cloud Console Setup

1. **Create a Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project: "Blipee OS"
   - Note your project ID

2. **Enable Google Sign-In API**
   - Navigate to "APIs & Services" → "Enabled APIs"
   - Click "+ Enable APIs and Services"
   - Search for "Google Identity Toolkit API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ Create Credentials" → "OAuth client ID"
   - Configure consent screen first:
     - User Type: External
     - App name: Blipee OS
     - Support email: your-email@domain.com
     - Authorized domains: 
       - `supabase.co`
       - `vercel.app`
       - Your custom domain

4. **Create OAuth Client ID**
   - Application type: Web application
   - Name: "Blipee OS Web Client"
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://your-project.vercel.app
     https://your-custom-domain.com
     ```
   - Authorized redirect URIs:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret**

### 2. Supabase Configuration

1. **Navigate to Authentication**
   - Go to your Supabase dashboard
   - Click "Authentication" → "Providers"
   - Find "Google" and click "Enable"

2. **Configure Google Provider**
   ```
   Client ID: your-google-client-id.apps.googleusercontent.com
   Client Secret: your-google-client-secret
   ```

3. **Copy Callback URL**
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
   Add this to Google Console's authorized redirect URIs

### 3. Update Environment Variables

Add to your `.env.local`:

```env
# Google OAuth (optional - for custom flows)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 4. Implement Google Sign-In

#### Option A: Supabase Auth UI (Simplest)

```typescript
// components/auth/GoogleSignIn.tsx
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function GoogleSignIn() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={['google']}
      redirectTo={`${window.location.origin}/auth/callback`}
    />
  )
}
```

#### Option B: Custom Button

```typescript
// components/auth/GoogleButton.tsx
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Chrome } from 'lucide-react'

export function GoogleButton() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      variant="outline"
      className="w-full"
    >
      <Chrome className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  )
}
```

#### Option C: Google One Tap

```typescript
// components/auth/GoogleOneTap.tsx
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

declare global {
  interface Window {
    google: any
  }
}

export function GoogleOneTap() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
        cancel_on_tap_outside: false,
      })
      
      window.google.accounts.id.prompt()
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleCredentialResponse = async (response: any) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    })
    
    if (error) {
      console.error('Error:', error)
    } else {
      // User signed in successfully
      window.location.href = '/app'
    }
  }

  return null
}
```

### 5. Create Auth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
```

### 6. Handle User Session

```typescript
// lib/auth/hooks.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

### 7. Protect Routes

```typescript
// middleware.ts
import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createClient(request, res)
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect /app routes
  if (request.nextUrl.pathname.startsWith('/app') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return res
}

export const config = {
  matcher: ['/app/:path*'],
}
```

## 🔧 Advanced Configuration

### Custom Scopes

Request additional permissions:

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly'
  }
})
```

### Handle Multiple Domains

For development and production:

```typescript
const getRedirectURL = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  return `${url}/auth/callback`
}
```

### User Profile Enhancement

After sign-in, enhance the user profile:

```typescript
// After successful sign-in
const { data: { user } } = await supabase.auth.getUser()

if (user && !user.user_metadata.onboarded) {
  // Create organization and building
  const { data: org } = await supabase
    .from('organizations')
    .insert({
      name: `${user.user_metadata.full_name}'s Organization`,
      slug: user.id.substring(0, 8)
    })
    .select()
    .single()

  // Update user metadata
  await supabase.auth.updateUser({
    data: { onboarded: true, organization_id: org.id }
  })
}
```

## 🚨 Troubleshooting

### "Redirect URI mismatch"
- Ensure callback URL in Google Console matches Supabase exactly
- Check for trailing slashes
- Verify HTTPS vs HTTP

### "User not found after sign-in"
- Check if Row Level Security is blocking
- Verify auth.users() references in RLS policies
- Check session is being set correctly

### "Google One Tap not showing"
- Verify client ID is correct
- Check domain is authorized
- Ensure cookies are enabled

## 🔒 Security Best Practices

1. **Never expose Client Secret**
   - Keep it server-side only
   - Use environment variables

2. **Validate ID Tokens**
   - Always verify tokens server-side
   - Check audience and issuer

3. **Implement CSRF Protection**
   - Use state parameter in OAuth flow
   - Verify nonce in ID tokens

4. **Secure Cookie Settings**
   ```typescript
   // In auth callback
   response.cookies.set('session', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 60 * 60 * 24 * 7 // 7 days
   })
   ```

## ✅ Testing Checklist

- [ ] Sign in with Google works locally
- [ ] Sign in works in production
- [ ] User data is saved correctly
- [ ] Session persists on refresh
- [ ] Sign out clears session
- [ ] Protected routes redirect properly
- [ ] Error handling works

## 🎉 Success!

Your users can now sign in with Google! This provides:
- One-click authentication
- No password management
- Trusted identity verification
- Access to Google APIs (if needed)

Next steps:
1. Customize the sign-in UI to match Blipee OS design
2. Add user onboarding flow
3. Implement role-based access control