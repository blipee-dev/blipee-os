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
- **Web Automation**: Puppeteer MCP for autonomous data collection and verification

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

### Web Automation System

The automation system (`/src/lib/automation/`) uses Puppeteer MCP (and enhanced MCPs) to autonomously collect data from websites without APIs:

**📚 Documentation:**
- **Quick Start**: `/docs/QUICK_START_SECTOR_INTELLIGENCE.md` ⭐ START HERE
- **Company Mapping**: `/docs/COMPANY_MAPPING_GUIDE.md` 🗺️ (40 pre-mapped companies + seed script)
- **MCP Enhancement Guide**: `/docs/MCP_ENHANCED_SECTOR_INTELLIGENCE.md` (Firecrawl, Docling, Exa)
- **Full Implementation**: `/docs/SECTOR_INTELLIGENCE_GUIDE.md`
- **Base Automation**: `/docs/PUPPETEER_AUTOMATION_GUIDE.md`
- **Complete Summary**: `/docs/COMPLETE_AUTOMATION_SUMMARY.md`

**6 Automation Features:**

1. **Utility Bill Automation** (`utility-providers/`)
   - Automatically logs into utility portals (PG&E, Con Edison, etc.)
   - Downloads monthly bills and extracts energy usage data
   - Auto-calculates Scope 2 emissions from electricity/gas usage
   - Stores bills in Supabase Storage with audit trails
   - **Value**: Eliminates 2 hours/month of manual data entry

2. **Regulatory Intelligence** (`regulatory/`)
   - Scrapes EPA, EU Taxonomy, SEC climate disclosure sites daily
   - Auto-detects new regulations affecting customer industries
   - Maps regulations to GRI sector standards (GRI 11-17)
   - Alerts Compliance Guardian agent of critical changes
   - **Value**: Real-time compliance monitoring vs. manual quarterly checks

3. **Carbon Market Tracking** (`carbon-markets/`)
   - Tracks carbon credit prices from ICAP, EU ETS, CBEx
   - Monitors Renewable Energy Certificate (REC) pricing
   - Calculates cost optimization opportunities
   - Feeds data to autonomous agents for financial recommendations
   - **Value**: Enables dynamic carbon offset purchasing strategies

4. **Supplier Verification** (`supplier-verification/`)
   - Verifies supplier sustainability certifications (B Corp, ISO 14001, LEED)
   - Scrapes supplier websites for sustainability reports
   - Screenshots proof for audit trails
   - Validates Scope 3 supply chain claims
   - **Value**: Automated supplier due diligence for ESG reporting

5. **Competitor Benchmarking** (`competitor-intelligence/`)
   - Tracks competitor sustainability initiatives and ESG claims
   - Monitors carbon neutral commitments and renewable energy targets
   - Finds published sustainability reports
   - Generates comparative insights for strategic positioning
   - **Value**: Stay ahead of industry sustainability trends

6. **Sector Intelligence & Benchmarking** (`sector-intelligence/`) 🌟 **GAME CHANGER**
   - Discovers 50+ companies per sector automatically
   - Parses sustainability reports with AI (Scope 1/2/3, targets, renewable %)
   - Creates industry benchmarks (median, percentiles, leaders, laggards)
   - Shows company competitive position vs. sector
   - **Value**: Builds "The Bloomberg Terminal of Sustainability" database
   - **Enhanced MCPs**: Use Firecrawl (web scraping), Docling (PDF parsing), Exa (AI search) for 5x faster & 2x more accurate results
   - **Network Effects**: More customers → Better benchmarks → Higher value → More customers

   **Company Mapping System**:
   - Pre-mapped **40 priority companies** across 7 GRI sectors (`company-targets.json`)
   - Direct links to sustainability report pages for all companies
   - Seed script to load companies: `npx tsx src/lib/automation/sector-intelligence/seed-companies.ts`
   - All data is **public** - sustainability reports published on corporate websites
   - Discovery sources documented for finding 1,000+ more companies per sector
   - See `/docs/COMPANY_MAPPING_GUIDE.md` for complete guide

**Architecture:**
- `BaseScraper` class: Common functionality (navigation, screenshots, retry logic, error handling)
- `AutomationManager`: Orchestrates all scraping jobs with scheduling
- Database tables: `automation_jobs`, `utility_bills`, `regulatory_updates`, `carbon_market_prices`, etc.
- Integration with autonomous agents: Carbon Hunter uses utility data, Compliance Guardian uses regulatory data

**Security & Compliance:**
- Utility credentials encrypted with Supabase Vault
- Screenshots stored for audit trails (RLS protected)
- Rate limiting to respect website terms of service
- Activity logging for all automation jobs

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

## MCP Integration (Model Context Protocol)

**IMPORTANT**: Always use MCP tools for operations instead of manual commands when available. The project has **11 MCP servers installed** (8 core + 3 enhanced for Sector Intelligence).

### Available MCP Servers

1. **Supabase MCP** (`mcp__supabase__*`)
   - Project management (list, get, create, pause, restore)
   - Database operations (list tables, execute SQL, apply migrations)
   - Edge Functions (list, get, deploy)
   - Logs and monitoring (get logs, advisors)
   - Branch management (create, merge, reset, rebase)
   - TypeScript types generation
   - API keys and URLs
   - **Connected to**: blipee-os project (quovvwrwyfkzhgqdeham)

2. **Vercel MCP - General** (`mcp__vercel__*`)
   - Manage all Vercel projects
   - Deployment monitoring and management
   - Build logs and error analysis
   - Documentation search
   - Team and domain management

3. **Vercel MCP - blipee-os** (`mcp__vercel-blipee-os__*`)
   - Project-specific operations for blipee-os
   - Quick access to deployments
   - Project-specific logs and analytics
   - **Connected to**: http://www.blipee.io

4. **GitHub MCP** (`mcp__github__*`)
   - Repository management and operations
   - File operations in GitHub repositories
   - Pull requests, issues, and discussions
   - Code reviews and comments
   - Branch management
   - GitHub Actions workflows
   - Organization and team management

5. **Puppeteer MCP** (`mcp__puppeteer__*`) 🤖
   - **Browser automation for web scraping**
   - Navigate to URLs and interact with pages
   - Fill forms, click elements, execute JavaScript
   - Take screenshots for audit trails
   - Extract data from websites without APIs
   - **Powers**: Utility bill automation, regulatory scraping, carbon market tracking, supplier verification, competitor intelligence

### Enhanced MCPs (Recommended for Sector Intelligence) ⭐

6. **Firecrawl MCP** (`mcp__firecrawl__*`) - ✅ INSTALLED
   - Advanced web scraping with structured output
   - Replaces 90% of Puppeteer scraping with cleaner code
   - Returns clean markdown + structured JSON automatically
   - Built-in rate limiting and retries
   - **Use for**: Company website scraping, sustainability page discovery
   - **Cost**: $50-200/mo | **ROI**: 12x faster than Puppeteer
   - **Status**: Installed with API key (may need restart to connect)

7. **Docling MCP** (`mcp__docling__*`) - ✅ INSTALLED
   - IBM's enterprise-grade PDF parsing with 97.9% table accuracy
   - Extracts tables, charts, formulas, and multi-column layouts
   - Exports to Markdown, HTML, JSON with structure preserved
   - 80%+ of sustainability reports are PDFs
   - **Use for**: Parsing sustainability reports, extracting emissions tables
   - **Cost**: FREE (open source) | **ROI**: 97.9% accuracy on complex tables
   - **Status**: Installed and connected ✓

8. **Exa MCP** (`mcp__exa__*`) - ✅ INSTALLED
   - AI-powered search engine designed for AI agents
   - Finds companies + sustainability reports in one query
   - Semantic search (understands meaning, not just keywords)
   - **Use for**: Company discovery, report finding
   - **Cost**: $25-100/mo | **ROI**: 10x faster company discovery
   - **Status**: Installed with API key (may need restart to connect)

9. **Boikot MCP** (`mcp__boikot__*`)
   - ESG/Sustainability intelligence 🌱
   - Lookup ethical/unethical company actions
   - Tool: `lookup_company_information`
   - Perfect for sustainability research and reporting

10. **Filesystem MCP** (`mcp__filesystem__*`)
   - Secure file operations
   - Read/write files in project
   - **Sandboxed to**: /Users/pedro/Documents/blipee/blipee-os/blipee-os
   - Useful for document processing workflows

11. **Memory MCP** (`mcp__memory__*`)
   - Knowledge graph persistence
   - Maintains context across conversations
   - Tracks project knowledge, patterns, and decisions
   - Improves with every interaction

### Usage Guidelines

- **Database operations**: Use Supabase MCP instead of `npx supabase` commands
- **Deployments**: Use Vercel MCP instead of `vercel` CLI
- **GitHub operations**: Use GitHub MCP for repository management
- **File operations**: Use Filesystem MCP for project file access
- **Company research**: Use Boikot MCP for ESG/sustainability data
- **Context persistence**: Use Memory MCP to store important project information

### Enhanced MCP Usage (Sector Intelligence)

- **Web scraping**: Use Firecrawl MCP instead of Puppeteer (12x faster, cleaner code)
- **PDF parsing**: Use Docling MCP for sustainability reports (97.9% table accuracy)
- **Company discovery**: Use Exa MCP for AI-powered search (10x faster than manual scraping)
- **Fallback**: Keep Puppeteer MCP as fallback if enhanced MCPs are unavailable
- **Cost optimization**: Use enhanced MCPs for sector intelligence, Puppeteer for utility bills/regulatory monitoring
- remember to use supabase mcp server to look for the table scheemas not the documentation