# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

blipee OS is a conversational AI platform that transforms how humans interact with buildings and sustainability data. Originally a building management system, it has evolved into a comprehensive sustainability-first platform where building management is just one module. The AI acts as an intelligent assistant providing natural, proactive insights through conversation rather than traditional dashboards.

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

1. **Sustainability-First Design**: While maintaining strong building management capabilities, the platform is architected to be sustainability-agnostic, supporting any industry or use case

2. **No Dashboards Philosophy**: Everything is conversational. The AI generates visualizations dynamically based on context rather than pre-built dashboards

3. **Provider Resilience**: Multiple AI providers with automatic fallback ensures high availability. If DeepSeek fails, it falls back to OpenAI, then Anthropic

4. **Real-time Architecture**: Supabase subscriptions enable live updates without polling

5. **File Upload in Chat**: Users can drag and drop documents directly into the conversation for instant analysis

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

### Adding New AI Capabilities

1. Add interface to `sustainability-intelligence.ts`
2. Implement in relevant engine file
3. Update context builder if needed
4. Add to prompt builder

### Creating Dynamic UI Components

1. Add component to `/src/components/dynamic/`
2. Add type to `UIComponent` interface in `types/conversation.ts`
3. Register in `DynamicUIRenderer.tsx`
4. Add demo response in chat route for testing

### Integrating External APIs

1. Create service in `/src/lib/data/`
2. Add to unified ingestion pipeline
3. Update context engine to include data
4. Add API key to environment variables

## Current Development Focus

The platform has completed Phase 1-3 (conversational AI, dynamic UI, multi-tenant architecture) and is now in Phase 4 focusing on:

- Production optimization and performance
- Advanced data visualizations
- Real-time streaming architecture
- Multi-LLM orchestration improvements

## Design System

- **Glass Morphism**: `backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]`
- **Gradients**: `bg-gradient-to-r from-purple-500/50 to-blue-500/50`
- **Animations**: Framer Motion for all transitions
- **Theme**: Dark mode primary with light mode support

Remember: We're building the future of human-building-sustainability interaction. Every feature should feel magical, intelligent, and effortlessly natural.
