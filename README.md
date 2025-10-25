# blipee OS – AI-Powered Sustainability Platform

> Transform how organizations understand and act on sustainability data through autonomous intelligence layered on top of production-ready dashboards.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fblipee-dev%2Fblipee-os)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-blue?style=flat-square&logo=vercel)](https://blipee-os.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0-green?style=flat-square&logo=supabase)](https://supabase.com)

## 🚀 Overview

blipee OS is a sustainability-first platform that unifies emissions, energy, water, waste, and compliance data into a single operating system. The latest architecture centres on autonomous intelligence that enriches dashboards with proactive insights, forecasts, and recommendations tailored to each organization and site.

**Key Differentiator:** The Sustainability Intelligence Layer coordinates eight autonomous agents that run continuously, augmenting every dashboard with context-aware alerts, targets, and optimisation paths.

## ✨ Core Capabilities

### ♻️ Sustainability Intelligence Layer
- **Autonomous Agents** – Carbon Hunter, Compliance Guardian, ESG Chief of Staff, and more operate 24/7.
- **Dashboard Enrichment** – `/api/sustainability/intelligence` returns insights, recommendations, and alerts tuned to each dashboard.
- **Five-Minute Caching** – Intelligent cache avoids redundant agent work while keeping outputs fresh.
- **Graceful Degradation** – Individual agent failures do not break the intelligence pipeline.

### 📈 Sustainability Dashboards
- **Energy, Water, Waste** – Rich time-series analysis, YoY comparisons, and forecast overlays.
- **Emissions & Targets** – Site-aware baselines, SBTi-aligned projections, and unified emissions tracking.
- **Transportation & Compliance** – Fleet, travel, commuting, and regulatory KPIs with automated status checks.
- **Portfolio Views** – Roll-up scoring, performance index, and cross-site benchmarking.

### 📊 Analytics & Forecasting Suite
1. **Emissions Tracking** – Automated Scope 1/2/3 calculations across 15+ categories.
2. **Energy Management** – Real-time monitoring, anomaly detection, and demand forecasting.
3. **Water & Waste Analytics** – Withdrawal vs discharge tracking, diversion rates, circular economy metrics.
4. **Supply Chain Analysis** – Vendor sustainability scoring and scope three attribution.
5. **Compliance Automation** – Multi-framework coverage (GHG, GRI, ESRS, etc.) with status dashboards.
6. **ESG Reporting** – Science-based target validation, yearly progress, and unified emissions summaries.

### 🏢 Enterprise Architecture

#### Security & Authentication
- **Multi-Factor Authentication** - TOTP, SMS, email, and WebAuthn support
- **Enterprise SSO** - SAML 2.0, OIDC, OAuth (Google, Microsoft, GitHub)
- **Role-Based Access Control** - 5 hierarchical roles with granular permissions
- **Session Management** - Device tracking, concurrent session limits
- **Audit Logging** - Comprehensive, tamper-proof activity tracking

#### API & Integration Platform
- **RESTful API Gateway** - Version management (v1/v2) with rate limiting
- **GraphQL Interface** - Flexible queries with real-time subscriptions
- **Webhook System** - Event streaming with retry logic and delivery tracking
- **External Integrations** - Weather APIs, carbon data providers, IoT systems
- **API Key Management** - Secure token generation and usage analytics

#### Performance & Scale
- **Response Time** - Average 350ms (86% improvement from baseline)
- **Concurrent Users** - Supports 1000+ simultaneous connections
- **Caching Strategy** - Multi-layer with 85% hit rate
- **Global Performance** - <50ms latency via CDN edge locations
- **AI Cost Optimization** - 85% reduction through semantic caching

### 🎨 User Experience

#### Glass Morphism Design System
- Beautiful translucent UI components
- Smooth animations with Framer Motion
- Dark/light mode with system preference detection
- Responsive design for all device sizes
- Consistent styling throughout the platform

#### Key User Interfaces
- **Sustainability Dashboards** – Energy, emissions, compliance, transportation, waste, and water hubs.
- **Targets & Forecasting Workspace** – Weighted allocations, dynamic metric targets, unified emissions tracking.
- **Settings & Security Centers** – Tenant management, MFA/SSO controls, and audit logs.
- **Developer Portal** – API documentation, SDK guides, and integration workflows.

## 🛠️ Technical Architecture

### Frontend Stack
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript 5.0 with strict mode
- **Styling:** Tailwind CSS with custom glass morphism utilities
- **State Management:** React Context + @tanstack/react-query (with persistent cache)
- **UI Components:** Custom component library with Radix UI primitives
- **Charts & Visualization:** Recharts and custom SVG components
- **Animation:** Framer Motion for smooth transitions

### Backend Infrastructure
- **API Layer:** Next.js API Routes with middleware pipeline
- **Database:** PostgreSQL 15 via Supabase with Row Level Security
- **Caching:** Redis cluster with ioredis for multi-layer caching
- **Queue System:** Bull for background job processing
- **File Storage:** Supabase Storage with CDN integration
- **Real-time:** Supabase Realtime for live updates

### AI & Machine Learning
- **Primary Provider:** DeepSeek R1 for cost-effective inference
- **Fallback Providers:** OpenAI GPT-4, Anthropic Claude
- **Autonomous Agents:** 8 domain-specific agents orchestrated by the Sustainability Intelligence layer
- **Forecasting:** Enterprise forecaster with seasonal decomposition and Prophet-style additive models
- **Caching Strategy:** Semantic similarity and domain-specific TTL caches
- **Context Building:** Dashboard-driven context plus sector intelligence lookups

### DevOps & Monitoring
- **Hosting:** Vercel with automatic scaling
- **CDN:** CloudFlare Workers for edge caching
- **Database Pooling:** PgBouncer for connection management
- **Monitoring:** Custom metrics with Prometheus compatibility
- **CI/CD:** GitHub Actions for automated deployment
- **Load Testing:** k6 framework for performance validation

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- PostgreSQL 15+ (via Supabase)
- Redis 7+ (for caching)
- AI API key (DeepSeek, OpenAI, or Anthropic)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/blipee-dev/blipee-os.git
cd blipee-os

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start infrastructure services
docker-compose up -d

# Set up database
npx supabase link --project-ref your-project-ref
npx supabase db push
npx supabase migration up

# Start development server
npm run dev
```

### Essential Configuration

```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Required - AI Provider (at least one)
DEEPSEEK_API_KEY=your_deepseek_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Required - Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Recommended - Performance
NEXT_PUBLIC_CDN_URL=your_cdn_url
CLOUDFLARE_API_TOKEN=your_cf_token
PGBOUNCER_DATABASE_URL=your_pooled_url

# Optional - External Services
OPENWEATHERMAP_API_KEY=weather_key
ELECTRICITY_MAPS_API_KEY=carbon_key
```

## 📚 Key Features in Detail

### Multi-Tenant Architecture
- **Organization Hierarchy** - Organizations → Buildings → Spaces → Devices
- **Data Isolation** - PostgreSQL RLS ensures complete tenant separation
- **Role Permissions** - Account Owner, Sustainability Manager, Facility Manager, Analyst, Viewer
- **Team Management** - Invitation system with email verification
- **Usage Tracking** - Per-organization metrics and billing

### Sustainability Intelligence Roadmap
- **Current** – Agent-driven intelligence rendered within dashboards via `/api/sustainability/intelligence`.
- **Upcoming** – Conversational UX returns as an overlay to the dashboard experience, reusing the intelligence layer for responses and actions.
- **Future** – Deeper workflow automation (ticketing, approvals) and expanded sector materiality models.

### Comprehensive Monitoring
- **Performance Dashboard** (`/settings/performance`)
  - Real-time response times (average, p95, p99)
  - Cache hit rates and efficiency metrics
  - System resource utilization
  - Historical trend analysis
- **Health Checks** (`/api/monitoring/health`)
  - Database connectivity
  - Redis availability
  - AI provider status
  - External API health

### Security Features
- **Authentication Methods**
  - Email/password with secure hashing
  - OAuth providers (Google, Microsoft, GitHub)
  - Enterprise SSO (SAML, OIDC)
  - WebAuthn/Passkeys for passwordless
- **Security Controls**
  - Rate limiting with Redis
  - CORS configuration
  - Security headers (CSP, HSTS, etc.)
  - Input validation and sanitization
  - SQL injection prevention via parameterized queries

### API Capabilities
- **RESTful Endpoints**
  - Comprehensive resource APIs
  - Consistent error handling
  - Request/response validation
  - API versioning support
- **GraphQL Interface**
  - Flexible query language
  - Real-time subscriptions
  - Efficient data fetching
  - Type-safe schema
- **Webhook System**
  - Event-driven architecture
  - Configurable endpoints
  - Retry with exponential backoff
  - Delivery status tracking

## 🎯 Use Cases

### For Sustainability Teams
- Track and reduce Scope 1/2/3 emissions
- Generate ESG reports automatically
- Monitor progress toward science-based targets
- Analyze supply chain sustainability
- Ensure regulatory compliance

### For Facility Managers
- Optimize energy consumption
- Monitor building health in real-time
- Predictive maintenance scheduling
- Occupancy-based HVAC control
- Water usage optimization

### For Executives
- Natural language queries for instant insights
- Real-time sustainability dashboards
- Cost reduction opportunities
- Risk assessment and mitigation
- Compliance status overview

### For Developers
- Comprehensive API access
- Webhook integrations
- Custom application development
- Data export capabilities
- Performance monitoring tools

## 📈 Performance Benchmarks

### System Performance
- **Average Response Time:** 350ms
- **P95 Response Time:** 800ms
- **Concurrent Users:** 1000+
- **Requests per Second:** 500+
- **Uptime SLA:** 99.9%

### Caching Effectiveness
- **Overall Hit Rate:** 85%
- **AI Response Cache:** 85% hit rate
- **Database Query Cache:** 90% hit rate
- **Static Asset Cache:** 95% hit rate
- **API Response Cache:** 80% hit rate

### Cost Optimization
- **AI API Costs:** 85% reduction via caching
- **Database Queries:** 80% reduction
- **Bandwidth Usage:** 60% reduction via CDN
- **Compute Resources:** 40% more efficient

## 🚀 Deployment Guide

### Production Checklist

1. **Environment Configuration**
   - Set all required environment variables
   - Configure production database URLs
   - Set up Redis cluster endpoints
   - Add CDN configuration

2. **Database Setup**
   - Run all migrations
   - Enable Row Level Security
   - Configure read replicas
   - Set up connection pooling

3. **Security Configuration**
   - Enable all authentication providers
   - Configure rate limiting rules
   - Set up WAF if using CloudFlare
   - Enable audit logging

4. **Performance Optimization**
   - Deploy Redis cluster
   - Configure CDN endpoints
   - Enable caching strategies
   - Set up monitoring alerts

5. **Monitoring Setup**
   - Configure health check endpoints
   - Set up metric collection
   - Enable error tracking
   - Configure alerting rules

### Deployment Commands

```bash
# Build for production
npm run build

# Run database migrations
npx supabase migration up

# Analyze bundle size
npm run build:analyze

# Deploy to Vercel
vercel --prod

# Run post-deployment checks
npm run test:production
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- TypeScript with strict mode
- ESLint configuration enforced
- Prettier for code formatting
- Conventional commits
- Comprehensive testing required

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**"The future of sustainability isn't more dashboards. It's intelligent conversation."**

Built with ❤️ by the blipee team
