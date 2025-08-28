# blipee OS Enterprise Transformation Plan

**Version:** 1.0  
**Start Date:** [TO BE FILLED]  
**Target Completion:** 16 weeks from start  
**Transformation Lead:** [TO BE ASSIGNED]

## Executive Summary

This document outlines a 16-week transformation plan to bring blipee OS to enterprise-grade standards. The plan follows a strict sequential execution model where each task must be completed and tested before the next begins.

### Key Principles

1. **Sequential Execution**: Tasks are end-to-start dependencies
2. **Gate Reviews**: Each task requires completion sign-off before proceeding
3. **Rollback Ready**: Every change must have a documented rollback procedure
4. **Test-Driven**: No task is complete without passing tests
5. **Daily Stand-ups**: Track progress and identify blockers immediately

## Tracking Methodology

### Task States
- **NOT_STARTED**: Waiting for predecessor completion
- **IN_PROGRESS**: Currently being worked on
- **IN_REVIEW**: Code complete, under review
- **IN_TESTING**: Passed review, being tested
- **COMPLETED**: Tested and deployed
- **BLOCKED**: Cannot proceed due to obstacle
- **ROLLED_BACK**: Reverted due to issues

### Daily Tracking Requirements
1. Update task status in project board
2. Log actual hours vs estimated
3. Document any blockers immediately
4. Update risk register if delays anticipated
5. Commit code with task ID reference

### Escalation Path
1. **Developer Blocked** → Team Lead (within 2 hours)
2. **Team Lead Blocked** → CTO (within 4 hours)
3. **Budget/Scope Change** → CTO + CEO (within 24 hours)

---

## PHASE 1: Critical Security Remediation (Weeks 1-4)

**Goal**: Eliminate all critical security vulnerabilities  
**Success Criteria**: Pass security audit with zero critical/high vulnerabilities

### Task 1.1: Implement CSRF Protection
**Duration**: 5 days  
**Owner**: Senior Backend Developer  
**Prerequisites**: None

#### Implementation Steps:

1. **Day 1: Setup CSRF Infrastructure**
```typescript
// File: /src/lib/security/csrf.ts
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly COOKIE_NAME = '__Host-csrf-token';
  private static readonly HEADER_NAME = 'X-CSRF-Token';

  static generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  static setTokenCookie(response: NextResponse, token: string): void {
    response.cookies.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 86400 // 24 hours
    });
  }

  static validateRequest(request: NextRequest): boolean {
    const headerToken = request.headers.get(this.HEADER_NAME);
    const cookieToken = request.cookies.get(this.COOKIE_NAME)?.value;
    
    if (!headerToken || !cookieToken) return false;
    
    // Constant-time comparison to prevent timing attacks
    return this.safeCompare(headerToken, cookieToken);
  }

  private static safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
```

2. **Day 2: Create CSRF Middleware**
```typescript
// File: /src/middleware/csrf.ts
import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf';

const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_EXCLUDED_PATHS = ['/api/webhooks/', '/api/health'];

export async function withCSRFProtection(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF for safe methods
  if (CSRF_SAFE_METHODS.includes(request.method)) {
    return handler();
  }

  // Skip CSRF for excluded paths (webhooks, health checks)
  const path = request.nextUrl.pathname;
  if (CSRF_EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))) {
    return handler();
  }

  // Validate CSRF token
  if (!CSRFProtection.validateRequest(request)) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    );
  }

  // Proceed with request
  const response = await handler();
  
  // Rotate token on successful state-changing request
  const newToken = CSRFProtection.generateToken();
  CSRFProtection.setTokenCookie(response, newToken);
  
  return response;
}
```

3. **Day 3: Update All API Routes**
```typescript
// Example: /src/app/api/organizations/[id]/route.ts
import { withCSRFProtection } from '@/middleware/csrf';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withCSRFProtection(request, async () => {
    // Existing route logic
  });
}

// Apply to all POST, PUT, PATCH, DELETE endpoints
```

4. **Day 4: Update Frontend to Include CSRF Token**
```typescript
// File: /src/lib/api/client.ts
class APIClient {
  private csrfToken: string | null = null;

  async fetchCSRFToken(): Promise<void> {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    this.csrfToken = data.token;
  }

  async request(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.csrfToken) {
      await this.fetchCSRFToken();
    }

    const headers = {
      ...options.headers,
      'X-CSRF-Token': this.csrfToken || '',
    };

    const response = await fetch(url, { ...options, headers });
    
    // If CSRF token invalid, refresh and retry once
    if (response.status === 403) {
      const error = await response.json();
      if (error.error?.includes('CSRF')) {
        await this.fetchCSRFToken();
        headers['X-CSRF-Token'] = this.csrfToken || '';
        return fetch(url, { ...options, headers });
      }
    }
    
    return response;
  }
}
```

5. **Day 5: Testing & Validation**
```typescript
// File: /src/tests/security/csrf.test.ts
describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const response = await request(app)
      .post('/api/organizations')
      .send({ name: 'Test Org' });
    
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('CSRF');
  });

  it('should accept requests with valid CSRF token', async () => {
    // Get CSRF token
    const tokenResponse = await request(app).get('/api/csrf-token');
    const { token } = tokenResponse.body;
    
    const response = await request(app)
      .post('/api/organizations')
      .set('X-CSRF-Token', token)
      .set('Cookie', `__Host-csrf-token=${token}`)
      .send({ name: 'Test Org' });
    
    expect(response.status).toBe(200);
  });
});
```

#### Testing Checklist
- [ ] All POST/PUT/PATCH/DELETE endpoints protected
- [ ] Frontend successfully sends CSRF token
- [ elegant graceful token rotation
- [ ] Webhook endpoints properly excluded
- [ ] Performance impact < 5ms per request

#### Rollback Procedure
1. Remove CSRF middleware from all routes
2. Remove CSRF token generation endpoint
3. Revert frontend API client changes
4. Deploy previous version

---

### Task 1.2: Fix XSS Vulnerability in Report Component
**Duration**: 2 days  
**Owner**: Frontend Security Specialist  
**Prerequisites**: Task 1.1 completed  
**Blocker Risk**: Low

#### Implementation Steps:

1. **Day 1: Install and Configure DOMPurify**
```bash
npm install dompurify @types/dompurify
```

```typescript
// File: /src/lib/security/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';

export class ContentSanitizer {
  private static readonly ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 
    'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
    'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ];

  private static readonly ALLOWED_ATTRIBUTES = {
    'a': ['href', 'target', 'rel'],
    'span': ['class'],
    'div': ['class'],
    '*': ['style'] // Allow style on all elements but sanitize it
  };

  static sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: this.ALLOWED_TAGS,
      ALLOWED_ATTR: Object.keys(this.ALLOWED_ATTRIBUTES),
      ALLOW_DATA_ATTR: false,
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      ADD_ATTR: ['target'], // Allow target attribute
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
    });
  }

  static sanitizeAndEnhance(content: string): string {
    // First sanitize
    let safe = this.sanitizeHTML(content);
    
    // Then apply safe transformations
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-400">$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safe = safe.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return safe;
  }
}
```

2. **Day 1 (continued): Update Report Component**
```typescript
// File: /src/components/dynamic/EnhancedReportComponent.tsx
import { ContentSanitizer } from '@/lib/security/sanitizer';

// Line 260 - Replace dangerous innerHTML
// BEFORE:
// dangerouslySetInnerHTML={{
//   __html: section.content
//     .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-400">$1</strong>')
// }}

// AFTER:
<div 
  className="text-gray-300"
  dangerouslySetInnerHTML={{
    __html: ContentSanitizer.sanitizeAndEnhance(section.content)
  }}
/>
```

3. **Day 2: Comprehensive Testing**
```typescript
// File: /src/tests/security/xss.test.ts
import { ContentSanitizer } from '@/lib/security/sanitizer';

describe('XSS Protection', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<a href="javascript:alert(\'XSS\')">Click</a>',
    '<div onmouseover="alert(\'XSS\')">Hover</div>',
    '<<SCRIPT>alert("XSS");//<</SCRIPT>',
    '<svg onload=alert("XSS")></svg>'
  ];

  test.each(xssPayloads)('should sanitize XSS payload: %s', (payload) => {
    const sanitized = ContentSanitizer.sanitizeHTML(payload);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('javascript:');
  });

  it('should preserve safe formatting', () => {
    const content = '**Bold text** and *italic* with `code`';
    const result = ContentSanitizer.sanitizeAndEnhance(content);
    
    expect(result).toContain('<strong class="text-purple-400">Bold text</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<code>code</code>');
  });
});
```

#### Testing Checklist
- [ ] All XSS payloads blocked
- [ ] Safe HTML formatting preserved
- [ ] No regression in report display
- [ ] Performance impact negligible
- [ ] CSP headers validate no inline scripts

#### Rollback Procedure
1. Revert EnhancedReportComponent.tsx changes
2. Remove DOMPurify dependency
3. Deploy previous version

---

### Task 1.3: Implement Security Headers Middleware
**Duration**: 3 days  
**Owner**: Backend Security Developer  
**Prerequisites**: Task 1.2 completed  
**Blocker Risk**: Medium (CDN compatibility)

#### Implementation Steps:

1. **Day 1: Create Security Headers Middleware**
```typescript
// File: /src/middleware/security-headers.ts
import { NextRequest, NextResponse } from 'next/server';

export function withSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://api.deepseek.com https://api.anthropic.com wss://*.supabase.co",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Apply security headers
  response.headers.set('Content-Security-Policy', cspDirectives);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}
```

2. **Day 2: Update Main Middleware**
```typescript
// File: /src/middleware.ts
import { withSecurityHeaders } from './middleware/security-headers';

export async function middleware(request: NextRequest) {
  // Existing middleware logic...
  
  const response = NextResponse.next();
  
  // Apply security headers to all responses
  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

3. **Day 3: Testing and CSP Refinement**
```typescript
// File: /src/tests/security/headers.test.ts
describe('Security Headers', () => {
  it('should set all required security headers', async () => {
    const response = await request(app).get('/');
    
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should not break existing functionality', async () => {
    // Test key features still work with CSP
    const response = await request(app).get('/dashboard');
    expect(response.status).toBe(200);
  });
});
```

#### Testing Checklist
- [ ] All security headers present
- [ ] CSP not blocking legitimate resources
- [ ] No console errors in browser
- [ ] External API calls still work
- [ ] WebSocket connections functional

#### Rollback Procedure
1. Remove security headers middleware
2. Update middleware.ts to remove header application
3. Deploy previous version

---

### Task 1.4: Enhance Session Security
**Duration**: 5 days  
**Owner**: Senior Security Engineer  
**Prerequisites**: Task 1.3 completed  
**Blocker Risk**: High (Breaking auth)

#### Implementation Steps:

1. **Day 1-2: Implement Session Fingerprinting**
```typescript
// File: /src/lib/auth/session-security.ts
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

export class SessionSecurity {
  // Generate fingerprint from request characteristics
  static generateFingerprint(request: NextRequest): string {
    const components = [
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || '',
      request.headers.get('accept-encoding') || '',
      // Don't use IP as it may change legitimately
    ];
    
    const fingerprint = components.join('|');
    return createHash('sha256').update(fingerprint).digest('hex');
  }

  // Store fingerprint with session
  static async storeSessionFingerprint(
    sessionId: string, 
    fingerprint: string
  ): Promise<void> {
    await redis.setex(
      `session:fingerprint:${sessionId}`,
      86400, // 24 hours
      fingerprint
    );
  }

  // Validate session fingerprint
  static async validateSession(
    sessionId: string,
    request: NextRequest
  ): Promise<boolean> {
    const storedFingerprint = await redis.get(`session:fingerprint:${sessionId}`);
    if (!storedFingerprint) return false;
    
    const currentFingerprint = this.generateFingerprint(request);
    return storedFingerprint === currentFingerprint;
  }
}
```

2. **Day 3: Implement Session Rotation**
```typescript
// File: /src/lib/auth/session-rotation.ts
export class SessionRotation {
  static async rotateSession(
    oldSessionId: string,
    userId: string
  ): Promise<string> {
    // Generate new session ID
    const newSessionId = crypto.randomUUID();
    
    // Copy session data to new session
    const sessionData = await redis.get(`session:${oldSessionId}`);
    if (sessionData) {
      await redis.setex(
        `session:${newSessionId}`,
        86400, // 24 hours
        sessionData
      );
    }
    
    // Mark old session for deletion (grace period)
    await redis.setex(
      `session:rotating:${oldSessionId}`,
      300, // 5 minute grace period
      newSessionId
    );
    
    // Delete old session after grace period
    setTimeout(async () => {
      await redis.del(`session:${oldSessionId}`);
    }, 300000);
    
    return newSessionId;
  }

  static async shouldRotate(
    sessionId: string,
    event: string
  ): Promise<boolean> {
    const rotationEvents = [
      'privilege_change',
      'password_change',
      'mfa_enabled',
      'suspicious_activity'
    ];
    
    return rotationEvents.includes(event);
  }
}
```

3. **Day 4: Update Authentication Middleware**
```typescript
// File: /src/middleware/auth-enhanced.ts
import { SessionSecurity } from '@/lib/auth/session-security';
import { SessionRotation } from '@/lib/auth/session-rotation';

export async function withEnhancedAuth(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const sessionId = request.cookies.get('session')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate session fingerprint
  const isValidFingerprint = await SessionSecurity.validateSession(
    sessionId,
    request
  );
  
  if (!isValidFingerprint) {
    // Potential session hijacking
    await logSecurityEvent({
      type: 'session_hijack_attempt',
      sessionId,
      ip: request.ip,
      userAgent: request.headers.get('user-agent')
    });
    
    return NextResponse.json(
      { error: 'Session security violation' },
      { status: 401 }
    );
  }

  // Proceed with request
  const response = await handler();
  
  // Check if session rotation needed
  const rotationEvent = response.headers.get('X-Session-Event');
  if (rotationEvent && await SessionRotation.shouldRotate(sessionId, rotationEvent)) {
    const newSessionId = await SessionRotation.rotateSession(sessionId, userId);
    response.cookies.set('session', newSessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400
    });
  }
  
  return response;
}
```

4. **Day 5: Testing & Validation**
```typescript
// File: /src/tests/security/session.test.ts
describe('Enhanced Session Security', () => {
  it('should detect session hijacking attempts', async () => {
    // Create legitimate session
    const { sessionCookie } = await createTestSession();
    
    // Attempt to use session with different fingerprint
    const response = await request(app)
      .get('/api/user')
      .set('Cookie', sessionCookie)
      .set('User-Agent', 'Different-Browser');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('security violation');
  });

  it('should rotate session on privilege change', async () => {
    const { sessionCookie, userId } = await createTestSession();
    
    // Change user role
    const response = await request(app)
      .post('/api/user/role')
      .set('Cookie', sessionCookie)
      .send({ role: 'admin' });
    
    // Check for new session cookie
    const newSessionCookie = response.headers['set-cookie'];
    expect(newSessionCookie).toBeDefined();
    expect(newSessionCookie).not.toEqual(sessionCookie);
  });
});
```

#### Testing Checklist
- [ ] Session fingerprinting working
- [ ] Session hijacking detected
- [ ] Session rotation on security events
- [ ] Grace period allows transition
- [ ] No impact on user experience

#### Rollback Procedure
1. Disable session fingerprinting
2. Disable session rotation
3. Revert to basic session validation
4. Clear Redis session data

---

## PHASE 1 COMPLETION GATE

### Exit Criteria
- [ ] All CSRF endpoints protected
- [ ] XSS vulnerability eliminated  
- [ ] Security headers implemented
- [ ] Session security enhanced
- [ ] Security scan shows zero high/critical issues
- [ ] Performance impact < 10ms per request
- [ ] All tests passing
- [ ] Rollback procedures tested

### Gate Review Meeting
- **Participants**: CTO, Security Lead, QA Lead
- **Duration**: 2 hours
- **Deliverables**: Security audit report, test results, performance metrics

---

## PHASE 2: Database Performance Optimization (Weeks 5-7)

**Goal**: Optimize database for enterprise scale  
**Success Criteria**: Handle 10,000 concurrent users with <100ms query time

### Task 2.1: Add Missing Database Indexes
**Duration**: 3 days  
**Owner**: Database Administrator  
**Prerequisites**: Phase 1 completed  
**Blocker Risk**: Low

#### Implementation Steps:

1. **Day 1: Create Index Migration**
```sql
-- File: /supabase/migrations/20240201_add_performance_indexes.sql

-- Foreign key indexes
CREATE INDEX CONCURRENTLY idx_metrics_device 
  ON metrics(device_id);

CREATE INDEX CONCURRENTLY idx_conversations_user_building 
  ON conversations(user_id, building_id);

CREATE INDEX CONCURRENTLY idx_user_orgs_covering 
  ON user_organizations(user_id, organization_id, role)
  INCLUDE (created_at);

-- JSONB GIN indexes for fast queries
CREATE INDEX CONCURRENTLY idx_buildings_metadata_gin 
  ON buildings USING GIN (metadata);

CREATE INDEX CONCURRENTLY idx_devices_state_gin 
  ON devices USING GIN (state);

CREATE INDEX CONCURRENTLY idx_devices_capabilities_gin 
  ON devices USING GIN (capabilities);

-- Specific JSON field indexes for common queries
CREATE INDEX CONCURRENTLY idx_buildings_metadata_type 
  ON buildings ((metadata->>'type'));

CREATE INDEX CONCURRENTLY idx_devices_state_mode 
  ON devices ((state->>'mode'));

-- Time-based query optimization
CREATE INDEX CONCURRENTLY idx_metrics_time_device 
  ON metrics(time DESC, device_id);

CREATE INDEX CONCURRENTLY idx_conversations_updated 
  ON conversations(updated_at DESC);

-- Analyze tables after index creation
ANALYZE metrics;
ANALYZE conversations;
ANALYZE buildings;
ANALYZE devices;
```

2. **Day 2: Test Index Performance**
```sql
-- File: /scripts/test-index-performance.sql

-- Before indexes (save these results)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM metrics 
WHERE device_id = 'test-uuid' 
AND time > NOW() - INTERVAL '7 days';

EXPLAIN (ANALYZE, BUFFERS)
SELECT b.*, COUNT(d.id) as device_count
FROM buildings b
LEFT JOIN devices d ON d.building_id = b.id
WHERE b.metadata->>'type' = 'office'
GROUP BY b.id;

-- After indexes (compare results)
-- Should see "Index Scan" instead of "Seq Scan"
-- Execution time should be <10ms for most queries
```

3. **Day 3: Monitor and Optimize**
```typescript
// File: /src/lib/monitoring/db-performance.ts
export class DatabasePerformanceMonitor {
  static async checkIndexUsage(): Promise<IndexUsageReport> {
    const { data } = await supabase.rpc('get_index_usage_stats');
    
    const unusedIndexes = data.filter(idx => idx.idx_scan === 0);
    const inefficientIndexes = data.filter(idx => 
      idx.idx_scan > 0 && idx.idx_tup_fetch / idx.idx_scan > 1000
    );
    
    return {
      total: data.length,
      unused: unusedIndexes,
      inefficient: inefficientIndexes,
      recommendations: this.generateRecommendations(data)
    };
  }

  static async monitorSlowQueries(): Promise<void> {
    // Enable pg_stat_statements
    await supabase.rpc('enable_query_monitoring');
    
    // Log queries taking > 100ms
    const slowQueries = await supabase.rpc('get_slow_queries', {
      threshold_ms: 100
    });
    
    for (const query of slowQueries) {
      await this.logSlowQuery(query);
    }
  }
}
```

#### Testing Checklist
- [ ] All indexes created successfully
- [ ] No blocking during index creation
- [ ] Query performance improved >80%
- [ ] No negative impact on writes
- [ ] Index usage statistics positive

#### Rollback Procedure
```sql
-- Drop indexes in reverse order
DROP INDEX CONCURRENTLY idx_conversations_updated;
DROP INDEX CONCURRENTLY idx_metrics_time_device;
-- ... (continue for all indexes)
```

---

### Task 2.2: Implement Connection Pooling
**Duration**: 4 days  
**Owner**: Senior Backend Engineer  
**Prerequisites**: Task 2.1 completed  
**Blocker Risk**: Medium

#### Implementation Steps:

1. **Day 1: Install and Configure PgBouncer**
```yaml
# File: /infrastructure/pgbouncer/pgbouncer.ini
[databases]
blipee_os = host=db.supabase.co port=5432 dbname=postgres

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 100
max_user_connections = 100
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

2. **Day 2: Create Connection Pool Manager**
```typescript
// File: /src/lib/db/connection-pool.ts
import { Pool, PoolClient } from 'pg';
import { backOff } from 'exponential-backoff';

export class DatabasePool {
  private static instance: DatabasePool;
  private pool: Pool;
  private healthCheckInterval: NodeJS.Timeout;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      maxUses: 7500, // Close connections after 7500 uses
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Handle pool errors
    this.pool.on('error', (err, client) => {
      console.error('Unexpected pool error', err);
      this.handlePoolError(err, client);
    });

    // Start health checks
    this.startHealthCheck();
  }

  static getInstance(): DatabasePool {
    if (!this.instance) {
      this.instance = new DatabasePool();
    }
    return this.instance;
  }

  async query<T>(text: string, params?: any[]): Promise<T> {
    return backOff(
      async () => {
        const start = Date.now();
        try {
          const result = await this.pool.query(text, params);
          const duration = Date.now() - start;
          
          // Log slow queries
          if (duration > 100) {
            console.warn('Slow query detected', { text, duration, rows: result.rowCount });
          }
          
          return result as T;
        } catch (error) {
          // Log query errors
          console.error('Query error', { text, params, error });
          throw error;
        }
      },
      {
        numOfAttempts: 3,
        startingDelay: 100,
        timeMultiple: 2,
        maxDelay: 1000,
        jitter: 'full'
      }
    );
  }

  async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect();
    
    // Add query tracking
    const originalQuery = client.query.bind(client);
    let queryCount = 0;
    
    client.query = async (...args: any[]) => {
      queryCount++;
      if (queryCount > 100) {
        console.warn('Client has executed many queries, consider refactoring', { 
          queryCount 
        });
      }
      return originalQuery(...args);
    };
    
    return client;
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.pool.query('SELECT 1');
      } catch (error) {
        console.error('Database health check failed', error);
        // Attempt to recreate pool
        await this.recreatePool();
      }
    }, 30000); // Every 30 seconds
  }

  private async recreatePool(): Promise<void> {
    const oldPool = this.pool;
    
    // Create new pool
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Drain old pool
    await oldPool.end();
  }

  async end(): Promise<void> {
    clearInterval(this.healthCheckInterval);
    await this.pool.end();
  }
}

// Export singleton instance
export const dbPool = DatabasePool.getInstance();
```

3. **Day 3: Update Supabase Client for Pooling**
```typescript
// File: /src/lib/supabase/server-pool.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

class SupabasePool {
  private static clients: Map<string, ReturnType<typeof createClient>> = new Map();
  private static lastAccess: Map<string, number> = new Map();
  private static readonly MAX_CLIENTS = 10;
  private static readonly CLIENT_TTL = 300000; // 5 minutes

  static getClient(options?: { 
    serviceRole?: boolean,
    auth?: string 
  }): ReturnType<typeof createClient<Database>> {
    const key = this.getClientKey(options);
    
    // Check if client exists and is fresh
    if (this.clients.has(key)) {
      this.lastAccess.set(key, Date.now());
      return this.clients.get(key)!;
    }
    
    // Clean up old clients if at capacity
    if (this.clients.size >= this.MAX_CLIENTS) {
      this.cleanupOldClients();
    }
    
    // Create new client
    const client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      options?.serviceRole 
        ? process.env.SUPABASE_SERVICE_ROLE_KEY!
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: options?.auth ? {
          autoRefreshToken: true,
          persistSession: false,
          detectSessionInUrl: false
        } : undefined,
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'blipee-os-server'
          }
        }
      }
    );
    
    this.clients.set(key, client);
    this.lastAccess.set(key, Date.now());
    
    return client;
  }

  private static getClientKey(options?: { 
    serviceRole?: boolean,
    auth?: string 
  }): string {
    return `${options?.serviceRole ? 'service' : 'anon'}_${options?.auth || 'default'}`;
  }

  private static cleanupOldClients(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    for (const [key, lastAccess] of this.lastAccess.entries()) {
      if (now - lastAccess > this.CLIENT_TTL) {
        entriesToDelete.push(key);
      }
    }
    
    // Delete oldest if still over capacity
    if (entriesToDelete.length === 0 && this.clients.size >= this.MAX_CLIENTS) {
      const sorted = Array.from(this.lastAccess.entries())
        .sort((a, b) => a[1] - b[1]);
      entriesToDelete.push(sorted[0][0]);
    }
    
    for (const key of entriesToDelete) {
      this.clients.delete(key);
      this.lastAccess.delete(key);
    }
  }
}

// Export helper functions
export const supabaseAdmin = () => SupabasePool.getClient({ serviceRole: true });
export const supabaseClient = () => SupabasePool.getClient();
```

4. **Day 4: Load Testing and Optimization**
```typescript
// File: /src/tests/load/connection-pool.test.ts
import { describe, it, expect } from 'vitest';
import pLimit from 'p-limit';

describe('Connection Pool Load Test', () => {
  it('should handle 1000 concurrent connections', async () => {
    const limit = pLimit(100); // 100 concurrent
    const operations = 1000;
    
    const promises = Array.from({ length: operations }, (_, i) => 
      limit(async () => {
        const start = Date.now();
        const { data, error } = await supabaseClient()
          .from('organizations')
          .select('id')
          .limit(1);
        
        const duration = Date.now() - start;
        
        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(duration).toBeLessThan(100); // Under 100ms
        
        return duration;
      })
    );
    
    const durations = await Promise.all(promises);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    console.log(`Average query time: ${avgDuration}ms`);
    expect(avgDuration).toBeLessThan(50); // Average under 50ms
  });
});
```

#### Testing Checklist
- [ ] Connection pool initialized correctly
- [ ] Handles 1000+ concurrent connections
- [ ] Connection reuse working
- [ ] Failed connections retry automatically
- [ ] No connection leaks under load

#### Rollback Procedure
1. Update environment variables to bypass PgBouncer
2. Revert to direct Supabase client creation
3. Monitor for connection exhaustion
4. Document performance degradation

---

### Task 2.3: Optimize N+1 Queries
**Duration**: 4 days  
**Owner**: Backend Performance Engineer  
**Prerequisites**: Task 2.2 completed  
**Blocker Risk**: Medium

#### Implementation Steps:

1. **Day 1: Identify and Document N+1 Queries**
```typescript
// File: /src/lib/db/query-analyzer.ts
export class QueryAnalyzer {
  private static queryLog: Map<string, number> = new Map();
  private static queryPatterns: Map<string, string[]> = new Map();

  static async analyzeN1Patterns(): Promise<N1QueryReport> {
    // Hook into Supabase client
    const originalFrom = supabaseClient.from;
    
    supabaseClient.from = function(table: string) {
      const caller = new Error().stack?.split('\n')[2] || 'unknown';
      QueryAnalyzer.logQuery(table, caller);
      return originalFrom.call(this, table);
    };

    // Analyze patterns
    const patterns: N1Pattern[] = [];
    
    for (const [location, queries] of this.queryPatterns) {
      const tableCount = new Map<string, number>();
      
      for (const query of queries) {
        const count = tableCount.get(query) || 0;
        tableCount.set(query, count + 1);
      }
      
      // Detect N+1: same table queried multiple times from same location
      for (const [table, count] of tableCount) {
        if (count > 5) {
          patterns.push({
            location,
            table,
            queryCount: count,
            severity: count > 50 ? 'critical' : count > 20 ? 'high' : 'medium'
          });
        }
      }
    }
    
    return { patterns, totalQueries: this.queryLog.size };
  }
}
```

2. **Day 2: Fix Organization Service N+1**
```typescript
// File: /src/lib/organizations/service-optimized.ts

// BEFORE: N+1 Query
async removeUser(organizationId: string, userId: string): Promise<boolean> {
  // This queries all buildings
  const { data: buildings } = await this.supabase
    .from('buildings')
    .select('id')
    .eq('organization_id', organizationId);

  // Then deletes assignments one by one (N queries)
  if (buildings) {
    for (const building of buildings) {
      await this.supabase
        .from('building_assignments')
        .delete()
        .eq('building_id', building.id)
        .eq('user_id', userId);
    }
  }
}

// AFTER: Single Query with CTE
async removeUser(organizationId: string, userId: string): Promise<boolean> {
  // Create stored procedure for atomic operation
  const { error } = await this.supabase.rpc('remove_user_from_organization', {
    p_organization_id: organizationId,
    p_user_id: userId
  });

  if (error) {
    console.error('Failed to remove user:', error);
    return false;
  }

  return true;
}

// SQL Stored Procedure
/*
CREATE OR REPLACE FUNCTION remove_user_from_organization(
  p_organization_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Remove from organization members
  DELETE FROM organization_members
  WHERE organization_id = p_organization_id AND user_id = p_user_id;

  -- Remove from all building assignments in one query
  DELETE FROM building_assignments
  WHERE user_id = p_user_id
    AND building_id IN (
      SELECT id FROM buildings WHERE organization_id = p_organization_id
    );

  -- Remove from all device assignments
  DELETE FROM device_assignments
  WHERE user_id = p_user_id
    AND device_id IN (
      SELECT d.id FROM devices d
      JOIN buildings b ON d.building_id = b.id
      WHERE b.organization_id = p_organization_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
```

3. **Day 3: Implement Data Loader Pattern**
```typescript
// File: /src/lib/db/data-loader.ts
import DataLoader from 'dataloader';

export class DatabaseLoaders {
  private static instance: DatabaseLoaders;
  
  userLoader: DataLoader<string, User>;
  organizationLoader: DataLoader<string, Organization>;
  buildingLoader: DataLoader<string, Building>;
  buildingsByOrgLoader: DataLoader<string, Building[]>;

  private constructor() {
    // User loader with batching
    this.userLoader = new DataLoader(async (userIds: string[]) => {
      const { data } = await supabaseClient()
        .from('users')
        .select('*')
        .in('id', userIds);
      
      const userMap = new Map(data?.map(u => [u.id, u]) || []);
      return userIds.map(id => userMap.get(id) || null);
    }, {
      batchScheduleFn: (callback) => setTimeout(callback, 10), // 10ms batch window
      cache: true,
      cacheKeyFn: (key) => key,
      maxBatchSize: 100
    });

    // Buildings by organization loader
    this.buildingsByOrgLoader = new DataLoader(async (orgIds: string[]) => {
      const { data } = await supabaseClient()
        .from('buildings')
        .select('*')
        .in('organization_id', orgIds)
        .order('name');
      
      const buildingsByOrg = new Map<string, Building[]>();
      
      for (const building of data || []) {
        const orgBuildings = buildingsByOrg.get(building.organization_id) || [];
        orgBuildings.push(building);
        buildingsByOrg.set(building.organization_id, orgBuildings);
      }
      
      return orgIds.map(id => buildingsByOrg.get(id) || []);
    });
  }

  static getInstance(): DatabaseLoaders {
    if (!this.instance) {
      this.instance = new DatabaseLoaders();
    }
    return this.instance;
  }

  // Clear all caches
  clearAll(): void {
    this.userLoader.clearAll();
    this.organizationLoader.clearAll();
    this.buildingLoader.clearAll();
    this.buildingsByOrgLoader.clearAll();
  }
}

// Usage example
export async function getOrganizationWithBuildings(orgId: string) {
  const loaders = DatabaseLoaders.getInstance();
  
  const [organization, buildings] = await Promise.all([
    loaders.organizationLoader.load(orgId),
    loaders.buildingsByOrgLoader.load(orgId)
  ]);
  
  return { organization, buildings };
}
```

4. **Day 4: Testing and Validation**
```typescript
// File: /src/tests/performance/n1-queries.test.ts
describe('N+1 Query Prevention', () => {
  let queryCounter: QueryCounter;

  beforeEach(() => {
    queryCounter = new QueryCounter();
    queryCounter.start();
  });

  afterEach(() => {
    queryCounter.stop();
  });

  it('should batch organization member queries', async () => {
    // Load 10 organizations with their members
    const orgIds = Array.from({ length: 10 }, () => crypto.randomUUID());
    
    await Promise.all(
      orgIds.map(id => getOrganizationWithMembers(id))
    );
    
    // Should have 2 queries: 1 for orgs, 1 for all members
    expect(queryCounter.getQueryCount('organizations')).toBe(1);
    expect(queryCounter.getQueryCount('organization_members')).toBe(1);
  });

  it('should use stored procedure for bulk operations', async () => {
    const orgId = 'test-org-id';
    const userIds = Array.from({ length: 20 }, () => crypto.randomUUID());
    
    // Remove multiple users
    await Promise.all(
      userIds.map(userId => removeUserFromOrganization(orgId, userId))
    );
    
    // Should use RPC calls, not individual deletes
    expect(queryCounter.getQueryCount('building_assignments')).toBe(0);
    expect(queryCounter.getRPCCount('remove_user_from_organization')).toBe(20);
  });
});
```

#### Testing Checklist
- [ ] N+1 queries eliminated
- [ ] Data loader batching working
- [ ] Query count reduced by >80%
- [ ] Response times improved
- [ ] Memory usage acceptable

#### Rollback Procedure
1. Revert to original service methods
2. Remove data loader implementation
3. Drop stored procedures
4. Monitor query performance

---

### Task 2.4: Implement Time-Series Data Partitioning
**Duration**: 5 days  
**Owner**: Database Architect  
**Prerequisites**: Task 2.3 completed  
**Blocker Risk**: High (Data migration)

#### Implementation Steps:

1. **Day 1: Design Partition Strategy**
```sql
-- File: /supabase/migrations/20240205_partition_metrics.sql

-- Create partitioned table
CREATE TABLE metrics_partitioned (
  id UUID DEFAULT gen_random_uuid(),
  time TIMESTAMPTZ NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, time)
) PARTITION BY RANGE (time);

-- Create indexes on partitioned table
CREATE INDEX idx_metrics_part_time_device 
  ON metrics_partitioned (time DESC, device_id);
  
CREATE INDEX idx_metrics_part_device_type_time 
  ON metrics_partitioned (device_id, metric_type, time DESC);

-- Create function to automatically create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partition(
  table_name TEXT,
  start_date DATE
) RETURNS TEXT AS $$
DECLARE
  partition_name TEXT;
  end_date DATE;
BEGIN
  partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
  end_date := start_date + INTERVAL '1 month';
  
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
    FOR VALUES FROM (%L) TO (%L)',
    partition_name, table_name, start_date, end_date
  );
  
  RETURN partition_name;
END;
$$ LANGUAGE plpgsql;

-- Create partitions for next 12 months
DO $$
DECLARE
  current_date DATE := DATE_TRUNC('month', CURRENT_DATE);
  i INTEGER;
BEGIN
  FOR i IN 0..11 LOOP
    PERFORM create_monthly_partition(
      'metrics_partitioned', 
      current_date + (i || ' months')::INTERVAL
    );
  END LOOP;
END $$;

-- Create trigger to auto-create partitions
CREATE OR REPLACE FUNCTION auto_create_partition() RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_monthly_partition(
    TG_TABLE_NAME::TEXT,
    DATE_TRUNC('month', NEW.time)
  );
  RETURN NEW;
EXCEPTION
  WHEN duplicate_table THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_partition_exists
  BEFORE INSERT ON metrics_partitioned
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_partition();
```

2. **Day 2-3: Migrate Existing Data**
```sql
-- File: /scripts/migrate-metrics-data.sql

-- Step 1: Create migration tracking table
CREATE TABLE IF NOT EXISTS migration_progress (
  id SERIAL PRIMARY KEY,
  batch_start TIMESTAMPTZ,
  batch_end TIMESTAMPTZ,
  rows_migrated INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running'
);

-- Step 2: Migration procedure with batching
CREATE OR REPLACE FUNCTION migrate_metrics_batch(
  batch_size INTEGER DEFAULT 10000,
  time_start TIMESTAMPTZ DEFAULT NULL,
  time_end TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (migrated INTEGER, last_time TIMESTAMPTZ) AS $$
DECLARE
  rows_migrated INTEGER := 0;
  last_timestamp TIMESTAMPTZ;
BEGIN
  -- Default to last 2 years if not specified
  IF time_start IS NULL THEN
    time_start := NOW() - INTERVAL '2 years';
  END IF;
  
  IF time_end IS NULL THEN
    time_end := NOW();
  END IF;

  -- Migrate batch
  WITH migrated_rows AS (
    INSERT INTO metrics_partitioned (
      id, time, device_id, metric_type, value, metadata, created_at
    )
    SELECT 
      id, time, device_id, metric_type, value, metadata, created_at
    FROM metrics
    WHERE time >= time_start 
      AND time < time_end
      AND NOT EXISTS (
        SELECT 1 FROM metrics_partitioned mp 
        WHERE mp.id = metrics.id
      )
    ORDER BY time
    LIMIT batch_size
    RETURNING time
  )
  SELECT COUNT(*), MAX(time) INTO rows_migrated, last_timestamp
  FROM migrated_rows;

  -- Log progress
  INSERT INTO migration_progress (
    batch_start, batch_end, rows_migrated, status
  )
  VALUES (
    time_start, last_timestamp, rows_migrated, 
    CASE WHEN rows_migrated < batch_size THEN 'completed' ELSE 'running' END
  );

  RETURN QUERY SELECT rows_migrated, last_timestamp;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Run migration in batches
DO $$
DECLARE
  batch_count INTEGER := 0;
  total_migrated INTEGER := 0;
  rows_in_batch INTEGER;
  current_time TIMESTAMPTZ := NOW() - INTERVAL '2 years';
  end_time TIMESTAMPTZ := NOW();
BEGIN
  WHILE current_time < end_time LOOP
    SELECT migrated, last_time 
    INTO rows_in_batch, current_time
    FROM migrate_metrics_batch(10000, current_time, end_time);
    
    total_migrated := total_migrated + rows_in_batch;
    batch_count := batch_count + 1;
    
    -- Progress log
    RAISE NOTICE 'Batch %: Migrated % rows, Total: %, Current time: %', 
      batch_count, rows_in_batch, total_migrated, current_time;
    
    -- Break if no more rows
    EXIT WHEN rows_in_batch = 0;
    
    -- Small delay to prevent overwhelming the database
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RAISE NOTICE 'Migration completed. Total rows migrated: %', total_migrated;
END $$;
```

3. **Day 4: Switch to Partitioned Table**
```typescript
// File: /src/lib/db/metrics-service.ts
export class MetricsService {
  private static tableName = 'metrics_partitioned'; // Changed from 'metrics'

  static async insertMetric(metric: MetricInput): Promise<void> {
    const { error } = await supabaseClient()
      .from(this.tableName)
      .insert({
        time: metric.timestamp || new Date().toISOString(),
        device_id: metric.deviceId,
        metric_type: metric.type,
        value: metric.value,
        metadata: metric.metadata || {}
      });

    if (error) {
      console.error('Failed to insert metric:', error);
      throw error;
    }
  }

  static async queryMetrics(params: MetricQueryParams): Promise<Metric[]> {
    let query = supabaseClient()
      .from(this.tableName)
      .select('*')
      .gte('time', params.startTime)
      .lte('time', params.endTime);

    if (params.deviceId) {
      query = query.eq('device_id', params.deviceId);
    }

    if (params.metricType) {
      query = query.eq('metric_type', params.metricType);
    }

    // Use partition pruning hint
    query = query.order('time', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Failed to query metrics:', error);
      throw error;
    }

    return data || [];
  }

  // Partition maintenance
  static async maintainPartitions(): Promise<void> {
    // Drop old partitions (older than 2 years)
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

    await supabaseClient().rpc('drop_old_partitions', {
      table_name: this.tableName,
      older_than: cutoffDate.toISOString()
    });

    // Pre-create future partitions (next 3 months)
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      
      await supabaseClient().rpc('create_monthly_partition', {
        table_name: this.tableName,
        start_date: futureDate.toISOString().slice(0, 7) + '-01'
      });
    }
  }
}
```

4. **Day 5: Performance Testing**
```typescript
// File: /src/tests/performance/partitioned-metrics.test.ts
describe('Partitioned Metrics Performance', () => {
  it('should query single partition efficiently', async () => {
    // Query current month data
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();

    const startTime = Date.now();
    
    const metrics = await MetricsService.queryMetrics({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      deviceId: 'test-device-id'
    });

    const queryTime = Date.now() - startTime;
    
    // Should use partition pruning
    expect(queryTime).toBeLessThan(50); // Under 50ms
    expect(metrics).toBeDefined();
  });

  it('should handle cross-partition queries', async () => {
    // Query across 3 months
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    
    const end = new Date();

    const startTime = Date.now();
    
    const metrics = await MetricsService.queryMetrics({
      startTime: start.toISOString(),
      endTime: end.toISOString()
    });

    const queryTime = Date.now() - startTime;
    
    // Should still be fast with partition pruning
    expect(queryTime).toBeLessThan(200); // Under 200ms
  });
});
```

#### Testing Checklist
- [ ] Partitions created correctly
- [ ] Data migration completed
- [ ] Query performance improved >70%
- [ ] Partition pruning working
- [ ] Auto-partition creation functional

#### Rollback Procedure
```sql
-- Rename tables to switch back
ALTER TABLE metrics RENAME TO metrics_old;
ALTER TABLE metrics_partitioned RENAME TO metrics;

-- Update application code to use 'metrics' table
-- Monitor for issues
```

---

## PHASE 2 COMPLETION GATE

### Exit Criteria
- [ ] All indexes created and used
- [ ] Connection pooling operational
- [ ] N+1 queries eliminated
- [ ] Time-series partitioning complete
- [ ] Query performance <100ms at p95
- [ ] Load test passing (10k concurrent)
- [ ] Zero data loss during migration

### Gate Review Meeting
- **Participants**: CTO, Database Lead, Performance Engineer
- **Duration**: 2 hours
- **Deliverables**: Performance benchmarks, query analysis, load test results

---

## PHASE 3: AI System Scalability (Weeks 8-11)

**Goal**: Optimize AI system for enterprise scale and cost efficiency  
**Success Criteria**: 60% cost reduction, <2s response time at p95

### Task 3.1: Implement AI Request Queue System
**Duration**: 5 days  
**Owner**: Senior AI Engineer  
**Prerequisites**: Phase 2 completed  
**Blocker Risk**: Medium

#### Implementation Steps:

1. **Day 1: Setup Redis and BullMQ**
```typescript
// File: /src/lib/queue/ai-queue.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false
});

// Queue definitions
export const aiRequestQueue = new Queue('ai-requests', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 }, // Keep last 100 completed
    removeOnFail: { count: 200 }, // Keep last 200 failed
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

export const priorityAIQueue = new Queue('priority-ai-requests', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

// Job interfaces
export interface AIRequestJob {
  id: string;
  userId: string;
  organizationId: string;
  message: string;
  context: Record<string, any>;
  attachments?: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: string;
}

export interface AIResponseResult {
  response: string;
  tokens: number;
  provider: string;
  processingTime: number;
  cost: number;
}
```

2. **Day 2: Create AI Queue Workers**
```typescript
// File: /src/lib/queue/ai-worker.ts
import { Worker, Job } from 'bullmq';
import { AIService } from '@/lib/ai/service';
import { AIRequestJob, AIResponseResult } from './ai-queue';

export class AIQueueWorker {
  private workers: Worker[] = [];
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    // Standard queue worker (5 concurrent)
    const standardWorker = new Worker<AIRequestJob, AIResponseResult>(
      'ai-requests',
      async (job: Job<AIRequestJob>) => {
        return this.processAIRequest(job);
      },
      {
        connection,
        concurrency: 5,
        limiter: {
          max: 20,
          duration: 60000 // 20 requests per minute
        }
      }
    );

    // Priority queue worker (3 concurrent)
    const priorityWorker = new Worker<AIRequestJob, AIResponseResult>(
      'priority-ai-requests',
      async (job: Job<AIRequestJob>) => {
        return this.processAIRequest(job);
      },
      {
        connection,
        concurrency: 3,
        limiter: {
          max: 30,
          duration: 60000 // 30 requests per minute
        }
      }
    );

    // Error handling
    [standardWorker, priorityWorker].forEach(worker => {
      worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed:`, err);
        this.handleFailedJob(job!, err);
      });

      worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed in ${job.finishedOn! - job.processedOn!}ms`);
      });
    });

    this.workers = [standardWorker, priorityWorker];
  }

  private async processAIRequest(
    job: Job<AIRequestJob>
  ): Promise<AIResponseResult> {
    const start = Date.now();
    const { data } = job;

    try {
      // Update job progress
      await job.updateProgress({ stage: 'preparing', percent: 10 });

      // Check cache first
      const cached = await this.checkCache(data);
      if (cached) {
        return {
          ...cached,
          processingTime: Date.now() - start,
          provider: 'cache'
        };
      }

      await job.updateProgress({ stage: 'processing', percent: 30 });

      // Process with AI
      const response = await this.aiService.complete(data.message, {
        context: data.context,
        maxTokens: this.getMaxTokens(data.priority),
        temperature: 0.7,
        userId: data.userId,
        organizationId: data.organizationId
      });

      await job.updateProgress({ stage: 'completed', percent: 100 });

      // Calculate cost
      const cost = this.calculateCost(response.tokens, response.provider);

      const result: AIResponseResult = {
        response: response.text,
        tokens: response.tokens,
        provider: response.provider,
        processingTime: Date.now() - start,
        cost
      };

      // Cache result
      await this.cacheResult(data, result);

      return result;
    } catch (error) {
      // Log error with context
      console.error('AI processing error:', {
        jobId: job.id,
        userId: data.userId,
        error: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }

  private getMaxTokens(priority: string): number {
    const tokenLimits = {
      critical: 4000,
      high: 3000,
      normal: 2000,
      low: 1000
    };
    return tokenLimits[priority as keyof typeof tokenLimits] || 2000;
  }

  private calculateCost(tokens: number, provider: string): number {
    const costPerMillion = {
      'deepseek': 2,
      'openai': 30,
      'anthropic': 25
    };
    return (tokens / 1000000) * (costPerMillion[provider] || 30);
  }

  private async checkCache(
    job: AIRequestJob
  ): Promise<AIResponseResult | null> {
    // Implement semantic cache check
    const cacheKey = this.generateCacheKey(job);
    const cached = await redis.get(`ai:cache:${cacheKey}`);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  private async cacheResult(
    job: AIRequestJob, 
    result: AIResponseResult
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(job);
    const ttl = this.getCacheTTL(job.priority);
    
    await redis.setex(
      `ai:cache:${cacheKey}`,
      ttl,
      JSON.stringify(result)
    );
  }

  private generateCacheKey(job: AIRequestJob): string {
    return crypto
      .createHash('sha256')
      .update(`${job.message}:${JSON.stringify(job.context)}`)
      .digest('hex');
  }

  private getCacheTTL(priority: string): number {
    const ttls = {
      critical: 300,    // 5 minutes
      high: 600,       // 10 minutes
      normal: 1800,    // 30 minutes
      low: 3600        // 1 hour
    };
    return ttls[priority as keyof typeof ttls] || 1800;
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.workers.map(w => w.close()));
  }
}

// Initialize worker
export const aiWorker = new AIQueueWorker();
```

3. **Day 3: Update API to Use Queue**
```typescript
// File: /src/app/api/ai/chat/route.ts
import { aiRequestQueue, priorityAIQueue } from '@/lib/queue/ai-queue';
import { Job } from 'bullmq';

export async function POST(request: NextRequest) {
  try {
    const { message, context, priority = 'normal' } = await request.json();
    const userId = await getUserId(request);

    // Determine which queue to use
    const queue = priority === 'critical' || priority === 'high' 
      ? priorityAIQueue 
      : aiRequestQueue;

    // Add to queue
    const job = await queue.add('process-ai-request', {
      id: crypto.randomUUID(),
      userId,
      organizationId: context.organizationId,
      message,
      context,
      priority,
      timestamp: new Date().toISOString()
    }, {
      priority: getPriorityScore(priority),
      delay: priority === 'low' ? 5000 : 0 // Delay low priority by 5s
    });

    // Return job ID for polling (or use WebSocket)
    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      position: await getQueuePosition(job),
      estimatedTime: await estimateProcessingTime(priority)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to queue request' },
      { status: 500 }
    );
  }
}

// Polling endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = await aiRequestQueue.getJob(params.jobId);
  
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  const state = await job.getState();
  const progress = job.progress;

  if (state === 'completed') {
    const result = job.returnvalue;
    return NextResponse.json({
      status: 'completed',
      result
    });
  }

  if (state === 'failed') {
    return NextResponse.json({
      status: 'failed',
      error: job.failedReason
    });
  }

  return NextResponse.json({
    status: state,
    progress,
    position: await getQueuePosition(job)
  });
}
```

4. **Day 4: Implement Request Batching**
```typescript
// File: /src/lib/queue/request-batcher.ts
export class AIRequestBatcher {
  private batchQueue: Map<string, AIRequestJob[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_TIMEOUT = 1000; // 1 second

  async addRequest(request: AIRequestJob): Promise<void> {
    const batchKey = this.getBatchKey(request);
    
    // Add to batch
    const batch = this.batchQueue.get(batchKey) || [];
    batch.push(request);
    this.batchQueue.set(batchKey, batch);

    // Process if batch is full
    if (batch.length >= this.BATCH_SIZE) {
      this.processBatch(batchKey);
    } else {
      // Set timeout for partial batch
      this.setBatchTimeout(batchKey);
    }
  }

  private getBatchKey(request: AIRequestJob): string {
    // Batch by organization and priority
    return `${request.organizationId}:${request.priority}`;
  }

  private setBatchTimeout(batchKey: string): void {
    // Clear existing timeout
    const existingTimer = this.batchTimers.get(batchKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timeout
    const timer = setTimeout(() => {
      this.processBatch(batchKey);
    }, this.BATCH_TIMEOUT);

    this.batchTimers.set(batchKey, timer);
  }

  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batchQueue.get(batchKey);
    if (!batch || batch.length === 0) return;

    // Clear batch
    this.batchQueue.delete(batchKey);
    
    // Clear timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Process batch with combined context
    const combinedContext = this.combineContexts(batch);
    const batchJob = await aiRequestQueue.add('batch-process', {
      requests: batch,
      combinedContext,
      batchSize: batch.length
    });

    // Notify individual requests
    for (const request of batch) {
      await this.notifyBatchProcessing(request.id, batchJob.id);
    }
  }

  private combineContexts(batch: AIRequestJob[]): Record<string, any> {
    // Intelligently combine contexts for efficiency
    const combined: Record<string, any> = {
      organizationId: batch[0].organizationId,
      batchSize: batch.length,
      queries: batch.map(r => ({
        id: r.id,
        message: r.message,
        context: r.context
      }))
    };

    return combined;
  }
}
```

5. **Day 5: Testing and Optimization**
```typescript
// File: /src/tests/performance/ai-queue.test.ts
describe('AI Queue System', () => {
  let queue: Queue;
  let worker: Worker;

  beforeAll(async () => {
    queue = aiRequestQueue;
    worker = new Worker('ai-requests', async (job) => {
      // Mock processing
      await new Promise(resolve => setTimeout(resolve, 100));
      return { response: 'test', tokens: 100 };
    });
  });

  afterAll(async () => {
    await worker.close();
    await queue.close();
  });

  it('should handle 100 concurrent requests', async () => {
    const jobs = [];
    
    // Queue 100 requests
    for (let i = 0; i < 100; i++) {
      const job = await queue.add('test', {
        message: `Test message ${i}`,
        priority: i % 4 === 0 ? 'high' : 'normal'
      });
      jobs.push(job);
    }

    // Wait for completion
    const results = await Promise.all(
      jobs.map(job => job.waitUntilFinished(queueEvents))
    );

    expect(results).toHaveLength(100);
    expect(results.every(r => r.response === 'test')).toBe(true);
  });

  it('should respect priority ordering', async () => {
    const completed: string[] = [];
    
    worker.on('completed', (job) => {
      completed.push(job.data.priority);
    });

    // Add mixed priority jobs
    await queue.add('critical', { priority: 'critical' }, { priority: 10 });
    await queue.add('low', { priority: 'low' }, { priority: 1 });
    await queue.add('high', { priority: 'high' }, { priority: 5 });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Critical should complete first
    expect(completed[0]).toBe('critical');
  });
});
```

#### Testing Checklist
- [ ] Queue system operational
- [ ] Workers processing requests
- [ ] Priority ordering working
- [ ] Request batching functional
- [ ] Cache hit rate improved
- [ ] Failed jobs retry correctly

#### Rollback Procedure
1. Update API to bypass queue
2. Stop queue workers
3. Process any queued jobs directly
4. Monitor for performance degradation

---

### Task 3.2: Implement Semantic Caching with Embeddings
**Duration**: 4 days  
**Owner**: ML Engineer  
**Prerequisites**: Task 3.1 completed  
**Blocker Risk**: Medium

[Continue with remaining tasks...]

---

## PHASE 4: Operational Excellence (Weeks 12-16)

[Define Phase 4 tasks...]

---

## Risk Register

### High-Risk Items
1. **Database Migration**: Data loss risk during partitioning
   - Mitigation: Full backup before migration
   - Rollback: Restore from backup

2. **Authentication Changes**: Users locked out
   - Mitigation: Phased rollout with monitoring
   - Rollback: Disable new auth features

3. **AI Queue System**: Response time degradation
   - Mitigation: Keep synchronous fallback
   - Rollback: Route directly to AI service

### Medium-Risk Items
1. **Performance Optimizations**: Unexpected side effects
2. **Security Headers**: Breaking third-party integrations
3. **Connection Pooling**: Resource exhaustion

---

## Success Metrics

### Phase 1: Security
- Zero critical vulnerabilities
- CSRF protection on 100% of endpoints
- Security headers score A+ on securityheaders.com

### Phase 2: Database
- Query p95 < 100ms
- Connection pool efficiency > 90%
- Zero N+1 queries in critical paths

### Phase 3: AI System
- Cost reduction > 60%
- Cache hit rate > 80%
- Queue processing time < 2s p95

### Phase 4: Operations
- Structured logging 100% coverage
- Error tracking < 0.1% error rate
- Monitoring coverage > 95%

---

## Communication Plan

### Daily Standups
- Time: 9:00 AM
- Duration: 15 minutes
- Format: Current task, blockers, needs

### Weekly Reviews
- Time: Fridays 3:00 PM
- Duration: 1 hour
- Format: Progress, metrics, risks, next week

### Phase Gates
- Stakeholders: CTO, Team Leads
- Duration: 2 hours
- Format: Demo, metrics review, go/no-go decision

---

## Appendices

### A. Rollback Procedures
[Detailed rollback for each task]

### B. Testing Plans
[Comprehensive test scenarios]

### C. Migration Scripts
[Database and data migration scripts]

### D. Monitoring Setup
[Dashboards and alerts configuration]