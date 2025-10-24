# Vercel AI SDK Migration Plan

**Status**: ✅ Packages Installed, Not Yet Used
**Timing**: 🎯 PERFECT - Doing agent refactor anyway
**Effort**: MEDIUM (2-3 days)
**Impact**: HIGH - Better tool calling, streaming, multi-provider support

---

## Current State

### Installed Packages ✅
```json
"@ai-sdk/anthropic": "^2.0.35",
"@ai-sdk/deepseek": "^1.0.23",
"@ai-sdk/openai": "^2.0.53",
"ai": "^5.0.76"
```

### Current Custom Implementation ❌
**File**: `/src/lib/ai/service.ts`
- Custom provider abstraction
- Manual streaming implementation
- Custom tool calling via function parameters
- Provider fallback logic

---

## Migration Benefits

### 1. **Tool Calling** (🔥 CRITICAL FOR AGENTS)

**Current** (Custom):
```typescript
const response = await aiService.complete(`
  You have access to these tools:
  - exploreData(query): Execute SQL
  - getSchema(): Get database schema

  User: ${message}
  `, { jsonMode: true });
```

**With Vercel AI SDK**:
```typescript
import { generateText, tool } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4-turbo'),
  tools: {
    exploreData: tool({
      description: 'Execute read-only SQL query on sustainability database',
      parameters: z.object({
        query: z.string().describe('SQL SELECT query'),
        org_id: z.string().uuid()
      }),
      execute: async ({ query, org_id }) => {
        return await supabase.rpc('explore_sustainability_data', {
          query_text: query,
          org_id
        });
      }
    }),
    getSchema: tool({
      description: 'Get database schema with domain knowledge',
      parameters: z.object({}),
      execute: async () => {
        return await supabase.rpc('get_sustainability_schema');
      }
    })
  },
  prompt: message
});
```

**Benefits**:
- ✅ Structured tool definitions with Zod validation
- ✅ Automatic tool call parsing (no JSON mode hacks)
- ✅ Type-safe tool execution
- ✅ Built-in error handling

### 2. **Streaming** (Already Have This, But Cleaner)

**Current**:
```typescript
// Custom streaming in blipee-brain.ts
stream('loading', 'Processing...');
const response = await aiService.complete(prompt);
stream('complete', response);
```

**With Vercel AI SDK**:
```typescript
import { streamText } from 'ai';

const result = streamText({
  model: deepseek('deepseek-chat'),
  prompt: message,
  onChunk: ({ chunk }) => {
    // Automatic streaming to client
  }
});

// In React component
const { messages, input, handleSubmit } = useChat({
  api: '/api/ai/chat',
  onFinish: (message) => { /* done */ }
});
```

### 3. **Multi-Provider Fallback**

**Current** (Manual):
```typescript
// service.ts lines 88-120
for (let i = 0; i < this.providers.length; i++) {
  try {
    const response = await provider.complete(prompt, options);
    return response;
  } catch (error) {
    // Try next provider...
  }
}
```

**With Vercel AI SDK** (Simpler):
```typescript
const providers = [
  createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY }),
  createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
];

async function completeWithFallback(prompt: string) {
  for (const model of providers) {
    try {
      return await generateText({ model, prompt });
    } catch (error) {
      continue; // Try next
    }
  }
}
```

---

## Migration Strategy

### Phase 1: BlipeeBrain (Week 1, Days 1-2)
**Why First**: Already has tool calling, perfect test case

**Files to Modify**:
1. `/src/lib/ai/blipee-brain.ts`
   - Replace custom tool calling with Vercel AI SDK tools
   - Use `generateText` with `exploreData` and `getSchema` tools
   - Keep streaming callbacks

**Example Implementation**:
```typescript
import { generateText, tool } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export class BlipeeBrain {
  private model = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-reasoner'
  });

  async process(userMessage: string, context: BlipeeBrainContext) {
    const result = await generateText({
      model: this.model,
      tools: {
        exploreData: tool({
          description: 'Execute SQL query on sustainability database',
          parameters: z.object({
            query: z.string().describe('Read-only SELECT query'),
            reasoning: z.string().describe('Why this query will answer the question')
          }),
          execute: async ({ query }) => {
            const { data, error } = await this.supabase.rpc(
              'explore_sustainability_data',
              { query_text: query, org_id: context.organizationId }
            );
            return data;
          }
        }),
        getSchema: tool({
          description: 'Get database schema context',
          parameters: z.object({}),
          execute: async () => {
            const { data } = await this.supabase.rpc('get_sustainability_schema');
            return data;
          }
        })
      },
      prompt: `${schemaContext}\n\nUser: ${userMessage}`,
      maxToolRoundtrips: 5 // Allow multi-step reasoning
    });

    return {
      response: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults
    };
  }
}
```

### Phase 2: Autonomous Agents (Week 1, Days 3-4)
**Why Next**: Define tools that agents can use

**New Agent Tools** (using Vercel AI SDK):
```typescript
// src/lib/ai/autonomous-agents/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const agentTools = {
  calculateEmissions: tool({
    description: 'Calculate total emissions by scope for a time period',
    parameters: z.object({
      organizationId: z.string().uuid(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      scope: z.enum(['scope_1', 'scope_2', 'scope_3']).optional()
    }),
    execute: async ({ organizationId, startDate, endDate, scope }) => {
      const query = `
        SELECT
          mc.scope,
          mc.category,
          SUM(md.co2e_emissions) / 1000.0 as total_co2e_tonnes
        FROM metrics_data md
        JOIN metrics_catalog mc ON md.metric_id = mc.id
        WHERE md.organization_id = '${organizationId}'
          AND md.period_start >= '${startDate}'
          AND md.period_end <= '${endDate}'
          ${scope ? `AND mc.scope = '${scope}'` : ''}
        GROUP BY mc.scope, mc.category
        ORDER BY total_co2e_tonnes DESC;
      `;

      const { data } = await supabase.rpc('explore_sustainability_data', {
        query_text: query,
        org_id: organizationId
      });

      return data.data;
    }
  }),

  detectAnomalies: tool({
    description: 'Detect emission anomalies using statistical analysis',
    parameters: z.object({
      organizationId: z.string().uuid(),
      category: z.string().optional(),
      stdDevThreshold: z.number().default(2)
    }),
    execute: async ({ organizationId, category, stdDevThreshold }) => {
      // SQL from MOCK_DATA_AUDIT.md
      const query = `
        WITH monthly_averages AS (
          SELECT
            DATE_TRUNC('month', period_start) as month,
            mc.category,
            AVG(md.co2e_emissions) as avg_emissions,
            STDDEV(md.co2e_emissions) as stddev_emissions
          FROM metrics_data md
          JOIN metrics_catalog mc ON md.metric_id = mc.id
          WHERE md.organization_id = '${organizationId}'
            ${category ? `AND mc.category = '${category}'` : ''}
          GROUP BY month, mc.category
        )
        SELECT
          md.period_start,
          mc.category,
          md.co2e_emissions / 1000.0 as co2e_tonnes,
          ma.avg_emissions / 1000.0 as avg_tonnes,
          CASE
            WHEN md.co2e_emissions > (ma.avg_emissions + ${stdDevThreshold} * ma.stddev_emissions)
            THEN 'HIGH_ANOMALY'
            WHEN md.co2e_emissions < (ma.avg_emissions - ${stdDevThreshold} * ma.stddev_emissions)
            THEN 'LOW_ANOMALY'
            ELSE 'NORMAL'
          END as anomaly_status
        FROM metrics_data md
        JOIN metrics_catalog mc ON md.metric_id = mc.id
        JOIN monthly_averages ma ON
          DATE_TRUNC('month', md.period_start) = ma.month
          AND mc.category = ma.category
        WHERE md.organization_id = '${organizationId}'
        ORDER BY md.period_start DESC;
      `;

      const { data } = await supabase.rpc('explore_sustainability_data', {
        query_text: query,
        org_id: organizationId
      });

      const anomalies = data.data.filter(r => r.anomaly_status !== 'NORMAL');
      return {
        totalRecords: data.data.length,
        anomalyCount: anomalies.length,
        anomalies: anomalies.slice(0, 10) // Top 10
      };
    }
  }),

  benchmarkEfficiency: tool({
    description: 'Compare site efficiency (emissions per sqm) across portfolio',
    parameters: z.object({
      organizationId: z.string().uuid(),
      startDate: z.string(),
      endDate: z.string()
    }),
    execute: async ({ organizationId, startDate, endDate }) => {
      // SQL from MOCK_DATA_AUDIT.md
      const query = `
        WITH site_emissions AS (
          SELECT
            s.id as site_id,
            s.name as site_name,
            s.area_sqm,
            SUM(md.co2e_emissions) / 1000.0 as total_co2e_tonnes
          FROM metrics_data md
          JOIN sites s ON md.site_id = s.id
          WHERE md.organization_id = '${organizationId}'
            AND md.period_start >= '${startDate}'
            AND md.period_end <= '${endDate}'
          GROUP BY s.id, s.name, s.area_sqm
        )
        SELECT
          site_name,
          total_co2e_tonnes,
          area_sqm,
          total_co2e_tonnes / NULLIF(area_sqm, 0) as emissions_per_sqm,
          RANK() OVER (ORDER BY total_co2e_tonnes / NULLIF(area_sqm, 0)) as efficiency_rank
        FROM site_emissions
        WHERE area_sqm > 0
        ORDER BY efficiency_rank;
      `;

      const { data } = await supabase.rpc('explore_sustainability_data', {
        query_text: query,
        org_id: organizationId
      });

      return data.data;
    }
  })
};
```

### Phase 3: Chat API (Week 1, Day 5)
**Why Last**: Needs BlipeeBrain + agents working first

**Replace**: `/src/app/api/ai/chat/route.ts`
```typescript
import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

export async function POST(req: Request) {
  const { message, conversationId } = await req.json();

  const result = streamText({
    model: createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: 'deepseek-reasoner'
    }),
    tools: agentTools, // From Phase 2
    prompt: message,
    onFinish: async ({ text, toolCalls }) => {
      // Save to conversation history
      await saveMessage(conversationId, text, toolCalls);
    }
  });

  return result.toDataStreamResponse();
}
```

**Client Side** (React):
```typescript
import { useChat } from 'ai/react';

export function FloatingChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    onToolCall: ({ toolCall }) => {
      // Show "Calculating emissions..." when tool is called
    }
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.content}
          {m.toolInvocations?.map(t => (
            <ToolCallDisplay tool={t} />
          ))}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}
```

---

## Migration Checklist

### Preparation (Day 0)
- [x] Verify packages installed
- [ ] Read Vercel AI SDK docs (https://sdk.vercel.ai/docs)
- [ ] Create feature branch: `feat/vercel-ai-sdk-migration`
- [ ] Write migration tests

### Week 1 Implementation
- [ ] **Day 1**: Migrate BlipeeBrain to use `generateText` + tools
- [ ] **Day 2**: Test BlipeeBrain with real queries, compare results
- [ ] **Day 3**: Create agent tool definitions (calculateEmissions, detectAnomalies, etc.)
- [ ] **Day 4**: Update CarbonHunter to use new tools
- [ ] **Day 5**: Migrate chat API to use `streamText`

### Testing
- [ ] Unit tests for each tool
- [ ] Integration test: BlipeeBrain end-to-end
- [ ] E2E test: Chat with tool calling
- [ ] Performance: Compare latency vs. current implementation

### Rollout
- [ ] Deploy to staging
- [ ] A/B test: 10% traffic to new SDK
- [ ] Monitor error rates
- [ ] Full rollout if metrics good

---

## Code Removal (After Migration)

**Can Delete**:
- `/src/lib/ai/providers/openai.ts` (replaced by `@ai-sdk/openai`)
- `/src/lib/ai/providers/anthropic.ts` (replaced by `@ai-sdk/anthropic`)
- `/src/lib/ai/providers/deepseek.ts` (replaced by `@ai-sdk/deepseek`)
- Custom streaming logic in BlipeeBrain
- Manual JSON mode parsing

**Keep**:
- `/src/lib/ai/service.ts` (refactor to use Vercel AI SDK under the hood)
- Caching layer (wrap around Vercel AI SDK calls)
- Provider fallback logic (still useful)

---

## Risk Mitigation

### Risk 1: Breaking Changes
**Mitigation**: Feature flag to toggle between old/new implementation
```typescript
const USE_VERCEL_SDK = process.env.NEXT_PUBLIC_USE_VERCEL_SDK === 'true';

if (USE_VERCEL_SDK) {
  return await generateTextWithVercelSDK(prompt);
} else {
  return await currentImplementation(prompt);
}
```

### Risk 2: Performance Regression
**Mitigation**: Run benchmarks before/after
```typescript
// Before: measure latency of current implementation
// After: compare with Vercel AI SDK implementation
```

### Risk 3: Tool Calling Differences
**Mitigation**: Test with same prompts, compare outputs

---

## Expected Outcomes

### Developer Experience ✅
- **Type Safety**: Zod schemas for all tool parameters
- **Less Code**: Remove ~500 lines of custom provider logic
- **Better Errors**: Structured error handling from SDK

### User Experience ✅
- **Faster Responses**: Better streaming implementation
- **More Reliable**: Automatic retries, better error handling
- **Richer Interactions**: Tool call visibility in UI

### Maintainability ✅
- **Standard**: Using industry-standard SDK vs. custom code
- **Updates**: Automatic improvements from Vercel team
- **Community**: Large community, better docs

---

**Recommendation**: ✅ **MIGRATE NOW** - We're already doing agent refactor, packages are installed, perfect timing!

**Timeline**: 5 days (1 week sprint)
**Blocker**: None
**Next Step**: Start with BlipeeBrain migration (Phase 1)
