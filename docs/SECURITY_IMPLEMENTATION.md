# Security Implementation Guide

## Overview

This document outlines the security measures implemented in blipee OS as part of the Phase 1 security modernization.

## CSRF Protection

### Implementation Details

CSRF (Cross-Site Request Forgery) protection has been implemented using a double-submit cookie pattern with signed tokens.

#### Components:
1. **CSRF Token Generation** (`/src/lib/security/csrf.ts`)
   - Generates cryptographically secure tokens
   - Tokens are signed with HMAC-SHA256
   - Include timestamp for expiry (24 hours)

2. **Middleware Integration** (`/src/middleware.ts`)
   - Automatically validates CSRF tokens for protected methods (POST, PUT, PATCH, DELETE)
   - Sets CSRF cookies for authenticated sessions
   - Exempt paths for webhooks and OAuth callbacks

3. **Client-Side Integration**
   - `useCSRF` hook for React components
   - Automatic token inclusion in API requests
   - API client with built-in CSRF support

### Usage

#### In React Components:
```typescript
import { useAPIClient } from '@/lib/api/client';

function MyComponent() {
  const apiClient = useAPIClient();
  
  const handleSubmit = async (data) => {
    // CSRF token automatically included
    const response = await apiClient.post('/api/endpoint', data);
  };
}
```

#### For File Uploads:
```typescript
import { useCSRF } from '@/hooks/use-csrf';

function FileUpload() {
  const { headers: csrfHeaders } = useCSRF();
  
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: csrfHeaders, // Include CSRF token
      body: formData,
      credentials: 'include',
    });
  };
}
```

### Testing CSRF Protection

Run the test script:
```bash
npm run test:csrf
```

### Configuration

Environment variable:
- `CSRF_SECRET_KEY`: Secret key for signing tokens (required in production)

## Security Headers

Security headers are implemented at multiple levels to ensure comprehensive protection:

### Middleware Level (`/src/lib/security/headers.ts`)
- Dynamic header application per request
- CSP with nonce support for inline scripts
- API-specific caching headers

### Framework Level (`next.config.js`)
- Applied to all responses automatically
- Production-specific headers (HSTS)

### Headers Implemented:
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Legacy XSS protection for older browsers
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` - Restricts browser features
- `X-DNS-Prefetch-Control: on` - Controls DNS prefetching
- `Strict-Transport-Security` - Forces HTTPS (production only)
- `Content-Security-Policy` - Comprehensive content restrictions

### Testing Security Headers

Check headers are properly set:
```bash
curl -I http://localhost:3000
```

Use security header scanner:
- https://securityheaders.com
- https://observatory.mozilla.org

## Session Security

Enhanced session security includes:

### Cookie Security
- **httpOnly**: true - Prevents JavaScript access
- **secure**: true in production - HTTPS only
- **sameSite**: strict - Maximum CSRF protection
- **maxAge**: 24 hours - Automatic expiration

### Advanced Security Features
1. **Session Rotation**
   - Automatic rotation every 30 minutes
   - Prevents session fixation attacks
   - Maintains session continuity

2. **Device Fingerprinting**
   - Tracks user agent, language, and browser features
   - Detects suspicious device changes
   - Optional enforcement via environment variable

3. **IP Binding**
   - Validates session against originating IP
   - Prevents session hijacking
   - Configurable enforcement

4. **Concurrent Session Limits**
   - Maximum 5 sessions per user
   - Automatic termination of oldest sessions
   - Prevents credential sharing

5. **Activity Monitoring**
   - 2-hour idle timeout
   - 24-hour maximum session lifetime
   - Last activity tracking

6. **High-Risk Detection**
   - Monitors for suspicious patterns
   - Rapid IP changes
   - Frequent rotation attempts
   - User agent mismatches

### Testing Session Security
```bash
npm run test:session-security
```

### Configuration
Environment variables:
- `SESSION_TTL`: Session lifetime in seconds
- `ENFORCE_IP_BINDING`: Enable IP validation
- `ENFORCE_FINGERPRINT`: Enable device fingerprint validation
- `MAX_CONCURRENT_SESSIONS`: Maximum sessions per user

## API Security

### Rate Limiting
- 100 requests per minute per IP
- Configurable per endpoint
- DDoS protection at edge

### Authentication
- Session-based auth with secure cookies
- Role-based access control (RBAC)
- API key support for external integrations

## XSS Protection

### Content Security Policy (CSP)
- Implemented via Next.js headers
- Restricts script sources
- Prevents inline scripts

### Input Sanitization
- DOMPurify for user-generated content
- Validation on all API inputs
- Output encoding for dynamic content

## Best Practices

1. **Never disable CSRF protection** unless absolutely necessary
2. **Keep tokens short-lived** (24 hours default)
3. **Use the provided hooks and utilities** instead of raw fetch
4. **Test security features** after any changes
5. **Monitor security logs** for suspicious activity

## Monitoring

Security events are logged and monitored:
- Failed CSRF validations
- Rate limit violations
- Authentication failures
- Suspicious request patterns

## Compliance

This implementation helps meet:
- OWASP Top 10 requirements
- SOC2 security controls
- GDPR data protection requirements
- Industry security standards

## Future Enhancements

Planned security improvements:
- [ ] Content Security Policy (CSP) headers
- [ ] Subresource Integrity (SRI)
- [ ] Security.txt file
- [ ] Bug bounty program
- [ ] Automated security scanning