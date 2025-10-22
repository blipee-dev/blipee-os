# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

blipee OS is the world's first Autonomous Sustainability Intelligence platform that will dominate the ESG market. It transforms traditional dashboard-based ESG management into conversational AI that works 24/7 as your digital sustainability team. The platform is on a 24-week roadmap to become the undisputed leader with a 20-point advantage over competitors.

**Vision**: Not just software, but AI employees that autonomously manage, optimize, and improve sustainability performance across any industry.

## Core Capabilities

- **Conversational AI**: Natural language interface for sustainability and building management
- **Dynamic UI Generation**: AI creates charts, dashboards, and controls based on conversation context
- **Real-time Intelligence**: Proactive insights, predictive analytics, and autonomous recommendations
- **Multi-Provider AI**: Seamless switching between DeepSeek, OpenAI, and Anthropic with automatic fallbacks
- **Sustainability Focus**: Scope 1/2/3 emissions tracking, document parsing, external API integrations

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript 5.0, Tailwind CSS with glass morphism design
- **Backend**: Supabase (PostgreSQL with RLS, Auth, Realtime, Storage)
- **AI Providers**: DeepSeek (primary), OpenAI, Anthropic with streaming support
- **Deployment**: Vercel with automatic CI/CD
- **External APIs**: Weather, carbon markets, regulatory compliance, electricity grid data

## Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)
npm run build           # Production build
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler check

# Database
npx supabase db push    # Push schema to Supabase
npx supabase migration up # Run migrations
```

## Architecture Overview

### AI System Architecture

The AI system (`/src/lib/ai/`) follows a multi-provider pattern with intelligent orchestration:

1. **Provider Abstraction** (`service.ts`): Seamlessly switches between AI providers based on availability and performance
2. **Context Engine** (`context-engine.ts`): Builds rich context from building data, user history, and external sources
3. **Action Planner** (`action-planner.ts`): Generates step-by-step plans for complex sustainability goals
4. **Sustainability Intelligence** (`sustainability-intelligence.ts`): 12 capability interfaces for comprehensive sustainability analysis
5. **Document Parser** (`/src/lib/data/document-parser.ts`): Extracts emissions data from PDFs, images, and spreadsheets using OCR and AI

### Multi-Tenant Architecture

- Organizations contain multiple buildings
- 5 role levels: account_owner, sustainability_manager, facility_manager, analyst, viewer
- PostgreSQL Row Level Security ensures data isolation
- Team invitation system with granular permissions

### Conversation Flow

1. User message → `ConversationInterface.tsx`
2. API call → `/api/ai/chat/route.ts`
3. Context building → AI service selection → Response generation
4. Dynamic UI components rendered based on response
5. Message persistence in Supabase

### External Data Integration

- **Weather**: OpenWeatherMap API for real-time conditions
- **Carbon Data**: Electricity Maps, Climatiq, Carbon Interface
- **Document Processing**: Automatic emission extraction from invoices, utility bills, travel documents

## Key Architectural Decisions

1. **Autonomous AI Agents**: Not just conversational UI, but autonomous agents that work 24/7 making decisions and taking actions within approved parameters

2. **No Dashboards Philosophy**: Everything is conversational. The AI generates visualizations dynamically based on context rather than pre-built dashboards

3. **Multi-Brain Orchestration**: Intelligent routing to the best AI model for each task type with automatic fallback for 99.99% uptime

4. **ML-Powered Predictions**: Every interaction trains models that predict emissions, compliance risks, and optimization opportunities

5. **GRI Sector Standards**: Deep integration with GRI 11-17 standards for industry-specific compliance and reporting

6. **Network Effects**: Each customer's anonymized data improves the platform for all users

7. **Zero Setup**: Full value in 5 minutes through AI that auto-discovers and configures everything

## AI Personality & Behavior

The AI behaves as a **natural, intelligent sustainability advisor** with these characteristics:

- Conversational and friendly, not robotic
- Uses the user's first name when known
- Provides brief, actionable insights (not information overload)
- Shows critical alerts with "Heads up" rather than formal warnings
- Creates appropriate visualizations based on context
- Focuses on helping users achieve their sustainability goals

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY  # At least one AI provider required

# Recommended
DEEPSEEK_API_KEY
ANTHROPIC_API_KEY
OPENWEATHERMAP_API_KEY
ELECTRICITY_MAPS_API_KEY

# See .env.example for complete list
```

## Common Development Patterns

### Adding New Autonomous Agents

1. Extend `AutonomousAgent` base class in `/src/lib/ai/autonomous-agents/`
2. Implement `executeTask()` and `learn()` methods
3. Add agent capabilities and approval workflows
4. Register in agent orchestrator
5. Create test suite with mock scenarios

### Implementing ML Models

1. Add model to `/src/lib/ai/ml-models/`
2. Implement feature engineering pipeline
3. Create training and inference endpoints
4. Add model versioning and A/B testing
5. Integrate with prediction API

### Adding GRI Sector Standards

1. Create sector model in `/src/lib/ai/industry-intelligence/`
2. Map GRI disclosures and material topics
3. Implement sector-specific KPIs
4. Add regulatory mappings
5. Create peer benchmarking logic

### Building Network Features

1. Design privacy-preserving data structures
2. Implement anonymization layers
3. Create aggregation algorithms
4. Build sharing protocols
5. Add network effect metrics

## Current Development Focus - DOMINATION ROADMAP

We are executing a 24-week sprint plan with 4 parallel streams to achieve market dominance:

### Completed Development (Phases 0-6):
1. **✅ Stream A: Autonomous Agents** - 4 AI employees operational (ESG Chief of Staff, Compliance Guardian, Carbon Hunter, Supply Chain Investigator)
2. **✅ Stream B: ML Pipeline** - Complete ML infrastructure with LSTM predictors, anomaly detection, optimization
3. **✅ Stream C: Industry Models** - GRI 11-17 standards integrated, industry intelligence engine active
4. **✅ Stream D: Network Features** - Peer benchmarking with privacy, supply chain intelligence, regulatory foresight

### Active Development (Phase 7+):
- **Weeks 15-18**: Advanced Analytics & Optimization Engines
- **Weeks 19-22**: Global Expansion & Market Features
- **Weeks 23-24**: Market Domination & Launch

### Key Achievements:
- **Phases 0-6 Complete**: 83% of platform built in 14 weeks
- **Autonomous Agents**: 4 AI employees working 24/7
- **ML Pipeline**: Production-ready predictive analytics
- **Industry Intelligence**: GRI standards, peer benchmarking, supply chain analysis
- **Network Effects**: System improves with every participant

**See `/docs/BLIPEE_DOMINATION_ROADMAP.md` for the complete implementation plan**

## 🚨 CRITICAL: Current Implementation Priority

**Active Plan:** `/docs/PRODUCTION_READY_PLAN.md` (3-4 week sprint to production)

### The Mission
Connect our 25+ working sustainability dashboards with our 8 autonomous AI agents. Currently they're isolated - dashboards show data, agents analyze in the background but users never see their insights.

### 3 Critical Bugs to Fix
1. **Agent Results Not Displayed** - `/src/app/api/ai/chat/route.ts:114-216`
   - Agent insights collected but never returned to users
   - Fix: Include `agentInsights` in API response

2. **Mock Data Throughout Agents** - 90% of agent methods use `Math.random()` or hardcoded values
   - Carbon Hunter, Compliance Guardian, ESG Chief all affected
   - Fix: Replace with real database queries (detailed in plan)

3. **Missing Intelligence Layer** - No orchestration connecting dashboards to AI
   - Fix: Build `/src/lib/sustainability-intelligence/` service

### Implementation Phases (20 days)
- **Phase 1** (3d): Fix agent mock data → Real database queries
- **Phase 2** (2d): Build Intelligence Layer → Orchestrate AI systems
- **Phase 3** (2d): Fix Chat API → Display agent insights
- **Phase 4** (3d): Dashboard Integration → Enrich with AI
- **Phase 5** (3d): Mobile Strategy → Conversational on mobile, dashboards on desktop
- **Phase 6** (2d): Testing & QA → 80%+ coverage
- **Phase 7** (5d): Production Deploy → Staged rollout with monitoring

### Success Criteria
- ✅ Zero `Math.random()` or hardcoded values - ALL data from database
- ✅ Agent insights visible in conversations AND dashboards
- ✅ Mobile: 100% conversational (< 768px), Desktop: Dashboards + AI (> 1024px)
- ✅ Performance: Dashboard < 2s, Intelligence < 3s, Chat < 1s

### When Working on This
**Always reference** `/docs/PRODUCTION_READY_PLAN.md` for:
- Complete code examples for every fix
- Database schema requirements
- API contracts and response formats
- Testing checklists
- Deployment procedures

**The goal:** Transform from "fragmented AI + working dashboards" to "unified AI-powered sustainability intelligence platform" with ZERO mock data.

## Design System

- **Glass Morphism**: `backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]`
- **Gradients**: `bg-gradient-to-r from-purple-500/50 to-blue-500/50`
- **Animations**: Framer Motion for all transitions
- **Theme**: Dark mode primary with light mode support

Remember: We're building autonomous AI employees, not just software. Every feature should:
- Work independently without human intervention
- Learn and improve from every interaction
- Create network effects that benefit all users
- Be 10x better than any competitor
- Get us closer to the 20-point market lead

**This is not an incremental improvement - this is a paradigm shift in how organizations manage sustainability.**
- remember to use the MCP integrations for Supabase and Vercel operations.

  My Available MCP Tools:

  Supabase MCP (mcp__supabase__*):
  - Project management (list, get, create, pause, restore)
  - Database operations (list tables, execute SQL, apply migrations)
  - Edge Functions (list, get, deploy)
  - Logs and monitoring (get logs, advisors)
  - Branch management (create, merge, reset, rebase)
  - TypeScript types generation
  - API keys and URLs

  Vercel MCP (mcp__vercel__*):
  - General Vercel operations
  - Project-specific operations for blipee-os
  - Deployment management
  - Log analysis
  - Documentation search

  Current Setup:
  - ✓ Supabase MCP connected to blipee-os (quovvwrwyfkzhgqdeham)
  - ✓ Vercel MCP connected (general)
  - ✓ Vercel MCP connected (blipee-os specific)
- remember 6 MCP Servers Running:

  1. ✓ Supabase - Full database management
    - List/manage tables, execute SQL, apply migrations
    - Edge Functions deployment
    - Logs, security advisors, performance monitoring
    - Branch management for dev workflows
  2. ✓ Vercel (General) - Platform operations
    - Manage all Vercel projects
    - Deployment monitoring
    - Documentation search
  3. ✓ Vercel-blipee-os (Project-specific) - Enhanced context
    - Quick access to blipee-os deployments
    - Project-specific logs and analytics
    - Direct integration with http://www.blipee.io
  4. ✓ Boikot - ESG/Sustainability Intelligence 🌱
    - Lookup ethical/unethical company actions
    - Perfect for your sustainability platform!
    - Tool: lookup_company_information
  5. ✓ Filesystem - Secure file operations
    - Read/write files in your project
    - Sandboxed to /Users/pedro/Documents/blipee/blipee-os/blipee-os
    - Useful for document processing workflows
  6. ✓ Memory - Knowledge graph persistence
    - Maintains context across conversations
    - Tracks project knowledge, patterns, and decisions
    - Improves with every interaction