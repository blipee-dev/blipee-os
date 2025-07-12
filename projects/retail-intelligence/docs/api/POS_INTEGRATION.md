# POS System Integration Guide

## Supported POS Systems

### 1. Shopify
- **Integration Type**: Webhook + REST API
- **Real-time**: Yes (webhooks)
- **Historical**: Yes (API polling)
- **Auth**: OAuth 2.0

### 2. Square
- **Integration Type**: Webhook + REST API
- **Real-time**: Yes (webhooks)
- **Historical**: Yes (API polling)
- **Auth**: OAuth 2.0

### 3. Generic REST API
- **Integration Type**: Polling/Webhook
- **Real-time**: Depends on system
- **Historical**: Yes
- **Auth**: Configurable

### 4. CSV Import
- **Integration Type**: File upload
- **Real-time**: No
- **Historical**: Yes
- **Auth**: API Key

## Shopify Integration

### Setup Process

1. **Create Private App**
```yaml
Required Scopes:
  - read_orders
  - read_products
  - read_customers
  - read_inventory
```

2. **Configure Webhooks**
```javascript
// Webhook topics to subscribe
const webhooks = [
  'orders/create',
  'orders/updated',
  'orders/cancelled',
  'refunds/create'
];

// Webhook endpoint
const endpoint = 'https://retail.blipee.ai/api/retail/webhooks/shopify';
```

3. **Initial Sync**
```http
POST https://retail.blipee.ai/api/retail/pos/shopify/sync
Authorization: Bearer <your-api-token>
Content-Type: application/json

{
  "store_id": "uuid",
  "shopify_domain": "your-store.myshopify.com",
  "access_token": "shppa_xxxxx",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

### Webhook Payload Example
```json
{
  "id": 820982911946154508,
  "email": "jon@doe.ca",
  "created_at": "2024-01-01T12:00:00-05:00",
  "updated_at": "2024-01-01T12:00:00-05:00",
  "total_price": "254.98",
  "currency": "USD",
  "line_items": [
    {
      "id": 866550311766439020,
      "variant_id": 31765594112,
      "title": "IPod Nano - Pink",
      "quantity": 1,
      "sku": "IPOD2008PINK",
      "price": "199.99",
      "product_id": 632910392
    }
  ],
  "customer": {
    "id": 115310627314723954,
    "email": "john@doe.ca",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Webhook Verification
```javascript
// Verify Shopify webhook
function verifyWebhook(data, hmacHeader) {
  const hash = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(data, 'utf8')
    .digest('base64');
  
  return hash === hmacHeader;
}
```

## Square Integration

### Setup Process

1. **OAuth Authorization**
```http
GET https://connect.squareup.com/oauth2/authorize?
  client_id=YOUR_CLIENT_ID&
  scope=MERCHANT_PROFILE_READ+PAYMENTS_READ+ITEMS_READ&
  redirect_uri=https://retail.blipee.ai/api/retail/pos/square/callback
```

2. **Configure Webhooks**
```json
{
  "notification_url": "https://retail.blipee.ai/api/retail/webhooks/square",
  "event_types": [
    "payment.created",
    "payment.updated",
    "refund.created",
    "inventory.count.updated"
  ]
}
```

3. **Initial Sync**
```http
POST https://retail.blipee.ai/api/retail/pos/square/sync
Authorization: Bearer <your-api-token>
Content-Type: application/json

{
  "store_id": "uuid",
  "square_access_token": "EAAAExxxxx",
  "location_id": "L1234567890",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

### Webhook Payload Example
```json
{
  "merchant_id": "MERCHANT_ID",
  "location_id": "LOCATION_ID",
  "type": "payment.created",
  "event_id": "12345678-1234-1234-1234-123456789012",
  "created_at": "2024-01-01T12:00:00Z",
  "data": {
    "type": "payment",
    "id": "KkAkhdMsgzn59SM8A89WgKwekxLZY",
    "object": {
      "payment": {
        "id": "KkAkhdMsgzn59SM8A89WgKwekxLZY",
        "created_at": "2024-01-01T12:00:00Z",
        "amount_money": {
          "amount": 5000,
          "currency": "USD"
        },
        "total_money": {
          "amount": 5000,
          "currency": "USD"
        }
      }
    }
  }
}
```

### Webhook Verification
```javascript
// Verify Square webhook
function verifyWebhook(body, signature) {
  const payload = JSON.stringify(body);
  const hash = crypto
    .createHmac('sha256', SQUARE_WEBHOOK_SIGNATURE_KEY)
    .update(payload)
    .digest('base64');
  
  return hash === signature;
}
```

## Generic REST API Integration

### Configuration Schema
```json
{
  "store_id": "uuid",
  "pos_type": "custom",
  "config": {
    "base_url": "https://api.your-pos.com",
    "auth_type": "bearer",
    "auth_credentials": {
      "token": "your-api-token"
    },
    "endpoints": {
      "transactions": "/v1/transactions",
      "products": "/v1/products",
      "customers": "/v1/customers"
    },
    "pagination": {
      "type": "cursor",
      "page_size": 100
    },
    "date_field": "created_at",
    "field_mapping": {
      "transaction_id": "id",
      "amount": "total_amount",
      "timestamp": "created_at",
      "items": "line_items",
      "customer_id": "customer.id"
    }
  }
}
```

### Polling Configuration
```json
{
  "polling": {
    "enabled": true,
    "interval_minutes": 15,
    "lookback_minutes": 30,
    "retry_strategy": {
      "max_retries": 3,
      "backoff_multiplier": 2
    }
  }
}
```

## CSV Import Format

### Transaction File Format
```csv
transaction_id,timestamp,amount,tax,discount,items,customer_id,staff_id,payment_method
TXN001,2024-01-01 12:00:00,99.99,8.99,5.00,3,CUST123,STAFF01,credit_card
TXN002,2024-01-01 12:15:00,45.50,4.09,0.00,1,CUST124,STAFF02,cash
```

### Line Items File Format
```csv
transaction_id,product_id,product_name,category,quantity,unit_price,total_price
TXN001,PROD001,Widget A,Widgets,2,25.00,50.00
TXN001,PROD002,Gadget B,Gadgets,1,49.99,49.99
```

### Upload Endpoint
```http
POST https://retail.blipee.ai/api/retail/pos/import
Authorization: Bearer <your-api-token>
Content-Type: multipart/form-data

Files:
- transactions.csv
- line_items.csv (optional)
```

## Data Mapping

### Standard Transaction Fields
```typescript
interface Transaction {
  // Required fields
  transaction_id: string;      // Unique ID from POS
  store_id: string;           // Blipee store ID
  timestamp: string;          // ISO 8601 format
  amount: number;             // Total amount
  
  // Optional fields
  tax_amount?: number;        // Tax amount
  discount_amount?: number;   // Discount applied
  items_count?: number;       // Number of items
  customer_id?: string;       // Customer identifier
  staff_id?: string;          // Staff member ID
  payment_method?: string;    // payment type
  
  // Line items
  items?: LineItem[];         // Detailed items
}

interface LineItem {
  product_id: string;         // Product identifier
  product_name: string;       // Product name
  category?: string;          // Product category
  quantity: number;           // Quantity sold
  unit_price: number;         // Price per unit
  total_price: number;        // Line total
}
```

## Real-time Sync Status

### Check Sync Status
```http
GET https://retail.blipee.ai/api/retail/pos/sync-status/:store_id
```

Response:
```json
{
  "store_id": "uuid",
  "pos_type": "shopify",
  "sync_status": "active",
  "last_sync": "2024-01-01T12:00:00Z",
  "next_sync": "2024-01-01T12:15:00Z",
  "statistics": {
    "transactions_synced_today": 145,
    "last_transaction_time": "2024-01-01T11:58:00Z",
    "sync_lag_seconds": 120,
    "error_rate": 0.1
  },
  "errors": []
}
```

### Manual Sync Trigger
```http
POST https://retail.blipee.ai/api/retail/pos/sync-now
Authorization: Bearer <your-api-token>
Content-Type: application/json

{
  "store_id": "uuid",
  "sync_type": "incremental",
  "force": false
}
```

## Error Handling

### Common POS Integration Errors

#### 1. Authentication Failed
```json
{
  "error": {
    "code": "POS_AUTH_FAILED",
    "message": "Failed to authenticate with Shopify",
    "details": {
      "store": "your-store.myshopify.com",
      "error": "Invalid access token"
    }
  }
}
```

#### 2. Rate Limited
```json
{
  "error": {
    "code": "POS_RATE_LIMITED",
    "message": "Square API rate limit exceeded",
    "details": {
      "retry_after": 60,
      "limit": "600/hour"
    }
  }
}
```

#### 3. Data Validation Error
```json
{
  "error": {
    "code": "INVALID_TRANSACTION_DATA",
    "message": "Transaction data validation failed",
    "details": {
      "transaction_id": "TXN001",
      "errors": [
        "amount must be positive",
        "timestamp is in invalid format"
      ]
    }
  }
}
```

## Best Practices

### 1. Webhook Reliability
- Implement idempotency checks
- Store webhook IDs to prevent duplicates
- Acknowledge webhooks quickly (< 3s)
- Process webhook data asynchronously

### 2. Data Consistency
- Use transaction IDs as unique keys
- Handle currency conversions properly
- Validate amounts are positive
- Check for missing required fields

### 3. Performance Optimization
- Batch API requests when possible
- Use cursor-based pagination
- Implement efficient retry logic
- Cache product/customer data

### 4. Security
- Store credentials encrypted
- Use webhook signature verification
- Implement IP whitelisting if available
- Rotate API keys regularly

## Testing

### Test Mode
Enable test mode to validate integration without affecting production data:

```http
POST https://retail.blipee.ai/api/retail/pos/test-mode
Authorization: Bearer <your-api-token>
Content-Type: application/json

{
  "store_id": "uuid",
  "enabled": true,
  "generate_test_data": true
}
```

### Integration Health Check
```http
GET https://retail.blipee.ai/api/retail/pos/health/:store_id
```

Response:
```json
{
  "store_id": "uuid",
  "pos_type": "shopify",
  "connection_status": "healthy",
  "last_successful_sync": "2024-01-01T12:00:00Z",
  "webhook_status": "active",
  "recent_errors": [],
  "recommendations": [
    "Consider enabling inventory sync",
    "Update webhook URL to use latest version"
  ]
}
```

## Support Resources

### Documentation
- Shopify: https://shopify.dev/api
- Square: https://developer.squareup.com
- API Reference: https://docs.blipee.ai/retail/pos

### Integration Support
- Email: pos-support@blipee.ai
- Slack: #retail-pos-integration
- Office Hours: Tuesdays 2-3 PM EST