# Blipee AI Chat System

## Overview

The Blipee AI Chat System is a production-grade conversational AI interface built specifically for sustainability management. It leverages OpenAI's GPT-4o and the Vercel AI SDK to provide real-time, streaming AI responses with comprehensive tool-calling capabilities.

## Key Features

### 🤖 AI Capabilities
- **Multi-Step Tool Calling**: Up to 5 sequential tool executions per conversation turn
- **Real-Time Streaming**: Server-Sent Events (SSE) for instant response delivery
- **8 Integrated Sustainability Tools**:
  - Carbon Footprint Analysis
  - ESG Compliance Checking
  - Natural Language Data Queries
  - Performance Benchmarking
  - Supply Chain Analysis
  - Sustainability Goal Tracking
  - ESG Report Generation
  - Document Analysis

### 💾 Data & Persistence
- **Full Message History**: All conversations and messages persisted to Supabase
- **Message Voting**: Users can rate AI responses (thumbs up/down)
- **File Attachments**: Support for PDFs, CSVs, Excel, and images
- **Conversation Sharing**: Share conversations with team members
- **Analytics Tracking**: Comprehensive usage metrics and performance monitoring

### 🎨 User Experience
- **Modern Chat UI**: Built with Radix UI components
- **Typing Indicators**: Real-time feedback during AI processing
- **Tool Visualization**: See which tools the AI is using in real-time
- **Message Regeneration**: Re-generate AI responses if needed
- **Voice Input**: (Coming soon) Voice-to-text capability
- **Auto-Scroll**: Smooth scrolling as messages arrive

## Architecture

### Tech Stack
- **AI**: OpenAI GPT-4o via Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- **Frontend**: Next.js 14 App Router, React, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with RLS)
- **Streaming**: Server-Sent Events (SSE)
- **Type Safety**: TypeScript, Zod schemas

### File Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       ├── route.ts          # Main streaming API endpoint
│   │       └── vote/route.ts     # Message voting endpoint
│   └── (dashboard)/
│       └── chat/page.tsx          # Chat UI page
├── components/
│   └── chat/
│       └── ChatInterface.tsx      # Main chat component
└── lib/
    └── ai/
        ├── chat-tools.ts          # Integrated sustainability tools
        ├── orchestrator.ts        # AI orchestration engine
        └── industry-intelligence/ # Intelligence modules
```

### Database Schema

#### Extended Tables:
- **conversations** - Extended with AI configuration (model, temperature, tokens, cost)
- **messages** - Extended with AI SDK fields (parts, tool_calls, tool_results, streaming)
- **message_votes** - NEW: User feedback on AI responses
- **chat_attachments** - NEW: File attachments with processing status
- **chat_shares** - NEW: Shared conversation links

## API Reference

### POST /api/chat

Stream AI responses with tool calling.

**Request Body:**
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    parts?: any[];
  }>;
  conversationId: string;
  organizationId: string;
  buildingId?: string;
  data?: any;
}
```

**Response:**
Server-Sent Events stream with format:
```
data: {"type":"token","content":"Hello"}

data: {"type":"tool-call","toolName":"analyzeCarbonFootprint","args":{...}}

data: {"type":"tool-result","toolName":"analyzeCarbonFootprint","result":{...}}

data: {"type":"finish","finishReason":"stop","usage":{...}}
```

### POST /api/chat/vote

Vote on message quality.

**Request Body:**
```typescript
{
  messageId: string;
  voteType: 'up' | 'down';
  feedbackText?: string;
  feedbackCategory?: string;
}
```

## Tools Reference

### 1. analyzeCarbonFootprint
Analyze carbon emissions with detailed breakdowns.

**Parameters:**
- `scope`: 'building' | 'organization' | 'activity' | 'product'
- `organizationId`: string
- `buildingId`: string (optional)
- `timeframe`: { start: string, end: string } (optional)
- `includeBreakdown`: boolean (default: true)
- `compareToBaseline`: boolean (default: true)

**Returns:**
```typescript
{
  success: boolean;
  totalEmissions: number;
  breakdown?: { scope1: number; scope2: number; scope3: number };
  insights: string;
  recommendations: string[];
}
```

### 2. checkESGCompliance
Check compliance with ESG reporting standards.

**Parameters:**
- `standard`: 'GRI' | 'SASB' | 'TCFD' | 'CDP' | 'CSRD' | 'EU_Taxonomy'
- `organizationId`: string
- `sector`: string (optional)
- `region`: string[] (optional)

**Returns:**
```typescript
{
  success: boolean;
  complianceStatus: string;
  requirements: Array<{topic: string; required: boolean}>;
  gaps: string[];
  recommendations: string[];
}
```

### 3. querySustainabilityData
Natural language queries for sustainability data.

**Parameters:**
- `query`: string (natural language)
- `organizationId`: string
- `buildingId`: string (optional)
- `timeRange`: { start: string, end: string } (optional)

**Returns:**
```typescript
{
  success: boolean;
  data: any[];
  summary: string;
  rowCount: number;
}
```

### 4. benchmarkPerformance
Compare against industry peers.

**Parameters:**
- `metric`: 'carbon_intensity' | 'energy_efficiency' | 'water_usage' | 'waste_diversion' | 'overall_esg'
- `organizationId`: string
- `industry`: string
- `region`: string (optional)

**Returns:**
```typescript
{
  success: boolean;
  yourValue: number;
  industryAverage: number;
  industryMedian: number;
  percentile: number;
  insights: string[];
}
```

### 5. analyzeSupplyChain
Analyze supply chain sustainability and risks.

**Parameters:**
- `analysisType`: 'risk' | 'emissions' | 'compliance' | 'network'
- `organizationId`: string
- `includeUpstream`: boolean (default: true)
- `includeDownstream`: boolean (default: false)

**Returns:**
```typescript
{
  success: boolean;
  riskScore: number;
  topRisks: Array<{type: string; severity: string}>;
  sustainabilityGaps: Array<{area: string; impact: string}>;
  collaborationOpportunities: any[];
}
```

### 6. trackSustainabilityGoals
Track progress toward goals.

**Parameters:**
- `goalType`: 'emission_reduction' | 'renewable_energy' | 'waste_diversion' | 'water_conservation' | 'custom'
- `organizationId`: string
- `timeframe`: string (optional)

**Returns:**
```typescript
{
  success: boolean;
  currentProgress: number;
  targetValue: number;
  onTrack: boolean;
  recommendations: string[];
}
```

### 7. generateESGReport
Generate ESG reports.

**Parameters:**
- `reportType`: 'annual' | 'quarterly' | 'monthly' | 'custom'
- `standard`: 'GRI' | 'SASB' | 'TCFD' | 'CDP' | 'integrated'
- `organizationId`: string
- `period`: { start: string, end: string }
- `sections`: string[] (optional)

**Returns:**
```typescript
{
  success: boolean;
  reportId: string;
  status: 'generating' | 'completed';
  estimatedCompletion: string;
}
```

### 8. analyzeDocument
Extract data from uploaded documents.

**Parameters:**
- `documentId`: string
- `analysisType`: 'emissions' | 'compliance' | 'general' | 'invoice' | 'utility_bill'

**Returns:**
```typescript
{
  success: boolean;
  extractedData: any;
  insights: string[];
  confidence: number;
}
```

## Usage Examples

### Basic Chat
```typescript
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function MyPage() {
  return (
    <ChatInterface
      conversationId="conv-123"
      organizationId="org-456"
      buildingId="bldg-789" // optional
    />
  );
}
```

### Programmatic Message Sending
```typescript
const { append } = useChat({
  api: '/api/chat',
  body: { conversationId, organizationId }
});

// Send a message programmatically
append({
  role: 'user',
  content: 'What are our Scope 1 emissions for Q4 2024?'
});
```

### Custom Tool Usage
```typescript
// In chat-tools.ts, add a new tool:
export const myCustomTool = tool({
  description: 'Description of what the tool does',
  parameters: z.object({
    param1: z.string().describe('First parameter'),
    param2: z.number().optional()
  }),
  execute: async ({ param1, param2 }) => {
    // Your custom logic here
    return { result: 'Success!' };
  }
});

// Then add to sustainabilityTools export:
export const sustainabilityTools = {
  // ... existing tools
  myCustomTool
};
```

## Configuration

### Environment Variables
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Model Configuration
Edit in `/api/chat/route.ts`:
```typescript
const model = 'gpt-4o';        // Model to use
const temperature = 0.7;        // 0-2, creativity level
const maxTokens = 2000;         // Max response length
const maxSteps = 5;             // Max tool calling steps
```

## Cost Management

Automatic cost tracking is built-in:

| Model | Input Tokens | Output Tokens |
|-------|--------------|---------------|
| gpt-4o | $0.0025/1K | $0.01/1K |
| gpt-4o-mini | $0.00015/1K | $0.0006/1K |
| gpt-4-turbo | $0.01/1K | $0.03/1K |

All costs are tracked in the `conversations` table:
- `total_tokens_used`
- `total_cost_usd`

## Security

### Row Level Security (RLS)
All database tables have RLS policies ensuring:
- Users can only see their own conversations
- Organization members can share conversations
- Admins have elevated access

### Authentication
Uses Supabase Auth with:
- Session-based authentication
- JWT tokens
- CSRF protection
- Rate limiting (100 requests/minute)

### Data Privacy
- All PII is encrypted at rest
- Conversation data isolated by organization
- Audit logging for all AI interactions

## Monitoring & Analytics

### Metrics Tracked
- `chat_requests`: Total chat API calls
- `chat_completions`: Successful completions
- `chat_errors`: Error count
- `chat_latency_ms`: Response time
- `chat_tokens`: Token usage
- `streaming_*`: Streaming-specific metrics

### Analytics Tables
- `conversation_analytics`: Detailed event tracking
- `message_votes`: User feedback data
- Access via Supabase dashboard or SQL queries

## Troubleshooting

### Common Issues

**Messages not streaming:**
- Check browser console for SSE connection errors
- Verify API route is accessible
- Ensure CORS headers are set correctly

**Tools not executing:**
- Check tool parameters match schema
- Verify organization access permissions
- Review tool execution logs in console

**High latency:**
- Consider using gpt-4o-mini for faster responses
- Reduce maxTokens if responses are too long
- Implement caching for frequently asked questions

### Debug Mode
Enable debug logging:
```typescript
// In chat-tools.ts
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) console.log('Tool execution:', { params, result });
```

## Roadmap

### Phase 1 (Completed ✅)
- [x] Database schema
- [x] Streaming API endpoint
- [x] Chat UI component
- [x] 8 integrated tools
- [x] Message voting
- [x] File attachments
- [x] Analytics tracking

### Phase 2 (Next)
- [ ] Voice input/output
- [ ] Multi-modal visualization
- [ ] RAG with vector search
- [ ] Conversation summaries
- [ ] Export conversations
- [ ] Advanced file processing

### Phase 3 (Future)
- [ ] Multi-agent collaboration
- [ ] Custom tool marketplace
- [ ] Fine-tuned models
- [ ] Real-time collaboration
- [ ] Mobile app support

## Support

For issues or questions:
1. Check this documentation
2. Review the [AI SDK docs](https://sdk.vercel.ai/docs)
3. Check existing conversations in `/chat`
4. Contact the development team

---

**Last Updated:** 2025-01-25
**Version:** 1.0.0
**Authors:** Blipee Development Team
