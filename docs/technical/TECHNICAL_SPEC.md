# Blipee OS Technical Specification

## Project Structure

```
blipee-os/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Main conversation interface
│   │   ├── globals.css          # Global styles
│   │   └── api/                 # API routes
│   │       ├── ai/
│   │       │   ├── chat/route.ts        # Main conversation endpoint
│   │       │   ├── generate/route.ts    # UI component generation
│   │       │   └── complete/route.ts    # Autocomplete suggestions
│   │       ├── building/
│   │       │   ├── context/route.ts     # Building state
│   │       │   ├── devices/route.ts     # Device management
│   │       │   └── analytics/route.ts   # Analytics data
│   │       └── webhooks/
│   │           └── supabase/route.ts    # Real-time updates
│   ├── components/
│   │   ├── blipee-os/
│   │   │   ├── ConversationInterface.tsx   # Main chat UI
│   │   │   ├── MessageBubble.tsx          # Individual messages
│   │   │   ├── InputArea.tsx              # Text/voice input
│   │   │   ├── DynamicUIRenderer.tsx      # Renders AI components
│   │   │   └── SuggestedQueries.tsx       # Query suggestions
│   │   ├── generated/                      # AI-generated components
│   │   │   ├── DynamicChart.tsx
│   │   │   ├── DeviceControl.tsx
│   │   │   ├── BuildingView3D.tsx
│   │   │   ├── Report.tsx
│   │   │   └── DataTable.tsx
│   │   └── ui/                            # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Dialog.tsx
│   │       └── Loading.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   ├── openai.ts
│   │   │   │   ├── anthropic.ts
│   │   │   │   └── deepseek.ts
│   │   │   ├── context-engine.ts         # Building context management
│   │   │   ├── prompt-builder.ts         # Dynamic prompt creation
│   │   │   ├── response-parser.ts        # Parse AI responses
│   │   │   └── ui-generator.ts           # Generate UI instructions
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Supabase client setup
│   │   │   ├── queries.ts                # Database queries
│   │   │   ├── realtime.ts               # Real-time subscriptions
│   │   │   └── auth.ts                   # Authentication helpers
│   │   ├── building/
│   │   │   ├── types.ts                  # TypeScript interfaces
│   │   │   ├── mock-data.ts              # Demo building data
│   │   │   ├── device-manager.ts         # Device control logic
│   │   │   └── analytics.ts              # Analytics calculations
│   │   └── utils/
│   │       ├── streaming.ts              # Response streaming
│   │       ├── cache.ts                  # Caching utilities
│   │       └── errors.ts                 # Error handling
│   ├── hooks/                            # React hooks
│   │   ├── useConversation.ts
│   │   ├── useBuildingContext.ts
│   │   ├── useVoiceInput.ts
│   │   └── useRealtimeData.ts
│   └── types/                           # TypeScript types
│       ├── conversation.ts
│       ├── building.ts
│       ├── ai.ts
│       └── api.ts
├── public/                              # Static assets
├── docs/                               # Documentation
├── tests/                              # Test files
└── config files...                     # Various configs
```

## Core Technologies

### Frontend Stack
```json
{
  "next": "14.2.x",
  "react": "18.3.x",
  "typescript": "5.5.x",
  "tailwindcss": "3.4.x",
  "@radix-ui/react-*": "latest",
  "framer-motion": "11.x",
  "recharts": "2.12.x",
  "three": "0.165.x",
  "@react-three/fiber": "8.16.x",
  "lucide-react": "0.400.x"
}
```

### AI/Backend Stack
```json
{
  "openai": "4.52.x",
  "@anthropic-ai/sdk": "0.24.x",
  "@supabase/supabase-js": "2.44.x",
  "zod": "3.23.x",
  "bull": "4.12.x",
  "ioredis": "5.4.x"
}
```

## API Specifications

### Main Conversation Endpoint
```typescript
// POST /api/ai/chat
interface ChatRequest {
  message: string
  conversationId?: string
  buildingId: string
  context?: {
    recentDeviceActivity?: DeviceActivity[]
    userPreferences?: UserPreferences
    buildingState?: BuildingState
  }
}

interface ChatResponse {
  message: string
  components?: UIComponent[]
  actions?: Action[]
  suggestions?: string[]
  metadata: {
    tokensUsed: number
    responseTime: number
    model: string
  }
}
```

### UI Component Generation
```typescript
interface UIComponent {
  type: 'chart' | 'control' | '3d-view' | 'report' | 'table'
  props: Record<string, any>
  layout?: {
    width?: string
    height?: string
    position?: 'inline' | 'modal' | 'sidebar'
  }
}
```

### Building Context
```typescript
interface BuildingContext {
  id: string
  name: string
  metadata: {
    size: number // square feet
    type: 'office' | 'retail' | 'industrial' | 'residential'
    location: {
      city: string
      timezone: string
      weather?: WeatherData
    }
  }
  devices: Device[]
  currentState: {
    energyUsage: number // watts
    temperature: number // celsius
    occupancy: number // people
    alerts: Alert[]
  }
  patterns: {
    daily: UsagePattern[]
    weekly: UsagePattern[]
    seasonal: SeasonalPattern[]
  }
}
```

## Database Schema

### Core Tables
```sql
-- Users table (managed by Supabase Auth)

-- Buildings
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Devices
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  capabilities JSONB DEFAULT '[]',
  state JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  building_id UUID REFERENCES buildings(id),
  messages JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Time series data (consider TimescaleDB)
CREATE TABLE metrics (
  time TIMESTAMPTZ NOT NULL,
  device_id UUID REFERENCES devices(id),
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Create hypertable for time series
SELECT create_hypertable('metrics', 'time');
```

### Indexes
```sql
CREATE INDEX idx_devices_building ON devices(building_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_building ON conversations(building_id);
CREATE INDEX idx_metrics_device_time ON metrics(device_id, time DESC);
```

## AI Prompt Engineering

### System Prompt Template
```typescript
const SYSTEM_PROMPT = `You are Blipee, an intelligent AI assistant that manages buildings through conversation.

Current Building Context:
${JSON.stringify(buildingContext, null, 2)}

Your capabilities:
1. Analyze building data and identify patterns
2. Control devices (return actions array)
3. Generate visualizations (return components array)
4. Provide insights and recommendations
5. Create reports and analytics

Guidelines:
- Be concise but thorough
- Always consider energy efficiency
- Prioritize occupant comfort
- Suggest proactive actions
- Learn from user preferences

When generating UI components, use these types:
- chart: For data visualization
- control: For device controls
- 3d-view: For spatial visualization
- report: For detailed analysis
- table: For structured data

Response format:
{
  "message": "Your conversational response",
  "components": [...],  // Optional UI components
  "actions": [...],     // Optional actions to execute
  "suggestions": [...]  // Optional follow-up suggestions
}`;
```

### Context Window Management
```typescript
class ContextManager {
  private maxTokens = 8000
  private priorityOrder = [
    'currentAlerts',
    'recentActivity',
    'userPreferences',
    'historicalPatterns',
    'deviceInventory'
  ]

  buildContext(fullContext: FullContext): CompressedContext {
    // Intelligently compress context to fit token limits
    // Prioritize based on conversation relevance
  }
}
```

## Security Specifications

### Authentication Flow
```typescript
// Supabase Auth with JWT
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Row Level Security policies
CREATE POLICY "Users can only see their buildings"
  ON buildings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));
```

### API Security
- Rate limiting: 100 requests/minute per user
- Token limits: 1M tokens/month per organization
- Prompt injection prevention
- Response content filtering

## Performance Requirements

### Response Times
- Initial response: < 500ms (streaming start)
- Complete response: < 3s (95th percentile)
- UI render: < 100ms
- Real-time updates: < 50ms latency

### Scalability
- Support 10,000 concurrent users
- Handle 1M messages/day
- Store 1TB time-series data/month
- 99.9% uptime SLA

## Development Standards

### Code Style
- ESLint + Prettier configuration
- Strict TypeScript
- Functional components only
- Composition over inheritance

### Testing Strategy
- Unit tests: 80% coverage minimum
- Integration tests for all API routes
- E2E tests for critical flows
- Performance benchmarks

### Git Workflow
```bash
main
├── develop
│   ├── feature/conversation-ui
│   ├── feature/ai-integration
│   └── feature/dynamic-components
└── release/v1.0.0
```

## Deployment Configuration

### Environment Variables
```env
# App
NEXT_PUBLIC_APP_URL=https://app.blipee.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=

# Redis
REDIS_URL=

# Monitoring
SENTRY_DSN=
VERCEL_ANALYTICS_ID=
```

### Vercel Configuration
```json
{
  "functions": {
    "app/api/ai/chat/route.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "NEXT_PUBLIC_APP_URL": "@app-url",
    "SUPABASE_SERVICE_KEY": "@supabase-service-key"
  }
}
```

## Monitoring & Analytics

### Key Metrics
- Response time percentiles
- Token usage by endpoint
- Active users/conversations
- Error rates by component
- Device response times

### Alerting Rules
- Response time > 5s
- Error rate > 1%
- Token usage > 80% of limit
- Database connection failures
- AI provider downtime

---

This specification provides the technical foundation for building Blipee OS. Every decision should optimize for conversation quality and user delight.