/**
 * Example: Autonomous Agent using Shared Tools
 *
 * This demonstrates how ANY agent can use the shared sustainability tools
 * with Vercel AI SDK for type-safe, reusable functionality.
 *
 * Pattern can be applied to:
 * - CarbonHunter
 * - ComplianceGuardian
 * - EsgChiefOfStaff
 * - CostSavingFinder
 * - SupplyChainInvestigator
 * - RegulatoryForesight
 * - PredictiveMaintenance
 * - AutonomousOptimizer
 */

import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAI } from '@ai-sdk/openai';
import { getSustainabilityTools } from './tools';

// Example Agent Class
export class ExampleSustainabilityAgent {
  // Initialize AI model with fallback
  private model = process.env.DEEPSEEK_API_KEY
    ? createDeepSeek({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com'
      })('deepseek-reasoner')
    : createOpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
        compatibility: 'strict'
      })('gpt-4o-mini');

  /**
   * Process a task using shared sustainability tools
   */
  async processTask(
    task: string,
    organizationId: string
  ): Promise<any> {
    try {
      // Use generateText with shared tools
      const result = await generateText({
        model: this.model,
        system: `You are an autonomous sustainability agent with access to powerful data analysis tools.

Available Tools:
- calculateEmissions: Get total emissions by scope for any time period
- detectAnomalies: Find unusual emission patterns using statistical analysis
- benchmarkEfficiency: Compare site performance across the portfolio
- investigateSources: Drill down into specific emission sources
- generateCarbonReport: Create comprehensive carbon reports

Organization ID: ${organizationId}

Analyze the task and use the appropriate tools to provide insights and recommendations.`,

        prompt: task,

        // ✅ Use shared sustainability tools!
        tools: getSustainabilityTools(),

        maxToolRoundtrips: 5, // Allow multi-step reasoning

        temperature: 0.7,
        maxTokens: 2000
      });

      return {
        success: true,
        response: result.text,
        toolsUsed: result.toolCalls?.map(tc => tc.toolName) || [],
        totalTokens: result.usage?.totalTokens || 0,
        roundtrips: result.roundtrips?.length || 0
      };

    } catch (error: any) {
      console.error('❌ Agent error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example 1: Calculate emissions for a time period
 */
export async function example1_CalculateEmissions() {
  const agent = new ExampleSustainabilityAgent();

  const result = await agent.processTask(
    "What are my total Scope 2 emissions for 2025 so far?",
    "22647141-2ee4-4d8d-8b47-16b0cbd830b2" // Org ID
  );

  console.log('✅ Result:', result.response);
  console.log('🔧 Tools used:', result.toolsUsed);
  // Output: ["calculateEmissions"]
  // Response: "Your Scope 2 emissions for 2025 YTD are 277.3 tCO2e, primarily from electricity (159.6 tCO2e)..."
}

/**
 * Example 2: Detect anomalies
 */
export async function example2_DetectAnomalies() {
  const agent = new ExampleSustainabilityAgent();

  const result = await agent.processTask(
    "Find any unusual emission spikes in my electricity usage",
    "22647141-2ee4-4d8d-8b47-16b0cbd830b2"
  );

  console.log('✅ Result:', result.response);
  console.log('🔧 Tools used:', result.toolsUsed);
  // Output: ["detectAnomalies"]
  // Response: "I found 3 high anomalies in electricity usage. March had a spike of 45.2 tCO2e vs average of 25.3..."
}

/**
 * Example 3: Benchmark efficiency across sites
 */
export async function example3_BenchmarkEfficiency() {
  const agent = new ExampleSustainabilityAgent();

  const result = await agent.processTask(
    "Which of my sites are most efficient? Where should I focus improvement efforts?",
    "22647141-2ee4-4d8d-8b47-16b0cbd830b2"
  );

  console.log('✅ Result:', result.response);
  console.log('🔧 Tools used:', result.toolsUsed);
  // Output: ["benchmarkEfficiency"]
  // Response: "Building A is your most efficient site at 0.0251 tCO2e/sqm. Building C needs improvement at 0.0512..."
}

/**
 * Example 4: Multi-step analysis (agent uses multiple tools)
 */
export async function example4_MultiStepAnalysis() {
  const agent = new ExampleSustainabilityAgent();

  const result = await agent.processTask(
    "Give me a complete carbon analysis: total emissions, any anomalies, and site efficiency comparison",
    "22647141-2ee4-4d8d-8b47-16b0cbd830b2"
  );

  console.log('✅ Result:', result.response);
  console.log('🔧 Tools used:', result.toolsUsed);
  // Output: ["calculateEmissions", "detectAnomalies", "benchmarkEfficiency"]
  // Response: "Complete analysis: Total emissions: 427.68 tCO2e. Found 2 anomalies in March. Building C is underperforming..."
}

/**
 * Example 5: Generate comprehensive report
 */
export async function example5_GenerateReport() {
  const agent = new ExampleSustainabilityAgent();

  const result = await agent.processTask(
    "Generate a comprehensive carbon report for Q1 2025",
    "22647141-2ee4-4d8d-8b47-16b0cbd830b2"
  );

  console.log('✅ Result:', result.response);
  console.log('🔧 Tools used:', result.toolsUsed);
  // Output: ["generateCarbonReport"]
  // Response: "Q1 2025 Carbon Report: Total emissions: 142.5 tCO2e. Data quality: high (342 data points)..."
}

// ============================================
// HOW OTHER AGENTS CAN USE THESE TOOLS
// ============================================

/**
 * CarbonHunter Agent
 * Instead of custom handleCarbonCalculation(), just use shared tools
 */
export class CarbonHunterV2 extends ExampleSustainabilityAgent {
  // ✅ Inherits all tool usage from base class
  // ✅ No need to implement custom SQL queries
  // ✅ Just customize the system prompt

  async hunt(organizationId: string) {
    return await this.processTask(
      "Hunt down all emission sources and identify opportunities for reduction",
      organizationId
    );
  }
}

/**
 * ComplianceGuardian Agent
 * Uses same tools but different focus
 */
export class ComplianceGuardianV2 extends ExampleSustainabilityAgent {
  async checkCompliance(organizationId: string, threshold: number) {
    return await this.processTask(
      `Check if emissions exceed the threshold of ${threshold} tCO2e and flag any compliance risks`,
      organizationId
    );
  }
}

/**
 * ESG Chief of Staff Agent
 * Uses same tools for executive reporting
 */
export class EsgChiefOfStaffV2 extends ExampleSustainabilityAgent {
  async generateExecutiveSummary(organizationId: string) {
    return await this.processTask(
      "Generate an executive summary of our carbon performance with key insights and recommendations",
      organizationId
    );
  }
}

/**
 * Cost Saving Finder Agent
 * Uses same tools but focuses on financial impact
 */
export class CostSavingFinderV2 extends ExampleSustainabilityAgent {
  async findSavings(organizationId: string, carbonPrice: number) {
    return await this.processTask(
      `Find emission reduction opportunities and calculate cost savings at $${carbonPrice} per tonne`,
      organizationId
    );
  }
}

// ============================================
// KEY BENEFITS
// ============================================

/*
✅ CODE REUSE
- ONE implementation of calculateEmissions (not 8 agent copies)
- ONE implementation of detectAnomalies (not 8 agent copies)
- All agents use same SQL queries → consistent results

✅ TYPE SAFETY
- Zod validates all tool parameters
- TypeScript knows exact types
- Compile-time error checking

✅ MAINTAINABILITY
- Fix bug once → all agents benefit
- Add feature once → all agents get it
- Test once → all agents tested

✅ DEVELOPER EXPERIENCE
- Simple to add new agents
- Just extend base class
- Customize system prompt
- No SQL knowledge needed

✅ CONSISTENCY
- All agents use same calculation methods
- Same emission values across all agents
- No discrepancies between agent outputs

BEFORE: 8 agents × 5 methods = 40 implementations ❌
AFTER: 1 shared library × 5 tools = 5 implementations ✅
CODE REDUCTION: 87.5%
*/
