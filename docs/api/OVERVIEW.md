# Blipee OS API Documentation

## Overview

The Blipee OS API is designed around a single principle: everything is a conversation. Instead of hundreds of endpoints, we have a few powerful ones that understand natural language and generate appropriate responses.

## Base URL

```
Production: https://api.blipee.com
Development: http://localhost:3000/api
```

## Authentication

All API requests require authentication via Supabase Auth JWT tokens.

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Core Endpoints

### 1. Conversation API

The main endpoint that powers Blipee OS.

#### POST `/api/ai/chat`

Process a conversational message and return appropriate response with optional UI components.

**Request:**
```typescript
{
  "message": "Show me energy usage for the last week",
  "conversationId": "uuid", // Optional, creates new if not provided
  "buildingId": "uuid",
  "stream": true, // Enable streaming responses
  "context": { // Optional additional context
    "timeRange": "last_week",
    "includeDevices": ["hvac", "lighting"]
  }
}
```

**Response (Streaming):**
```typescript
// Server-Sent Events stream
data: {"token": "Based"}
data: {"token": " on"}
data: {"token": " your"}
data: {"token": " building's"}
data: {"token": " data"}
data: {"token": "..."}
data: {"done": true, "components": [...], "actions": [...]}
```

**Response (Non-streaming):**
```typescript
{
  "message": "Based on your building's data, here's the energy usage for the last week. Total consumption was 5,420 kWh, which is 12% lower than the previous week.",
  "components": [
    {
      "type": "chart",
      "props": {
        "title": "Weekly Energy Usage",
        "data": [...],
        "chartType": "line",
        "yAxis": "kWh",
        "xAxis": "date"
      }
    }
  ],
  "actions": [
    {
      "type": "insight",
      "description": "HVAC usage dropped significantly on Thursday"
    }
  ],
  "suggestions": [
    "What caused the drop on Thursday?",
    "Show me a breakdown by device type",
    "Compare to same week last year"
  ],
  "metadata": {
    "tokensUsed": 245,
    "model": "gpt-4",
    "responseTime": 1240
  }
}
```

### 2. Building Context API

Provides real-time building state and context.

#### GET `/api/building/context/:buildingId`

Get current building context including devices, state, and patterns.

**Response:**
```typescript
{
  "id": "uuid",
  "name": "Downtown Office Tower",
  "currentState": {
    "energyUsage": 4520, // watts
    "temperature": 22.5, // celsius
    "humidity": 45, // percentage
    "occupancy": 127, // people
    "co2": 420 // ppm
  },
  "devices": {
    "online": 47,
    "offline": 2,
    "alerts": 1
  },
  "trends": {
    "energyTrend": "decreasing",
    "comfortScore": 8.5,
    "efficiencyScore": 7.2
  },
  "alerts": [
    {
      "id": "uuid",
      "severity": "warning",
      "message": "Chiller efficiency below threshold",
      "device": "chiller-01",
      "timestamp": "2024-01-10T14:30:00Z"
    }
  ]
}
```

### 3. Device Control API

Execute actions on building devices.

#### POST `/api/building/control`

Control devices based on AI-generated or direct commands.

**Request:**
```typescript
{
  "buildingId": "uuid",
  "actions": [
    {
      "deviceId": "hvac-zone-3",
      "command": "setTemperature",
      "value": 21.5
    },
    {
      "deviceId": "lights-floor-2",
      "command": "turnOff"
    }
  ],
  "source": "ai_recommendation", // or "manual"
  "reason": "Optimizing for energy savings"
}
```

**Response:**
```typescript
{
  "success": true,
  "executed": [
    {
      "deviceId": "hvac-zone-3",
      "status": "success",
      "previousValue": 23.0,
      "newValue": 21.5
    },
    {
      "deviceId": "lights-floor-2",
      "status": "success",
      "previousValue": "on",
      "newValue": "off"
    }
  ],
  "estimatedImpact": {
    "energySavings": "45W",
    "costSavings": "$0.12/hour"
  }
}
```

### 4. Analytics API

Retrieve building analytics and insights.

#### GET `/api/building/analytics/:buildingId`

Get analytics data for visualization and reporting.

**Query Parameters:**
- `metric`: energy | temperature | occupancy | air_quality
- `timeRange`: hour | day | week | month | year | custom
- `startDate`: ISO 8601 date (for custom range)
- `endDate`: ISO 8601 date (for custom range)
- `resolution`: minute | hour | day | week | month
- `devices`: Comma-separated device IDs (optional)

**Response:**
```typescript
{
  "metric": "energy",
  "timeRange": "week",
  "data": [
    {
      "timestamp": "2024-01-10T00:00:00Z",
      "value": 4520,
      "breakdown": {
        "hvac": 2100,
        "lighting": 1200,
        "equipment": 1220
      }
    }
    // ... more data points
  ],
  "summary": {
    "total": 35420,
    "average": 5060,
    "peak": 7200,
    "low": 2100
  },
  "insights": [
    "Energy usage peaks at 2 PM daily",
    "Weekend usage is 60% lower than weekdays"
  ]
}
```

### 5. UI Generation API

Generate UI components based on natural language descriptions.

#### POST `/api/ai/generate`

Generate UI components for specific data visualizations.

**Request:**
```typescript
{
  "description": "Create a pie chart showing energy usage by device type for today",
  "buildingId": "uuid",
  "preferences": {
    "colorScheme": "default",
    "size": "medium"
  }
}
```

**Response:**
```typescript
{
  "component": {
    "type": "chart",
    "props": {
      "chartType": "pie",
      "data": [
        { "name": "HVAC", "value": 45, "color": "#0EA5E9" },
        { "name": "Lighting", "value": 25, "color": "#8B5CF6" },
        { "name": "Equipment", "value": 20, "color": "#10B981" },
        { "name": "Other", "value": 10, "color": "#F59E0B" }
      ],
      "title": "Energy Usage by Device Type - Today",
      "showLegend": true,
      "showValues": true
    }
  }
}
```

## WebSocket Events

Real-time updates via WebSocket connection.

### Connection

```typescript
const ws = new WebSocket('wss://api.blipee.com/ws');
ws.send(JSON.stringify({
  type: 'auth',
  token: authToken,
  buildingId: buildingId
}));
```

### Events

**Device Update:**
```typescript
{
  "type": "device:update",
  "data": {
    "deviceId": "hvac-01",
    "changes": {
      "temperature": 22.5,
      "status": "cooling"
    },
    "timestamp": "2024-01-10T14:30:00Z"
  }
}
```

**Alert:**
```typescript
{
  "type": "alert:new",
  "data": {
    "id": "uuid",
    "severity": "critical",
    "message": "Power outage detected in Zone 3",
    "actions": ["Switch to backup", "Notify maintenance"]
  }
}
```

**AI Insight:**
```typescript
{
  "type": "insight:generated",
  "data": {
    "message": "Unusual energy spike detected. Investigating...",
    "confidence": 0.92,
    "suggestedAction": "Check HVAC system in Building A"
  }
}
```

## Error Handling

All errors follow a consistent format:

```typescript
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "details": {
      "limit": 100,
      "window": "1m",
      "retryAfter": 60
    }
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Missing or invalid auth token | 401 |
| `FORBIDDEN` | No access to resource | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INVALID_REQUEST` | Malformed request | 400 |
| `AI_ERROR` | AI provider error | 503 |
| `INTERNAL_ERROR` | Server error | 500 |

## Rate Limits

- **Conversation API:** 100 requests/minute
- **Analytics API:** 300 requests/minute
- **Control API:** 50 requests/minute
- **WebSocket:** 1000 messages/minute

## Best Practices

### 1. Use Streaming for Long Responses
```typescript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ message, stream: true }),
  headers: { 'Content-Type': 'application/json' }
});

const reader = response.body.getReader();
// Process stream...
```

### 2. Cache Building Context
```typescript
// Cache context for 5 minutes
const context = await cache.get(`building:${buildingId}`) || 
                await fetchBuildingContext(buildingId);
```

### 3. Batch Device Controls
```typescript
// Good: Single request with multiple actions
await controlDevices([action1, action2, action3]);

// Bad: Multiple requests
await controlDevice(action1);
await controlDevice(action2);
await controlDevice(action3);
```

### 4. Handle Errors Gracefully
```typescript
try {
  const response = await blipeeChat(message);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Show user-friendly message
    // Retry after suggested time
  }
}
```

## SDK Example

```typescript
import { BlipeeOS } from '@blipee/sdk';

const blipee = new BlipeeOS({
  apiKey: process.env.BLIPEE_API_KEY,
  buildingId: 'your-building-id'
});

// Simple conversation
const response = await blipee.chat("Show me today's energy usage");

// With streaming
const stream = await blipee.chat("Generate monthly report", { 
  stream: true 
});

for await (const chunk of stream) {
  console.log(chunk.token);
}

// Control devices
await blipee.control({
  device: 'hvac-01',
  command: 'setTemperature',
  value: 21.5
});

// Subscribe to real-time updates
blipee.on('device:update', (data) => {
  console.log('Device updated:', data);
});
```

---

This API is designed to be simple yet powerful, enabling natural language interaction with buildings while providing the flexibility to build any interface imaginable.