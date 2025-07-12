# Retail Intelligence API Documentation

## Overview

The Retail Intelligence API provides comprehensive endpoints for managing retail stores, foot traffic data, sales analytics, and AI-powered insights.

Base URL: `https://retail.blipee.ai/api/retail`

## Authentication

The API supports multiple authentication methods to accommodate different interfaces:

### 1. JWT Token (Web Interface)
```http
Authorization: Bearer <your-jwt-token>
```

### 2. API Key (Telegram Bot & Integrations)
```http
X-API-Key: <your-api-key>
```

### 3. Telegram User Authentication
For Telegram bot compatibility, authenticate users via:
```http
POST /api/v1/auth/telegram
{
  "telegram_user_id": "123456789",
  "telegram_username": "john_doe",
  "chat_id": "987654321"
}
```

## Multi-Interface Support

This API serves multiple interfaces simultaneously:
- **Web Dashboard**: Full REST API with WebSocket support
- **Telegram Bot**: Compatible endpoints for existing Python bot
- **Mobile Apps**: RESTful API with offline support
- **Third-party Integrations**: API key-based access

### Telegram Bot Compatibility

The following endpoints maintain compatibility with the existing Telegram bot:

#### Get Analytics (Telegram Format)
```http
GET /api/v1/analytics?loja=OML01&start_date=2024-01-01&end_date=2024-01-31
```

Returns data in the exact format expected by the Telegram bot. See [API Compatibility Guide](API_COMPATIBILITY_GUIDE.md) for details.

#### Bot State Management
```http
GET /api/v1/telegram/state?chat_id=123456789
POST /api/v1/telegram/state
```

Maintains conversation flow for Telegram users.

## API Endpoints

### Store Management

#### List Stores
```http
GET /api/retail/stores
```

Query parameters:
- `organization_id` (optional): Filter by organization
- `mall_id` (optional): Filter by mall
- `is_active` (optional): Filter by active status

Response:
```json
{
  "stores": [
    {
      "id": "uuid",
      "name": "Downtown Flagship",
      "code": "DTF001",
      "mall_id": "uuid",
      "timezone": "America/New_York",
      "operating_hours": {
        "monday": { "open": "09:00", "close": "21:00" },
        "tuesday": { "open": "09:00", "close": "21:00" }
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### Get Store Details
```http
GET /api/retail/stores/:id
```

#### Create Store
```http
POST /api/retail/stores
```

Request body:
```json
{
  "name": "New Store",
  "code": "NS001",
  "building_id": "uuid",
  "mall_id": "uuid",
  "timezone": "America/New_York",
  "floor_area_sqm": 500,
  "operating_hours": {}
}
```

### Foot Traffic

#### Get Real-time Traffic
```http
GET /api/retail/traffic/realtime/:store_id
```

Response:
```json
{
  "store_id": "uuid",
  "current_occupancy": 145,
  "last_hour_in": 203,
  "last_hour_out": 198,
  "trend": "increasing",
  "last_updated": "2024-01-01T12:00:00Z"
}
```

#### Submit Traffic Data
```http
POST /api/retail/traffic
```

Request body:
```json
{
  "store_id": "uuid",
  "sensor_id": "SENSOR001",
  "timestamp": "2024-01-01T12:00:00Z",
  "count_in": 15,
  "count_out": 12
}
```

#### Get Traffic History
```http
GET /api/retail/traffic/history/:store_id
```

Query parameters:
- `start_date`: ISO date string
- `end_date`: ISO date string
- `granularity`: `hourly`, `daily`, `weekly`, `monthly`

### Sales Integration

#### Sync Sales Data
```http
POST /api/retail/sales/sync
```

Request body:
```json
{
  "store_id": "uuid",
  "pos_type": "shopify",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

#### Get Sales Analytics
```http
GET /api/retail/sales/analytics/:store_id
```

Query parameters:
- `period`: `today`, `week`, `month`, `custom`
- `start_date`: ISO date (if period is custom)
- `end_date`: ISO date (if period is custom)

Response:
```json
{
  "total_revenue": 125000.50,
  "transactions_count": 850,
  "avg_transaction_value": 147.06,
  "items_sold": 2340,
  "conversion_rate": 24.5,
  "top_products": [],
  "hourly_breakdown": []
}
```

### Capture Rate

#### Get Capture Rate
```http
GET /api/retail/capture-rate/:store_id
```

Query parameters:
- `date`: ISO date string
- `compare_to`: `yesterday`, `last_week`, `last_month`

Response:
```json
{
  "store_id": "uuid",
  "date": "2024-01-01",
  "capture_rate": 3.4,
  "mall_traffic": 10000,
  "store_entries": 340,
  "rank_in_mall": 5,
  "comparison": {
    "previous_rate": 3.1,
    "change_percent": 9.7
  }
}
```

### AI Insights

#### Get Predictions
```http
GET /api/retail/predictions/:store_id
```

Query parameters:
- `type`: `traffic`, `sales`, `conversion`
- `hours_ahead`: 1-24

Response:
```json
{
  "predictions": [
    {
      "timestamp": "2024-01-01T13:00:00Z",
      "type": "traffic",
      "predicted_value": 185,
      "confidence": 87.5,
      "factors": ["weather", "time_of_day", "day_of_week"]
    }
  ]
}
```

#### Get Recommendations
```http
GET /api/retail/recommendations/:store_id
```

Response:
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "type": "staffing",
      "priority": "high",
      "title": "Increase staff during peak hours",
      "description": "Analysis shows understaffing between 2-4 PM",
      "expected_impact": {
        "conversion_rate": "+2.5%",
        "revenue": "+$1,200/day"
      }
    }
  ]
}
```

### Targets & Performance

#### Set Targets
```http
POST /api/retail/targets
```

Request body:
```json
{
  "store_id": "uuid",
  "target_type": "sales",
  "period_type": "monthly",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "target_value": 150000,
  "stretch_value": 175000
}
```

#### Get Performance
```http
GET /api/retail/performance/:store_id
```

Query parameters:
- `period`: `today`, `week`, `month`
- `include_targets`: boolean

## Webhooks

### Configure Webhooks
```http
POST /api/retail/webhooks
```

Request body:
```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["traffic.anomaly", "sales.milestone", "target.achieved"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

#### Traffic Anomaly
```json
{
  "event": "traffic.anomaly",
  "store_id": "uuid",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "type": "sudden_drop",
    "severity": "high",
    "current_traffic": 5,
    "expected_traffic": 150
  }
}
```

#### Sales Milestone
```json
{
  "event": "sales.milestone",
  "store_id": "uuid",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "milestone": "daily_record",
    "value": 25000,
    "previous_record": 22000
  }
}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INVALID_REQUEST`: Request validation failed
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

API requests are limited to:
- 100 requests per minute for read operations
- 20 requests per minute for write operations

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704121200
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { RetailClient } from '@blipee/retail-sdk';

const client = new RetailClient({
  apiKey: 'your-api-key',
  storeId: 'your-store-id'
});

// Get real-time traffic
const traffic = await client.traffic.getRealtime();

// Submit sales data
await client.sales.sync({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### Python
```python
from blipee_retail import RetailClient

client = RetailClient(
    api_key='your-api-key',
    store_id='your-store-id'
)

# Get predictions
predictions = client.predictions.get(
    type='traffic',
    hours_ahead=4
)

# Set monthly target
client.targets.create(
    target_type='sales',
    period_type='monthly',
    target_value=150000
)
```