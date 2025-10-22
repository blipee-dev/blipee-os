# Session-Based Authentication Implementation

## Overview

We've migrated from JWT-based authentication (using Supabase cookies) to **session-based authentication** using session ID cookies. This solves the chunked cookie problem where large JWT tokens were being split into multiple cookies that the browser's fetch() API couldn't properly send.

## The Problem We Solved

### Previous Issue: Chunked Cookies
- Supabase JWTs can be 2000+ bytes
- Browser splits them into `.0` and `.1` chunks
- Navigation requests (GET /page) sent both chunks ✅
- But fetch() API only sent `.1` chunk ❌
- Result: Client-side auth checks failed with 401 errors

### Solution: Session ID Cookies
- Store session ID in database (sessions table)
- Cookie contains only a small token (~44 bytes)
- No chunking needed!
- Works perfectly with fetch() API ✅

## Architecture

### Database Schema

**Table: `sessions`**
```sql
id              UUID PRIMARY KEY
user_id         UUID (references auth.users)
session_token   TEXT UNIQUE (cryptographically secure random token)
expires_at      TIMESTAMP
created_at      TIMESTAMP
last_active_at  TIMESTAMP
user_agent      TEXT
ip_address      TEXT
```

### Authentication Flow

#### 1. **Sign In** (`POST /api/auth/signin`)
1. Validate credentials with Supabase Auth
2. Create session record in database
3. Generate cryptographically secure session token
4. Set `blipee-session` cookie with token
5. Return user data to client

#### 2. **Session Validation** (Middleware)
1. Read `blipee-session` cookie
2. Query sessions table for valid session
3. If valid, load user data from Supabase
4. If invalid/expired, return null (401)

#### 3. **Client State** (`GET /api/auth/user`)
1. Client calls endpoint to get user data
2. Server validates session cookie
3. Returns user data + session info
4. Client updates auth context

#### 4. **Sign Out** (`POST /api/auth/signout`)
1. Delete session from database
2. Clear `blipee-session` cookie
3. Client clears state and redirects

## Key Files Modified

### Created
- `/src/lib/auth/sessions.ts` - Session management utilities
- `/src/app/api/auth/user/route.ts` - Get current user endpoint
- `/supabase/migrations/20251022_create_sessions_table.sql` - Database schema

### Modified
- `/src/app/api/auth/signin/route.ts` - Now creates sessions instead of JWT cookies
- `/src/app/api/auth/signout/route.ts` - Now deletes sessions
- `/src/lib/supabase/middleware.ts` - Validates sessions instead of JWTs
- `/src/lib/auth/context.tsx` - Calls `/api/auth/user` instead of `/api/auth/session`

## Benefits

### 1. **No More Chunked Cookies**
- Session token is ~44 bytes (vs 2000+ for JWT)
- Never gets chunked by browser
- Works with fetch() API ✅

### 2. **Better Security**
- `httpOnly: true` - JavaScript can't access cookie
- Easy session invalidation (just delete from DB)
- Track active sessions per user
- "Logout from all devices" capability

### 3. **Better Control**
- See all active sessions
- Track last activity time
- Store IP address and user agent
- Expire sessions programmatically

### 4. **Better Performance**
- No JWT parsing on every request
- Simple database lookup
- Can cache session data

## Cookie Comparison

### Before (JWT-based)
```
Cookie Name: sb-quovvwrwyfkzhgqdeham-auth-token.0
Value: base64-eyJhY2Nlc... (2000 bytes)
httpOnly: false
Chunked: YES ❌

Cookie Name: sb-quovvwrwyfkzhgqdeham-auth-token.1
Value: joiam9zZS5waW... (714 bytes)
httpOnly: false
```

### After (Session-based)
```
Cookie Name: blipee-session
Value: R4nd0mT0k3nH3r3... (44 bytes)
httpOnly: true ✅
Chunked: NO ✅
```

## Session Management

### Creating Sessions
```typescript
import { createSession } from '@/lib/auth/sessions';

const session = await createSession(userId, {
  userAgent: request.headers.get('user-agent'),
  ipAddress: request.headers.get('x-forwarded-for'),
  expiresInDays: 30
});
```

### Validating Sessions
```typescript
import { validateSession } from '@/lib/auth/sessions';

const session = await validateSession(sessionToken);
if (session) {
  // Session valid, get user
}
```

### Deleting Sessions
```typescript
import { deleteSession, deleteAllUserSessions } from '@/lib/auth/sessions';

// Logout from current device
await deleteSession(sessionToken);

// Logout from all devices
await deleteAllUserSessions(userId);
```

## Migration Notes

### What Changed
- ✅ Session cookie replaces JWT cookies
- ✅ Server-side session validation in middleware
- ✅ Client gets user data from `/api/auth/user`
- ✅ Sessions stored in database

### What Stayed The Same
- ✅ Supabase Auth still validates credentials
- ✅ User data still comes from Supabase
- ✅ Middleware still protects routes
- ✅ Auth context API unchanged for consumers

### TODO
- [ ] Migrate signup route to session-based auth
- [ ] Re-implement MFA with sessions
- [ ] Add "active sessions" management UI
- [ ] Add session cleanup cron job
- [ ] Load organizations in `/api/auth/user`

## Testing

### Test Sign In
1. Clear all cookies
2. Go to `/signin`
3. Enter credentials
4. Should redirect to `/sustainability`
5. Check DevTools → Application → Cookies
6. Should see `blipee-session` cookie (small, httpOnly)

### Test Protected Routes
1. After sign in, navigate to `/sustainability`
2. Should work without redirect
3. Check Network tab - no 401 errors
4. User data should be visible in UI

### Test Sign Out
1. Click sign out button
2. Should redirect to `/signin`
3. `blipee-session` cookie should be gone
4. Trying to access `/sustainability` should redirect to `/signin`

## Troubleshooting

### Issue: 401 on protected routes
- Check if `blipee-session` cookie is set
- Check if session exists in database
- Check if session is expired

### Issue: Session not persisting
- Ensure `credentials: 'include'` in fetch calls
- Check cookie attributes (httpOnly, sameSite, path)
- Verify cookie domain matches

### Issue: User data not loading
- Check `/api/auth/user` response
- Verify session token is valid
- Check Supabase user exists

## Production Considerations

1. **Session Cleanup**: Run periodic cleanup of expired sessions
2. **Session Rotation**: Regenerate tokens periodically for security
3. **Rate Limiting**: Protect session endpoints
4. **Monitoring**: Track session creation/validation metrics
5. **Redis**: Consider using Redis for session storage at scale

## References

- Session management utilities: `/src/lib/auth/sessions.ts`
- Middleware validation: `/src/lib/supabase/middleware.ts`
- Auth context: `/src/lib/auth/context.tsx`
- Database migration: `/supabase/migrations/20251022_create_sessions_table.sql`
