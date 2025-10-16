/**
 * Monthly AI Intelligence Coordinator
 *
 * This coordinates AI activities around the monthly data cycle.
 * Data arrives by the 15th of each month, triggering a cascade of AI activities.
 */

import { fullCapabilityOrchestrator } from './full-capability-orchestrator';
import { conversationalIntelligenceOrchestrator } from './conversation-intelligence';
import { predictiveIntelligence } from './predictive-intelligence';
import { createDatabaseIntelligence } from './database-intelligence';

export interface MonthlyDataCycle {
  currentPhase: 'pre-data' | 'data-arrival' | 'processing' | 'insights' | 'planning';
  daysUntilData: number;
  lastDataReceived: Date | null;
  nextDataExpected: Date;
  dataCompleteness: number; // 0-100%
  readyForAnalysis: boolean;
}

export interface MonthlyInsights {
  month: string;
  year: number;
  keyFindings: string[];
  anomalies: string[];
  recommendations: string[];
  targetProgress: {
    scope: string;
    actual: number;
    target: number;
    gap: number;
    onTrack: boolean;
  }[];
  predictedNextMonth: {
    metric: string;
    predicted: number;
    confidence: number;
  }[];
}

export class MonthlyIntelligenceCoordinator {
  private organizationId: string = '';
  private currentCycle: MonthlyDataCycle | null = null;
  private monthlyInsights: MonthlyInsights[] = [];
  private isMonitoring = false;

  async initialize(organizationId: string) {
    this.organizationId = organizationId;

    // Initialize full AI capability
    await fullCapabilityOrchestrator.initialize(organizationId);

    // Start monitoring cycle
    this.startMonthlyMonitoring();

  }

  private getNextDataDate(): Date {
    const now = new Date();
    const currentDay = now.getDate();
    const nextDate = new Date(now);

    if (currentDay < 15) {
      // Data arrives this month on the 15th
      nextDate.setDate(15);
    } else {
      // Data arrives next month on the 15th
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(15);
    }

    return nextDate;
  }

  getCurrentPhase(): MonthlyDataCycle['currentPhase'] {
    const now = new Date();
    const day = now.getDate();

    if (day < 10) {
      return 'planning'; // Early month: planning based on last month's insights
    } else if (day < 15) {
      return 'pre-data'; // Preparing for data arrival
    } else if (day === 15 || day === 16) {
      return 'data-arrival'; // Data arriving
    } else if (day <= 20) {
      return 'processing'; // Processing and analyzing new data
    } else {
      return 'insights'; // Generating and sharing insights
    }
  }

  getDaysUntilData(): number {
    const now = new Date();
    const day = now.getDate();

    if (day < 15) {
      return 15 - day;
    } else {
      // Days until next month's 15th
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return daysInMonth - day + 15;
    }
  }

  async getPhaseActivities(): Promise<{
    phase: string;
    activities: string[];
    aiAgentsActive: string[];
    userActions: string[];
  }> {
    const phase = this.getCurrentPhase();

    switch (phase) {
      case 'pre-data':
        return {
          phase: 'Preparing for Data Arrival',
          activities: [
            '🔍 AI reviewing last month\'s performance',
            '📊 Identifying data gaps to fill',
            '🎯 Preparing automated data collection',
            '💡 Generating hypothesis for upcoming data'
          ],
          aiAgentsActive: ['ESG Chief of Staff', 'Carbon Hunter', 'Compliance Guardian'],
          userActions: [
            'Review AI-suggested data sources',
            'Confirm data collection readiness',
            'Set priorities for analysis'
          ]
        };

      case 'data-arrival':
        return {
          phase: 'Data Processing Day',
          activities: [
            '📥 Ingesting monthly data feeds',
            '✅ Validating data quality',
            '🔄 Running anomaly detection',
            '📈 Calculating month-over-month changes'
          ],
          aiAgentsActive: ['All 8 agents working in parallel'],
          userActions: [
            'Upload any manual data files',
            'Verify automated imports',
            'Review AI-flagged anomalies'
          ]
        };

      case 'processing':
        return {
          phase: 'Deep Analysis',
          activities: [
            '🧠 ML models updating predictions',
            '📊 Generating performance reports',
            '🎯 Calculating target progress',
            '💰 Identifying cost-saving opportunities'
          ],
          aiAgentsActive: ['Autonomous Optimizer', 'Cost Saving Finder', 'Predictive Maintenance'],
          userActions: [
            'Review AI insights',
            'Approve recommended actions',
            'Ask questions about findings'
          ]
        };

      case 'insights':
        return {
          phase: 'Insights & Recommendations',
          activities: [
            '💡 Sharing key findings',
            '📈 Trend analysis complete',
            '🎯 Action items prioritized',
            '📅 Next month predictions ready'
          ],
          aiAgentsActive: ['ESG Chief of Staff', 'Supply Chain Investigator'],
          userActions: [
            'Review monthly report',
            'Approve AI recommendations',
            'Set next month\'s goals'
          ]
        };

      case 'planning':
        return {
          phase: 'Planning & Optimization',
          activities: [
            '📋 Implementing approved actions',
            '🔄 Optimizing operations',
            '📊 Tracking early indicators',
            '🎯 Preparing for next cycle'
          ],
          aiAgentsActive: ['Regulatory Foresight', 'Autonomous Optimizer'],
          userActions: [
            'Monitor implementation progress',
            'Adjust strategies as needed',
            'Prepare for next data cycle'
          ]
        };

      default:
        return {
          phase: 'Monitoring',
          activities: [],
          aiAgentsActive: [],
          userActions: []
        };
    }
  }

  private startMonthlyMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Check every hour for phase changes
    setInterval(async () => {
      const currentPhase = this.getCurrentPhase();

      if (this.currentCycle?.currentPhase !== currentPhase) {

        // Trigger phase-specific activities
        await this.handlePhaseChange(currentPhase);
      }

      this.currentCycle = {
        currentPhase,
        daysUntilData: this.getDaysUntilData(),
        lastDataReceived: this.getLastDataDate(),
        nextDataExpected: this.getNextDataDate(),
        dataCompleteness: await this.checkDataCompleteness(),
        readyForAnalysis: currentPhase === 'processing' || currentPhase === 'insights'
      };
    }, 60 * 60 * 1000); // Check every hour
  }

  private async handlePhaseChange(newPhase: MonthlyDataCycle['currentPhase']) {

    switch (newPhase) {
      case 'data-arrival':
        // Trigger all agents to prepare for data
        await fullCapabilityOrchestrator.processRequest({
          type: 'analysis',
          context: {
            event: 'monthly_data_arrival',
            organizationId: this.organizationId
          }
        });
        break;

      case 'processing':
        // Start deep analysis
        await this.runMonthlyAnalysis();
        break;

      case 'insights':
        // Generate and store insights
        await this.generateMonthlyInsights();
        break;

      case 'planning':
        // Create action plans
        await this.createMonthlyPlans();
        break;
    }
  }

  private async runMonthlyAnalysis() {

    // Coordinate all AI systems for analysis
    const results = await fullCapabilityOrchestrator.processRequest({
      type: 'analysis',
      context: {
        organizationId: this.organizationId,
        analysisType: 'monthly_comprehensive',
        includeAllScopes: true,
        generatePredictions: true
      }
    });

    return results;
  }

  private async generateMonthlyInsights() {
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });

    const insights: MonthlyInsights = {
      month: monthName,
      year: now.getFullYear(),
      keyFindings: [],
      anomalies: [],
      recommendations: [],
      targetProgress: [],
      predictedNextMonth: []
    };

    // Get insights from all agents
    const aiInsights = await fullCapabilityOrchestrator.processRequest({
      type: 'analysis',
      context: {
        requestType: 'monthly_insights',
        organizationId: this.organizationId
      }
    });

    // Store insights
    this.monthlyInsights.push(insights);

    return insights;
  }

  private async createMonthlyPlans() {
    // Generate action plans for the coming month
    const plans = await fullCapabilityOrchestrator.processRequest({
      type: 'optimization',
      context: {
        organizationId: this.organizationId,
        planType: 'monthly_action_plan'
      }
    });

    return plans;
  }

  private getLastDataDate(): Date | null {
    const now = new Date();
    const day = now.getDate();

    if (day >= 15) {
      // Data was received this month
      return new Date(now.getFullYear(), now.getMonth(), 15);
    } else {
      // Data was received last month
      return new Date(now.getFullYear(), now.getMonth() - 1, 15);
    }
  }

  private async checkDataCompleteness(): Promise<number> {
    // This would check actual data completeness
    // For now, return based on phase
    const phase = this.getCurrentPhase();

    switch (phase) {
      case 'data-arrival':
        return 50; // Data arriving
      case 'processing':
        return 75; // Processing
      case 'insights':
      case 'planning':
        return 100; // Complete
      default:
        return 0; // No new data yet
    }
  }

  async getMonthlyStatus() {
    const activities = await this.getPhaseActivities();

    return {
      cycle: this.currentCycle,
      activities,
      recentInsights: this.monthlyInsights.slice(-3), // Last 3 months
      aiStatus: await fullCapabilityOrchestrator.getSystemStatus()
    };
  }

  async triggerManualDataProcessing() {

    // Force processing phase
    await this.handlePhaseChange('data-arrival');
    await this.handlePhaseChange('processing');

    return {
      success: true,
      message: 'Manual processing initiated. AI agents are now analyzing the data.'
    };
  }
}

// Export singleton instance
export const monthlyIntelligence = new MonthlyIntelligenceCoordinator();