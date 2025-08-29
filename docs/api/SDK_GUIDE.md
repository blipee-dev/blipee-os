# Blipee OS SDK Guide

## Installation

### JavaScript/TypeScript
```bash
npm install @blipee/sdk
# or
yarn add @blipee/sdk
```

### Python
```bash
pip install blipee-sdk
```

## Quick Start

### JavaScript/TypeScript

```typescript
import { BlipeeClient } from '@blipee/sdk';

// Initialize client
const client = new BlipeeClient({
  baseURL: 'https://api.blipee.com/v1', // Optional, defaults to production
  timeout: 30000, // Optional, 30 seconds default
});

// Sign in
const { user, session } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'secure-password'
});

// Chat with AI
const response = await client.ai.chat({
  message: 'What are our Scope 2 emissions this quarter?'
});

console.log(response.message);
response.components.forEach(component => {
  console.log(`Render ${component.type} with:`, component.props);
});
```

### Python

```python
from blipee import BlipeeClient

# Initialize client
client = BlipeeClient(
    base_url='https://api.blipee.com/v1',  # Optional
    timeout=30  # Optional, seconds
)

# Sign in
auth_response = client.auth.sign_in(
    email='user@example.com',
    password='secure-password'
)

# Chat with AI
response = client.ai.chat(
    message='What are our Scope 2 emissions this quarter?'
)

print(response.message)
for component in response.components:
    print(f"Render {component.type} with: {component.props}")
```

## Advanced Usage

### Error Handling

#### JavaScript/TypeScript
```typescript
import { BlipeeError, RateLimitError, AuthError } from '@blipee/sdk';

try {
  const response = await client.ai.chat({ message });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof AuthError) {
    // Re-authenticate
    await client.auth.signIn({ email, password });
  } else if (error instanceof BlipeeError) {
    console.error('API error:', error.message, error.code);
  }
}
```

#### Python
```python
from blipee.exceptions import RateLimitError, AuthError, BlipeeError

try:
    response = client.ai.chat(message=message)
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except AuthError:
    # Re-authenticate
    client.auth.sign_in(email=email, password=password)
except BlipeeError as e:
    print(f"API error: {e.message} (Code: {e.code})")
```

### Streaming Responses

For real-time AI responses:

#### JavaScript/TypeScript
```typescript
const stream = await client.ai.chatStream({
  message: 'Generate a comprehensive ESG report',
  onChunk: (chunk) => {
    console.log('Received:', chunk);
  },
  onComponent: (component) => {
    console.log('Render component:', component);
  }
});

// Cancel streaming if needed
stream.abort();
```

### File Uploads

#### JavaScript/TypeScript
```typescript
// Upload from browser
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const file = fileInput.files[0];

const uploadResult = await client.files.upload({
  file,
  conversationId: 'conv_123'
});

console.log('Extracted data:', uploadResult.extractedData);

// Upload from Node.js
import fs from 'fs';

const file = fs.createReadStream('utility-bill.pdf');
const uploadResult = await client.files.upload({
  file,
  filename: 'utility-bill.pdf',
  conversationId: 'conv_123'
});
```

#### Python
```python
# Upload file
with open('utility-bill.pdf', 'rb') as f:
    result = client.files.upload(
        file=f,
        conversation_id='conv_123'
    )
    
print(f"Extracted data: {result.extracted_data}")
```

### Batch Operations

#### JavaScript/TypeScript
```typescript
// Batch emissions queries
const buildings = ['bld_1', 'bld_2', 'bld_3'];

const emissionsData = await Promise.all(
  buildings.map(buildingId =>
    client.metrics.getEmissions({
      buildingId,
      startDate: '2025-01-01',
      endDate: '2025-08-31'
    })
  )
);
```

### Webhooks

#### JavaScript/TypeScript (Express.js)
```typescript
import { verifyWebhookSignature } from '@blipee/sdk';

app.post('/webhooks/blipee', (req, res) => {
  const signature = req.headers['x-blipee-signature'];
  const isValid = verifyWebhookSignature(
    req.body,
    signature,
    process.env.BLIPEE_WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  const { event, data } = req.body;
  console.log(`Received ${event} event:`, data);
  
  res.status(200).send('OK');
});
```

### Custom Configuration

#### JavaScript/TypeScript
```typescript
const client = new BlipeeClient({
  baseURL: 'https://api.blipee.com/v1',
  timeout: 60000, // 60 seconds
  retryConfig: {
    retries: 3,
    retryDelay: 1000, // Start with 1 second
    retryCondition: (error) => {
      return error.response?.status >= 500 || error.code === 'ETIMEDOUT';
    }
  },
  onRequest: (config) => {
    console.log('Request:', config.method, config.url);
  },
  onResponse: (response) => {
    console.log('Response:', response.status);
  }
});
```

### TypeScript Types

The SDK includes full TypeScript definitions:

```typescript
import type {
  User,
  Organization,
  Building,
  ChatResponse,
  EmissionsData,
  Report,
  Webhook,
  SecurityAuditLog
} from '@blipee/sdk';

// Type-safe operations
const org: Organization = await client.organizations.create({
  name: 'Test Org',
  industry: 'Technology',
  size: 'medium'
});

// Autocomplete and type checking
const emissions: EmissionsData = await client.metrics.getEmissions({
  buildingId: org.buildings[0].id,
  scope: 'all', // Type: 'scope1' | 'scope2' | 'scope3' | 'all'
  startDate: '2025-01-01',
  endDate: '2025-08-31'
});
```

## Best Practices

### 1. Session Management
```typescript
// Store session info
let sessionExpiresAt = new Date(session.expiresAt);

// Check before requests
if (new Date() >= sessionExpiresAt) {
  await client.auth.refresh();
}
```

### 2. Error Recovery
```typescript
// Implement retry logic
async function reliableChat(message: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.ai.chat({ message });
    } catch (error) {
      if (error instanceof RateLimitError) {
        await sleep(error.retryAfter * 1000);
      } else if (i === maxRetries - 1) {
        throw error;
      }
    }
  }
}
```

### 3. Caching
```typescript
// Cache organization data
const orgCache = new Map();

async function getOrganization(id: string) {
  if (orgCache.has(id)) {
    return orgCache.get(id);
  }
  
  const org = await client.organizations.get(id);
  orgCache.set(id, org);
  
  // Expire after 5 minutes
  setTimeout(() => orgCache.delete(id), 5 * 60 * 1000);
  
  return org;
}
```

## Migration Guide

### From REST API to SDK

Before (REST):
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify({ message })
});
const data = await response.json();
```

After (SDK):
```javascript
const data = await client.ai.chat({ message });
```

## Support

- SDK Issues: https://github.com/blipee/sdk-js/issues
- Documentation: https://developers.blipee.com/sdk
- Examples: https://github.com/blipee/sdk-examples