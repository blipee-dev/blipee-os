# Blipee OS: Claude AI Assistant Configuration

## Project Overview
Blipee OS is the world's first conversational building management system that allows users to interact with their buildings through natural language. The AI acts as a silent butler, providing intelligent, proactive insights while maintaining a natural, helpful tone.

## Core Capabilities
- **Conversational AI**: Natural language interface for building management
- **Dynamic UI Generation**: AI creates charts, dashboards, and controls based on conversation
- **Real-time Intelligence**: Proactive insights, predictive analytics, and autonomous recommendations
- **Premium Design**: Glass morphism UI with dark/light mode support
- **Voice Integration**: Hands-free building interaction

## Technology Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Realtime), Vercel deployment
- **AI**: Multi-provider integration (DeepSeek, OpenAI, Anthropic)
- **UI**: Dynamic component rendering with premium animations

## Project Structure
```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/ai/            # AI endpoints (chat, stream)
│   └── globals.css        # Global styles with premium themes
├── components/
│   ├── blipee-os/         # Core conversation interface
│   ├── dynamic/           # AI-generated UI components
│   ├── effects/           # Visual effects (ambient backgrounds)
│   ├── navigation/        # NavRail with theme toggle
│   └── onboarding/        # User onboarding experience
├── lib/
│   ├── ai/               # AI intelligence system
│   │   ├── context-engine.ts      # Rich context building
│   │   ├── action-planner.ts      # Intelligent action planning
│   │   ├── proactive-insights.ts  # Welcome messages & insights
│   │   └── service.ts             # AI provider integration
│   ├── conversations/     # Chat persistence
│   └── supabase/         # Database client
└── types/                # TypeScript definitions
```

## AI Personality & Behavior
The AI should behave as a **natural, intelligent building butler** with these characteristics:

### Communication Style
- Natural and conversational, not robotic
- Uses user's first name for personalization
- Brief welcome messages (avoid information overload)
- Only shows critical alerts upfront, detailed reports on request
- Casual section headers: "Heads up" instead of "Critical Alerts"

### Intelligence Features
- **Proactive Welcome**: Greets users with building status and planned activities
- **Context Awareness**: Remembers building state, user preferences, conversation history
- **Predictive Insights**: Forecasts energy usage, maintenance needs, optimization opportunities
- **Action Planning**: Generates step-by-step plans for building optimization
- **Dynamic UI**: Creates appropriate visualizations based on user requests

## Key Files to Understand

### Core Conversation Interface
- `src/components/blipee-os/ConversationInterface.tsx` - Main chat interface
- `src/components/blipee-os/MessageBubble.tsx` - Message display with markdown
- `src/components/blipee-os/InputArea.tsx` - User input with voice support

### AI Intelligence System
- `src/lib/ai/context-engine.ts` - Builds rich context for AI responses
- `src/lib/ai/action-planner.ts` - Intelligent action planning with 100% AI potential
- `src/lib/ai/proactive-insights.ts` - Welcome messages and building insights

### Dynamic UI Components
- `src/components/dynamic/DashboardComponent.tsx` - Tabbed building dashboard
- `src/components/dynamic/ChartComponent.tsx` - Energy and performance charts
- `src/components/blipee-os/DynamicUIRenderer.tsx` - Component renderer

### API Endpoints
- `src/app/api/ai/chat/route.ts` - Main AI chat endpoint with fallback responses

## Common Development Tasks

### Adding New UI Components
1. Create component in `src/components/dynamic/`
2. Add type to `src/types/conversation.ts` UIComponent interface
3. Register in `src/components/blipee-os/DynamicUIRenderer.tsx`
4. Add demo response in `src/app/api/ai/chat/route.ts`

### Modifying AI Behavior
1. Update welcome logic in `src/lib/ai/proactive-insights.ts`
2. Enhance context in `src/lib/ai/context-engine.ts`
3. Adjust action planning in `src/lib/ai/action-planner.ts`

### Design Guidelines
- Use glass morphism: `backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]`
- Premium gradients: `bg-gradient-to-r from-purple-500/50 to-blue-500/50`
- Smooth animations with Framer Motion
- Support both dark and light modes

## Environment Variables Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers
DEEPSEEK_API_KEY=your_deepseek_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Build & Deployment
- `npm run dev` - Local development
- `npm run build` - Production build
- `npm run lint` - ESLint checking
- Deployed on Vercel with automatic GitHub integration

## Common Issues & Solutions

### ESLint Errors
- Escape apostrophes: `'` → `&apos;`
- Use proper quotes: `"` → `&quot;`

### TypeScript Errors
- Add new component types to `UIComponent` interface
- Ensure all imports have proper type definitions

### Build Failures
- Check for unescaped entities in JSX
- Verify all dynamic imports have proper error boundaries

## Current Status
✅ **Phase 1-2 Complete**: Full conversational AI with dynamic UI generation
🚧 **Phase 3 In Progress**: Production polish and launch preparation

## Next Development Priorities
1. Load testing and performance optimization
2. Beta user feedback integration
3. Marketing website and launch materials
4. Advanced building integrations (BACnet, Modbus)

## User Experience Guidelines
- Welcome message should be brief and friendly
- Building reports available via suggestion buttons, not automatically shown
- Include planned activities (maintenance, meetings, deliveries)
- Use natural, conversational language throughout
- Prioritize user control over information display

---

**Remember**: We're building the future of human-building interaction. Every feature should feel magical, intelligent, and effortlessly natural.