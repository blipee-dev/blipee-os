# Chat API Documentation

## Overview

The Chat API provides endpoints for managing conversations and sending messages to AI agents.

## Base URL

```
http://localhost:3005/api  (development)
https://v2.blipee.com/api  (production)
```

## Authentication

All endpoints require authentication via Supabase JWT token in cookies.

---

## Endpoints

### 1. Send Message

Send a message and receive AI response.

**Endpoint:** `POST /api/chat/completions`

**Request Body:**

```json
{
  "message": "What are the top 3 ways to reduce carbon emissions?",
  "conversationId": "optional-uuid-if-continuing-conversation",
  "agentType": "carbon_hunter",
  "contextType": "building",
  "contextEntities": ["building-uuid"],
  "buildingId": "building-uuid"
}
```

**Response:**

```json
{
  "conversationId": "uuid",
  "message": {
    "id": "message-uuid",
    "role": "assistant",
    "content": "Here are the top 3 ways...",
    "createdAt": "2025-01-12T10:00:00Z"
  },
  "usage": {
    "promptTokens": 150,
    "completionTokens": 300,
    "totalTokens": 450
  },
  "latencyMs": 1234
}
```

**Agent Types:**

- `chief_of_staff` (default)
- `compliance_guardian`
- `carbon_hunter`
- `supply_chain_investigator`
- `cost_saving_finder`
- `energy_optimizer`
- `esg_analyst`
- `data_insights_specialist`

---

### 2. List Conversations

Get user's conversations with pagination.

**Endpoint:** `GET /api/conversations`

**Query Parameters:**

- `limit` - Number of conversations (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)
- `archived` - Include archived (default: false)
- `agentType` - Filter by agent type
- `search` - Search in title/summary

**Example:**

```bash
GET /api/conversations?limit=20&offset=0&agentType=carbon_hunter
```

**Response:**

```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Carbon Reduction Strategies",
      "type": "carbon_hunter",
      "status": "active",
      "message_count": 12,
      "last_message_at": "2025-01-12T10:00:00Z",
      "created_at": "2025-01-10T08:00:00Z",
      ...
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 3. Create Conversation

Create a new conversation.

**Endpoint:** `POST /api/conversations`

**Request Body:**

```json
{
  "title": "My New Conversation",
  "agentType": "chief_of_staff",
  "contextType": "organization",
  "contextEntities": ["org-uuid"],
  "buildingId": "building-uuid"
}
```

**Response:**

```json
{
  "conversation": {
    "id": "uuid",
    "title": "My New Conversation",
    "type": "chief_of_staff",
    ...
  }
}
```

---

### 4. Get Conversation

Get conversation details by ID.

**Endpoint:** `GET /api/conversations/[id]`

**Response:**

```json
{
  "conversation": {
    "id": "uuid",
    "title": "Carbon Reduction Strategies",
    "type": "carbon_hunter",
    "status": "active",
    "message_count": 12,
    ...
  }
}
```

---

### 5. Update Conversation

Update conversation metadata.

**Endpoint:** `PATCH /api/conversations/[id]`

**Request Body:**

```json
{
  "title": "Updated Title",
  "is_archived": true,
  "is_pinned": false,
  "summary": "Conversation summary",
  "tags": ["carbon", "reduction"]
}
```

**Response:**

```json
{
  "conversation": {
    "id": "uuid",
    "title": "Updated Title",
    ...
  }
}
```

---

### 6. Delete Conversation

Soft delete a conversation.

**Endpoint:** `DELETE /api/conversations/[id]`

**Response:**

```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "status": "deleted",
    ...
  }
}
```

---

### 7. Get Messages

Get messages for a conversation with pagination.

**Endpoint:** `GET /api/conversations/[id]/messages`

**Query Parameters:**

- `limit` - Number of messages (default: 50, max: 100)
- `before` - Get messages before this message ID
- `after` - Get messages after this message ID

**Example:**

```bash
GET /api/conversations/abc-123/messages?limit=50
```

**Response:**

```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "role": "user",
      "content": "What are the top ways to reduce carbon?",
      "created_at": "2025-01-12T10:00:00Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "Here are the top ways...",
      "model": "claude-sonnet-4-5",
      "prompt_tokens": 150,
      "completion_tokens": 300,
      "total_tokens": 450,
      "latency_ms": 1234,
      "cost_usd": 0.001234,
      "created_at": "2025-01-12T10:00:02Z"
    }
  ],
  "pagination": {
    "total": 24,
    "limit": 50,
    "hasMore": false
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": [] // Optional additional details
}
```

**Common Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Rate Limiting

- Default: 20 requests per minute per user
- Configurable via `CHAT_RATE_LIMIT_PER_MINUTE` env var
- Returns `429 Too Many Requests` when exceeded

---

## Testing with cURL

### Send a message:

```bash
curl -X POST http://localhost:3005/api/chat/completions \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "message": "What are the benefits of renewable energy?",
    "agentType": "energy_optimizer"
  }'
```

### List conversations:

```bash
curl http://localhost:3005/api/conversations \
  -H "Cookie: your-session-cookie"
```

### Get messages:

```bash
curl http://localhost:3005/api/conversations/[conversation-id]/messages \
  -H "Cookie: your-session-cookie"
```

---

## Next Steps

After the API layer, we'll implement:

1. **React Hooks** (`useChat`, `useConversations`, `useMessages`)
2. **UI Components** (ChatInterface, MessageList, MessageInput)
3. **Streaming** (Server-Sent Events for real-time responses)
4. **Advanced Features** (regenerate, edit, branching, export)
