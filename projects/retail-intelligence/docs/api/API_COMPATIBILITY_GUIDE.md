# API Compatibility Guide

## Overview

This guide documents the API endpoints that maintain compatibility between the existing Python/Telegram bot system and the new Blipee-OS web interface.

## Authentication

### Telegram Authentication
```bash
POST /api/v1/auth/telegram
{
  "telegram_user_id": "123456789",
  "telegram_username": "john_doe",
  "chat_id": "987654321"
}
```

### API Key Authentication
Add header: `X-API-Key: your-api-key`

## Core Endpoints

### 1. Get Analytics Data
```bash
# GET request (preferred)
GET /api/v1/analytics?loja=OML01&start_date=2024-01-01&end_date=2024-01-31&metric_type=all

# POST request (for compatibility)
POST /api/v1/analytics
{
  "loja": "OML01-Omnia GuimarãesShopping",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "metric_type": "all"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loja": "OML01-Omnia GuimarãesShopping",
    "periodo": {
      "inicio": "2024-01-01T00:00:00",
      "fim": "2024-01-31T23:59:59"
    },
    "vendas": {
      "total_com_iva": 125000.50,
      "total_sem_iva": 102459.84,
      "transacoes": 1850,
      "ticket_medio": 67.57
    },
    "trafego": {
      "visitantes": 15420,
      "total_passagens": 30840,
      "entry_rate": 50.0
    },
    "conversao": {
      "taxa_conversao": 12.0,
      "tempo_medio_permanencia": 25.5,
      "unidades_por_transacao": 2.3
    },
    "top_performers": {
      "vendedores": [
        {"codigo": "V001", "nome": "Maria Silva", "vendas": 15000}
      ],
      "produtos": [
        {"item": "P001", "descricao": "Produto A", "quantidade": 250}
      ]
    },
    "regioes": {
      "ocupacao": {"region1": 45, "region2": 30, "region3": 15, "region4": 10},
      "top_2": ["region1", "region2"],
      "bottom_2": ["region3", "region4"]
    },
    "ultima_atualizacao": "2024-01-31T23:40:00"
  }
}
```

### 2. Get Available Stores
```bash
GET /api/v1/stores
```

**Response:**
```json
{
  "success": true,
  "stores": [
    {
      "name": "OML01-Omnia GuimarãesShopping",
      "code": "OML01",
      "is_active": true
    },
    {
      "name": "ONL01-Only UBBO Amadora",
      "code": "ONL01",
      "is_active": true
    }
  ]
}
```

### 3. Real-time Traffic
```bash
GET /api/v1/traffic/realtime?loja=OML01
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loja": "OML01-Omnia GuimarãesShopping",
    "current_occupancy": 145,
    "last_update": "2024-01-31T14:30:00",
    "last_hour": {
      "entries": 52,
      "exits": 48
    }
  }
}
```

### 4. Telegram Bot State Management
```bash
# Get bot state
GET /api/v1/telegram/state?chat_id=987654321

# Update bot state
POST /api/v1/telegram/state
{
  "chat_id": "987654321",
  "state": "waiting_for_store_selection",
  "context": {
    "command": "analytics",
    "step": 2
  }
}
```

### 5. Generate API Key (Admin Only)
```bash
POST /api/v1/keys
Authorization: Bearer admin-token

{
  "name": "Python Data Collector",
  "permissions": {
    "stores": ["OML01", "OML02", "OML03"],
    "endpoints": ["/api/v1/analytics", "/api/v1/traffic/*"],
    "rate_limit": 1000
  }
}
```

## Python Client Example

```python
import requests
import json
from datetime import datetime, timedelta

class RetailAPIClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers['X-API-Key'] = api_key
    
    def get_analytics(self, loja, start_date, end_date, metric_type='all'):
        """Get analytics data for a store"""
        params = {
            'loja': loja,
            'start_date': start_date.isoformat() if isinstance(start_date, datetime) else start_date,
            'end_date': end_date.isoformat() if isinstance(end_date, datetime) else end_date,
            'metric_type': metric_type
        }
        
        response = self.session.get(
            f"{self.base_url}/api/v1/analytics",
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_realtime_traffic(self, loja):
        """Get real-time traffic for a store"""
        response = self.session.get(
            f"{self.base_url}/api/v1/traffic/realtime",
            params={'loja': loja}
        )
        response.raise_for_status()
        return response.json()
    
    def authenticate_telegram_user(self, telegram_user_id, telegram_username, chat_id):
        """Authenticate a Telegram user"""
        data = {
            'telegram_user_id': str(telegram_user_id),
            'telegram_username': telegram_username,
            'chat_id': str(chat_id)
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/auth/telegram",
            json=data
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = RetailAPIClient(
    base_url='https://retail.blipee.com',
    api_key='your-api-key-here'
)

# Get analytics for last 7 days
end_date = datetime.now()
start_date = end_date - timedelta(days=7)

analytics = client.get_analytics(
    loja='OML01-Omnia GuimarãesShopping',
    start_date=start_date,
    end_date=end_date
)

print(f"Sales: €{analytics['data']['vendas']['total_com_iva']:,.2f}")
print(f"Visitors: {analytics['data']['trafego']['visitantes']:,}")
print(f"Conversion Rate: {analytics['data']['conversao']['taxa_conversao']:.1f}%")
```

## Telegram Bot Integration

The existing Telegram bot can continue operating by using these endpoints:

```python
# In your telegram bot handler
async def handle_analytics_command(update, context):
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id
    
    # Authenticate user
    auth_result = await authenticate_user(user_id, update.effective_user.username, chat_id)
    
    if auth_result['success']:
        # Get analytics
        analytics = await get_analytics_data(
            user_id=user_id,
            loja='OML01',
            start_date=datetime.now().date(),
            end_date=datetime.now().date()
        )
        
        # Format and send response
        message = format_analytics_message(analytics['data'])
        await update.message.reply_text(message, parse_mode='Markdown')
```

## Migration Notes

1. **Store Names**: The API accepts both full store names (e.g., "OML01-Omnia GuimarãesShopping") and store codes (e.g., "OML01")

2. **Date Formats**: Accepts ISO 8601 format (YYYY-MM-DD or full timestamps)

3. **Backward Compatibility**: All response formats match the existing Python data structures

4. **Rate Limiting**: Default rate limit is 100 requests per minute per API key

5. **Error Responses**: Standard HTTP status codes with consistent error format:
   ```json
   {
     "error": "Error message",
     "details": {} // Optional additional information
   }
   ```

## Testing the API

```bash
# Test with curl
curl -X GET "http://localhost:3001/api/v1/analytics?loja=OML01&start_date=2024-01-01&end_date=2024-01-31" \
  -H "X-API-Key: your-api-key"

# Test real-time traffic
curl -X GET "http://localhost:3001/api/v1/traffic/realtime?loja=OML01" \
  -H "X-API-Key: your-api-key"
```

This API design ensures seamless integration with your existing Python/Telegram bot while providing a foundation for the new web interface and future mobile app.