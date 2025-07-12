# Multi-Interface Architecture

## Overview

The Retail Intelligence platform supports multiple user interfaces sharing the same backend:
- **Telegram Bot** (existing, maintained)
- **Web Interface** (new, Blipee-OS integrated)
- **Mobile App** (future)
- **API** (for third-party integrations)

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interfaces                          │
├────────────────┬────────────────┬────────────┬─────────────┤
│  Telegram Bot  │  Web Dashboard │ Mobile App │  API Client │
│   (Python)     │  (Next.js)     │  (Future)  │   (REST)    │
└────────┬───────┴────────┬───────┴──────┬─────┴──────┬──────┘
         │                │               │            │
         ▼                ▼               ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared API Layer                          │
│                 (FastAPI + Next.js API)                      │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic                            │
│          (Data Collection, Analytics, Reports)               │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│              (PostgreSQL + Redis Cache)                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Principles

1. **Interface Independence**: Each interface can evolve independently
2. **Shared Business Logic**: Core functionality is shared across all interfaces
3. **Consistent Data**: Single source of truth for all interfaces
4. **Backward Compatibility**: Existing Telegram bot continues to work
5. **Progressive Enhancement**: New features added without breaking existing ones

## Implementation Strategy

### Phase 1: Dual Operation (Current)
- Keep Telegram bot running on existing infrastructure
- Build new web interface in parallel
- Share the same database (migrate to PostgreSQL)

### Phase 2: Unified Backend
- Create shared API endpoints
- Both interfaces use the same backend
- Gradual feature parity

### Phase 3: Mobile App
- Add React Native mobile app
- Reuse API layer
- Native features (push notifications, etc.)

## API Design

### RESTful Endpoints
```
/api/v1/auth/          # Authentication (shared)
/api/v1/stores/        # Store management
/api/v1/traffic/       # Foot traffic data
/api/v1/sales/         # Sales data
/api/v1/analytics/     # Analytics results
/api/v1/reports/       # Report generation
/api/v1/telegram/      # Telegram-specific endpoints
```

### WebSocket Endpoints
```
/ws/traffic/realtime   # Real-time traffic updates
/ws/sales/live         # Live sales feed
/ws/alerts/            # Real-time alerts
```

## Database Strategy

### Option 1: Shared PostgreSQL (Recommended)
- Migrate SQLite data to PostgreSQL
- Both interfaces use the same database
- Better scalability and features

### Option 2: Database Sync
- Keep SQLite for Telegram bot
- PostgreSQL for web interface
- Periodic sync between databases

### Option 3: Dual Database with Queue
- Write to both databases via message queue
- Eventual consistency
- More complex but fully independent

## Deployment Architecture

```yaml
version: '3.8'

services:
  # Shared Database
  postgres:
    image: postgres:15
    volumes:
      - retail_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: retail_intelligence
  
  # Redis Cache (shared)
  redis:
    image: redis:7-alpine
    
  # Data Collector (Python - existing)
  data-collector:
    build: ./python-services
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres@postgres/retail_intelligence
      
  # Telegram Bot (Python - existing)
  telegram-bot:
    build: ./telegram
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres@postgres/retail_intelligence
      TELEGRAM_TOKEN: ${TELEGRAM_TOKEN}
      
  # Web API (FastAPI - enhanced)
  api:
    build: ./api
    depends_on:
      - postgres
      - redis
    ports:
      - "8000:8000"
      
  # Web Frontend (Next.js - new)
  web:
    build: ./web
    depends_on:
      - api
    ports:
      - "3001:3001"
```

## Security Considerations

1. **Authentication**
   - Telegram: Chat ID based (existing)
   - Web: JWT tokens (Blipee-OS)
   - API: API keys or OAuth2

2. **Authorization**
   - Shared RBAC model
   - User mappings between systems
   - Consistent permissions

3. **Data Access**
   - Row-level security in PostgreSQL
   - Cache invalidation strategy
   - Audit logging for all interfaces

## Migration Path

1. **Week 1-2**: Set up shared PostgreSQL
2. **Week 3**: Migrate data from SQLite
3. **Week 4**: Update Telegram bot to use PostgreSQL
4. **Week 5-6**: Build web interface
5. **Week 7**: Test both interfaces
6. **Week 8**: Deploy and monitor

This architecture ensures your users can continue using the Telegram bot while gaining access to the new web interface, with a clear path to a mobile app in the future.