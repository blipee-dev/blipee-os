# API Quick Reference

## Authentication Required Headers

For all protected endpoints:
```
Cookie: blipee-session=<session_id>
```

For mutating operations (POST, PUT, DELETE):
```
X-CSRF-Token: <csrf_token>
```

## Common Endpoints

### Authentication
| Method | Endpoint | Description | CSRF Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signin` | Sign in | No |
| POST | `/auth/signout` | Sign out | Yes |
| GET | `/auth/session` | Get session info | No |

### Core Resources
| Method | Endpoint | Description | CSRF Required |
|--------|----------|-------------|---------------|
| GET | `/organizations` | List organizations | No |
| POST | `/organizations` | Create organization | Yes |
| GET | `/organizations/{id}` | Get organization | No |
| GET | `/buildings` | List buildings | No |
| POST | `/buildings` | Create building | Yes |

### AI & Analytics
| Method | Endpoint | Description | CSRF Required |
|--------|----------|-------------|---------------|
| POST | `/ai/chat` | Chat with AI | Yes |
| GET | `/metrics/emissions` | Get emissions data | No |
| POST | `/reports/generate` | Generate report | Yes |
| GET | `/reports/{id}` | Get report status | No |

### Documents
| Method | Endpoint | Description | CSRF Required |
|--------|----------|-------------|---------------|
| POST | `/files/upload` | Upload document | Yes |
| GET | `/files/{id}` | Download file | No |
| DELETE | `/files/{id}` | Delete file | Yes |

## Response Status Codes

| Code | Meaning | Action Required |
|------|---------|-----------------|
| 200 | Success | None |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Sign in required |
| 403 | Forbidden | Check CSRF token or permissions |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |

## Rate Limits

- **Default**: 100 requests/minute
- **AI Chat**: 30 requests/minute
- **File Upload**: 10 requests/minute
- **Report Generation**: 5 requests/hour

## Quick Examples

### Get CSRF Token (JavaScript)
```javascript
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('_csrf='))
  ?.split('=')[1];
```

### Authenticated Request (JavaScript)
```javascript
const response = await fetch('/api/organizations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify({ name: 'New Org' })
});
```

### Check Rate Limit Headers
```javascript
const remaining = response.headers.get('X-RateLimit-Remaining');
if (parseInt(remaining) < 10) {
  console.warn('Approaching rate limit');
}
```

## Common Error Responses

### Invalid CSRF Token
```json
{
  "error": "CSRF token validation failed",
  "code": "CSRF_INVALID"
}
```

### Rate Limited
```json
{
  "error": "Too many requests",
  "retryAfter": 60
}
```

### Validation Error
```json
{
  "error": "Validation failed",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```