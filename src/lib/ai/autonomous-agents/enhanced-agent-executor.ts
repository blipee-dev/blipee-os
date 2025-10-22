/**
 * Enhanced Agent Executor with Vercel AI SDK
 *
 * Provides autonomous agents with:
 * - Tool calling capabilities
 * - Structured outputs
 * - Multi-turn conversations
 * - Better error handling
 * - Integration with Vercel AI Gateway
 */

import { vercelAIService } from '../vercel-ai-service';
import { getToolDefinitions, agentTools } from './tools/agent-tools';
import { z } from 'zod';

export interface AgentTaskContext {
  organizationId: string;
  buildingId?: string;
  userId?: string;
  conversationId?: string;
  timestamp: Date;
}

export interface AgentExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  toolCallsMade: number;
  confidence: number;
  reasoning: string[];
  metadata: Record<string, any>;
}

/**
 * Enhanced Agent Executor
 *
 * Wraps the Vercel AI Service to provide agent-specific functionality
 */
export class EnhancedAgentExecutor {
  private agentName: string;
  private tools: Record<string, any>;

  constructor(agentName: string) {
    this.agentName = agentName;
    this.tools = getToolDefinitions();
  }

  /**
   * Execute a task with tool calling
   */
  async executeTask(
    taskDescription: string,
    context: AgentTaskContext,
    options: {
      maxToolCalls?: number;
      temperature?: number;
      requireStructuredOutput?: boolean;
      outputSchema?: z.ZodSchema;
    } = {}
  ): Promise<AgentExecutionResult> {
    const {
      maxToolCalls = 5,
      temperature = 0.7,
      requireStructuredOutput = false,
      outputSchema,
    } = options;

    const systemPrompt = this.buildSystemPrompt(context);

    try {
      console.log(`🤖 ${this.agentName} executing task: ${taskDescription}`);

      // If structured output required, use schema
      if (requireStructuredOutput && outputSchema) {
        const response = await vercelAIService.complete(taskDescription, {
          systemPrompt,
          temperature,
          schema: outputSchema,
        });

        return {
          success: true,
          result: JSON.parse(response),
          toolCallsMade: 0,
          confidence: 0.9,
          reasoning: ['Structured output generated successfully'],
          metadata: {
            agentName: this.agentName,
            executionType: 'structured',
            timestamp: new Date().toISOString(),
          }
        };
      }

      // Standard execution with tool calling
      const response = await vercelAIService.complete(taskDescription, {
        systemPrompt,
        temperature,
        tools: this.tools,
        toolChoice: 'auto',
        maxRetries: 3,
      });

      return {
        success: true,
        result: response,
        toolCallsMade: 0, // Would be tracked by tool execution
        confidence: 0.85,
        reasoning: ['Task completed successfully'],
        metadata: {
          agentName: this.agentName,
          executionType: 'standard',
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} task execution failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolCallsMade: 0,
        confidence: 0,
        reasoning: ['Task execution failed'],
        metadata: {
          agentName: this.agentName,
          errorType: error instanceof Error ? error.name : 'UnknownError',
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Execute a multi-step task with conversation
   */
  async executeMultiStepTask(
    initialTask: string,
    context: AgentTaskContext,
    steps: string[]
  ): Promise<AgentExecutionResult> {
    const systemPrompt = this.buildSystemPrompt(context);
    const allResults: any[] = [];
    let totalToolCalls = 0;
    const reasoning: string[] = [];

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`🔄 ${this.agentName} executing step ${i + 1}/${steps.length}: ${step}`);

        const stepPrompt = `
Initial Task: ${initialTask}

Current Step (${i + 1}/${steps.length}): ${step}

Previous Results:
${allResults.map((r, idx) => `Step ${idx + 1}: ${JSON.stringify(r)}`).join('\n')}

Execute this step and provide the result.`;

        const response = await vercelAIService.complete(stepPrompt, {
          systemPrompt,
          temperature: 0.7,
          tools: this.tools,
          toolChoice: 'auto',
        });

        allResults.push(response);
        reasoning.push(`Step ${i + 1} completed: ${step}`);
      }

      return {
        success: true,
        result: {
          steps: allResults,
          summary: `Completed ${steps.length} steps successfully`
        },
        toolCallsMade: totalToolCalls,
        confidence: 0.9,
        reasoning,
        metadata: {
          agentName: this.agentName,
          executionType: 'multi-step',
          totalSteps: steps.length,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} multi-step task failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolCallsMade: totalToolCalls,
        confidence: 0,
        reasoning: [...reasoning, 'Multi-step execution failed'],
        metadata: {
          agentName: this.agentName,
          completedSteps: allResults.length,
          totalSteps: steps.length,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Analyze and provide recommendations
   */
  async analyzeAndRecommend(
    data: any,
    analysisType: string,
    context: AgentTaskContext
  ): Promise<AgentExecutionResult> {
    const schema = z.object({
      analysis: z.object({
        summary: z.string(),
        keyFindings: z.array(z.string()),
        metrics: z.record(z.any()),
      }),
      recommendations: z.array(z.object({
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        action: z.string(),
        impact: z.string(),
        effort: z.enum(['low', 'medium', 'high']),
        timeline: z.string(),
      })),
      confidence: z.number().min(0).max(1),
      reasoning: z.array(z.string()),
    });

    const prompt = `
Analyze the following ${analysisType} data and provide actionable recommendations.

Data:
${JSON.stringify(data, null, 2)}

Context:
- Organization ID: ${context.organizationId}
- Building ID: ${context.buildingId || 'N/A'}
- Timestamp: ${context.timestamp.toISOString()}

Provide a comprehensive analysis with:
1. Summary of key findings
2. Relevant metrics and KPIs
3. Prioritized recommendations with impact assessment
4. Confidence level in the analysis

Focus on sustainability, compliance, and operational efficiency.`;

    try {
      const response = await vercelAIService.complete(prompt, {
        systemPrompt: this.buildSystemPrompt(context),
        temperature: 0.6, // Lower for analytical tasks
        schema,
      });

      const analysis = JSON.parse(response);

      return {
        success: true,
        result: analysis,
        toolCallsMade: 0,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        metadata: {
          agentName: this.agentName,
          analysisType,
          recommendationCount: analysis.recommendations.length,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} analysis failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolCallsMade: 0,
        confidence: 0,
        reasoning: ['Analysis failed'],
        metadata: {
          agentName: this.agentName,
          analysisType,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Build system prompt for the agent
   */
  private buildSystemPrompt(context: AgentTaskContext): string {
    return `You are ${this.agentName}, an autonomous AI agent specializing in sustainability and ESG management.

Your capabilities include:
- Analyzing emissions and environmental data
- Creating and tracking sustainability targets
- Checking compliance with standards (GRI, CDP, TCFD, SBTi)
- Identifying optimization opportunities
- Providing actionable recommendations

Current Context:
- Organization ID: ${context.organizationId}
- Building ID: ${context.buildingId || 'N/A'}
- Timestamp: ${context.timestamp.toISOString()}

Guidelines:
1. Always be data-driven and provide specific, measurable recommendations
2. Reference relevant sustainability standards and best practices
3. Consider both environmental impact and business value
4. Be transparent about confidence levels and assumptions
5. Request human approval for high-impact decisions

You have access to tools for:
- Querying emissions data
- Calculating carbon footprints
- Creating sustainability targets
- Checking compliance status
- Scheduling tasks
- Requesting approvals
- Analyzing anomalies

Use these tools as needed to provide the best possible assistance.`;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    return {
      agentName: this.agentName,
      availableTools: Object.keys(this.tools),
      supportedFeatures: [
        'tool_calling',
        'structured_outputs',
        'multi_step_execution',
        'analysis_and_recommendations',
        'streaming',
      ],
      aiProvider: vercelAIService.getProviderStatus(),
    };
  }
}

/**
 * Create an enhanced executor for a specific agent
 */
export function createAgentExecutor(agentName: string): EnhancedAgentExecutor {
  return new EnhancedAgentExecutor(agentName);
}
