# API Endpoints Reference

**Version**: 1.0.0  
**Date**: 2025-08-29  
**Base URL**: `https://your-domain.com/api`  

## 🎯 Overview

Complete reference for blipee OS AI Infrastructure API endpoints, including authentication, request/response formats, and usage examples.

## 🔐 Authentication

All API endpoints require authentication via Supabase Auth.

```typescript
// Client-side authentication
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

// Include auth header in requests
const { data: { session } } = await supabase.auth.getSession()
const authHeader = {
  'Authorization': `Bearer ${session?.access_token}`
}
```

## 📦 AI Queue Management

### GET /api/ai/queue

Get queue statistics and status information.

#### Parameters
- `action` (string, optional): Action to perform
  - `stats` (default): Get queue statistics
  - `status`: Get specific request status (requires `requestId`)
  - `cleanup`: Clean up old requests (admin only)
- `requestId` (string, optional): Request ID for status check

#### Response
```typescript
{
  "success": true,
  "action": "stats",
  "timestamp": "2025-08-29T12:00:00.000Z",
  "data": {
    "queueSize": 42,
    "totalProcessed": 1547,
    "totalFailed": 23,
    "avgProcessingTime": 2400,
    "activeWorkers": 3
  }
}
```

#### Examples
```bash
# Get queue statistics
curl -X GET "https://your-domain.com/api/ai/queue?action=stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get request status
curl -X GET "https://your-domain.com/api/ai/queue?action=status&requestId=abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clean up old requests (admin only)
curl -X GET "https://your-domain.com/api/ai/queue?action=cleanup" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /api/ai/queue

Enqueue a new AI request for processing.

#### Request Body
```typescript
{
  "provider": "deepseek" | "openai" | "anthropic",
  "model": string,
  "messages": Array<{
    "role": "system" | "user" | "assistant",
    "content": string
  }>,
  "priority": "low" | "normal" | "high" | "critical",
  "organizationId": string,
  "conversationId": string | null,
  "maxRetries": number | null,
  "timeout": number | null
}
```

#### Response
```typescript
// Cache hit response
{
  "success": true,
  "cached": true,
  "response": {
    "id": "chatcmpl-abc123",
    "choices": [{
      "message": {
        "role": "assistant",
        "content": "Your carbon footprint for Q3 is 2,450 tons CO2e..."
      }
    }],
    "usage": {
      "promptTokens": 45,
      "completionTokens": 120,
      "totalTokens": 165
    }
  },
  "metadata": {
    "similarity": 0.92,
    "source": "semantic_cache",
    "cachedAt": "2025-08-29T11:45:00.000Z",
    "costSaved": true
  }
}

// Cache miss response  
{
  "success": true,
  "cached": false,
  "requestId": "req_abc123def456",
  "message": "AI request enqueued successfully",
  "timestamp": "2025-08-29T12:00:00.000Z"
}
```

#### Examples
```bash
# Enqueue ESG query
curl -X POST "https://your-domain.com/api/ai/queue" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "deepseek",
    "model": "deepseek-chat",
    "messages": [{
      "role": "user", 
      "content": "What is our carbon footprint for Q3?"
    }],
    "priority": "normal",
    "organizationId": "org-123",
    "conversationId": "conv-456"
  }'

# High priority sustainability alert
curl -X POST "https://your-domain.com/api/ai/queue" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model": "gpt-4",
    "messages": [{
      "role": "user",
      "content": "URGENT: Scope 1 emissions exceeded threshold - provide immediate analysis"
    }],
    "priority": "critical",
    "organizationId": "org-123"
  }'
```

### DELETE /api/ai/queue

Cancel a pending AI request (if possible).

#### Parameters
- `requestId` (string, required): ID of request to cancel

#### Response
```typescript
{
  "message": "Request cancellation not yet implemented",
  "requestId": "req_abc123",
  "currentStatus": "pending",
  "timestamp": "2025-08-29T12:00:00.000Z"
}
```

#### Examples
```bash
# Cancel pending request
curl -X DELETE "https://your-domain.com/api/ai/queue?requestId=req_abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 💰 Cost Optimization

### GET /api/ai/cost

Get cost metrics, alerts, recommendations, and budget information.

#### Parameters
- `action` (string, required): Action to perform
  - `summary`: Get cost summary overview
  - `metrics`: Get detailed cost metrics
  - `alerts`: Get budget alerts
  - `recommendations`: Get optimization recommendations
  - `provider-recommendation`: Get optimal provider suggestion
- `organizationId` (string, required): Organization ID
- `period` (string, optional): Time period for metrics (`hourly`, `daily`, `weekly`, `monthly`)
- `limit` (number, optional): Number of periods to return (default: 30)
- `requestType` (string, optional): For provider recommendations (`simple`, `complex`, `creative`)
- `priority` (string, optional): Request priority (`low`, `normal`, `high`, `critical`)

#### Response Examples

##### Cost Summary
```typescript
{
  "success": true,
  "data": {
    "period": "7 days",
    "totalCost": 0.0234,
    "totalSavings": 0.1876,
    "savingsPercentage": 88.9,
    "avgCacheHitRate": 67.3,
    "activeAlerts": 0,
    "pendingRecommendations": 2,
    "estimatedMonthlySavings": 45.67,
    "topProviders": ["deepseek", "openai"],
    "costTrend": "decreasing"
  }
}
```

##### Cost Metrics
```typescript
{
  "success": true,
  "data": [
    {
      "organizationId": "org-123",
      "period": "daily",
      "startTime": 1703808000000,
      "endTime": 1703894400000,
      "totalCost": 0.0456,
      "costByProvider": {
        "deepseek": 0.0123,
        "openai": 0.0333
      },
      "costByModel": {
        "deepseek-chat": 0.0123,
        "gpt-4": 0.0333
      },
      "costSavingsFromCache": 0.0234,
      "totalRequests": 127,
      "totalTokensUsed": 15420,
      "totalTokensSaved": 8730,
      "cacheHitRate": 36.2,
      "avgLatencyByProvider": {
        "deepseek": 2400,
        "openai": 1800
      },
      "errorRateByProvider": {
        "deepseek": 0.8,
        "openai": 0.3
      },
      "costPerRequest": 0.000359,
      "costPerToken": 0.00000296,
      "roi": 51.3
    }
  ]
}
```

##### Budget Alerts
```typescript
{
  "success": true,
  "data": [
    {
      "id": "alert_abc123",
      "organizationId": "org-123",
      "type": "budget_warning",
      "severity": "medium",
      "message": "Budget warning: Current usage: $67.45 (67.5% of $100 monthly budget)",
      "currentCost": 67.45,
      "budgetLimit": 100.0,
      "threshold": 70,
      "createdAt": 1703808000000,
      "acknowledged": false
    }
  ]
}
```

##### Optimization Recommendations
```typescript
{
  "success": true,
  "data": [
    {
      "id": "rec_abc123",
      "organizationId": "org-123",
      "type": "provider_switch",
      "priority": "high",
      "title": "Switch to DeepSeek for Cost Efficiency",
      "description": "OpenAI usage represents 73% of your costs. DeepSeek provides similar quality at 95% lower cost for most ESG queries.",
      "estimatedSavings": {
        "monthly": 156.78,
        "percentage": 85
      },
      "implementation": {
        "difficulty": "easy",
        "timeToImplement": "30 minutes",
        "steps": [
          "Update AI service configuration to prefer DeepSeek",
          "Test critical queries with DeepSeek",
          "Gradually migrate traffic over 1 week"
        ]
      },
      "createdAt": 1703808000000,
      "status": "pending"
    }
  ]
}
```

##### Provider Recommendation
```typescript
{
  "success": true,
  "data": {
    "provider": "deepseek",
    "model": "deepseek-chat",
    "reasoning": "DeepSeek provides optimal balance of cost, performance, and reliability for ESG queries",
    "estimatedCost": 0.0002,
    "estimatedLatency": 2400,
    "confidence": 0.92,
    "alternatives": [
      {
        "provider": "openai",
        "model": "gpt-3.5-turbo", 
        "estimatedCost": 0.0012,
        "reasoning": "Higher cost but potentially better accuracy"
      }
    ]
  }
}
```

#### Examples
```bash
# Get cost summary
curl -X GET "https://your-domain.com/api/ai/cost?action=summary&organizationId=org-123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get daily cost metrics
curl -X GET "https://your-domain.com/api/ai/cost?action=metrics&period=daily&limit=7&organizationId=org-123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get budget alerts
curl -X GET "https://your-domain.com/api/ai/cost?action=alerts&organizationId=org-123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get optimization recommendations
curl -X GET "https://your-domain.com/api/ai/cost?action=recommendations&organizationId=org-123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get provider recommendation
curl -X GET "https://your-domain.com/api/ai/cost?action=provider-recommendation&requestType=simple&priority=normal&organizationId=org-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /api/ai/cost

Set budgets and configure cost optimization settings.

#### Request Body
```typescript
{
  "action": "set-budget",
  "organizationId": "org-123",
  "period": "daily" | "weekly" | "monthly",
  "limit": number,
  "warningThreshold": number, // percentage (e.g., 80 for 80%)
  "alertThreshold": number,   // percentage (e.g., 90 for 90%)
  "rolloverUnused": boolean
}
```

#### Response
```typescript
{
  "success": true,
  "budgetId": "budget_abc123",
  "message": "Budget set successfully",
  "budget": {
    "organizationId": "org-123",
    "period": "monthly",
    "limit": 100.0,
    "warningThreshold": 80,
    "alertThreshold": 90,
    "rolloverUnused": false,
    "createdAt": 1703808000000
  }
}
```

#### Examples
```bash
# Set monthly budget
curl -X POST "https://your-domain.com/api/ai/cost" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set-budget",
    "organizationId": "org-123",
    "period": "monthly",
    "limit": 100.0,
    "warningThreshold": 80,
    "alertThreshold": 90,
    "rolloverUnused": false
  }'
```

### PUT /api/ai/cost

Update cost optimization settings and acknowledge alerts.

#### Request Body
```typescript
{
  "action": "acknowledge-alert" | "update-recommendation",
  "organizationId": "org-123",
  "alertId"?: "alert_abc123",
  "recommendationId"?: "rec_abc123",
  "status"?: "implemented" | "dismissed"
}
```

#### Response
```typescript
{
  "success": true,
  "message": "Alert acknowledged successfully",
  "updatedAt": "2025-08-29T12:00:00.000Z"
}
```

#### Examples
```bash
# Acknowledge budget alert
curl -X PUT "https://your-domain.com/api/ai/cost" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "acknowledge-alert",
    "organizationId": "org-123",
    "alertId": "alert_abc123"
  }'

# Mark recommendation as implemented
curl -X PUT "https://your-domain.com/api/ai/cost" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update-recommendation",
    "organizationId": "org-123", 
    "recommendationId": "rec_abc123",
    "status": "implemented"
  }'
```

### DELETE /api/ai/cost

Clean up old cost data and metrics.

#### Parameters
- `action` (string, required): Cleanup action
  - `cleanup-metrics`: Remove old metrics data
  - `reset-budget`: Reset current budget period
- `organizationId` (string, required): Organization ID
- `beforeDate` (string, optional): ISO date string for cleanup cutoff

#### Response
```typescript
{
  "success": true,
  "message": "Cleanup completed successfully",
  "deletedRecords": 1247,
  "timestamp": "2025-08-29T12:00:00.000Z"
}
```

#### Examples
```bash
# Clean up old metrics
curl -X DELETE "https://your-domain.com/api/ai/cost?action=cleanup-metrics&organizationId=org-123&beforeDate=2025-01-01T00:00:00.000Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Real-time Updates

### WebSocket Integration

For real-time updates on request status and cost metrics, use Supabase Realtime:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Subscribe to AI request updates
const channel = supabase
  .channel('ai-updates')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'ai_requests',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      console.log('AI request update:', payload)
      
      if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
        // Handle completed request
        handleRequestComplete(payload.new)
      }
    }
  )
  .subscribe()

// Subscribe to cost alerts
supabase
  .channel('cost-alerts')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public', 
      table: 'cost_alerts',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      console.log('New cost alert:', payload.new)
      showCostAlert(payload.new)
    }
  )
  .subscribe()
```

## 📊 Response Codes

### Success Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully

### Error Codes
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Response Format
```typescript
{
  "error": "Brief error description",
  "details": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-29T12:00:00.000Z",
  "requestId": "req_abc123"
}
```

## 🔄 Rate Limiting

### Limits by Endpoint
- **AI Queue**: 100 requests/minute per organization
- **Cost Metrics**: 60 requests/minute per organization  
- **General**: 1000 requests/hour per user

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703808060
X-RateLimit-Window: 60
```

### Rate Limit Response
```typescript
{
  "error": "Rate limit exceeded",
  "details": "Maximum 100 requests per minute allowed",
  "retryAfter": 45,
  "timestamp": "2025-08-29T12:00:00.000Z"
}
```

## 🎯 Best Practices

### Request Optimization
1. **Use semantic caching** - Similar queries return cached responses
2. **Set appropriate priorities** - Reserve 'critical' for emergencies  
3. **Batch requests** when possible - Reduce API overhead
4. **Monitor usage** - Track costs and performance

### Error Handling
1. **Implement retry logic** - Handle transient failures
2. **Use exponential backoff** - Avoid overwhelming services
3. **Handle rate limits** - Respect API limits
4. **Log errors** - Monitor for patterns

### Security
1. **Validate inputs** - Sanitize all user data
2. **Use HTTPS** - Encrypt all communications
3. **Rotate tokens** - Regular credential rotation
4. **Monitor access** - Watch for unusual patterns

### Performance
1. **Cache responses** - Reduce redundant requests
2. **Use connection pooling** - Optimize network usage
3. **Monitor latency** - Track response times
4. **Optimize payloads** - Minimize request/response size

## 📚 SDK Examples

### TypeScript/JavaScript
```typescript
import { BlipeeAI } from '@blipee/ai-sdk'

const ai = new BlipeeAI({
  apiKey: 'your_api_key',
  baseUrl: 'https://your-domain.com/api'
})

// Queue AI request
const response = await ai.queue.enqueue({
  provider: 'deepseek',
  model: 'deepseek-chat',
  messages: [{ role: 'user', content: 'What is our carbon footprint?' }],
  priority: 'normal',
  organizationId: 'org-123'
})

// Get cost metrics  
const metrics = await ai.cost.getMetrics({
  organizationId: 'org-123',
  period: 'daily',
  limit: 7
})

// Set budget
await ai.cost.setBudget({
  organizationId: 'org-123',
  period: 'monthly',
  limit: 100.0,
  warningThreshold: 80
})
```

### Python
```python
import requests
import json

class BlipeeAI:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def enqueue_request(self, provider, model, messages, **kwargs):
        data = {
            'provider': provider,
            'model': model, 
            'messages': messages,
            **kwargs
        }
        
        response = requests.post(
            f'{self.base_url}/ai/queue',
            headers=self.headers,
            data=json.dumps(data)
        )
        
        return response.json()
    
    def get_cost_metrics(self, organization_id, period='daily', limit=30):
        params = {
            'action': 'metrics',
            'organizationId': organization_id,
            'period': period,
            'limit': limit
        }
        
        response = requests.get(
            f'{self.base_url}/ai/cost',
            headers=self.headers,
            params=params
        )
        
        return response.json()

# Usage
ai = BlipeeAI('your_api_key', 'https://your-domain.com/api')

# Queue request
result = ai.enqueue_request(
    'deepseek',
    'deepseek-chat',
    [{'role': 'user', 'content': 'What is our carbon footprint?'}],
    organizationId='org-123',
    priority='normal'
)

# Get metrics
metrics = ai.get_cost_metrics('org-123', 'daily', 7)
```

### cURL Scripts
```bash
#!/bin/bash
# Blipee AI API Helper Script

API_BASE="https://your-domain.com/api"
AUTH_TOKEN="your_token_here"
ORG_ID="org-123"

# Function to enqueue AI request
enqueue_request() {
    local provider="$1"
    local model="$2"
    local message="$3"
    local priority="${4:-normal}"
    
    curl -X POST "${API_BASE}/ai/queue" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"provider\": \"${provider}\",
            \"model\": \"${model}\",
            \"messages\": [{\"role\": \"user\", \"content\": \"${message}\"}],
            \"priority\": \"${priority}\",
            \"organizationId\": \"${ORG_ID}\"
        }"
}

# Function to get cost summary
get_cost_summary() {
    curl -X GET "${API_BASE}/ai/cost?action=summary&organizationId=${ORG_ID}" \
        -H "Authorization: Bearer ${AUTH_TOKEN}"
}

# Function to set budget
set_budget() {
    local period="$1"
    local limit="$2"
    
    curl -X POST "${API_BASE}/ai/cost" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"action\": \"set-budget\",
            \"organizationId\": \"${ORG_ID}\",
            \"period\": \"${period}\",
            \"limit\": ${limit},
            \"warningThreshold\": 80,
            \"alertThreshold\": 90
        }"
}

# Usage examples
echo "Enqueueing AI request..."
enqueue_request "deepseek" "deepseek-chat" "What is our Scope 1 emissions?" "normal"

echo -e "\n\nGetting cost summary..."
get_cost_summary

echo -e "\n\nSetting monthly budget..."
set_budget "monthly" 100.0
```

---

**API Reference Version**: 1.0.0  
**Last Updated**: 2025-08-29  
**Status**: Production Ready ✅

For additional support, refer to the main documentation or contact the development team.