# Vercel AI SDK Integration Guide

## Overview

We've integrated Vercel AI SDK into blipee OS to leverage its powerful features for autonomous agents and AI operations. This provides significant improvements over the previous custom implementation.

## 🚀 Key Benefits

### 1. **Multi-Provider Orchestration**
- Seamless switching between DeepSeek, OpenAI, and Anthropic
- Automatic fallback with built-in retry logic
- Intelligent provider routing based on task type

### 2. **Advanced Features**
- **Tool Calling**: Agents can execute functions (query database, calculate, create targets)
- **Structured Outputs**: Zod schema validation for reliable data structures
- **Streaming**: Better backpressure handling and error recovery
- **Multi-Turn Conversations**: Context-aware dialogue management

### 3. **Production Ready**
- Built-in error handling and retries
- Performance optimizations
- Integration with Vercel AI Gateway
- Better cost management and monitoring

## 📦 What Was Added

### Core Services

1. **`vercel-ai-service.ts`** - Main AI service using Vercel AI SDK
   - Multi-provider orchestration
   - Intelligent fallback
   - Streaming support
   - Backward compatible with existing code

2. **`autonomous-agents/tools/agent-tools.ts`** - Tool definitions for agents
   - Query emissions data
   - Calculate carbon footprint
   - Create sustainability targets
   - Check compliance status
   - Schedule tasks
   - Request approvals
   - Analyze anomalies

3. **`autonomous-agents/enhanced-agent-executor.ts`** - Enhanced agent execution
   - Tool calling capabilities
   - Structured outputs
   - Multi-step task execution
   - Analysis and recommendations

### Dependencies

```json
{
  "ai": "^3.x",
  "@ai-sdk/openai": "^0.x",
  "@ai-sdk/anthropic": "^0.x",
  "@ai-sdk/deepseek": "^0.x"
}
```

## 🔧 Usage Examples

### Basic AI Completion

```typescript
import { vercelAIService } from '@/lib/ai/vercel-ai-service';

// Simple completion
const response = await vercelAIService.complete(
  'What are the best practices for reducing Scope 2 emissions?',
  {
    temperature: 0.7,
    maxTokens: 1000,
  }
);

console.log(response);
```

### Structured Output with Schema

```typescript
import { vercelAIService } from '@/lib/ai/vercel-ai-service';
import { z } from 'zod';

const targetSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.string()),
  targetData: z.object({
    target_name: z.string(),
    target_type: z.enum(['absolute', 'intensity', 'net_zero']),
    baseline_year: z.number(),
    target_year: z.number(),
  }).optional(),
});

const result = await vercelAIService.complete(
  'Help me set a net zero target for 2040',
  {
    schema: targetSchema,
    temperature: 0.7,
  }
);

const parsed = JSON.parse(result);
// Guaranteed to match schema!
```

### Streaming Response

```typescript
import { vercelAIService } from '@/lib/ai/vercel-ai-service';

for await (const chunk of vercelAIService.stream(
  'Explain the SBTi Net-Zero Standard',
  {
    temperature: 0.6,
    maxTokens: 2000,
  }
)) {
  process.stdout.write(chunk);
}
```

### Using Enhanced Agent Executor

```typescript
import { createAgentExecutor } from '@/lib/ai/autonomous-agents/enhanced-agent-executor';
import { z } from 'zod';

// Create executor for ESG Chief of Staff
const executor = createAgentExecutor('ESG Chief of Staff');

// Execute a task with tool calling
const result = await executor.executeTask(
  'Analyze our Q4 emissions data and recommend reduction strategies',
  {
    organizationId: 'org_123',
    buildingId: 'building_456',
    userId: 'user_789',
    timestamp: new Date(),
  },
  {
    maxToolCalls: 5,
    temperature: 0.7,
  }
);

console.log(result);
// {
//   success: true,
//   result: "...",
//   toolCallsMade: 2,
//   confidence: 0.9,
//   reasoning: [...],
//   metadata: {...}
// }
```

### Analysis and Recommendations

```typescript
const executor = createAgentExecutor('Carbon Hunter');

const analysis = await executor.analyzeAndRecommend(
  {
    monthlyEmissions: [
      { month: '2024-01', scope1: 120, scope2: 340, scope3: 890 },
      { month: '2024-02', scope1: 115, scope2: 330, scope3: 910 },
    ],
    targets: {
      scope1: { target: 100, deadline: '2025-12-31' },
      scope2: { target: 300, deadline: '2025-12-31' },
    }
  },
  'emissions_trend_analysis',
  {
    organizationId: 'org_123',
    timestamp: new Date(),
  }
);

console.log(analysis.result);
// {
//   analysis: {
//     summary: "...",
//     keyFindings: [...],
//     metrics: {...}
//   },
//   recommendations: [
//     {
//       priority: 'high',
//       action: 'Implement LED lighting upgrade',
//       impact: 'Reduce Scope 2 emissions by 15%',
//       effort: 'medium',
//       timeline: '3 months'
//     }
//   ]
// }
```

### Multi-Step Task Execution

```typescript
const executor = createAgentExecutor('Compliance Guardian');

const result = await executor.executeMultiStepTask(
  'Prepare GRI compliance report',
  {
    organizationId: 'org_123',
    timestamp: new Date(),
  },
  [
    'Query all emissions data for the reporting period',
    'Calculate compliance metrics against GRI standards',
    'Identify gaps and missing disclosures',
    'Generate recommendations for improvement',
    'Create draft report structure'
  ]
);

console.log(`Completed ${result.metadata.totalSteps} steps`);
console.log(result.result.summary);
```

## 🔄 Migrating Existing Agents

### Before (Old AIService)

```typescript
import { aiService } from '@/lib/ai/service';

const result = await aiService.complete(prompt, {
  temperature: 0.7,
  jsonMode: true,
});
```

### After (Vercel AI Service with Schema)

```typescript
import { vercelAIService } from '@/lib/ai/vercel-ai-service';
import { z } from 'zod';

const schema = z.object({
  // Define your expected structure
  message: z.string(),
  data: z.any(),
});

const result = await vercelAIService.complete(prompt, {
  temperature: 0.7,
  schema, // Validates output automatically!
});
```

### Updating Autonomous Agents

**Old approach:**
```typescript
class MyAgent extends AutonomousAgent {
  protected async executeTask(task: Task): Promise<TaskResult> {
    const response = await aiService.complete(prompt);
    // Manual parsing and error handling
    return {
      taskId: task.id,
      status: 'success',
      result: response,
      // ...
    };
  }
}
```

**New approach with Enhanced Executor:**
```typescript
import { createAgentExecutor } from '@/lib/ai/autonomous-agents/enhanced-agent-executor';

class MyAgent extends AutonomousAgent {
  private executor = createAgentExecutor(this.name);

  protected async executeTask(task: Task): Promise<TaskResult> {
    const result = await this.executor.executeTask(
      task.payload.description,
      {
        organizationId: task.context.organizationId,
        timestamp: new Date(),
      },
      {
        requireStructuredOutput: true,
        outputSchema: myTaskSchema,
      }
    );

    return {
      taskId: task.id,
      status: result.success ? 'success' : 'failure',
      result: result.result,
      confidence: result.confidence,
      reasoning: result.reasoning,
      completedAt: new Date(),
    };
  }
}
```

## 🛠️ Available Tools for Agents

Agents can use these tools via the Vercel AI SDK:

1. **`queryEmissionsData`** - Query emissions data from database
2. **`calculateCarbonFootprint`** - Calculate CO2e from activity data
3. **`createSustainabilityTarget`** - Create new targets (with approval)
4. **`queryComplianceStatus`** - Check compliance against standards
5. **`scheduleTask`** - Schedule future tasks
6. **`requestApproval`** - Request human approval for actions
7. **`analyzeAnomaly`** - Analyze data anomalies

### Tool Usage Example

The Vercel AI SDK automatically calls tools when needed:

```typescript
const executor = createAgentExecutor('Carbon Hunter');

// The AI will automatically call queryEmissionsData tool if needed
const result = await executor.executeTask(
  'What were our total emissions last month?',
  context,
  {
    maxToolCalls: 3, // Allow up to 3 tool calls
  }
);
```

## 📊 Provider Status and Monitoring

```typescript
// Check which providers are available
const providers = vercelAIService.getAvailableProviders();
console.log('Available:', providers); // ['DeepSeek', 'OpenAI', 'Anthropic']

// Get detailed status
const status = vercelAIService.getProviderStatus();
console.log(status);
// {
//   total: 3,
//   enabled: 3,
//   providers: [
//     { name: 'DeepSeek', priority: 1, enabled: true },
//     { name: 'OpenAI', priority: 2, enabled: true },
//     { name: 'Anthropic', priority: 3, enabled: true }
//   ],
//   primary: 'DeepSeek'
// }
```

## 🔐 Environment Variables

Ensure these are set:

```bash
# At least one is required
DEEPSEEK_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Optional: Vercel AI Gateway (for advanced routing)
VERCEL_AI_GATEWAY_URL=https://...
```

## 🎯 Best Practices

1. **Use Structured Outputs** - Always define Zod schemas for predictable results
2. **Set Appropriate Temperatures** - Lower (0.3-0.5) for analytical tasks, higher (0.7-0.9) for creative
3. **Limit Tool Calls** - Set maxToolCalls to prevent infinite loops
4. **Handle Errors Gracefully** - The service has built-in fallback, but always check result.success
5. **Monitor Provider Usage** - Track which providers are being used for cost optimization

## 🚧 Migration Checklist

- [ ] Install Vercel AI SDK packages (`npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/deepseek`)
- [ ] Set up environment variables
- [ ] Test vercelAIService with simple completion
- [ ] Create Zod schemas for your use cases
- [ ] Update autonomous agents to use EnhancedAgentExecutor
- [ ] Test tool calling with agent tasks
- [ ] Monitor provider usage and costs
- [ ] Gradually migrate from old aiService to vercelAIService

## 📝 Next Steps

1. **Explore Tool Definitions** - Add custom tools in `agent-tools.ts`
2. **Integrate with AI Gateway** - Set up Vercel AI Gateway for optimized routing
3. **Add Monitoring** - Track usage, costs, and performance
4. **Extend Capabilities** - Add more agent-specific tools and capabilities

## 🤝 Support

For questions or issues:
- Check Vercel AI SDK docs: https://sdk.vercel.ai/docs
- Review agent examples in `src/lib/ai/autonomous-agents/employees/`
- Open an issue in the repository

---

**🚀 The future of autonomous sustainability intelligence is here!**
