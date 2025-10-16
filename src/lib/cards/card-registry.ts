/**
 * Card Registry System
 * Central registry for all card types in the Zero-Typing system
 */

import { ComponentType } from 'react';
import { CardData, CardLayout } from '@/components/cards/SmartCard';
import {
  fetchTotalEmissionsData,
  fetchEnergyUsageData,
  fetchCriticalAlertsData,
  fetchEmissionsTrendData,
  fetchSystemStatusData
} from './card-data-fetchers';
import {
  fetchESGChiefData,
  fetchCarbonHunterData,
  fetchComplianceGuardianData,
  fetchSupplyChainData
} from './agent-data-fetchers';

export enum CardType {
  METRIC = 'metric',
  CHART = 'chart',
  ALERT = 'alert',
  AGENT = 'agent',
  ACTION = 'action',
  WORKFLOW = 'workflow',
  INSIGHT = 'insight',
  STATUS = 'status'
}

export interface CardDefinition {
  id: string;
  type: CardType;
  title: string;
  description?: string;
  component?: ComponentType<any>;
  defaultLayout: CardLayout;
  dataFetcher?: (params?: any) => Promise<CardData>;
  updateFrequency?: 'realtime' | 'hourly' | 'daily';
  agentId?: string;
  requiredPermissions?: string[];
  tags?: string[];
}

export interface CardRegistration {
  definition: CardDefinition;
  priority?: number;
  conditions?: CardCondition[];
}

export interface CardCondition {
  type: 'time' | 'role' | 'context' | 'alert' | 'custom';
  check: (context: any) => boolean;
}

class CardRegistry {
  private static instance: CardRegistry;
  private cards: Map<string, CardRegistration> = new Map();
  private typeIndex: Map<CardType, Set<string>> = new Map();
  private agentIndex: Map<string, Set<string>> = new Map();

  private constructor() {
    this.initializeDefaultCards();
  }

  public static getInstance(): CardRegistry {
    if (!CardRegistry.instance) {
      CardRegistry.instance = new CardRegistry();
    }
    return CardRegistry.instance;
  }

  /**
   * Register a new card type
   */
  public register(registration: CardRegistration): void {
    const { definition } = registration;

    // Store in main registry
    this.cards.set(definition.id, registration);

    // Update type index
    if (!this.typeIndex.has(definition.type)) {
      this.typeIndex.set(definition.type, new Set());
    }
    this.typeIndex.get(definition.type)?.add(definition.id);

    // Update agent index if applicable
    if (definition.agentId) {
      if (!this.agentIndex.has(definition.agentId)) {
        this.agentIndex.set(definition.agentId, new Set());
      }
      this.agentIndex.get(definition.agentId)?.add(definition.id);
    }

  }

  /**
   * Get a card definition by ID
   */
  public getCard(id: string): CardRegistration | undefined {
    return this.cards.get(id);
  }

  /**
   * Get all cards of a specific type
   */
  public getCardsByType(type: CardType): CardRegistration[] {
    const cardIds = this.typeIndex.get(type) || new Set();
    return Array.from(cardIds)
      .map(id => this.cards.get(id))
      .filter(Boolean) as CardRegistration[];
  }

  /**
   * Get all cards for a specific agent
   */
  public getCardsByAgent(agentId: string): CardRegistration[] {
    const cardIds = this.agentIndex.get(agentId) || new Set();
    return Array.from(cardIds)
      .map(id => this.cards.get(id))
      .filter(Boolean) as CardRegistration[];
  }

  /**
   * Get all registered cards
   */
  public getAllCards(): CardRegistration[] {
    return Array.from(this.cards.values());
  }

  /**
   * Get cards that match the given context
   */
  public getCardsForContext(context: any): CardRegistration[] {
    return this.getAllCards().filter(registration => {
      // Check if all conditions are met
      if (!registration.conditions || registration.conditions.length === 0) {
        return true; // No conditions means always show
      }

      return registration.conditions.every(condition =>
        condition.check(context)
      );
    });
  }

  /**
   * Get recommended cards based on various factors
   */
  public getRecommendedCards(context: any, limit: number = 10): CardRegistration[] {
    const contextCards = this.getCardsForContext(context);

    // Sort by priority
    contextCards.sort((a, b) => {
      const priorityA = a.priority || 50;
      const priorityB = b.priority || 50;
      return priorityB - priorityA; // Higher priority first
    });

    return contextCards.slice(0, limit);
  }

  /**
   * Initialize default card definitions
   */
  private initializeDefaultCards(): void {
    // Agent Cards
    this.register({
      definition: {
        id: 'esg-chief-card',
        type: CardType.AGENT,
        title: 'ESG Chief of Staff',
        description: 'Strategic sustainability overview and coordination',
        agentId: 'esg-chief',
        defaultLayout: {
          size: 'large',
          aspectRatio: 'wide',
          color: '#8B5CF6' // Purple
        },
        updateFrequency: 'hourly',
        tags: ['strategic', 'executive', 'overview'],
        dataFetcher: fetchESGChiefData
      },
      priority: 90,
      conditions: [
        {
          type: 'role',
          check: (ctx) => ['super_admin', 'account_owner', 'sustainability_manager'].includes(ctx.user?.role)
        }
      ]
    });

    this.register({
      definition: {
        id: 'carbon-hunter-card',
        type: CardType.AGENT,
        title: 'Carbon Hunter',
        description: 'Real-time emissions tracking and reduction opportunities',
        agentId: 'carbon-hunter',
        defaultLayout: {
          size: 'medium',
          color: '#10B981' // Green
        },
        updateFrequency: 'realtime',
        tags: ['emissions', 'carbon', 'tracking'],
        dataFetcher: fetchCarbonHunterData
      },
      priority: 85
    });

    this.register({
      definition: {
        id: 'compliance-guardian-card',
        type: CardType.AGENT,
        title: 'Compliance Guardian',
        description: 'Regulatory compliance monitoring and alerts',
        agentId: 'compliance-guardian',
        defaultLayout: {
          size: 'medium',
          color: '#3B82F6' // Blue
        },
        updateFrequency: 'daily',
        tags: ['compliance', 'regulatory', 'audit'],
        dataFetcher: fetchComplianceGuardianData
      },
      priority: 80,
      conditions: [
        {
          type: 'context',
          check: (ctx) => ctx.business?.compliance?.openIssues > 0
        }
      ]
    });

    this.register({
      definition: {
        id: 'supply-chain-card',
        type: CardType.AGENT,
        title: 'Supply Chain Investigator',
        description: 'Scope 3 emissions and supplier analysis',
        agentId: 'supply-chain',
        defaultLayout: {
          size: 'medium',
          color: '#F97316' // Orange
        },
        updateFrequency: 'daily',
        tags: ['supply-chain', 'scope3', 'vendors'],
        dataFetcher: fetchSupplyChainData
      },
      priority: 70
    });

    // Metric Cards
    this.register({
      definition: {
        id: 'total-emissions-metric',
        type: CardType.METRIC,
        title: 'Total Emissions',
        description: 'Current total emissions across all scopes',
        defaultLayout: {
          size: 'small'
        },
        updateFrequency: 'realtime',
        tags: ['emissions', 'kpi', 'metric'],
        dataFetcher: fetchTotalEmissionsData
      },
      priority: 95
    });

    this.register({
      definition: {
        id: 'energy-usage-metric',
        type: CardType.METRIC,
        title: 'Energy Usage',
        description: 'Current energy consumption',
        defaultLayout: {
          size: 'small'
        },
        updateFrequency: 'realtime',
        tags: ['energy', 'kpi', 'metric'],
        dataFetcher: fetchEnergyUsageData
      },
      priority: 85
    });

    // Alert Cards
    this.register({
      definition: {
        id: 'critical-alerts',
        type: CardType.ALERT,
        title: 'Critical Alerts',
        description: 'High-priority system alerts',
        defaultLayout: {
          size: 'medium',
          aspectRatio: 'wide',
          color: '#EF4444' // Red
        },
        updateFrequency: 'realtime',
        tags: ['alerts', 'critical', 'urgent'],
        dataFetcher: fetchCriticalAlertsData
      },
      priority: 100,
      conditions: [
        {
          type: 'alert',
          check: (ctx) => ctx.business?.alerts?.some((a: any) => a.type === 'critical')
        }
      ]
    });

    // Chart Cards
    this.register({
      definition: {
        id: 'emissions-trend-chart',
        type: CardType.CHART,
        title: 'Emissions Trend',
        description: '30-day emissions trend visualization',
        defaultLayout: {
          size: 'large',
          aspectRatio: 'wide'
        },
        updateFrequency: 'hourly',
        tags: ['chart', 'trend', 'emissions', 'visualization'],
        dataFetcher: fetchEmissionsTrendData
      },
      priority: 75
    });

    // Action Cards
    this.register({
      definition: {
        id: 'quick-actions',
        type: CardType.ACTION,
        title: 'Quick Actions',
        description: 'Common tasks and actions',
        defaultLayout: {
          size: 'medium'
        },
        tags: ['actions', 'tasks', 'shortcuts'],
        dataFetcher: async () => ({
          id: 'quick-actions',
          type: 'action',
          title: 'Quick Actions',
          actions: [
            { id: 'report', label: 'Generate Report', action: () =>, variant: 'primary' },
            { id: 'analyze', label: 'Analyze Emissions', action: () =>, variant: 'secondary' },
            { id: 'export', label: 'Export Data', action: () =>, variant: 'secondary' }
          ]
        })
      },
      priority: 60
    });

    // Workflow Cards
    this.register({
      definition: {
        id: 'compliance-workflow',
        type: CardType.WORKFLOW,
        title: 'Compliance Workflow',
        description: 'Current compliance tasks and progress',
        defaultLayout: {
          size: 'large'
        },
        updateFrequency: 'daily',
        tags: ['workflow', 'compliance', 'tasks']
      },
      priority: 70,
      conditions: [
        {
          type: 'context',
          check: (ctx) => ctx.business?.deadlines?.length > 0
        }
      ]
    });

    // Status Cards
    this.register({
      definition: {
        id: 'system-status',
        type: CardType.STATUS,
        title: 'System Status',
        description: 'Overall system health and status',
        defaultLayout: {
          size: 'small',
          color: '#06B6D4' // Cyan
        },
        updateFrequency: 'realtime',
        tags: ['status', 'health', 'system'],
        dataFetcher: fetchSystemStatusData
      },
      priority: 50
    });

    // Time-based cards
    this.register({
      definition: {
        id: 'morning-briefing',
        type: CardType.INSIGHT,
        title: 'Morning Briefing',
        description: 'Daily sustainability insights and priorities',
        defaultLayout: {
          size: 'large',
          aspectRatio: 'wide',
          color: '#F59E0B' // Amber
        },
        updateFrequency: 'daily',
        tags: ['insight', 'daily', 'briefing']
      },
      priority: 95,
      conditions: [
        {
          type: 'time',
          check: (ctx) => {
            const hour = new Date().getHours();
            return hour >= 6 && hour <= 10; // Show between 6 AM and 10 AM
          }
        }
      ]
    });

    this.register({
      definition: {
        id: 'end-of-day-summary',
        type: CardType.INSIGHT,
        title: 'End of Day Summary',
        description: "Today's achievements and tomorrow's priorities",
        defaultLayout: {
          size: 'large',
          aspectRatio: 'wide',
          color: '#6366F1' // Indigo
        },
        updateFrequency: 'daily',
        tags: ['insight', 'summary', 'daily']
      },
      priority: 90,
      conditions: [
        {
          type: 'time',
          check: (ctx) => {
            const hour = new Date().getHours();
            return hour >= 17 && hour <= 19; // Show between 5 PM and 7 PM
          }
        }
      ]
    });

  }

  /**
   * Create card data from definition
   */
  public async createCardData(cardId: string, params?: any): Promise<CardData | null> {
    const registration = this.getCard(cardId);
    if (!registration) {
      console.warn(`Card not found: ${cardId}`);
      return null;
    }

    const { definition } = registration;

    // If there's a data fetcher, use it
    if (definition.dataFetcher) {
      try {
        return await definition.dataFetcher(params);
      } catch (error) {
        console.error(`Failed to fetch data for card ${cardId}:`, error);
      }
    }

    // Otherwise, create basic card data
    return {
      id: definition.id,
      type: definition.type as any,
      title: definition.title,
      subtitle: definition.description,
      agentId: definition.agentId,
      metadata: {
        tags: definition.tags,
        updateFrequency: definition.updateFrequency
      }
    };
  }

  /**
   * Get cards for a specific user role
   */
  public getCardsForRole(role: string): CardRegistration[] {
    const roleCardMap: Record<string, string[]> = {
      super_admin: ['system-status', 'esg-chief-card', 'compliance-guardian-card', 'critical-alerts'],
      account_owner: ['esg-chief-card', 'total-emissions-metric', 'compliance-guardian-card', 'emissions-trend-chart'],
      sustainability_manager: ['carbon-hunter-card', 'compliance-workflow', 'supply-chain-card', 'total-emissions-metric'],
      facility_manager: ['energy-usage-metric', 'carbon-hunter-card', 'quick-actions', 'critical-alerts'],
      analyst: ['emissions-trend-chart', 'total-emissions-metric', 'energy-usage-metric', 'supply-chain-card'],
      viewer: ['total-emissions-metric', 'emissions-trend-chart', 'system-status']
    };

    const cardIds = roleCardMap[role] || roleCardMap.viewer;
    return cardIds
      .map(id => this.cards.get(id))
      .filter(Boolean) as CardRegistration[];
  }

  /**
   * Clear all registered cards (useful for testing)
   */
  public clear(): void {
    this.cards.clear();
    this.typeIndex.clear();
    this.agentIndex.clear();
  }

  /**
   * Export registry data for persistence
   */
  public export(): any {
    return {
      cards: Array.from(this.cards.entries()),
      typeIndex: Array.from(this.typeIndex.entries()),
      agentIndex: Array.from(this.agentIndex.entries())
    };
  }

  /**
   * Import registry data
   */
  public import(data: any): void {
    this.cards = new Map(data.cards);
    this.typeIndex = new Map(data.typeIndex.map(([k, v]: [any, any]) => [k, new Set(v)]));
    this.agentIndex = new Map(data.agentIndex.map(([k, v]: [any, any]) => [k, new Set(v)]));
  }
}

// Export singleton instance
export const cardRegistry = CardRegistry.getInstance();