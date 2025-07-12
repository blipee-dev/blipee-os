# Retail Intelligence Module

A comprehensive retail analytics platform within Blipee-OS that provides multi-interface access through web dashboard, Telegram bot, and API. This module transforms traditional retail data collection into an intelligent, conversational experience while maintaining compatibility with existing systems.

## Project Structure

```
projects/retail-intelligence/
├── README.md                    # This file
├── package.json                 # Module-specific dependencies
├── .env.example                # Environment variables template
│
├── src/                        # Source code
│   ├── api/                   # API routes for retail
│   ├── components/            # React components
│   ├── lib/                   # Business logic
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
│
├── database/                   # Database related files
│   ├── migrations/            # SQL migrations
│   ├── schemas/               # Schema definitions
│   ├── seeds/                 # Seed data
│   └── queries/               # Common queries
│
├── tests/                      # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── e2e/                   # End-to-end tests
│   └── fixtures/              # Test data
│
├── docs/                       # Documentation
│   ├── api/                   # API documentation
│   ├── architecture/          # Architecture decisions
│   ├── setup/                 # Setup guides
│   └── user-guides/           # User documentation
│
├── scripts/                    # Utility scripts
│   ├── setup.sh              # Initial setup
│   ├── test.sh               # Test runner
│   └── deploy.sh             # Deployment script
│
├── config/                     # Configuration files
│   ├── sensors/              # Sensor configurations
│   ├── pos/                  # POS integrations
│   └── analytics/            # Analytics settings
│
└── docker/                     # Docker configurations
    ├── Dockerfile             # Container definition
    └── docker-compose.yml     # Local development

```

## Key Features

### 🎯 Multi-Interface Access
- **Web Dashboard**: Modern, AI-powered conversational interface
- **Telegram Bot**: Existing bot continues to work seamlessly
- **RESTful API**: For custom integrations and mobile apps
- **Real-time Updates**: WebSocket support for live data

### 📊 Data Sources
- **ViewSonic VS133 Sensors**: People counting, heatmaps, regional analytics
- **Sales API Integration**: Real-time transaction data with JWT authentication
- **Future POS Support**: Shopify, Square, and custom systems

### 🤖 AI Capabilities
- Natural language queries for analytics
- Predictive insights and anomaly detection
- Automated report generation
- Smart recommendations

## Interface Options

### 1. Telegram Bot (Existing Users)
- Continue using your existing Telegram bot without changes
- All commands and reports work as before
- Gradual migration path available
- See [Telegram Bot Update Guide](docs/deployment/TELEGRAM_BOT_UPDATE_GUIDE.md)

### 2. Web Dashboard (New Features)
- Conversational AI interface
- Dynamic chart generation
- Real-time monitoring
- Advanced analytics

### 3. API Access (Integrations)
- RESTful endpoints for all functionality
- API key authentication
- Rate limiting and monitoring
- See [API Compatibility Guide](docs/api/API_COMPATIBILITY_GUIDE.md)

## Integration with Blipee-OS

This module integrates with the main Blipee-OS platform by:
- Using shared authentication from `/src/lib/auth`
- Extending the AI context engine from `/src/lib/ai`
- Sharing UI components from `/src/components/ui`
- Leveraging the existing Supabase connection
- Maintaining multi-tenant architecture with RBAC

## Quick Start

```bash
# Navigate to the retail module
cd projects/retail-intelligence

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start development
npm run dev
```

## Architecture

The system uses a multi-interface architecture where all interfaces (Web, Telegram, API) share the same backend:

```
┌─────────────────┬─────────────────┬─────────────────┐
│  Telegram Bot   │  Web Dashboard  │   Mobile App    │
│    (Python)     │   (Next.js)     │    (Future)     │
└────────┬────────┴────────┬────────┴────────┬────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              Shared API Layer (REST + WS)           │
├─────────────────────────────────────────────────────┤
│            Business Logic & Analytics               │
├─────────────────────────────────────────────────────┤
│         PostgreSQL Database + Redis Cache           │
└─────────────────────────────────────────────────────┘
```

See [Multi-Interface Architecture](docs/architecture/MULTI_INTERFACE_ARCHITECTURE.md) for details.

## Development Status

### ✅ Completed
- [x] Multi-interface architecture design
- [x] Database schema (PostgreSQL with SQLite compatibility)
- [x] API specifications and implementation
- [x] Telegram bot integration service
- [x] Python compatibility wrapper
- [x] Core sensor integrations (ViewSonic VS133)
- [x] Sales API integration
- [x] Authentication bridge (Telegram ↔ Web)
- [x] Deployment configuration (Docker Compose)

### 🚧 In Progress
- [ ] Web UI components
- [ ] WebSocket real-time updates
- [ ] Comprehensive test suite
- [ ] Production deployment scripts

### 📋 Planned
- [ ] Mobile app API endpoints
- [ ] Additional POS integrations
- [ ] ML-powered predictions
- [ ] Advanced analytics features

## Documentation

### Implementation Plans
- [Enhanced Modular Implementation Plan](docs/reference/ENHANCED_MODULAR_IMPLEMENTATION_PLAN.md) - **Current Approach**
- [Implementation Tracker](docs/reference/IMPLEMENTATION_PLAN_AND_TRACKER_MODULAR.md) - Sprint progress

### Architecture & Integration
- [Architecture Overview](docs/architecture/MULTI_INTERFACE_ARCHITECTURE.md)
- [API Compatibility Guide](docs/api/API_COMPATIBILITY_GUIDE.md)
- [Telegram Bot Update Guide](docs/deployment/TELEGRAM_BOT_UPDATE_GUIDE.md)

### User Guides
- [Telegram Bot Setup](docs/TELEGRAM_BOT_SETUP.md)
- [User Migration Guide](docs/USER_MIGRATION_GUIDE.md)
- [Feature Comparison](docs/FEATURE_COMPARISON.md)

### Technical Reference
- [Performance Requirements](docs/PERFORMANCE_REQUIREMENTS.md)
- [Data Privacy Compliance](docs/DATA_PRIVACY_COMPLIANCE.md)

## Support

For questions or issues:
- Check the [documentation](docs/)
- Review [API examples](docs/api/API_COMPATIBILITY_GUIDE.md)
- Test endpoints: `GET /api/v1/health`