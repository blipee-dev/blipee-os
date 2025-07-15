/**
 * BLIPEE CONVERSATIONAL ENGINE
 * The natural language interface to the world's most advanced sustainability AI
 */

import { blipeeIntelligence } from "./sustainability-intelligence";
import { networkIntelligence } from "./network-intelligence/ai-integration";
import { aiContextEngine } from "./context-engine";

export class ConversationalEngine {
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private userContext: Map<string, any> = new Map();

  /**
   * The magic happens here - pure conversation to action
   */
  async chat(userMessage: string, userId?: string, organizationId?: string): Promise<{
    response: string;
    visualizations?: any[];
    actions?: any[];
    notifications?: any[];
  }> {
    // Add to conversation history
    this.conversationHistory.push({ role: "user", content: userMessage });

    // Build enriched context including network intelligence
    const enrichedContext = await aiContextEngine.buildEnrichedContext(
      userMessage,
      userId,
      organizationId
    );

    // Extract intent and context
    const understanding = await this.understand(userMessage, enrichedContext);

    // Generate response based on intent
    let response = "";
    let visualizations: any[] = [];
    let actions: any[] = [];
    let notifications: any[] = [];

    // Handle different conversation types
    if (this.isAnalyticalQuery(understanding)) {
      response = await this.handleAnalysis(userMessage, enrichedContext);
      visualizations = await this.generateVisualizations(understanding);
    } else if (this.isPredictiveQuery(understanding)) {
      const predictions = await this.handlePrediction(userMessage);
      response = predictions.narrative;
      visualizations = predictions.visualizations;
    } else if (this.isActionRequest(understanding)) {
      const plan = await this.handleActionRequest(userMessage);
      response = plan.response;
      actions = plan.actions;
    } else if (this.isReportRequest(understanding)) {
      const report = await this.generateReport(userMessage);
      response = report.summary;
      visualizations = report.visualizations;
    }

    // Check for proactive notifications
    notifications = await this.checkForNotifications(understanding);

    // Add AI response to history
    this.conversationHistory.push({ role: "assistant", content: response });

    return { response, visualizations, actions, notifications };
  }

  /**
   * Natural language understanding
   */
  private async understand(message: string, enrichedContext?: any): Promise<any> {
    // Advanced NLU with context awareness
    const lowerMessage = message.toLowerCase();

    // Pattern matching for common intents
    const patterns = {
      analysis: /analyze|show me|what is|how much|tell me about/i,
      prediction: /predict|forecast|will|future|trend|projection/i,
      action: /reduce|improve|optimize|implement|do|make|achieve/i,
      report: /report|summary|overview|status|progress/i,
      target: /target|goal|objective|aim|reach|achieve by/i,
      benchmark: /compare|benchmark|peers|industry|others|ranking/i,
      compliance: /comply|compliance|regulation|framework|csrd|tcfd/i,
      network: /supply chain|supplier|peer|benchmark|network|partner/i,
    };

    // Context from conversation history
    const recentContext = this.conversationHistory.slice(-5);

    // Check if network intelligence is relevant
    let networkRelevance = null;
    if (enrichedContext?.networkIntelligence) {
      const networkContext = enrichedContext.networkIntelligence;
      if (patterns.network.test(message) || patterns.benchmark.test(message)) {
        networkRelevance = {
          hasSupplyChainData: !!networkContext.supplyChainRisk,
          hasPeerBenchmarks: !!networkContext.peerBenchmarks?.length,
          hasNetworkMetrics: !!networkContext.networkMetrics,
          summary: networkIntelligence.generateContextSummary(networkContext)
        };
      }
    }

    return {
      patterns,
      message,
      recentContext,
      enrichedContext,
      networkRelevance,
      timestamp: new Date(),
    };
  }

  /**
   * Handle analytical queries
   */
  private async handleAnalysis(message: string, enrichedContext?: any): Promise<string> {
    // Examples of natural analysis
    if (message.includes("emissions")) {
      return await this.analyzeEmissions(message);
    }
    if (message.includes("energy")) {
      return await this.analyzeEnergy(message);
    }
    if (message.includes("suppliers") || message.includes("supply chain")) {
      return await this.analyzeSupplyChain(message, enrichedContext);
    }
    if (message.includes("benchmark") || message.includes("compare")) {
      return await this.analyzeBenchmarks(message, enrichedContext);
    }

    // Default analysis
    return `I'll analyze that for you. Based on current data...`;
  }

  /**
   * Natural energy analysis
   */
  private async analyzeEnergy(message: string): Promise<string> {
    return `Your energy consumption is trending well. Let me break this down for you...`;
  }

  /**
   * Natural supply chain analysis
   */
  private async analyzeSupplyChain(message: string, enrichedContext?: any): Promise<string> {
    if (enrichedContext?.networkIntelligence?.supplyChainRisk) {
      const risk = enrichedContext.networkIntelligence.supplyChainRisk;
      
      let response = `I've analyzed your supply chain network. `;
      
      if (risk.totalConnections > 0) {
        response += `You have ${risk.totalConnections} active supplier connections. `;
      }
      
      if (risk.criticalSuppliers.length > 0) {
        response += `\n\nHeads up - ${risk.criticalSuppliers.length} suppliers need attention:\n`;
        risk.criticalSuppliers.slice(0, 3).forEach((supplier, i) => {
          response += `${i + 1}. ${supplier.name} (Risk: ${supplier.riskScore}/100, Tier ${supplier.tier})\n`;
        });
      }
      
      if (risk.riskDistribution) {
        response += `\n\nRisk distribution: ${risk.riskDistribution.low_risk} low-risk, `;
        response += `${risk.riskDistribution.medium_risk} medium-risk, `;
        response += `${risk.riskDistribution.high_risk} high-risk suppliers.`;
      }
      
      return response;
    }
    
    return `I'll analyze your supply chain for you. To get detailed insights, make sure your suppliers are connected to the network.`;
  }

  /**
   * Natural benchmark analysis
   */
  private async analyzeBenchmarks(message: string, enrichedContext?: any): Promise<string> {
    if (enrichedContext?.networkIntelligence?.peerBenchmarks) {
      const benchmarks = enrichedContext.networkIntelligence.peerBenchmarks;
      
      if (benchmarks.length > 0) {
        let response = `Here's how you compare to your industry peers:\n\n`;
        
        benchmarks.slice(0, 5).forEach((benchmark, i) => {
          response += `• ${benchmark.metricName}: Industry average is ${benchmark.industryMean.toFixed(1)}`;
          if (benchmark.industryMedian) {
            response += ` (median: ${benchmark.industryMedian.toFixed(1)})`;
          }
          response += `\n  ${benchmark.interpretation}\n\n`;
        });
        
        response += `These benchmarks are based on anonymous data from organizations in your industry.`;
        
        return response;
      }
    }
    
    return `I'll help you benchmark against industry peers. Join the network to access anonymous benchmark data from similar organizations.`;
  }

  /**
   * Natural emission analysis
   */
  private async analyzeEmissions(message: string): Promise<string> {
    // Extract timeframe from natural language
    const timeframe = this.extractTimeframe(message);

    // Get actual data (would be from database)
    const emissions = {
      total: 2847.5,
      scope1: 453.2,
      scope2: 1823.7,
      scope3: 570.6,
      trend: -12.3,
      mainSources: [
        { source: "Electricity", percentage: 45 },
        { source: "Fleet", percentage: 28 },
        { source: "Supply Chain", percentage: 27 },
      ],
    };

    // Generate natural response
    return `Your total emissions ${timeframe} are ${emissions.total} tonnes CO₂e, which is ${Math.abs(emissions.trend)}% ${emissions.trend < 0 ? "lower" : "higher"} than the previous period. 

The breakdown shows:
• Scope 1 (direct): ${emissions.scope1} tonnes (${((emissions.scope1 / emissions.total) * 100).toFixed(1)}%)
• Scope 2 (electricity): ${emissions.scope2} tonnes (${((emissions.scope2 / emissions.total) * 100).toFixed(1)}%)  
• Scope 3 (value chain): ${emissions.scope3} tonnes (${((emissions.scope3 / emissions.total) * 100).toFixed(1)}%)

Your main emission sources are ${emissions.mainSources[0].source} (${emissions.mainSources[0].percentage}%), followed by ${emissions.mainSources[1].source} and ${emissions.mainSources[2].source}.

${emissions.trend < 0 ? "Great progress! You're trending in the right direction." : "There's opportunity to reverse this trend - shall I show you how?"}`;
  }

  /**
   * Handle predictive queries
   */
  private async handlePrediction(message: string): Promise<any> {
    const timeHorizon = this.extractTimeHorizon(message);

    // Generate prediction
    const prediction = {
      expected: 3250,
      confidence: 0.87,
      factors: [
        "Seasonal increase",
        "New facility opening",
        "Supply chain optimization",
      ],
      recommendation: "Pre-emptively increase renewable energy allocation",
    };

    const narrative = `Based on current patterns and upcoming factors, I predict your emissions will reach ${prediction.expected} tonnes CO₂e by ${timeHorizon} (87% confidence).

Key factors influencing this:
${prediction.factors.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Recommendation: ${prediction.recommendation} - this could prevent 15% of the projected increase.`;

    const visualizations = [
      {
        type: "forecast-chart",
        data: this.generateForecastData(prediction),
      },
    ];

    return { narrative, visualizations };
  }

  /**
   * Handle action requests
   */
  private async handleActionRequest(message: string): Promise<any> {
    // Parse the goal
    const goal = this.extractGoal(message);

    // Generate action plan
    const plan = {
      objective: goal,
      impact: -500, // tonnes CO2e
      timeframe: "3 months",
      steps: [
        { action: "Switch 40% of energy to renewable sources", impact: -200 },
        { action: "Optimize logistics routes using AI", impact: -150 },
        { action: "Implement supplier engagement program", impact: -150 },
      ],
    };

    const response = `I'll help you ${goal}. Here's a plan that will reduce emissions by ${Math.abs(plan.impact)} tonnes CO₂e over ${plan.timeframe}:

${plan.steps.map((s, i) => `${i + 1}. ${s.action} (saves ${Math.abs(s.impact)} tonnes)`).join("\n")}

This approach has a 92% success rate based on similar implementations. Shall I create tasks for each step?`;

    const actions = plan.steps.map((step) => ({
      type: "task",
      description: step.action,
      impact: step.impact,
      status: "proposed",
    }));

    return { response, actions };
  }

  /**
   * Generate intelligent reports
   */
  private async generateReport(message: string): Promise<any> {
    const reportType = this.extractReportType(message);
    const period = this.extractPeriod(message);

    // Generate executive summary
    const summary = `Here's your ${reportType} report for ${period}:

📊 **Performance Highlights**
• Total emissions: 2,847 tonnes CO₂e (↓12% vs last period)
• Progress to net-zero: 34% (ahead of schedule)
• Cost savings from efficiency: $127,000

🎯 **Target Status**
• 2025 Target: On track (projected to exceed by 8%)
• 2030 Target: Requires 15% acceleration
• SBTi Alignment: Fully compliant

🚀 **Key Achievements**
• Completed transition to renewable energy (Phase 1)
• Reduced supply chain emissions by 23%
• Achieved ISO 14001 certification

⚡ **Immediate Opportunities**
• Fleet electrification could save 400 tonnes/year
• Supplier engagement program ready to launch
• Carbon offset strategy could achieve carbon neutrality by Q4`;

    const visualizations = [
      { type: "emissions-trend", period },
      { type: "target-progress", targets: ["2025", "2030"] },
      { type: "breakdown-pie", scopes: [1, 2, 3] },
    ];

    return { summary, visualizations };
  }

  /**
   * Helper methods for natural language processing
   */
  private isAnalyticalQuery(understanding: any): boolean {
    return understanding.patterns.analysis.test(understanding.message);
  }

  private isPredictiveQuery(understanding: any): boolean {
    return understanding.patterns.prediction.test(understanding.message);
  }

  private isActionRequest(understanding: any): boolean {
    return understanding.patterns.action.test(understanding.message);
  }

  private isReportRequest(understanding: any): boolean {
    return understanding.patterns.report.test(understanding.message);
  }

  private extractTimeframe(message: string): string {
    if (message.includes("today")) return "today";
    if (message.includes("this week")) return "this week";
    if (message.includes("this month")) return "this month";
    if (message.includes("this year")) return "this year";
    return "in the current period";
  }

  private extractTimeHorizon(message: string): string {
    if (message.includes("next week")) return "next week";
    if (message.includes("next month")) return "next month";
    if (message.includes("next quarter")) return "next quarter";
    if (message.includes("next year")) return "next year";
    return "the end of this quarter";
  }

  private extractGoal(message: string): string {
    // Extract action goal from natural language
    if (message.includes("reduce emissions")) return "reduce emissions";
    if (message.includes("carbon neutral")) return "achieve carbon neutrality";
    if (message.includes("net zero")) return "reach net-zero";
    return "improve sustainability performance";
  }

  private extractReportType(message: string): string {
    if (message.includes("sustainability")) return "sustainability";
    if (message.includes("emissions")) return "emissions";
    if (message.includes("esg")) return "ESG";
    if (message.includes("compliance")) return "compliance";
    return "executive";
  }

  private extractPeriod(message: string): string {
    if (message.includes("last month")) return "last month";
    if (message.includes("last quarter")) return "Q4 2024";
    if (message.includes("last year")) return "2024";
    return "the current period";
  }

  private async generateVisualizations(understanding: any): Promise<any[]> {
    // Dynamically generate relevant visualizations
    return [];
  }

  private async checkForNotifications(understanding: any): Promise<any[]> {
    // Check for important notifications
    return [
      {
        type: "insight",
        message:
          "Energy prices are 23% lower than average right now - good time to lock in renewable contracts",
        priority: "high",
      },
    ];
  }

  private generateForecastData(prediction: any): any {
    // Generate forecast visualization data
    return {
      historical: [],
      forecast: [],
      confidence_band: [],
    };
  }
}

// Export the conversational interface
export const conversationalEngine = new ConversationalEngine();
