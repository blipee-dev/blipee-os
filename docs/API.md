# blipee OS API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Core APIs](#core-apis)
6. [AI & Chat APIs](#ai--chat-apis)
7. [Authentication APIs](#authentication-apis)
8. [Monitoring APIs](#monitoring-apis)
9. [Webhook APIs](#webhook-apis)
10. [GraphQL API](#graphql-api)
11. [API Gateway](#api-gateway)
12. [Code Examples](#code-examples)

## Overview

The blipee OS API provides programmatic access to all platform features. The API follows RESTful principles and supports both JSON and GraphQL formats.

### Base URLs
- **Production**: `https://api.blipee.com`
- **Development**: `http://localhost:3000/api`

### API Versioning
APIs are versioned via URL path:
- **v1**: `/api/v1/` (current stable)
- **v2**: `/api/v2/` (beta features)

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`
- **File Upload**: `multipart/form-data`

## Authentication

All API requests require authentication except public endpoints.

### Methods

#### 1. API Key Authentication
```bash
curl -H "X-API-Key: your-api-key" \
  https://api.blipee.com/v1/organizations
```

#### 2. Bearer Token (JWT)
```bash
curl -H "Authorization: Bearer your-jwt-token" \
  https://api.blipee.com/v1/organizations
```

#### 3. Session Cookie
Automatically included for web clients after login.

### Getting API Keys

```typescript
// POST /api/gateway/keys
{
  "name": "Production API Key",
  "permissions": ["read", "write"],
  "expiresIn": "90d"
}

// Response
{
  "id": "key_abc123",
  "key": "sk_live_abc123...",
  "name": "Production API Key",
  "permissions": ["read", "write"],
  "expiresAt": "2024-04-01T00:00:00Z"
}
```

## Rate Limiting

Rate limits are enforced per API key or authenticated user.

### Limits
- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **Pro Plan**: 1000 requests/minute
- **Enterprise**: Custom limits

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## Core APIs

### Organizations

#### List Organizations
```http
GET /api/v1/organizations
```

Response:
```json
{
  "data": [
    {
      "id": "org_123",
      "name": "Acme Corp",
      "plan": "enterprise",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

#### Get Organization
```http
GET /api/v1/organizations/:id
```

#### Update Organization
```http
PUT /api/v1/organizations/:id
Content-Type: application/json

{
  "name": "Updated Corp Name",
  "settings": {
    "timezone": "America/New_York"
  }
}
```

### Buildings

#### List Buildings
```http
GET /api/v1/organizations/:orgId/buildings
```

#### Create Building
```http
POST /api/v1/organizations/:orgId/buildings
Content-Type: application/json

{
  "name": "HQ Building",
  "address": "123 Main St",
  "type": "office",
  "size": 50000,
  "units": "sqft"
}
```

## AI & Chat APIs

### Chat Completion

#### Send Message
```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "What's our current energy usage?",
  "conversationId": "conv_123",
  "context": {
    "buildingId": "bld_456",
    "timeRange": "last_30_days"
  }
}
```

Response:
```json
{
  "response": "Your current energy usage for the HQ Building over the last 30 days is 45,230 kWh, which is 12% lower than the previous period.",
  "conversationId": "conv_123",
  "uiComponents": [
    {
      "type": "chart",
      "data": {
        "type": "line",
        "series": [...]
      }
    }
  ],
  "cached": false,
  "processingTime": 342
}
```

#### Stream Response
```http
POST /api/ai/stream
Content-Type: application/json

{
  "message": "Analyze our Scope 3 emissions",
  "stream": true
}
```

Response (Server-Sent Events):
```
data: {"chunk": "Analyzing your Scope 3 emissions...", "done": false}
data: {"chunk": "Based on your supply chain data...", "done": false}
data: {"chunk": "", "done": true, "uiComponents": [...]}
```

### Document Analysis

#### Upload Document
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: [binary data]
type: "invoice"
```

Response:
```json
{
  "fileId": "file_789",
  "analysis": {
    "type": "utility_bill",
    "extractedData": {
      "vendor": "City Power Co",
      "amount": 2340.50,
      "usage": 12500,
      "units": "kWh",
      "period": "2024-01-01 to 2024-01-31"
    },
    "emissions": {
      "co2e": 5.2,
      "units": "tonnes"
    }
  }
}
```

## Authentication APIs

### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "organizationName": "New Company"
}
```

### OAuth Flow
```http
GET /api/auth/oauth?provider=google
```

### SSO Initiation
```http
POST /api/auth/sso/initiate
Content-Type: application/json

{
  "email": "user@company.com"
}
```

### MFA Verification
```http
POST /api/auth/mfa/verify
Content-Type: application/json

{
  "code": "123456",
  "method": "totp"
}
```

## Monitoring APIs

### Health Check
```http
GET /api/monitoring/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ai": "healthy"
  }
}
```

### Metrics
```http
GET /api/monitoring/metrics
```

Response (Prometheus format):
```
# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",endpoint="/api/v1/organizations"} 1234

# HELP response_time_seconds Response time in seconds
# TYPE response_time_seconds histogram
response_time_seconds_bucket{le="0.1"} 850
response_time_seconds_bucket{le="0.5"} 980
response_time_seconds_bucket{le="1"} 1000
```

### Performance Stats
```http
GET /api/monitoring/performance
```

Response:
```json
{
  "responseTime": {
    "average": 145,
    "p95": 320,
    "p99": 580
  },
  "cacheHitRate": 0.85,
  "errorRate": 0.001,
  "throughput": 523
}
```

## Webhook APIs

### List Webhooks
```http
GET /api/webhooks
```

### Create Webhook
```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://example.com/webhook",
  "events": ["emission.created", "report.generated"],
  "secret": "webhook-secret"
}
```

### Test Webhook
```http
POST /api/webhooks/:id/test
```

### Delivery Status
```http
GET /api/webhooks/:id/deliveries
```

Response:
```json
{
  "deliveries": [
    {
      "id": "del_123",
      "status": "success",
      "statusCode": 200,
      "timestamp": "2024-01-01T00:00:00Z",
      "responseTime": 145
    }
  ]
}
```

## GraphQL API

### Endpoint
```
POST /api/graphql
```

### Schema Overview
```graphql
type Query {
  # Organizations
  organization(id: ID!): Organization
  organizations(filter: OrganizationFilter): [Organization!]!
  
  # Buildings
  building(id: ID!): Building
  buildings(organizationId: ID!): [Building!]!
  
  # Emissions
  emissions(filter: EmissionFilter): EmissionConnection!
  emissionSummary(timeRange: TimeRange!): EmissionSummary!
}

type Mutation {
  # Create operations
  createBuilding(input: CreateBuildingInput!): Building!
  createEmission(input: CreateEmissionInput!): Emission!
  
  # Update operations
  updateBuilding(id: ID!, input: UpdateBuildingInput!): Building!
  updateOrganization(id: ID!, input: UpdateOrganizationInput!): Organization!
}

type Subscription {
  # Real-time updates
  buildingUpdated(buildingId: ID!): Building!
  emissionCreated(organizationId: ID!): Emission!
  alertTriggered(buildingId: ID!): Alert!
}
```

### Example Query
```graphql
query GetBuildingData($buildingId: ID!, $timeRange: TimeRange!) {
  building(id: $buildingId) {
    id
    name
    currentMetrics {
      energy
      temperature
      occupancy
    }
    emissions(timeRange: $timeRange) {
      edges {
        node {
          id
          scope
          amount
          timestamp
        }
      }
    }
  }
}
```

## API Gateway

### API Key Management

#### Create API Key
```http
POST /api/gateway/keys
Content-Type: application/json

{
  "name": "Mobile App Key",
  "permissions": ["read"],
  "rateLimit": 1000,
  "expiresIn": "90d"
}
```

#### List API Keys
```http
GET /api/gateway/keys
```

#### Revoke API Key
```http
DELETE /api/gateway/keys/:id
```

### Usage Analytics
```http
GET /api/gateway/usage
```

Response:
```json
{
  "period": "last_30_days",
  "totalRequests": 45230,
  "byEndpoint": {
    "/api/ai/chat": 12500,
    "/api/v1/organizations": 8200
  },
  "byDay": [
    {
      "date": "2024-01-01",
      "requests": 1520
    }
  ]
}
```

## Code Examples

### JavaScript/TypeScript
```typescript
import { BlipeeClient } from '@blipee/sdk';

const client = new BlipeeClient({
  apiKey: process.env.BLIPEE_API_KEY
});

// Chat with AI
const response = await client.chat.send({
  message: "What's our carbon footprint this month?"
});

// Create webhook
const webhook = await client.webhooks.create({
  url: 'https://myapp.com/webhook',
  events: ['emission.created']
});

// GraphQL query
const data = await client.graphql({
  query: `
    query {
      organizations {
        id
        name
        buildings {
          id
          name
        }
      }
    }
  `
});
```

### Python
```python
import blipee

client = blipee.Client(api_key="your-api-key")

# Send chat message
response = client.chat.send(
    message="Show me energy trends",
    context={"building_id": "bld_123"}
)

# Upload document
analysis = client.documents.upload(
    file=open("invoice.pdf", "rb"),
    type="invoice"
)

# Get metrics
metrics = client.monitoring.get_metrics()
print(f"Cache hit rate: {metrics['cache_hit_rate']}")
```

### cURL
```bash
# Basic request
curl -X GET \
  -H "X-API-Key: your-api-key" \
  https://api.blipee.com/v1/organizations

# Chat request
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"message": "What is our water usage?"}' \
  https://api.blipee.com/api/ai/chat

# File upload
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@document.pdf" \
  -F "type=utility_bill" \
  https://api.blipee.com/api/files/upload
```

## Best Practices

1. **Authentication**
   - Use API keys for server-to-server communication
   - Use JWT tokens for client applications
   - Rotate API keys regularly

2. **Rate Limiting**
   - Implement exponential backoff for retries
   - Cache responses when appropriate
   - Use webhooks for real-time updates instead of polling

3. **Error Handling**
   - Always check for error responses
   - Log errors with request IDs for debugging
   - Implement proper retry logic

4. **Performance**
   - Use pagination for large data sets
   - Leverage GraphQL for efficient data fetching
   - Enable compression for responses

5. **Security**
   - Always use HTTPS
   - Validate webhook signatures
   - Never expose API keys in client code

---

For more examples and SDKs, visit our [Developer Portal](https://developers.blipee.com).