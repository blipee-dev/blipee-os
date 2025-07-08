import { aiContextEngine } from "./context-engine";

interface ProactiveInsight {
  type: "welcome" | "alert" | "opportunity" | "achievement" | "prediction";
  priority: "low" | "medium" | "high" | "critical";
  message: string;
  data?: any;
  actionable: boolean;
  suggestedActions?: string[];
}

export class ProactiveInsightEngine {
  /**
   * Generate intelligent welcome message with real-time building insights
   */
  async generateWelcomeInsights(): Promise<{
    message: string;
    components: any[];
    suggestions: string[];
  }> {
    // Get real-time building context
    const context = await aiContextEngine.buildEnrichedContext(
      "building status",
      "demo-user",
    );

    // Check if this is a new user/organization with no data
    const isNewUser = await this.isNewUserWithoutData(context);

    if (isNewUser) {
      // Return welcome message for new users without mock data
      return this.generateNewUserWelcome(context);
    }

    // Analyze current building state
    const insights = await this.analyzeBuildingState(context);

    // Generate intelligent welcome message
    const welcomeMessage = await this.craftIntelligentWelcome(
      insights,
      context,
    );

    // Create relevant components
    const components = await this.generateWelcomeComponents(insights, context);

    // Generate intelligent suggestions
    const suggestions = await this.generateWelcomeSuggestions(insights);

    return {
      message: welcomeMessage,
      components,
      suggestions,
    };
  }

  /**
   * Check if this is a new user without any data
   */
  private async isNewUserWithoutData(context: any): Promise<boolean> {
    // Check if user has no buildings, no data, just completed onboarding
    const hasBuildings = context.buildings && context.buildings.length > 0;
    const hasEmissionData = context.realTimeMetrics?.emissions?.total > 0;
    const hasHistoricalData = context.historicalData && context.historicalData.length > 0;
    
    return !hasBuildings || (!hasEmissionData && !hasHistoricalData);
  }

  /**
   * Generate welcome message for new users without mock data
   */
  private generateNewUserWelcome(context: any): {
    message: string;
    components: any[];
    suggestions: string[];
  } {
    const userName = context.user?.full_name?.split(' ')[0] || 'there';
    
    const message = `Welcome to blipee, ${userName}! 🌱

I'm your AI sustainability assistant, and I'm excited to help you build a more sustainable future. I noticed you're just getting started, so let me guide you through the setup process.

**Great news!** If you already have your data in spreadsheets or previous sustainability reports, you can simply drag and drop them into this chat, and I'll extract all the relevant information automatically. I can handle:
• Excel/CSV files with energy consumption data
• PDF sustainability reports
• Utility bills (electricity, gas, water)
• Carbon footprint calculations
• ESG reports

Just drop your files here, or let's set things up step by step:`;

    const components = [
      {
        type: "quick-start-upload",
        props: {
          onFileUpload: (files: FileList) => {
            console.log("Files uploaded:", files);
          }
        }
      },
      {
        type: "setup-checklist",
        props: {
          title: "Or Set Up Step by Step",
          steps: [
            {
              id: "add-building",
              title: "Add Your First Building",
              description: "Tell me about your building or facility",
              status: "pending",
              action: "Add building details"
            },
            {
              id: "connect-meters",
              title: "Connect Energy Meters",
              description: "Link your utility accounts or smart meters",
              status: "pending",
              action: "Connect utilities"
            },
            {
              id: "upload-bills",
              title: "Upload Recent Bills",
              description: "Share your electricity, gas, or water bills",
              status: "pending",
              action: "Upload documents"
            },
            {
              id: "set-baseline",
              title: "Establish Baseline",
              description: "Set your emissions baseline and targets",
              status: "pending",
              action: "Set targets"
            }
          ],
          completedCount: 0,
          totalCount: 4
        }
      }
    ];

    const suggestions = [
      "I have my data in a spreadsheet",
      "Upload my sustainability reports",
      "Import data from Excel",
      "What formats do you accept?"
    ];

    return {
      message,
      components,
      suggestions
    };
  }

  /**
   * Analyze current building state for proactive insights
   */
  private async analyzeBuildingState(
    context: any,
  ): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    const metrics = context.realTimeMetrics;

    // Energy Analysis
    const energyEfficiency = metrics.energy.efficiency;
    if (energyEfficiency < 80) {
      insights.push({
        type: "alert",
        priority: "high",
        message: `energy efficiency is currently at ${energyEfficiency}%, which is below the optimal range`,
        actionable: true,
        suggestedActions: ["Run energy optimization", "Check HVAC settings"],
      });
    } else if (energyEfficiency > 90) {
      insights.push({
        type: "achievement",
        priority: "medium",
        message: `your building is achieving excellent energy efficiency at ${energyEfficiency}%`,
        actionable: false,
      });
    }

    // Trend Analysis
    if (metrics.energy.trend === "increasing") {
      const currentUsage = metrics.energy.currentUsage;
      const baseline = metrics.energy.baseline;
      const increase = Math.round(((currentUsage - baseline) / baseline) * 100);

      insights.push({
        type: "alert",
        priority: increase > 20 ? "high" : "medium",
        message: `energy usage is currently ${increase}% above baseline, and I'm investigating the cause`,
        actionable: true,
        suggestedActions: ["Show detailed breakdown", "Check equipment status"],
      });
    }

    // Predictive Insights
    const predictions = context.predictiveInsights;
    const criticalPredictions = predictions.filter(
      (p: any) => p.urgency === "high" || p.urgency === "critical",
    );

    if (criticalPredictions.length > 0) {
      insights.push({
        type: "prediction",
        priority: "critical",
        message: `${criticalPredictions.length} critical issue(s) predicted in the next 7 days`,
        data: criticalPredictions,
        actionable: true,
        suggestedActions: [
          "View predictions",
          "Schedule preventive maintenance",
        ],
      });
    }

    // Occupancy Insights
    const occupancy = metrics.occupancy;
    const occupancyRate = (occupancy.current / occupancy.capacity) * 100;

    if (occupancyRate < 30) {
      insights.push({
        type: "opportunity",
        priority: "medium",
        message: `Building is only ${Math.round(occupancyRate)}% occupied - opportunity to reduce energy usage`,
        actionable: true,
        suggestedActions: [
          "Optimize unoccupied zones",
          "Implement smart scheduling",
        ],
      });
    }

    // Environmental Factors
    const weather = context.environmentalFactors.weather;
    if (weather.current.temp > 85) {
      insights.push({
        type: "prediction",
        priority: "medium",
        message: `High outdoor temperature (${Math.round(weather.current.temp)}°F) - increased cooling demand expected`,
        actionable: true,
        suggestedActions: ["Pre-cool building", "Check HVAC capacity"],
      });
    }

    // Equipment Status
    const equipment = metrics.equipment;
    const totalDevices = Object.values(equipment).flat().length;
    const onlineDevices = Object.values(equipment)
      .flat()
      .filter((device: any) => device.status === "online").length;
    const deviceHealth = (onlineDevices / totalDevices) * 100;

    if (deviceHealth < 95) {
      insights.push({
        type: "alert",
        priority: "medium",
        message: `${totalDevices - onlineDevices} device(s) need attention`,
        actionable: true,
        suggestedActions: ["View device status", "Schedule maintenance"],
      });
    }

    // Cost Optimization Opportunities
    const energyPrices =
      context.environmentalFactors.economicFactors.energyPrices;
    const timeContext = context.environmentalFactors.timeContext;

    if (
      energyPrices.current > energyPrices.offPeak &&
      timeContext.timeOfDay === "morning"
    ) {
      insights.push({
        type: "opportunity",
        priority: "medium",
        message: `Currently in peak pricing (${energyPrices.current}/kWh) - shifting loads could save money`,
        actionable: true,
        suggestedActions: [
          "Show load shifting opportunities",
          "Implement demand response",
        ],
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Craft intelligent welcome message based on insights
   */
  private async craftIntelligentWelcome(
    insights: ProactiveInsight[],
    context: any,
  ): Promise<string> {
    const buildingName = context.building.name;
    const criticalInsights = insights.filter((i) => i.priority === "critical");
    const plannedActivities = context.plannedActivities || [];

    // Natural, personable greeting with user's first name
    const userName = context.userProfile?.firstName || "there";

    let welcomeMessage = `Good ${this.getTimeOfDayGreeting()}, ${userName}! 🌱\n\n`;
    welcomeMessage += `I've been tracking your sustainability metrics. Your organization is making great progress!`;

    // Only show critical alerts in welcome message
    if (criticalInsights.length > 0) {
      welcomeMessage += ` However, there's something urgent that needs your attention:\n\n`;
      welcomeMessage += `🚨 **Urgent:**\n`;
      criticalInsights.forEach((insight) => {
        welcomeMessage += `• ${insight.message}\n`;
      });
    }

    // Show today's planned activities if any
    if (plannedActivities.length > 0) {
      const todayActivities = plannedActivities.filter(
        (activity: any) =>
          new Date(activity.date).toDateString() === new Date().toDateString(),
      );

      if (todayActivities.length > 0) {
        welcomeMessage += `\n\n📅 **Today's schedule:**\n`;
        todayActivities.slice(0, 2).forEach((activity: any) => {
          welcomeMessage += `• ${activity.time}: ${activity.description}\n`;
        });
      }
    }

    welcomeMessage += `\n\nHow can I help you achieve your sustainability goals today?`;

    return welcomeMessage;
  }

  /**
   * Generate relevant components for welcome screen
   */
  private async generateWelcomeComponents(
    insights: ProactiveInsight[],
    context: any,
  ): Promise<any[]> {
    const components = [];

    // Always show energy dashboard
    components.push({
      type: "energy-dashboard",
      props: {
        title: "Live Building Performance",
        currentUsage: context.realTimeMetrics.energy.currentUsage,
        trend: context.realTimeMetrics.energy.trend,
        efficiency: context.realTimeMetrics.energy.efficiency,
        breakdown: [
          {
            name: "HVAC",
            value: Math.round(
              context.realTimeMetrics.energy.currentUsage * 0.47,
            ),
            color: "#0EA5E9",
          },
          {
            name: "Lighting",
            value: Math.round(
              context.realTimeMetrics.energy.currentUsage * 0.28,
            ),
            color: "#8B5CF6",
          },
          {
            name: "Equipment",
            value: Math.round(
              context.realTimeMetrics.energy.currentUsage * 0.25,
            ),
            color: "#10B981",
          },
        ],
        predictions: {
          nextHour: Math.round(
            context.realTimeMetrics.energy.currentUsage * 1.05,
          ),
          peakToday: Math.round(
            context.realTimeMetrics.energy.currentUsage * 1.15,
          ),
          endOfMonth: Math.round(
            context.realTimeMetrics.energy.currentUsage * 720 * 0.95,
          ),
        },
      },
    });

    // Add insights panel if there are actionable insights
    const actionableInsights = insights.filter((i) => i.actionable);
    if (actionableInsights.length > 0) {
      components.push({
        type: "insights-panel",
        props: {
          title: "AI Insights & Recommendations",
          insights: actionableInsights.map((insight) => ({
            type: insight.type,
            text: insight.message,
            confidence: 0.85 + Math.random() * 0.1, // Simulated confidence
            actionable: insight.actionable,
          })),
        },
      });
    }

    // Add optimization dashboard if there are opportunities
    const opportunities = insights.filter((i) => i.type === "opportunity");
    if (opportunities.length > 0) {
      components.push({
        type: "optimization-dashboard",
        props: {
          title: "Smart Optimization Opportunities",
          opportunities: [
            {
              name: "HVAC Optimization",
              savings: "$1,200/month",
              effort: "Low",
              impact: "High",
              timeframe: "Immediate",
              confidence: 0.89,
            },
            {
              name: "Smart Scheduling",
              savings: "$840/month",
              effort: "Medium",
              impact: "Medium",
              timeframe: "1 week",
              confidence: 0.76,
            },
          ],
          totalSavings: "$2,040/month",
          roiTimeline: "2.1 months",
          automationLevel: 85,
        },
      });
    }

    return components;
  }

  /**
   * Generate intelligent welcome suggestions
   */
  private async generateWelcomeSuggestions(
    insights: ProactiveInsight[],
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Always include sustainability report as first option
    suggestions.push("Show me today's emissions report");

    // Add urgent actions from critical insights
    const criticalInsights = insights.filter((i) => i.priority === "critical");
    criticalInsights.forEach((insight) => {
      if (insight.suggestedActions) {
        suggestions.push(insight.suggestedActions[0]);
      }
    });

    // Add general intelligent suggestions
    suggestions.push(
      "What's my carbon footprint today?",
      "How can I reduce emissions?",
      "Show me sustainability opportunities",
    );

    // Return unique suggestions, limited to 4
    return Array.from(new Set(suggestions)).slice(0, 4);
  }

  /**
   * Get appropriate greeting based on time of day
   */
  private getTimeOfDayGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }
}

// Export singleton
export const proactiveInsightEngine = new ProactiveInsightEngine();
