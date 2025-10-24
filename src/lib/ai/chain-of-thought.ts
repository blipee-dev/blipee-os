import { AIService } from "./service";
import { esgContextEngine } from "./esg-context-engine";
import { parseAIJSON } from "./utils/json-parser";

interface ChainOfThoughtStep {
  step: number;
  thought: string;
  confidence: number;
  evidence: string[];
}

interface ChainOfThoughtResponse {
  reasoning: ChainOfThoughtStep[];
  conclusion: string;
  confidence: number;
  actions: RecommendedAction[];
  visualizations: VisualizationSpec[];
  followUp: string[];
}

interface RecommendedAction {
  action: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: {
    metric: string;
    expectedChange: number;
    timeframe: string;
  };
  resources: string[];
  risks: string[];
}

interface VisualizationSpec {
  type: "chart" | "metric" | "matrix" | "table" | "timeline";
  component: string;
  data: any;
  config: any;
}

export class ChainOfThoughtEngine {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Process a query using chain-of-thought reasoning
   */
  async processWithReasoning(
    query: string,
    organizationId: string,
    userId?: string
  ): Promise<ChainOfThoughtResponse> {
    // Step 1: Build ESG context
    const context = await esgContextEngine.buildESGContext(query, organizationId, userId);

    // Step 2: Generate chain-of-thought prompt
    const reasoningPrompt = this.buildReasoningPrompt(query, context);

    // Step 3: Get AI response with structured output
    const response = await this.aiService.complete(reasoningPrompt, {
      temperature: 0.7,
      maxTokens: 2000,
      jsonMode: true,
      systemPrompt: this.getSystemPrompt()
    });

    // Step 4: Parse and validate response
    const parsed = this.parseResponse(response);

    // Step 5: Enhance with visualizations
    const enhanced = await this.enhanceWithVisualizations(parsed, context);

    return enhanced;
  }

  /**
   * Build a comprehensive reasoning prompt
   */
  private buildReasoningPrompt(query: string, context: any): string {
    return `
TASK: Analyze this ESG query using step-by-step reasoning.

CONTEXT:
${JSON.stringify(context, null, 2)}

USER QUERY: "${query}"

Please think through this step-by-step and respond in the following JSON structure:

{
  "reasoning": [
    {
      "step": 1,
      "thought": "What is the core question or need?",
      "confidence": 0.9,
      "evidence": ["Supporting data point 1", "Supporting data point 2"]
    },
    {
      "step": 2,
      "thought": "What relevant data and benchmarks apply?",
      "confidence": 0.85,
      "evidence": ["Metric comparison", "Industry benchmark"]
    },
    {
      "step": 3,
      "thought": "What are the implications and risks?",
      "confidence": 0.8,
      "evidence": ["Risk factors", "Stakeholder impacts"]
    },
    {
      "step": 4,
      "thought": "What actions should be recommended?",
      "confidence": 0.9,
      "evidence": ["Best practices", "Expected outcomes"]
    }
  ],
  "conclusion": "Clear, actionable summary of findings and recommendations",
  "confidence": 0.85,
  "actions": [
    {
      "action": "Specific action to take",
      "priority": "high",
      "impact": {
        "metric": "CO2 emissions",
        "expectedChange": -15,
        "timeframe": "6 months"
      },
      "resources": ["Team member", "Budget allocation"],
      "risks": ["Implementation challenge"]
    }
  ],
  "visualizations": [
    {
      "type": "chart",
      "component": "EmissionsTrendChart",
      "data": {},
      "config": {}
    }
  ],
  "followUp": [
    "Related question the user might have",
    "Next step to consider"
  ]
}

Apply the following reasoning principles:
1. Start with understanding the user's intent and context
2. Identify relevant data points and benchmarks
3. Analyze implications across E, S, and G dimensions
4. Consider stakeholder perspectives
5. Recommend specific, measurable actions
6. Suggest appropriate visualizations
7. Anticipate follow-up questions

Remember to:
- Use specific numbers and data from the context
- Consider materiality and stakeholder priorities
- Align with reporting frameworks and regulations
- Balance quick wins with long-term strategy
- Be transparent about confidence levels`;
  }

  /**
   * System prompt for chain-of-thought reasoning
   */
  private getSystemPrompt(): string {
    return `You are an expert ESG advisor with deep knowledge of:
- Climate science and emissions accounting (GHG Protocol)
- Sustainability reporting frameworks (GRI, SASB, TCFD, ISSB)
- ESG regulations and compliance requirements
- Industry best practices and benchmarks
- Stakeholder engagement and materiality assessment
- Risk management and scenario analysis

Your reasoning should be:
- Data-driven: Base conclusions on specific metrics and evidence
- Comprehensive: Consider environmental, social, and governance impacts
- Practical: Provide actionable recommendations with clear steps
- Strategic: Balance short-term actions with long-term goals
- Transparent: Show your reasoning process clearly

Always structure your thinking to show:
1. Understanding of the question
2. Analysis of relevant data
3. Consideration of impacts and risks
4. Clear recommendations
5. Confidence levels and limitations

IMPORTANT: Always respond in valid JSON format as specified in the user prompt.`;
  }

  /**
   * Parse and validate AI response
   */
  private parseResponse(response: any): ChainOfThoughtResponse {
    try {
      let parsed: any;
      if (typeof response === 'string') {
        const parseResult = parseAIJSON(response);
        if (!parseResult.success) {
          console.error('Error parsing chain-of-thought response:', parseResult.error);
          throw new Error('Failed to parse chain-of-thought response');
        }
        parsed = parseResult.data;
      } else {
        parsed = response;
      }
      
      // Validate structure
      if (!parsed.reasoning || !Array.isArray(parsed.reasoning)) {
        throw new Error('Invalid reasoning structure');
      }

      return {
        reasoning: parsed.reasoning,
        conclusion: parsed.conclusion || 'No conclusion provided',
        confidence: parsed.confidence || 0.5,
        actions: parsed.actions || [],
        visualizations: parsed.visualizations || [],
        followUp: parsed.followUp || []
      };
    } catch (error) {
      console.error('Failed to parse chain-of-thought response:', error);
      
      // Return fallback response
      return {
        reasoning: [{
          step: 1,
          thought: "Unable to process request with full reasoning",
          confidence: 0.3,
          evidence: []
        }],
        conclusion: "Please try rephrasing your question",
        confidence: 0.3,
        actions: [],
        visualizations: [],
        followUp: []
      };
    }
  }

  /**
   * Enhance response with appropriate visualizations
   */
  private async enhanceWithVisualizations(
    response: ChainOfThoughtResponse,
    context: any
  ): Promise<ChainOfThoughtResponse> {
    // Analyze what visualizations would be most helpful
    const visualizations: VisualizationSpec[] = [];

    // Check if emissions data is relevant
    if (response.conclusion.toLowerCase().includes('emission') || 
        response.conclusion.toLowerCase().includes('carbon')) {
      visualizations.push({
        type: 'chart',
        component: 'EmissionsTrendChart',
        data: {
          scope1: context.esgMetrics.emissions.scope1,
          scope2: context.esgMetrics.emissions.scope2,
          scope3: context.esgMetrics.emissions.scope3
        },
        config: {
          title: 'Emissions Overview',
          showTrend: true,
          showTarget: true
        }
      });
    }

    // Check if materiality is relevant
    if (response.conclusion.toLowerCase().includes('material') ||
        response.conclusion.toLowerCase().includes('priority')) {
      visualizations.push({
        type: 'matrix',
        component: 'MaterialityMatrix',
        data: {
          topics: context.materialTopics
        },
        config: {
          interactive: true,
          showQuadrants: true
        }
      });
    }

    // Check if targets/goals are relevant
    if (response.conclusion.toLowerCase().includes('target') ||
        response.conclusion.toLowerCase().includes('goal')) {
      visualizations.push({
        type: 'chart',
        component: 'TargetProgressChart',
        data: {
          targets: context.sustainabilityGoals
        },
        config: {
          showProgress: true,
          showTimeline: true
        }
      });
    }

    // Merge with AI-suggested visualizations
    const merged = [...visualizations, ...response.visualizations];
    
    // Remove duplicates
    const unique = merged.filter((v, index, self) =>
      index === self.findIndex(t => t.component === v.component)
    );

    return {
      ...response,
      visualizations: unique
    };
  }

  /**
   * Generate natural language explanation of reasoning
   */
  generateExplanation(response: ChainOfThoughtResponse): string {
    const steps = response.reasoning.map((step, index) => 
      `${index + 1}. ${step.thought} (${Math.round(step.confidence * 100)}% confidence)`
    ).join('\n');

    return `Here's how I analyzed your question:

${steps}

**Conclusion**: ${response.conclusion}

**Confidence**: ${Math.round(response.confidence * 100)}%

${response.actions.length > 0 ? `**Recommended Actions**:
${response.actions.map(a => `• ${a.action} (${a.priority} priority)`).join('\n')}` : ''}`;
  }
}

// Export singleton
export const chainOfThoughtEngine = new ChainOfThoughtEngine();