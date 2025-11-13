/**
 * Dynamic Suggestion Engine
 * Generates intelligent, context-aware suggestions based on user role, current state, and available agents
 * Client-safe version - no server-side imports
 */

export interface DynamicSuggestion {
  id: string;
  text: string;
  icon?: string;
  agent: string;
  priority: number;
  category: 'action' | 'insight' | 'report' | 'optimization' | 'compliance';
  requiredRole?: string[];
  context?: string[];
}

export class SuggestionEngine {
  constructor() {
    // Client-safe - no actual agent instantiation
  }

  /**
   * Generate role-based suggestions
   */
  async generateSuggestions(
    userRole: string,
    organizationId: string,
    currentPath?: string,
    recentActivity?: any[]
  ): Promise<DynamicSuggestion[]> {
    const suggestions: DynamicSuggestion[] = [];

    // Role-specific suggestions
    switch (userRole) {
      case 'account_owner':
      case 'OWNER':
        suggestions.push(
          {
            id: 'compliance-overview',
            text: 'Review compliance status across all frameworks',
            icon: '🛡️',
            agent: 'ComplianceGuardian',
            priority: 1,
            category: 'compliance',
            requiredRole: ['account_owner', 'OWNER']
          },
          {
            id: 'cost-analysis',
            text: 'Analyze sustainability cost savings opportunities',
            icon: '💰',
            agent: 'CostSavingFinder',
            priority: 2,
            category: 'optimization'
          },
          {
            id: 'strategic-report',
            text: 'Generate executive sustainability report',
            icon: '📊',
            agent: 'ESGChiefOfStaff',
            priority: 3,
            category: 'report'
          },
          {
            id: 'supply-chain-risk',
            text: 'Assess supply chain ESG risks',
            icon: '🔍',
            agent: 'SupplyChainInvestigator',
            priority: 4,
            category: 'insight'
          }
        );
        break;

      case 'sustainability_manager':
      case 'MANAGER':
        suggestions.push(
          {
            id: 'emissions-tracking',
            text: 'Track current month emissions vs targets',
            icon: '📉',
            agent: 'CarbonHunter',
            priority: 1,
            category: 'insight'
          },
          {
            id: 'data-entry',
            text: 'Add this month\'s utility data',
            icon: '📝',
            agent: 'ESGChiefOfStaff',
            priority: 2,
            category: 'action'
          },
          {
            id: 'optimization-opportunities',
            text: 'Find quick emission reduction wins',
            icon: '⚡',
            agent: 'AutonomousOptimizer',
            priority: 3,
            category: 'optimization'
          },
          {
            id: 'team-report',
            text: 'Generate team performance dashboard',
            icon: '👥',
            agent: 'ESGChiefOfStaff',
            priority: 4,
            category: 'report'
          }
        );
        break;

      case 'facility_manager':
        suggestions.push(
          {
            id: 'maintenance-alerts',
            text: 'Review predictive maintenance alerts',
            icon: '🔧',
            agent: 'PredictiveMaintenance',
            priority: 1,
            category: 'action'
          },
          {
            id: 'energy-optimization',
            text: 'Optimize building energy usage',
            icon: '⚡',
            agent: 'AutonomousOptimizer',
            priority: 2,
            category: 'optimization'
          },
          {
            id: 'equipment-efficiency',
            text: 'Check equipment efficiency scores',
            icon: '🏭',
            agent: 'PredictiveMaintenance',
            priority: 3,
            category: 'insight'
          }
        );
        break;

      case 'analyst':
      case 'MEMBER':
        suggestions.push(
          {
            id: 'data-analysis',
            text: 'Analyze emissions trends',
            icon: '📈',
            agent: 'CarbonHunter',
            priority: 1,
            category: 'insight'
          },
          {
            id: 'report-generation',
            text: 'Create monthly sustainability report',
            icon: '📋',
            agent: 'ESGChiefOfStaff',
            priority: 2,
            category: 'report'
          },
          {
            id: 'benchmark',
            text: 'Compare performance with industry peers',
            icon: '🎯',
            agent: 'ESGChiefOfStaff',
            priority: 3,
            category: 'insight'
          }
        );
        break;

      case 'viewer':
      case 'VIEWER':
        suggestions.push(
          {
            id: 'view-dashboard',
            text: 'View sustainability dashboard',
            icon: '👁️',
            agent: 'ESGChiefOfStaff',
            priority: 1,
            category: 'insight'
          },
          {
            id: 'emissions-summary',
            text: 'See current emissions summary',
            icon: '📊',
            agent: 'CarbonHunter',
            priority: 2,
            category: 'insight'
          }
        );
        break;

      default:
        // Generic suggestions for unknown roles
        suggestions.push(
          {
            id: 'help',
            text: 'What can I help you with today?',
            icon: '💬',
            agent: 'ESGChiefOfStaff',
            priority: 1,
            category: 'action'
          }
        );
    }

    // Context-aware suggestions based on current page
    if (currentPath) {
      if (currentPath.includes('sustainability')) {
        suggestions.push({
          id: 'page-context-sustainability',
          text: 'Explain this sustainability data',
          icon: '🌱',
          agent: 'ESGChiefOfStaff',
          priority: 5,
          category: 'insight',
          context: ['sustainability']
        });
      }
      
      if (currentPath.includes('settings')) {
        suggestions.push({
          id: 'page-context-settings',
          text: 'Help me configure emission factors',
          icon: '⚙️',
          agent: 'ComplianceGuardian',
          priority: 5,
          category: 'action',
          context: ['settings']
        });
      }
    }

    // Time-based suggestions
    const now = new Date();
    const day = now.getDate();
    
    // End of month reminders
    if (day >= 25) {
      suggestions.push({
        id: 'month-end-reminder',
        text: 'Complete month-end sustainability reporting',
        icon: '📅',
        agent: 'ComplianceGuardian',
        priority: 0, // High priority
        category: 'action'
      });
    }

    // Sort by priority and return top suggestions
    return suggestions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 6); // Return top 6 suggestions
  }

  /**
   * Get agent-specific capabilities
   */
  getAgentCapabilities(agentName: string): string[] {
    const capabilities: Record<string, string[]> = {
      ESGChiefOfStaff: [
        'Strategic planning',
        'Report generation',
        'Team coordination',
        'Performance tracking'
      ],
      ComplianceGuardian: [
        'Regulatory compliance',
        'Framework alignment',
        'Audit preparation',
        'Risk assessment'
      ],
      CarbonHunter: [
        'Emissions tracking',
        'Carbon reduction',
        'Scope analysis',
        'Target monitoring'
      ],
      SupplyChainInvestigator: [
        'Supplier assessment',
        'ESG risk analysis',
        'Chain transparency',
        'Vendor scoring'
      ],
      CostSavingFinder: [
        'Cost optimization',
        'ROI analysis',
        'Budget planning',
        'Savings identification'
      ],
      PredictiveMaintenance: [
        'Equipment monitoring',
        'Failure prediction',
        'Maintenance scheduling',
        'Efficiency optimization'
      ],
      AutonomousOptimizer: [
        'System optimization',
        'Energy efficiency',
        'Performance tuning',
        'Resource allocation'
      ]
    };

    return capabilities[agentName] || [];
  }

  /**
   * Generate contextual follow-up suggestions based on conversation
   */
  async generateFollowUpSuggestions(
    previousMessage: string,
    agentUsed: string,
    userRole: string
  ): Promise<string[]> {
    const followUps: string[] = [];

    // Agent-specific follow-ups
    if (agentUsed === 'CarbonHunter') {
      followUps.push(
        'Show me the breakdown by scope',
        'Compare with last month',
        'What are the main drivers?',
        'How can we reduce these emissions?'
      );
    } else if (agentUsed === 'ComplianceGuardian') {
      followUps.push(
        'Which frameworks are we compliant with?',
        'What documentation do we need?',
        'Show me the compliance gaps',
        'When is the next audit?'
      );
    } else if (agentUsed === 'CostSavingFinder') {
      followUps.push(
        'What\'s the ROI on these changes?',
        'How quickly can we implement?',
        'Show me the cost breakdown',
        'What are the risks?'
      );
    } else if (agentUsed === 'ESGChiefOfStaff') {
      followUps.push(
        'Generate a detailed report',
        'Schedule this for monthly review',
        'Share with my team',
        'Set up automated tracking'
      );
    }

    // Role-specific follow-ups
    if (userRole === 'OWNER' || userRole === 'account_owner') {
      followUps.push('What\'s the strategic impact?');
    } else if (userRole === 'MANAGER' || userRole === 'sustainability_manager') {
      followUps.push('Create an action plan');
    }

    return followUps.slice(0, 4);
  }

  /**
   * Get proactive alerts and notifications
   */
  async getProactiveAlerts(
    organizationId: string,
    userRole: string
  ): Promise<any[]> {
    const alerts = [];

    // Check various conditions and generate alerts
    // This would normally check real data
    
    // Compliance alerts
    if (['OWNER', 'MANAGER'].includes(userRole)) {
      alerts.push({
        type: 'compliance',
        severity: 'warning',
        message: 'GRI report due in 15 days',
        agent: 'ComplianceGuardian',
        action: 'Start GRI report preparation'
      });
    }

    // Performance alerts
    alerts.push({
      type: 'performance',
      severity: 'info',
      message: 'Emissions reduced by 12% this month',
      agent: 'CarbonHunter',
      action: 'View detailed breakdown'
    });

    // Opportunity alerts
    if (['OWNER', 'MANAGER'].includes(userRole)) {
      alerts.push({
        type: 'opportunity',
        severity: 'success',
        message: 'New carbon credit opportunity identified',
        agent: 'CostSavingFinder',
        action: 'Review opportunity'
      });
    }

    return alerts;
  }
}

export const suggestionEngine = new SuggestionEngine();