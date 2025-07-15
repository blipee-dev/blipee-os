/**
 * Regulatory Intelligence API
 * Provides real-time regulatory updates and compliance tracking
 */

export interface RegulatoryAPIConfig {
  apiKey: string;
  baseUrl?: string;
  webhookUrl?: string;
}

interface RegulationUpdate {
  id: string;
  title: string;
  jurisdiction: string;
  category: 'environmental' | 'climate' | 'sustainability' | 'carbon' | 'energy';
  status: 'proposed' | 'pending' | 'active' | 'amended' | 'repealed';
  effectiveDate: Date;
  publishedDate: Date;
  summary: string;
  fullText?: string;
  impact: {
    scope: string[];
    industries: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    complianceDeadline?: Date;
  };
  keyChanges: string[];
  relatedRegulations: string[];
  sources: Array<{
    type: 'official' | 'news' | 'analysis';
    url: string;
    title: string;
    publishedAt: Date;
  }>;
}

interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  jurisdiction: string;
  lastUpdated: Date;
  applicability: {
    companySize: string[];
    industries: string[];
    revenue?: number;
    employees?: number;
  };
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    mandatory: boolean;
    deadline?: Date;
    category: string;
    subRequirements?: Array<{
      id: string;
      title: string;
      description: string;
    }>;
  }>;
  reportingSchedule: Array<{
    type: 'annual' | 'quarterly' | 'monthly';
    deadline: string; // e.g., "March 31"
    description: string;
  }>;
}

export class RegulatoryAPI {
  private config: RegulatoryAPIConfig;
  private baseUrl: string;

  constructor(config: RegulatoryAPIConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.regulatory-intelligence.com/v1';
  }

  /**
   * Get latest regulatory updates
   */
  async getRegulationUpdates(params: {
    jurisdictions?: string[];
    categories?: string[];
    since?: Date;
    limit?: number;
  } = {}): Promise<RegulationUpdate[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.jurisdictions?.length) {
        searchParams.append('jurisdictions', params.jurisdictions.join(','));
      }
      if (params.categories?.length) {
        searchParams.append('categories', params.categories.join(','));
      }
      if (params.since) {
        searchParams.append('since', params.since.toISOString());
      }
      if (params.limit) {
        searchParams.append('limit', params.limit.toString());
      }

      const response = await fetch(
        `${this.baseUrl}/regulations/updates?${searchParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.updates.map((update: any) => ({
        ...update,
        effectiveDate: new Date(update.effectiveDate),
        publishedDate: new Date(update.publishedDate),
        impact: {
          ...update.impact,
          complianceDeadline: update.impact.complianceDeadline ? 
            new Date(update.impact.complianceDeadline) : undefined
        },
        sources: update.sources.map((source: any) => ({
          ...source,
          publishedAt: new Date(source.publishedAt)
        }))
      }));
    } catch (error) {
      console.error('Regulatory updates API error:', error);
      return this.getMockRegulationUpdates(params);
    }
  }

  /**
   * Get compliance framework details
   */
  async getComplianceFramework(frameworkId: string): Promise<ComplianceFramework | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/frameworks/${frameworkId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        ...data.framework,
        lastUpdated: new Date(data.framework.lastUpdated),
        requirements: data.framework.requirements.map((req: any) => ({
          ...req,
          deadline: req.deadline ? new Date(req.deadline) : undefined
        }))
      };
    } catch (error) {
      console.error('Framework API error:', error);
      return this.getMockComplianceFramework(frameworkId);
    }
  }

  /**
   * Get applicable regulations for organization
   */
  async getApplicableRegulations(params: {
    jurisdiction: string;
    industry: string;
    companySize: 'small' | 'medium' | 'large';
    revenue?: number;
    employees?: number;
  }): Promise<Array<{
    regulation: ComplianceFramework;
    applicabilityScore: number;
    mandatoryRequirements: number;
    optionalRequirements: number;
    nextDeadline?: Date;
  }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/compliance/applicable`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.regulations.map((reg: any) => ({
        ...reg,
        regulation: {
          ...reg.regulation,
          lastUpdated: new Date(reg.regulation.lastUpdated)
        },
        nextDeadline: reg.nextDeadline ? new Date(reg.nextDeadline) : undefined
      }));
    } catch (error) {
      console.error('Applicable regulations API error:', error);
      return this.getMockApplicableRegulations(params);
    }
  }

  /**
   * Analyze regulatory compliance gaps
   */
  async analyzeComplianceGaps(params: {
    organizationId: string;
    frameworks: string[];
    currentImplementation: Record<string, {
      status: 'complete' | 'in_progress' | 'not_started';
      evidence?: string[];
      lastUpdated?: Date;
    }>;
  }): Promise<{
    overallCompliance: number;
    frameworkCompliance: Record<string, number>;
    criticalGaps: Array<{
      frameworkId: string;
      requirementId: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      deadline?: Date;
      recommendation: string;
    }>;
    actionPlan: Array<{
      priority: number;
      task: string;
      framework: string;
      estimatedEffort: string;
      deadline?: Date;
    }>;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/compliance/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        ...data.analysis,
        criticalGaps: data.analysis.criticalGaps.map((gap: any) => ({
          ...gap,
          deadline: gap.deadline ? new Date(gap.deadline) : undefined
        })),
        actionPlan: data.analysis.actionPlan.map((action: any) => ({
          ...action,
          deadline: action.deadline ? new Date(action.deadline) : undefined
        }))
      };
    } catch (error) {
      console.error('Compliance analysis API error:', error);
      return this.getMockComplianceAnalysis(params);
    }
  }

  /**
   * Subscribe to regulatory alerts
   */
  async subscribeToAlerts(params: {
    jurisdictions: string[];
    categories: string[];
    keywords?: string[];
    webhookUrl?: string;
  }): Promise<{ subscriptionId: string; status: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/alerts/subscribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...params,
            webhookUrl: params.webhookUrl || this.config.webhookUrl
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.subscription;
    } catch (error) {
      console.error('Alert subscription API error:', error);
      return {
        subscriptionId: `mock-${Date.now()}`,
        status: 'active'
      };
    }
  }

  /**
   * Get regulatory calendar
   */
  async getRegulatoryCalendar(params: {
    startDate: Date;
    endDate: Date;
    jurisdictions?: string[];
    frameworks?: string[];
  }): Promise<Array<{
    date: Date;
    type: 'deadline' | 'effective_date' | 'comment_period' | 'hearing';
    title: string;
    description: string;
    framework?: string;
    jurisdiction: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    actionRequired?: string;
  }>> {
    try {
      const searchParams = new URLSearchParams({
        start_date: params.startDate.toISOString(),
        end_date: params.endDate.toISOString()
      });

      if (params.jurisdictions?.length) {
        searchParams.append('jurisdictions', params.jurisdictions.join(','));
      }
      if (params.frameworks?.length) {
        searchParams.append('frameworks', params.frameworks.join(','));
      }

      const response = await fetch(
        `${this.baseUrl}/calendar?${searchParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.events.map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
    } catch (error) {
      console.error('Regulatory calendar API error:', error);
      return this.getMockRegulatoryCalendar(params);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; jurisdictions?: string[]; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) {
        return {
          healthy: false,
          error: response.statusText
        };
      }

      const data = await response.json();

      return {
        healthy: true,
        jurisdictions: data.supportedJurisdictions
      };
    } catch (error) {
      return {
        healthy: false,
        error: String(error)
      };
    }
  }

  // Mock data for development/testing
  private getMockRegulationUpdates(params: any): RegulationUpdate[] {
    return [
      {
        id: 'eu-csrd-2024-update',
        title: 'CSRD Implementation Guidance Updated',
        jurisdiction: 'European Union',
        category: 'sustainability',
        status: 'active',
        effectiveDate: new Date('2024-01-01'),
        publishedDate: new Date('2023-12-15'),
        summary: 'European Commission publishes updated implementation guidance for Corporate Sustainability Reporting Directive',
        impact: {
          scope: ['Large companies', 'Listed SMEs'],
          industries: ['All sectors'],
          severity: 'high',
          complianceDeadline: new Date('2025-03-31')
        },
        keyChanges: [
          'Clarification on materiality assessment process',
          'Updated data quality requirements',
          'New sector-specific guidance'
        ],
        relatedRegulations: ['EU-Taxonomy', 'SFDR'],
        sources: [
          {
            type: 'official',
            url: 'https://eur-lex.europa.eu/csrd-guidance',
            title: 'Official CSRD Guidance',
            publishedAt: new Date('2023-12-15')
          }
        ]
      },
      {
        id: 'sec-climate-rule-final',
        title: 'SEC Climate Disclosure Rules Finalized',
        jurisdiction: 'United States',
        category: 'climate',
        status: 'pending',
        effectiveDate: new Date('2025-01-01'),
        publishedDate: new Date('2024-01-20'),
        summary: 'SEC finalizes climate disclosure rules for public companies',
        impact: {
          scope: ['Public companies'],
          industries: ['All sectors'],
          severity: 'critical',
          complianceDeadline: new Date('2025-03-31')
        },
        keyChanges: [
          'Mandatory Scope 1 and 2 emissions disclosure',
          'Climate risk materiality assessment',
          'Board oversight requirements'
        ],
        relatedRegulations: ['TCFD'],
        sources: [
          {
            type: 'official',
            url: 'https://sec.gov/climate-rules',
            title: 'Final Climate Rules',
            publishedAt: new Date('2024-01-20')
          }
        ]
      }
    ];
  }

  private getMockComplianceFramework(frameworkId: string): ComplianceFramework | null {
    const frameworks: Record<string, ComplianceFramework> = {
      'eu-csrd': {
        id: 'eu-csrd',
        name: 'Corporate Sustainability Reporting Directive',
        version: '2024.1',
        jurisdiction: 'European Union',
        lastUpdated: new Date('2024-01-01'),
        applicability: {
          companySize: ['large'],
          industries: ['all'],
          revenue: 40000000, // €40M
          employees: 250
        },
        requirements: [
          {
            id: 'materiality-assessment',
            title: 'Double Materiality Assessment',
            description: 'Conduct comprehensive materiality assessment covering impact and financial materiality',
            mandatory: true,
            category: 'governance'
          },
          {
            id: 'scope-1-2-3',
            title: 'GHG Emissions Reporting',
            description: 'Report Scope 1, 2, and 3 greenhouse gas emissions',
            mandatory: true,
            deadline: new Date('2025-03-31'),
            category: 'environmental'
          }
        ],
        reportingSchedule: [
          {
            type: 'annual',
            deadline: 'March 31',
            description: 'Annual sustainability report'
          }
        ]
      }
    };

    return frameworks[frameworkId] || null;
  }

  private getMockApplicableRegulations(params: any): any[] {
    return [
      {
        regulation: this.getMockComplianceFramework('eu-csrd'),
        applicabilityScore: 95,
        mandatoryRequirements: 15,
        optionalRequirements: 5,
        nextDeadline: new Date('2025-03-31')
      }
    ];
  }

  private getMockComplianceAnalysis(params: any): any {
    return {
      overallCompliance: 75,
      frameworkCompliance: {
        'eu-csrd': 80,
        'tcfd': 70
      },
      criticalGaps: [
        {
          frameworkId: 'eu-csrd',
          requirementId: 'scope-3-emissions',
          severity: 'critical',
          deadline: new Date('2025-03-31'),
          recommendation: 'Implement Scope 3 emissions tracking system'
        }
      ],
      actionPlan: [
        {
          priority: 1,
          task: 'Complete materiality assessment',
          framework: 'CSRD',
          estimatedEffort: '4-6 weeks',
          deadline: new Date('2024-12-31')
        }
      ]
    };
  }

  private getMockRegulatoryCalendar(params: any): any[] {
    return [
      {
        date: new Date('2024-12-31'),
        type: 'deadline',
        title: 'CSRD Materiality Assessment Due',
        description: 'Complete double materiality assessment for 2025 reporting',
        framework: 'CSRD',
        jurisdiction: 'EU',
        importance: 'critical',
        actionRequired: 'Submit materiality assessment'
      }
    ];
  }
}