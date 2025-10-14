# Authentication Security Fixes & Improvements

## Executive Summary

This document outlines critical security vulnerabilities discovered in the authentication system and provides a detailed implementation plan to fix them. Issues are prioritized by severity (Critical → High → Medium → Low) with estimated timelines.

**Total Estimated Time**: 3-4 weeks for all fixes
**Critical Fixes Required**: 1 (immediate)
**High Priority Fixes**: 4 (week 1-2)
**Medium Priority Fixes**: 5 (week 2-3)
**Low Priority Fixes**: 3 (week 3-4)

---

## 🚨 CRITICAL PRIORITY (Fix Immediately)

### 1. Hardcoded Gmail Password in Source Code

**File**: `src/lib/email/send-invitation-gmail.ts:11`

**Current Code**:
```typescript
auth: {
  user: process.env.SMTP_USER || process.env.EMAIL_USER || 'pedro@blipee.com',
  pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || 'dptc xmxt vlwl hvgk'
}
```

**Severity**: 🔴 CRITICAL
**Risk**:
- Gmail app password exposed in version control
- Anyone with code access can send emails as your domain
- Could be used for phishing or spam campaigns
- Potential GDPR violation (unauthorized email sending)

**Impact**: HIGH - Security breach, brand reputation damage

**Fix Required**:

#### Step 1: Immediate Password Rotation
```bash
# 1. Revoke the exposed app password
# Go to: https://myaccount.google.com/apppasswords
# Delete: "blipee-smtp" or equivalent

# 2. Generate new app password
# Save it securely in password manager

# 3. Update environment variables
# Production (Vercel):
vercel env add SMTP_PASSWORD
# Enter the new password

# Staging:
vercel env add SMTP_PASSWORD --environment=preview

# Local:
# Add to .env.local (never commit)
SMTP_PASSWORD=your-new-app-password
```

#### Step 2: Update Code
```typescript
// src/lib/email/send-invitation-gmail.ts

// Add validation at the top of the file
if (!process.env.SMTP_PASSWORD) {
  throw new Error(
    'SMTP_PASSWORD environment variable is required but not set. ' +
    'Please configure email credentials in your environment.'
  );
}

const createGmailTransporter = () => {
  // Remove ALL defaults - fail fast if not configured
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;

  if (!smtpUser || !smtpPassword) {
    throw new Error(
      'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD.'
    );
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPassword
    }
  });
};
```

#### Step 3: Add Startup Validation
```typescript
// src/app/api/users/manage/route.ts

// Add at the top of the file
const EMAIL_CONFIGURED = Boolean(
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD
);

// In POST handler, before sending email:
if (formData.sendInvite && !EMAIL_CONFIGURED) {
  return NextResponse.json({
    error: 'Email system not configured. Contact system administrator.',
    user: newUser // Still create user, just don't send email
  }, { status: 201 });
}
```

#### Step 4: Add .env.example
```bash
# .env.example
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@blipee.com
SMTP_PASSWORD=your-app-password-here
```

#### Step 5: Update .gitignore
```bash
# Ensure these are ignored
.env
.env.local
.env.*.local
```

**Testing**:
```bash
# 1. Test without env vars (should fail gracefully)
unset SMTP_PASSWORD
npm run dev
# Try to create user → should show configuration error

# 2. Test with env vars
export SMTP_PASSWORD="new-password"
npm run dev
# Create user → should send email

# 3. Check logs for any password leakage
grep -r "dptc xmxt" .
# Should return: no results
```

**Checklist**:
- [ ] Revoke old Gmail app password
- [ ] Generate new app password
- [ ] Update all environments (production, staging, local)
- [ ] Update code to remove hardcoded password
- [ ] Add validation and fail-fast behavior
- [ ] Test email sending with new credentials
- [ ] Verify password not in git history
- [ ] Update documentation
- [ ] Notify team members to update local .env

**Estimated Time**: 1-2 hours
**Assigned To**: Security Team + DevOps
**Deadline**: IMMEDIATE (Today)

---

## 🔴 HIGH PRIORITY (Week 1-2)

### 2. Session Timing Issues & Race Conditions

**Files**:
- `src/app/set-password/page.tsx:39-75`
- `src/app/auth/callback/page.tsx:75`

**Current Code**:
```typescript
// Multiple hardcoded delays
await new Promise(resolve => setTimeout(resolve, 1500));
// ... later ...
setTimeout(async () => { ... }, 2000);
// ... and ...
await new Promise(resolve => setTimeout(resolve, 500));
```

**Severity**: 🟠 HIGH
**Risk**:
- Unreliable session establishment
- Race conditions causing failed logins
- Poor UX (unnecessary waiting)
- May fail on slow networks

**Fix Required**:

#### Solution: Use Supabase Auth State Listener

```typescript
// src/app/set-password/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const supabase = createClient();

    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handleSession(session);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          handleSession(session);
        } else if (event === 'SIGNED_OUT') {
          router.push('/signin');
        }
      }
    );

    // Helper to handle session
    const handleSession = (session: Session) => {
      const user = session.user;
      setUserEmail(user.email || '');
      setUserName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        ''
      );

      // Check if password already set
      if (user.user_metadata?.password_set) {
        router.push('/sustainability');
      } else {
        setSessionReady(true);
      }
    };

    checkSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Show loading while waiting for session
  if (!sessionReady) {
    return <LoadingState />;
  }

  // Rest of component...
}
```

```typescript
// src/app/auth/callback/page.tsx

'use client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const isInvitation = session.user.user_metadata?.type === 'invite';
          const passwordSet = session.user.user_metadata?.password_set;

          if (isInvitation && !passwordSet) {
            router.push('/set-password');
          } else {
            router.push('/sustainability');
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          router.push('/signin');
        }
      }
    );

    // Handle callback (no delays needed)
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const code = searchParams.get('code');
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const error = hashParams.get('error') || searchParams.get('error');

      if (error) {
        setError(error);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) setError(error.message);
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) setError(error.message);
      }

      // Auth state listener will handle redirect
    };

    handleCallback();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (error) {
    return <ErrorState error={error} />;
  }

  return <LoadingState />;
}
```

**Testing**:
```bash
# Test scenarios:
1. Slow network (throttle to 3G in DevTools)
2. Fast network (no throttling)
3. Invitation flow
4. Password reset flow
5. OAuth flow
6. Expired tokens
```

**Estimated Time**: 4-6 hours
**Deadline**: End of Week 1

---

### 3. Inconsistent Permission Checking

**Files**: Multiple API routes

**Current Issue**: Some routes use manual permission checks instead of centralized `PermissionService`

**Example** (`src/app/api/users/resend-invitation/route.ts:26-38`):
```typescript
// Manual check - BAD
const { data: superAdminCheck } = await supabaseAdmin
  .from('super_admins')
  .select('id')
  .eq('user_id', user.id)
  .single();

const { data: currentUser } = await supabaseAdmin
  .from('app_users')
  .select('role')
  .eq('auth_user_id', user.id)
  .single();

const canResend = superAdminCheck ||
  (currentUser && (currentUser.role === 'owner' || currentUser.role === 'manager'));
```

**Fix**: Use centralized service
```typescript
// src/app/api/users/resend-invitation/route.ts

import { PermissionService } from '@/lib/auth/permission-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    // Get target user
    const { data: targetUser } = await supabaseAdmin
      .from('app_users')
      .select('organization_id, status, email, name, role')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use centralized permission check
    const canResend = await PermissionService.canManageUsers(
      user.id,
      targetUser.organization_id
    );

    if (!canResend) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate user status
    if (targetUser.status === 'active' && targetUser.last_login) {
      return NextResponse.json({
        error: 'User has already activated their account'
      }, { status: 400 });
    }

    // Rest of the handler...
  }
}
```

**Files to Update**:
1. `src/app/api/users/resend-invitation/route.ts`
2. `src/app/api/users/bulk-delete/route.ts`
3. Any other routes with manual permission checks

**Audit Command**:
```bash
# Find all manual super_admin checks
grep -r "super_admins" src/app/api/ --exclude-dir=node_modules

# Find all manual role checks
grep -r "role === 'owner'" src/app/api/ --exclude-dir=node_modules
```

**Estimated Time**: 6-8 hours
**Deadline**: End of Week 1

---

### 4. Missing Rate Limiting on Critical Endpoints

**Files**: All `/api/users/*` endpoints

**Current Issue**: No rate limiting on user creation, invitation, bulk delete

**Risk**:
- Spam invitation emails
- Denial of service
- Resource exhaustion

**Fix**: Add rate limiting middleware

```typescript
// src/lib/rate-limit/index.ts

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, {
  requests: number;
  resetTime: number;
}>();

export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1';

    const key = `ratelimit:${request.nextUrl.pathname}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      // Reset window
      rateLimitStore.set(key, {
        requests: 1,
        resetTime: now + config.windowMs
      });
      return handler(request);
    }

    if (record.requests >= config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
          }
        }
      );
    }

    // Increment requests
    record.requests++;

    return handler(request);
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
```

**Apply to endpoints**:
```typescript
// src/app/api/users/manage/route.ts

import { createRateLimiter } from '@/lib/rate-limit';

// 10 user creations per hour per IP
const rateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10
});

export async function POST(request: NextRequest) {
  return rateLimiter(request, async (req) => {
    // Existing handler code
  });
}
```

```typescript
// src/app/api/users/resend-invitation/route.ts

// 5 resends per 5 minutes per IP
const rateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 5
});

export async function POST(request: NextRequest) {
  return rateLimiter(request, async (req) => {
    // Existing handler code
  });
}
```

```typescript
// src/app/api/users/bulk-delete/route.ts

// 3 bulk deletes per 10 minutes per IP
const rateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 3
});

export async function POST(request: NextRequest) {
  return rateLimiter(request, async (req) => {
    // Existing handler code
  });
}
```

**Production Enhancement**:
For production, use Redis-based rate limiting:
```typescript
// src/lib/rate-limit/redis.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / windowMs)}`;

  const count = await redis.incr(windowKey);

  if (count === 1) {
    await redis.expire(windowKey, Math.ceil(windowMs / 1000));
  }

  const allowed = count <= maxRequests;
  const remaining = Math.max(0, maxRequests - count);
  const resetTime = Math.ceil(now / windowMs) * windowMs + windowMs;

  return { allowed, remaining, resetTime };
}
```

**Estimated Time**: 8 hours
**Deadline**: End of Week 2

---

### 5. SQL Trigger Conflict Bug

**File**: `supabase/migrations/20250117_fix_auth_user_creation.sql:42-45`

**Current Code**:
```sql
ON CONFLICT (auth_user_id) DO NOTHING
ON CONFLICT (email) DO UPDATE ...
```

**Issue**: PostgreSQL doesn't support multiple `ON CONFLICT` clauses

**Fix**:
```sql
-- supabase/migrations/20250XXX_fix_trigger_conflict.sql

-- Fix the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Try to insert new user
    INSERT INTO public.app_users (
        auth_user_id,
        email,
        name,
        created_at,
        updated_at,
        status
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        now(),
        now(),
        'pending'
    )
    ON CONFLICT (email) DO UPDATE
        SET auth_user_id = EXCLUDED.auth_user_id,
            updated_at = now(),
            status = CASE
                WHEN app_users.status = 'inactive' THEN 'pending'
                ELSE app_users.status
            END;

    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail auth user creation
        RAISE WARNING 'Error in handle_new_user for %: %', new.email, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

**Testing**:
```sql
-- Test Case 1: New user (no conflicts)
INSERT INTO auth.users (id, email)
VALUES (gen_random_uuid(), 'test1@example.com');
-- Should create app_users record

-- Test Case 2: Existing email, no auth_user_id
INSERT INTO app_users (email, name)
VALUES ('test2@example.com', 'Test User');
-- Then create auth user
INSERT INTO auth.users (id, email)
VALUES (gen_random_uuid(), 'test2@example.com');
-- Should link auth_user_id to existing app_users

-- Test Case 3: Error handling
-- Trigger should not fail even if app_users insertion fails
```

**Estimated Time**: 2 hours
**Deadline**: End of Week 2

---

## 🟡 MEDIUM PRIORITY (Week 2-3)

### 6. Email Validation Before User Creation

**File**: `src/app/api/users/manage/route.ts`

**Issue**: No check if email already exists in `auth.users` before attempting creation

**Fix**:
```typescript
// src/app/api/users/manage/route.ts

export async function POST(request: NextRequest) {
  try {
    // ... existing code ...

    // Check app_users (existing check - keep this)
    const { data: existingAppUser } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingAppUser?.auth_user_id) {
      return NextResponse.json({
        error: 'User with this email already exists'
      }, { status: 409 });
    }

    // NEW: Check auth.users as well
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers?.find(u => u.email === email);

    if (existingAuthUser) {
      // Auth user exists but no app_user record
      // Option 1: Link them
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('app_users')
        .insert([{
          name,
          email,
          role,
          organization_id,
          auth_user_id: existingAuthUser.id,
          status: 'active', // Already verified
          permissions: {
            access_level: access_level || 'organization',
            site_ids: access_level === 'site' ? (site_ids || []) : []
          }
        }])
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({
        user: newUser,
        message: 'User linked to existing account'
      });
    }

    // Continue with normal flow...
  }
}
```

**Estimated Time**: 2 hours
**Deadline**: Week 2

---

### 7. Password Strength Enhancement

**File**: `src/app/set-password/page.tsx`

**Current**: Basic validation (8 chars, upper, lower, number)

**Enhancement**: Add dictionary check and password strength meter

```typescript
// src/lib/auth/password-validation.ts

import zxcvbn from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function validatePassword(
  password: string,
  userInputs: string[] = []
): PasswordStrength {
  // Basic requirements
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least one number');
  }

  // Check against common passwords and user info
  const result = zxcvbn(password, userInputs);

  // Add zxcvbn feedback
  if (result.feedback.warning) {
    errors.push(result.feedback.warning);
  }
  result.feedback.suggestions.forEach(s => errors.push(s));

  return {
    score: result.score,
    feedback: errors,
    isStrong: result.score >= 3 && errors.length === 0
  };
}
```

```typescript
// src/app/set-password/page.tsx

import { validatePassword } from '@/lib/auth/password-validation';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    // Calculate strength
    const result = validatePassword(value, [
      userEmail,
      userName,
      userEmail.split('@')[0]
    ]);
    setStrength(result);
  };

  // Visual strength meter
  const renderStrengthMeter = () => {
    if (!strength || !password) return null;

    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

    return (
      <div className="mt-2">
        <div className="flex gap-1 mb-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${
                i <= strength.score ? colors[strength.score] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600">
          Strength: <span className="font-medium">{labels[strength.score]}</span>
        </p>
        {strength.feedback.length > 0 && (
          <ul className="text-xs text-red-600 mt-1 space-y-1">
            {strength.feedback.map((msg, i) => (
              <li key={i}>• {msg}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    // ... existing code ...
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => handlePasswordChange(e.target.value)}
      // ...
    />
    {renderStrengthMeter()}
    // ...
  );
}
```

**Install dependency**:
```bash
npm install zxcvbn
npm install --save-dev @types/zxcvbn
```

**Estimated Time**: 4 hours
**Deadline**: Week 2

---

### 8. Failed Authentication Logging

**Issue**: No logging of failed permission checks or auth attempts

**Fix**: Create audit logging middleware

```typescript
// src/lib/auth/audit-logger.ts

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface SecurityEvent {
  eventType: 'auth_failure' | 'permission_denied' | 'rate_limit' | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await supabaseAdmin.from('security_audit_logs').insert({
      event_type: event.eventType,
      user_id: event.userId,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      resource: event.resource,
      action: event.action,
      reason: event.reason,
      metadata: event.metadata,
      created_at: new Date().toISOString()
    });

    // Also log critical events to external service
    if (event.eventType === 'suspicious_activity') {
      // Send to Sentry, DataDog, etc.
      console.error('[SECURITY] Suspicious activity detected:', event);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
```

**Migration**:
```sql
-- supabase/migrations/20250XXX_security_audit_logs.sql

CREATE TABLE security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  resource TEXT,
  action TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_logs_event ON security_audit_logs(event_type);
CREATE INDEX idx_security_logs_user ON security_audit_logs(user_id);
CREATE INDEX idx_security_logs_ip ON security_audit_logs(ip_address);
CREATE INDEX idx_security_logs_created ON security_audit_logs(created_at DESC);

-- RLS: Only super admins can read
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_logs_read" ON security_audit_logs
FOR SELECT USING (
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);
```

**Usage in API routes**:
```typescript
// src/lib/auth/permission-service.ts

import { logSecurityEvent } from './audit-logger';

export class PermissionService {
  static async checkPermission(
    userId: string,
    resource: string,
    action: string,
    resourceId?: string
  ): Promise<boolean> {
    // ... existing check logic ...

    const allowed = /* permission check result */;

    // Log if denied
    if (!allowed) {
      await logSecurityEvent({
        eventType: 'permission_denied',
        userId,
        ipAddress: /* get from request */,
        resource,
        action,
        reason: 'Insufficient permissions'
      });
    }

    return allowed;
  }
}
```

**Estimated Time**: 6 hours
**Deadline**: Week 3

---

### 9. Improve Error Messages

**Issue**: Some errors reveal too much internal detail

**Current**:
```typescript
return NextResponse.json({
  error: 'User already exists in auth.users table'
}, { status: 409 });
```

**Better**:
```typescript
// Log detailed error server-side
console.error('[User Creation] Conflict:', {
  email,
  source: 'auth.users',
  existingUserId: existingAuthUser.id
});

// Return generic message to client
return NextResponse.json({
  error: 'An account with this email address already exists. Please use a different email or contact support.'
}, { status: 409 });
```

**Create error helper**:
```typescript
// src/lib/api/errors.ts

export function createApiError(
  clientMessage: string,
  serverDetails: Record<string, any>,
  statusCode: number = 500
) {
  // Log full details server-side
  console.error('[API Error]', {
    message: clientMessage,
    details: serverDetails,
    timestamp: new Date().toISOString()
  });

  // Return sanitized message to client
  return NextResponse.json(
    { error: clientMessage },
    { status: statusCode }
  );
}

// Usage:
return createApiError(
  'Unable to create user. Please try again.',
  { email, error: createError.message, code: createError.code },
  409
);
```

**Estimated Time**: 3 hours
**Deadline**: Week 3

---

### 10. Transaction Support for Critical Operations

**Issue**: Bulk delete and user creation don't use transactions

**Fix**: Wrap in database transactions

```typescript
// src/app/api/users/bulk-delete/route.ts

export async function POST(request: NextRequest) {
  try {
    // ... permission checks ...

    const { userIds } = await request.json();
    const results = { successCount: 0, failedCount: 0, errors: [] };

    // Use transaction for atomic operation
    for (const userId of userIds) {
      try {
        await supabaseAdmin.rpc('delete_user_with_cleanup', {
          p_user_id: userId
        });
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({
          userId,
          error: error.message
        });
      }
    }

    return NextResponse.json(results);
  }
}
```

**Database function**:
```sql
-- supabase/migrations/20250XXX_user_delete_function.sql

CREATE OR REPLACE FUNCTION delete_user_with_cleanup(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  -- Get auth_user_id
  SELECT auth_user_id INTO v_auth_user_id
  FROM app_users
  WHERE id = p_user_id;

  -- Delete in correct order (transaction ensures atomicity)
  DELETE FROM user_access WHERE user_id = v_auth_user_id OR user_id = p_user_id;
  DELETE FROM app_users WHERE id = p_user_id;

  -- Delete from auth (requires service role)
  -- Handled by API call to supabaseAdmin.auth.admin.deleteUser()
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Estimated Time**: 4 hours
**Deadline**: Week 3

---

## 🟢 LOW PRIORITY (Week 3-4)

### 11. Session Management Dashboard

**Goal**: Allow users to view and manage active sessions

**Features**:
- List all active sessions
- Show device, location, last active
- Force logout from specific session
- "Logout all other sessions" button

**Implementation**: See separate feature spec document

**Estimated Time**: 12 hours
**Deadline**: Week 4

---

### 12. Multi-Factor Authentication (MFA)

**Goal**: Add TOTP-based MFA support

**Supabase already supports MFA**, just need UI:

```typescript
// Enable MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
});

// Display QR code for user to scan
const qrCode = data.totp.qr_code;
```

**Estimated Time**: 16 hours
**Deadline**: Week 4

---

### 13. IP Whitelisting for Super Admins

**Goal**: Restrict super admin access to specific IPs

**Implementation**: See separate feature spec

**Estimated Time**: 8 hours
**Deadline**: Week 4

---

## Testing Plan

### Unit Tests
```bash
# Create test suite
mkdir -p src/__tests__/auth

# Test files:
- permission-service.test.ts
- password-validation.test.ts
- rate-limit.test.ts
- email-service.test.ts
```

### Integration Tests
```bash
# Test user flows
- User creation → invitation → password set → login
- Password reset flow
- Permission checks at each step
- Rate limiting
- Error handling
```

### Security Tests
```bash
# Penetration testing
- SQL injection attempts
- XSS attempts
- CSRF token validation
- Rate limit bypass attempts
- Permission escalation attempts
```

---

## Deployment Plan

### Phase 1: Critical Fix (Day 1)
1. Rotate Gmail password
2. Update code to remove hardcoded password
3. Deploy to production
4. Verify email sending works

### Phase 2: High Priority (Week 1-2)
1. Implement session listeners
2. Centralize permission checks
3. Add rate limiting
4. Fix SQL trigger bug
5. Deploy to staging → test → production

### Phase 3: Medium Priority (Week 2-3)
1. Add email validation
2. Implement password strength meter
3. Add security audit logging
4. Improve error messages
5. Add transaction support
6. Deploy to staging → test → production

### Phase 4: Low Priority (Week 3-4)
1. Session management dashboard
2. MFA support
3. IP whitelisting
4. Final testing and documentation

---

## Monitoring & Alerts

### Metrics to Track
- Failed authentication attempts per hour
- Permission denied events per hour
- Rate limit hits per endpoint
- Email send failures
- Session establishment failures

### Alerts to Configure
- Critical: >100 failed auth attempts in 1 hour
- Critical: SMTP credentials fail
- High: >50 permission denials in 1 hour
- Medium: >1000 rate limit hits in 1 hour

---

## Success Criteria

- [ ] No hardcoded credentials in codebase
- [ ] All critical endpoints have rate limiting
- [ ] Session establishment success rate >99%
- [ ] Permission checks use centralized service
- [ ] Security events are logged and monitored
- [ ] Error messages don't leak sensitive info
- [ ] All tests pass
- [ ] Documentation is up to date

---

## Rollback Plan

For each deployment:
1. Tag current production version
2. Test in staging first
3. Deploy to production during low-traffic hours
4. Monitor for 30 minutes
5. If issues detected, revert to previous tag

```bash
# Rollback command
git checkout <previous-tag>
vercel --prod
```

---

## Team Communication

- Daily standup: Progress updates
- Slack channel: #auth-security-fixes
- Weekly review: Demo completed fixes
- Post-deployment: Incident report if issues arise

---

For implementation details of each fix, see individual task cards in the project board.
