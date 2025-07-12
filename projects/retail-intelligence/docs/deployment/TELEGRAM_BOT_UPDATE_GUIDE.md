# Telegram Bot Update Guide

## Overview

This guide explains how to update your existing Telegram bot to use the new API while maintaining full functionality.

## Option 1: Minimal Changes (Recommended)

Replace database queries with API calls using the compatibility wrapper:

### 1. Install the wrapper

Copy `PYTHON_COMPATIBILITY_WRAPPER.py` to your bot directory as `retail_api.py`.

### 2. Update your bot imports

```python
# Old code
import sqlite3
from your_db_module import get_analytics_results

# New code
from retail_api import RetailAPIWrapper, CompatibilityDB
import os

# Initialize API
api = RetailAPIWrapper(os.getenv('API_BASE_URL', 'http://localhost:3001'))
db = CompatibilityDB(api)
```

### 3. Update database queries

```python
# Old code
def get_daily_analytics(loja, date):
    conn = sqlite3.connect('bot_database.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM analytics_results 
        WHERE loja = ? AND DATE(data_inicio) = DATE(?)
    """, (loja, date))
    result = cursor.fetchone()
    conn.close()
    return result

# New code
async def get_daily_analytics(loja, date):
    async with RetailAPIWrapper(API_BASE_URL) as api:
        return await api.get_daily_report(loja, date)
```

### 4. Update your bot handlers

```python
# Old code
def handle_analytics_command(update, context):
    loja = context.user_data.get('selected_store')
    analytics = get_daily_analytics(loja, datetime.now())
    # ... format and send message

# New code
async def handle_analytics_command(update, context):
    loja = context.user_data.get('selected_store')
    
    async with RetailAPIWrapper(API_BASE_URL) as api:
        # Authenticate if needed
        await api.authenticate_telegram_user(
            telegram_user_id=update.effective_user.id,
            telegram_username=update.effective_user.username,
            chat_id=update.effective_chat.id
        )
        
        # Get analytics
        analytics = await api.get_daily_report(loja, datetime.now())
        
        # ... format and send message
```

## Option 2: Direct API Integration

For more control, integrate directly with the API:

```python
import aiohttp
import json
from datetime import datetime

class RetailBot:
    def __init__(self, api_base_url, api_key):
        self.api_base_url = api_base_url
        self.api_key = api_key
        self.headers = {'X-API-Key': api_key}
    
    async def get_analytics(self, loja, start_date, end_date):
        url = f"{self.api_base_url}/api/v1/analytics"
        params = {
            'loja': loja,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, headers=self.headers) as resp:
                return await resp.json()
```

## Environment Variables

Update your bot's environment variables:

```bash
# Old
DATABASE_PATH=/path/to/bot_database.db
TELEGRAM_BOT_TOKEN=your-token

# New (add these)
API_BASE_URL=http://localhost:3001
TELEGRAM_API_KEY=your-api-key-from-admin
```

## Docker Compose Update

If using Docker, update your `docker-compose.yml`:

```yaml
# Old
services:
  telegram-bot:
    build: .
    environment:
      - DATABASE_PATH=/data/bot_database.db
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    volumes:
      - ./data:/data

# New
services:
  telegram-bot:
    build: .
    environment:
      - API_BASE_URL=http://api:3001  # Use service name if in same network
      - TELEGRAM_API_KEY=${TELEGRAM_API_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    depends_on:
      - api  # Ensure API is running first
```

## Testing Your Updated Bot

1. **Test Authentication**:
```python
# Test script
import asyncio
from retail_api import RetailAPIWrapper

async def test_auth():
    async with RetailAPIWrapper('http://localhost:3001') as api:
        result = await api.authenticate_telegram_user(
            telegram_user_id='test_user_123',
            telegram_username='test_user',
            chat_id='test_chat_123'
        )
        print(f"Auth result: {result}")

asyncio.run(test_auth())
```

2. **Test Analytics**:
```python
async def test_analytics():
    async with RetailAPIWrapper('http://localhost:3001') as api:
        stores = await api.get_stores()
        if stores:
            analytics = await api.get_daily_report(
                loja=stores[0]['name'],
                date=datetime.now()
            )
            print(f"Analytics: {json.dumps(analytics, indent=2)}")

asyncio.run(test_analytics())
```

## Gradual Migration Strategy

### Phase 1: Read Operations (Week 1)
- Replace all SELECT queries with API calls
- Keep using SQLite for bot state management

### Phase 2: State Management (Week 2)
- Migrate bot conversation state to API
- Use `/api/v1/telegram/state` endpoints

### Phase 3: Full Migration (Week 3)
- Remove SQLite dependency
- Use API for all operations

## Common Issues and Solutions

### Issue: API Connection Errors
```python
# Add retry logic
import backoff

@backoff.on_exception(backoff.expo, aiohttp.ClientError, max_tries=3)
async def get_analytics_with_retry(api, loja, date):
    return await api.get_daily_report(loja, date)
```

### Issue: Response Format Changes
```python
# Add response validation
def validate_analytics_response(response):
    required_fields = ['vendas', 'trafego', 'conversao']
    if not all(field in response.get('data', {}) for field in required_fields):
        raise ValueError("Invalid response format")
    return response
```

### Issue: Performance
```python
# Use connection pooling
class PersistentAPIClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.session = aiohttp.ClientSession(
            headers={'X-API-Key': api_key},
            connector=aiohttp.TCPConnector(limit=100)
        )
    
    async def close(self):
        await self.session.close()
```

## Benefits of Migration

1. **Shared Infrastructure**: Use the same backend as web interface
2. **Real-time Data**: Access to WebSocket endpoints for live updates
3. **Better Scalability**: PostgreSQL handles concurrent users better
4. **Unified Auth**: Single user management system
5. **API Features**: Rate limiting, monitoring, versioning

## Support

If you encounter issues:

1. Check API health: `GET http://localhost:3001/api/v1/health`
2. Verify API key: `curl -H "X-API-Key: your-key" http://localhost:3001/api/v1/stores`
3. Check logs: Both bot logs and API logs
4. Test with the provided Python wrapper examples

The migration can be done gradually, allowing your users to continue using the bot without interruption.