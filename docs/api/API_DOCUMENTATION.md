# Blipee OS API Documentation

## Overview

The Blipee OS API provides programmatic access to the world's first Autonomous Sustainability Intelligence platform. This RESTful API enables integration with enterprise systems and custom applications.

## Base URL

```
Production: https://api.blipee.com/v1
Staging: https://staging-api.blipee.com/v1
Development: http://localhost:3000/api
```

## Authentication

The API uses session-based authentication with enhanced security features:

1. **Login**: POST to `/auth/signin` with email and password
2. **Session Cookie**: `blipee-session` cookie is set (httpOnly, secure, sameSite=strict)
3. **CSRF Protection**: Include `X-CSRF-Token` header for all mutating operations (POST, PUT, DELETE)
4. **Session Security**: 
   - Sessions rotate every 30 minutes
   - 24-hour maximum lifetime
   - 2-hour idle timeout
   - Device fingerprinting and IP validation available

### Example Authentication Flow

```javascript
// 1. Sign in
const response = await fetch('https://api.blipee.com/v1/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'secure-password'
  }),
  credentials: 'include' // Important for cookies
});

// 2. Get CSRF token from cookie
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('_csrf='))
  ?.split('=')[1];

// 3. Make authenticated requests
const apiResponse = await fetch('https://api.blipee.com/v1/organizations', {
  headers: {
    'X-CSRF-Token': csrfToken // Required for mutations
  },
  credentials: 'include'
});
```

## Rate Limiting

- **Limit**: 100 requests per minute per IP address
- **Headers**: Rate limit information included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `Retry-After`: Seconds until rate limit resets (when exceeded)

## Security

### Headers
All responses include comprehensive security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production)
- `Content-Security-Policy`: Restrictive CSP policy
- `Permissions-Policy`: Disabled camera, microphone, geolocation

### Input Validation
- All user inputs are sanitized to prevent XSS
- SQL injection protection via parameterized queries
- File upload restrictions and virus scanning

### Audit Logging
All API access is logged for security and compliance:
- Authentication events
- Data access patterns
- Security violations
- API key usage

## Error Handling

### Error Response Format

```json
{
  "error": "validation_error",
  "message": "Invalid input provided",
  "code": "VAL001",
  "details": {
    "field": "email",
    "reason": "Invalid email format"
  }
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async processing) |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - CSRF token invalid or insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## API Endpoints

### Authentication

#### POST /auth/signin
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "sustainability_manager"
  },
  "session": {
    "id": "session_2a3b4c5d",
    "expiresAt": "2025-08-30T10:00:00Z",
    "isMfaVerified": false
  }
}
```

#### POST /auth/signout
Terminate the current session.

**Headers Required:**
- `X-CSRF-Token`: CSRF token

**Response:**
```json
{
  "message": "Successfully signed out"
}
```

#### GET /auth/session
Get current session information.

**Response:**
```json
{
  "id": "session_2a3b4c5d",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2025-08-30T10:00:00Z",
  "isMfaVerified": true,
  "permissions": ["read", "write", "admin"]
}
```

### Organizations

#### GET /organizations
List all organizations the user has access to.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "org_123",
      "name": "Acme Corporation",
      "industry": "Manufacturing",
      "size": "enterprise",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### POST /organizations
Create a new organization.

**Headers Required:**
- `X-CSRF-Token`: CSRF token

**Request Body:**
```json
{
  "name": "New Company Inc",
  "industry": "Technology",
  "size": "medium"
}
```

### AI Chat

#### POST /ai/chat
Send a message to the AI assistant.

**Headers Required:**
- `X-CSRF-Token`: CSRF token

**Request Body:**
```json
{
  "message": "What are our Scope 2 emissions this month?",
  "conversationId": "conv_abc123",
  "buildingId": "bld_456",
  "attachments": []
}
```

**Response:**
```json
{
  "message": "Your Scope 2 emissions for this month are 145.3 tCO2e, which is 12% lower than last month.",
  "components": [
    {
      "type": "chart",
      "props": {
        "title": "Scope 2 Emissions Trend",
        "data": [...]
      }
    }
  ],
  "suggestions": [
    "Show me the breakdown by building",
    "What's driving the reduction?",
    "Compare with same month last year"
  ],
  "confidence": 0.95,
  "processingTime": 850
}
```

### Metrics

#### GET /metrics/emissions
Retrieve emissions data.

**Query Parameters:**
- `buildingId` (uuid): Filter by building
- `startDate` (date): Start date (YYYY-MM-DD)
- `endDate` (date): End date (YYYY-MM-DD)
- `scope` (enum): scope1, scope2, scope3, or all

**Response:**
```json
{
  "period": {
    "start": "2025-08-01",
    "end": "2025-08-31"
  },
  "emissions": {
    "scope1": 234.5,
    "scope2": 145.3,
    "scope3": 1890.2,
    "total": 2270.0
  },
  "trends": [
    {
      "date": "2025-08-01",
      "value": 75.2
    }
  ]
}
```

### Documents

#### POST /files/upload
Upload a document for AI analysis.

**Headers Required:**
- `X-CSRF-Token`: CSRF token
- `Content-Type`: multipart/form-data

**Form Data:**
- `file`: Binary file data (PDF, PNG, JPG, XLSX)
- `conversationId`: Associated conversation ID

**Response:**
```json
{
  "id": "file_789",
  "filename": "utility-bill.pdf",
  "size": 245632,
  "type": "application/pdf",
  "extractedData": {
    "documentType": "utility_bill",
    "emissions": 45.2,
    "period": "2025-08",
    "confidence": 0.92
  }
}
```

### Reports

#### POST /reports/generate
Generate an ESG report.

**Headers Required:**
- `X-CSRF-Token`: CSRF token

**Request Body:**
```json
{
  "organizationId": "org_123",
  "reportType": "quarterly",
  "startDate": "2025-07-01",
  "endDate": "2025-09-30"
}
```

**Response (202 Accepted):**
```json
{
  "reportId": "rpt_xyz",
  "status": "processing",
  "estimatedTime": 180
}
```

## Code Examples

### JavaScript/TypeScript

```typescript
// Using the API client
import { BlipeeClient } from '@blipee/sdk';

const client = new BlipeeClient({
  baseURL: 'https://api.blipee.com/v1',
  credentials: 'include'
});

// Authenticate
await client.auth.signIn({
  email: 'user@example.com',
  password: 'secure-password'
});

// Chat with AI
const response = await client.ai.chat({
  message: 'What are our emissions targets?'
});

console.log(response.message);
```

### Python

```python
import requests

class BlipeeAPI:
    def __init__(self, base_url='https://api.blipee.com/v1'):
        self.base_url = base_url
        self.session = requests.Session()
        
    def signin(self, email, password):
        response = self.session.post(
            f'{self.base_url}/auth/signin',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()
        
        # Extract CSRF token from cookies
        self.csrf_token = self.session.cookies.get('_csrf')
        return response.json()
    
    def chat(self, message):
        headers = {'X-CSRF-Token': self.csrf_token}
        response = self.session.post(
            f'{self.base_url}/ai/chat',
            headers=headers,
            json={'message': message}
        )
        response.raise_for_status()
        return response.json()
```

### cURL

```bash
# Sign in
curl -X POST https://api.blipee.com/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure-password"}' \
  -c cookies.txt

# Extract CSRF token
CSRF_TOKEN=$(grep "_csrf" cookies.txt | awk '{print $7}')

# Make authenticated request
curl -X POST https://api.blipee.com/v1/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{"message":"What are our emissions?"}'
```

## Webhooks

Blipee OS can send webhooks for various events. Configure webhooks in your organization settings.

### Webhook Events

- `metrics.threshold_exceeded` - Emissions threshold exceeded
- `report.completed` - Report generation completed
- `ai.insight_generated` - New AI insight available
- `compliance.alert` - Compliance issue detected

### Webhook Security

- Signature verification using HMAC-SHA256
- Retry logic with exponential backoff
- Event deduplication

## API Versioning

The API uses URL versioning. The current version is v1.

- Current: `https://api.blipee.com/v1`
- Legacy endpoints will be maintained for 12 months after deprecation
- Breaking changes will result in a new version

## Support

- Email: api-support@blipee.com
- Developer Portal: https://developers.blipee.com
- Status Page: https://status.blipee.com

## Changelog

### v1.0.0 (2025-08-29)
- Initial API release
- Authentication endpoints
- Organization management
- AI chat interface
- Metrics and reporting
- Document analysis
- Enhanced security with CSRF protection
- Session rotation and security features
- Comprehensive audit logging