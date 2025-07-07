# Blipee OS - Codebase Insights for Future Claude Instances

## 🎯 Quick Understanding

**What is Blipee OS?**
- A conversational AI building management system - think "ChatGPT for Buildings"
- Users interact with buildings through natural language instead of traditional dashboards
- The AI acts as a "silent butler" providing proactive insights and managing building operations

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **AI**: Multi-provider system (DeepSeek, OpenAI, Anthropic) with fallbacks
- **UI**: Premium glass morphism design with Framer Motion animations
- **Deployment**: Vercel with automatic CI/CD

### Key Architectural Patterns

1. **Multi-Tenant Architecture**
   - Organizations → Buildings → Users with 8 hierarchical roles
   - PostgreSQL Row Level Security (RLS) for data isolation
   - Granular permissions down to building areas

2. **AI Service Pattern**
   - Provider abstraction with automatic fallback
   - Load balancing between providers
   - Streaming support for real-time responses
   - Located in `/src/lib/ai/service.ts`

3. **Conversational Interface**
   - Messages persisted in Supabase
   - Dynamic UI component generation based on AI responses
   - Real-time updates via Supabase subscriptions

4. **Component Architecture**
   - Server Components by default (App Router)
   - Client Components marked with 'use client'
   - Dynamic component loading for AI-generated UIs

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API endpoints
│   │   ├── ai/           # AI chat and streaming
│   │   ├── auth/         # Authentication endpoints
│   │   └── organizations/ # Org management
│   └── (routes)/         # Pages with layouts
├── components/
│   ├── blipee-os/        # Core conversation UI
│   ├── dynamic/          # AI-generated components
│   ├── premium/          # Reusable UI components
│   └── effects/          # Visual effects
├── lib/
│   ├── ai/              # AI intelligence system
│   │   ├── providers/   # AI provider implementations
│   │   ├── context-engine.ts    # Rich context building
│   │   ├── action-planner.ts    # Action planning
│   │   └── service.ts           # Main AI service
│   ├── supabase/        # Database clients
│   └── conversations/   # Chat persistence
└── types/               # TypeScript definitions
```

## 🔑 Key Files to Understand

### Core Configuration
- `/CLAUDE.md` - AI assistant personality and behavior guide
- `/package.json` - Dependencies and scripts
- `/.env.example` - Required environment variables
- `/src/app/globals.css` - Global styles with theme variables

### AI System
- `/src/lib/ai/service.ts` - Main AI service with provider fallback
- `/src/lib/ai/context-engine.ts` - Builds rich context for AI
- `/src/lib/ai/proactive-insights.ts` - Welcome messages and insights
- `/src/app/api/ai/chat/route.ts` - Main chat endpoint with demo fallbacks

### Conversation Interface
- `/src/components/blipee-os/ConversationInterface.tsx` - Main chat UI
- `/src/components/blipee-os/DynamicUIRenderer.tsx` - Renders AI components
- `/src/types/conversation.ts` - Message and component types

### Database
- `/supabase/migrations/` - Schema evolution
- Key tables: organizations, buildings, users, conversations, messages

## 🚀 Development Workflow

### Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint checking
npm run type-check   # TypeScript validation
npm run test:apis    # Test external API connections
```

### Adding New Features

1. **New AI-Generated UI Component**
   - Create component in `/src/components/dynamic/`
   - Add type to `UIComponent` interface in `/src/types/conversation.ts`
   - Register in `DynamicUIRenderer.tsx`
   - Add demo response in chat route

2. **New API Endpoint**
   - Create route in `/src/app/api/`
   - Use Next.js Route Handlers pattern
   - Include proper error handling and auth checks

3. **Database Changes**
   - Create migration in `/supabase/migrations/`
   - Update TypeScript types in `/src/types/`
   - Test RLS policies

## 🎨 Design System

### Glass Morphism Theme
```css
/* Core glass effect */
backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]

/* Premium gradients */
bg-gradient-to-r from-purple-500/50 to-blue-500/50

/* Dark mode support */
dark:bg-black/[0.02] dark:border-white/[0.03]
```

### Component Patterns
- All premium components in `/src/components/premium/`
- Consistent animation with Framer Motion
- Responsive design with Tailwind breakpoints

## ⚡ Performance Considerations

1. **AI Response Optimization**
   - Streaming responses for better UX
   - Provider fallback for reliability
   - Demo responses for instant feedback

2. **Database Queries**
   - Efficient indexes on foreign keys
   - Batch operations where possible
   - Real-time subscriptions only when needed

3. **Frontend Performance**
   - Dynamic imports for large components
   - Image optimization with Next.js Image
   - Minimal client-side JavaScript

## 🔒 Security

1. **Authentication**
   - Supabase Auth with email/OAuth
   - JWT tokens for API access
   - Session management

2. **Authorization**
   - Row Level Security (RLS) in PostgreSQL
   - 8-tier permission system
   - API route protection

3. **Data Protection**
   - Environment variables for secrets
   - CORS configuration
   - Input sanitization

## 🐛 Common Issues & Solutions

### Build Errors
- **Unescaped entities**: Use `&apos;` for apostrophes, `&quot;` for quotes
- **TypeScript errors**: Check all imports have proper types
- **Missing env vars**: Copy `.env.example` to `.env.local`

### Runtime Issues
- **AI not responding**: Check API keys and rate limits
- **Database connection**: Verify Supabase URL and keys
- **UI not updating**: Check React state and Supabase subscriptions

## 📈 Current Status

### Completed ✅
- Full conversational AI interface
- Dynamic UI generation
- Multi-tenant architecture
- Authentication system
- Premium UI design
- Production deployment

### In Progress 🚧
- Advanced building integrations
- Performance optimization
- Beta user testing
- Marketing website

## 🎯 Key Principles

1. **Conversational First**: Every interaction should feel natural
2. **Proactive Intelligence**: AI anticipates user needs
3. **Premium Experience**: Beautiful, smooth, and polished
4. **Developer Friendly**: Clear patterns and documentation
5. **Production Ready**: Scalable, secure, and reliable

## 🚦 Quick Start for New Development

1. Clone and install:
   ```bash
   git clone <repo>
   npm install
   ```

2. Set up environment:
   ```bash
   cp .env.example .env.local
   # Add your Supabase and AI keys
   ```

3. Run development:
   ```bash
   npm run dev
   ```

4. Key areas to explore:
   - `/src/app/api/ai/chat/route.ts` - See how AI works
   - `/src/components/blipee-os/` - Understand the UI
   - `/src/lib/ai/` - Explore AI intelligence

## 📚 Additional Resources

- Main docs: `/README.md`
- AI personality: `/CLAUDE.md`
- Deployment: `/DEPLOYMENT_CHECKLIST.md`
- Vision docs: `/docs/vision/`

---

**Remember**: This is not just a building management system - it's a revolution in human-building interaction. Every line of code should contribute to making buildings feel intelligent, responsive, and delightful to interact with.