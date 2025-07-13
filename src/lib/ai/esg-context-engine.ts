import { Message } from "../../types/conversation";
import { createClient } from "../supabase/client";

interface ESGEnrichedContext {
  organization: OrganizationContext;
  esgMetrics: ESGMetrics;
  materialTopics: MaterialTopic[];
  complianceStatus: ComplianceStatus;
  stakeholders: StakeholderContext;
  industryBenchmarks: IndustryBenchmark[];
  sustainabilityGoals: SustainabilityGoal[];
  reportingFrameworks: ReportingFramework[];
  supplyChain: SupplyChainContext;
  riskAssessment: ESGRiskAssessment;
  conversationMemory: ConversationMemory;
  userProfile: UserProfile;
}

interface OrganizationContext {
  id: string;
  name: string;
  industry: string;
  size: string;
  locations: string[];
  fiscalYear: string;
  reportingBoundary: string;
}

interface ESGMetrics {
  emissions: {
    scope1: { current: number; trend: string; target: number };
    scope2: { current: number; trend: string; target: number };
    scope3: { current: number; trend: string; target: number };
    intensity: number;
    reduction: number;
  };
  energy: {
    consumption: number;
    renewable: number;
    efficiency: number;
  };
  water: {
    consumption: number;
    recycled: number;
    stressAreas: boolean;
  };
  waste: {
    generated: number;
    recycled: number;
    diverted: number;
  };
  social: {
    diversity: { gender: number; ethnicity: number };
    safety: { incidents: number; ltifr: number };
    training: { hours: number; investment: number };
  };
  governance: {
    boardDiversity: number;
    ethicsTraining: number;
    dataBreaches: number;
  };
}

interface MaterialTopic {
  name: string;
  category: "environmental" | "social" | "governance";
  businessImpact: number;
  stakeholderConcern: number;
  trend: "increasing" | "stable" | "decreasing";
  risks: string[];
  opportunities: string[];
}

interface ComplianceStatus {
  frameworks: {
    name: string;
    status: "compliant" | "partial" | "non-compliant";
    gaps: string[];
    nextDeadline: string;
  }[];
  regulations: {
    name: string;
    jurisdiction: string;
    status: string;
    requirements: string[];
  }[];
}

interface StakeholderContext {
  investors: { priorities: string[]; concerns: string[] };
  customers: { expectations: string[]; feedback: string[] };
  employees: { engagement: number; concerns: string[] };
  communities: { issues: string[]; partnerships: string[] };
  regulators: { focus: string[]; upcoming: string[] };
}

interface IndustryBenchmark {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topQuartile: number;
  percentile: number;
}

interface SustainabilityGoal {
  id: string;
  name: string;
  type: string;
  baseline: { year: number; value: number };
  target: { year: number; value: number };
  current: { value: number; progress: number };
  status: "on-track" | "at-risk" | "off-track";
  initiatives: string[];
}

interface ReportingFramework {
  name: string;
  disclosures: { required: number; completed: number };
  lastReport: string;
  nextDue: string;
  gaps: string[];
}

interface SupplyChainContext {
  riskLevel: "low" | "medium" | "high";
  criticalSuppliers: number;
  assessedSuppliers: number;
  highRiskCategories: string[];
  initiatives: string[];
}

interface ESGRiskAssessment {
  physicalRisks: Risk[];
  transitionRisks: Risk[];
  opportunities: Opportunity[];
  overallScore: number;
}

interface Risk {
  name: string;
  likelihood: number;
  impact: number;
  timeframe: string;
  mitigation: string[];
}

interface Opportunity {
  name: string;
  potential: number;
  feasibility: number;
  timeframe: string;
  actions: string[];
}

interface ConversationMemory {
  recentTopics: string[];
  pendingActions: string[];
  commitments: string[];
  learnings: string[];
}

interface UserProfile {
  role: string;
  department: string;
  expertise: string;
  focusAreas: string[];
  communicationStyle: string;
}

export class ESGContextEngine {
  private supabase = createClient();

  /**
   * Build comprehensive ESG context for AI reasoning
   */
  async buildESGContext(
    message: string,
    organizationId: string,
    userId?: string
  ): Promise<ESGEnrichedContext> {
    const [
      organization,
      esgMetrics,
      materialTopics,
      complianceStatus,
      stakeholders,
      industryBenchmarks,
      sustainabilityGoals,
      reportingFrameworks,
      supplyChain,
      riskAssessment,
      conversationMemory,
      userProfile
    ] = await Promise.all([
      this.getOrganizationContext(organizationId),
      this.getESGMetrics(organizationId),
      this.getMaterialTopics(organizationId),
      this.getComplianceStatus(organizationId),
      this.getStakeholderContext(organizationId),
      this.getIndustryBenchmarks(organizationId),
      this.getSustainabilityGoals(organizationId),
      this.getReportingFrameworks(organizationId),
      this.getSupplyChainContext(organizationId),
      this.getRiskAssessment(organizationId),
      this.getConversationMemory(userId),
      this.getUserProfile(userId)
    ]);

    return {
      organization,
      esgMetrics,
      materialTopics,
      complianceStatus,
      stakeholders,
      industryBenchmarks,
      sustainabilityGoals,
      reportingFrameworks,
      supplyChain,
      riskAssessment,
      conversationMemory,
      userProfile
    };
  }

  /**
   * Generate chain-of-thought reasoning prompt
   */
  generateChainOfThoughtPrompt(
    message: string,
    context: ESGEnrichedContext
  ): string {
    return `You are an expert ESG advisor helping ${context.organization.name} achieve their sustainability goals.

ORGANIZATION CONTEXT:
- Industry: ${context.organization.industry}
- Size: ${context.organization.size}
- Current Focus: ${context.userProfile.focusAreas.join(", ")}

KEY ESG METRICS:
- Total Emissions: ${(context.esgMetrics.emissions.scope1.current + context.esgMetrics.emissions.scope2.current + context.esgMetrics.emissions.scope3.current).toFixed(2)} tCO2e
- Emission Intensity: ${context.esgMetrics.emissions.intensity.toFixed(2)} tCO2e/unit
- Renewable Energy: ${context.esgMetrics.energy.renewable}%
- Water Consumption: ${context.esgMetrics.water.consumption} m³
- Waste Recycling Rate: ${((context.esgMetrics.waste.recycled / context.esgMetrics.waste.generated) * 100).toFixed(1)}%

TOP MATERIAL TOPICS:
${context.materialTopics.slice(0, 5).map(t => 
  `- ${t.name}: Impact ${t.businessImpact}/5, Concern ${t.stakeholderConcern}/5 (${t.trend})`
).join("\n")}

COMPLIANCE STATUS:
${context.complianceStatus.frameworks.slice(0, 3).map(f => 
  `- ${f.name}: ${f.status} (${f.gaps.length} gaps)`
).join("\n")}

STAKEHOLDER PRIORITIES:
- Investors: ${context.stakeholders.investors.priorities.slice(0, 3).join(", ")}
- Customers: ${context.stakeholders.customers.expectations.slice(0, 3).join(", ")}

ACTIVE GOALS:
${context.sustainabilityGoals.slice(0, 3).map(g => 
  `- ${g.name}: ${g.current.progress}% progress (${g.status})`
).join("\n")}

USER MESSAGE: "${message}"

INSTRUCTIONS FOR CHAIN-OF-THOUGHT REASONING:
Please think through this step-by-step:

1. UNDERSTAND: What is the user really asking for? Consider their role (${context.userProfile.role}) and expertise level.

2. ANALYZE: What data points are most relevant? Check:
   - Current performance vs targets
   - Industry benchmarks
   - Regulatory requirements
   - Stakeholder expectations

3. CONTEXTUALIZE: How does this relate to:
   - Material topics
   - Current initiatives
   - Risk factors
   - Opportunities

4. RECOMMEND: What specific actions should be taken?
   - Quick wins
   - Long-term strategies
   - Resource requirements
   - Expected outcomes

5. MEASURE: How will we track success?
   - KPIs to monitor
   - Reporting implications
   - Timeline for results

Please provide your reasoning first, then give a clear, actionable response that:
- Uses data to support recommendations
- Considers multiple stakeholder perspectives
- Aligns with reporting frameworks
- Includes specific next steps

Remember: Every recommendation should tie back to material topics and help achieve sustainability goals while managing risks.`;
  }

  /**
   * Generate structured response with reasoning
   */
  async generateStructuredResponse(
    message: string,
    context: ESGEnrichedContext
  ): Promise<{
    reasoning: string[];
    response: string;
    actions: Array<{
      action: string;
      priority: string;
      impact: string;
      timeline: string;
    }>;
    metrics: Array<{
      metric: string;
      current: number;
      target: number;
      unit: string;
    }>;
    visualizations: string[];
  }> {
    const prompt = `${this.generateChainOfThoughtPrompt(message, context)}

Please respond in the following JSON format:
{
  "reasoning": [
    "Step 1 reasoning...",
    "Step 2 reasoning...",
    "Step 3 reasoning..."
  ],
  "response": "Natural language response to the user",
  "actions": [
    {
      "action": "Specific action to take",
      "priority": "high/medium/low",
      "impact": "Expected impact",
      "timeline": "When to complete"
    }
  ],
  "metrics": [
    {
      "metric": "Metric name",
      "current": 0,
      "target": 0,
      "unit": "Unit of measurement"
    }
  ],
  "visualizations": [
    "Suggested chart or visualization type"
  ]
}`;

    // This would call the AI service with JSON mode enabled
    return {
      reasoning: [],
      response: "",
      actions: [],
      metrics: [],
      visualizations: []
    };
  }

  // Context retrieval methods (simplified for demo)
  private async getOrganizationContext(orgId: string): Promise<OrganizationContext> {
    const { data: _data } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    return {
      id: orgId,
      name: data?.name || "Demo Organization",
      industry: data?.industry || "Technology",
      size: data?.size || "Large",
      locations: data?.locations || ["Global"],
      fiscalYear: data?.fiscal_year || "Calendar",
      reportingBoundary: data?.reporting_boundary || "Operational Control"
    };
  }

  private async getESGMetrics(orgId: string): Promise<ESGMetrics> {
    // Fetch latest emissions data
    const { data: emissions } = await this.supabase
      .from('emissions')
      .select('*')
      .eq('organization_id', orgId)
      .order('period_end', { ascending: false })
      .limit(100);

    // Calculate aggregated metrics
    const scope1Total = emissions?.filter(e => e.scope === 'scope_1')
      .reduce((sum, e) => sum + (e.co2e_tonnes || 0), 0) || 0;
    const scope2Total = emissions?.filter(e => e.scope === 'scope_2')
      .reduce((sum, e) => sum + (e.co2e_tonnes || 0), 0) || 0;
    const scope3Total = emissions?.filter(e => e.scope === 'scope_3')
      .reduce((sum, e) => sum + (e.co2e_tonnes || 0), 0) || 0;

    return {
      emissions: {
        scope1: { current: scope1Total, trend: "decreasing", target: scope1Total * 0.8 },
        scope2: { current: scope2Total, trend: "stable", target: scope2Total * 0.7 },
        scope3: { current: scope3Total, trend: "increasing", target: scope3Total * 0.9 },
        intensity: (scope1Total + scope2Total) / 1000000, // per revenue
        reduction: 15 // % reduction from baseline
      },
      energy: {
        consumption: 50000000, // kWh
        renewable: 35, // %
        efficiency: 85 // efficiency score
      },
      water: {
        consumption: 250000, // m3
        recycled: 50000, // m3
        stressAreas: true
      },
      waste: {
        generated: 5000, // tonnes
        recycled: 3500, // tonnes
        diverted: 4000 // tonnes
      },
      social: {
        diversity: { gender: 42, ethnicity: 38 },
        safety: { incidents: 3, ltifr: 0.5 },
        training: { hours: 40, investment: 50000 }
      },
      governance: {
        boardDiversity: 45,
        ethicsTraining: 98,
        dataBreaches: 0
      }
    };
  }

  private async getMaterialTopics(orgId: string): Promise<MaterialTopic[]> {
    const { data: _data } = await this.supabase
      .from('material_topics')
      .select('*')
      .eq('organization_id', orgId)
      .order('business_impact_score', { ascending: false });

    return data?.map(topic => ({
      name: topic.topic_name,
      category: topic.category,
      businessImpact: topic.business_impact_score,
      stakeholderConcern: topic.stakeholder_concern_score,
      trend: "stable",
      risks: topic.risks || [],
      opportunities: topic.opportunities || []
    })) || [];
  }

  private async getComplianceStatus(orgId: string): Promise<ComplianceStatus> {
    const { data: frameworks } = await this.supabase
      .from('compliance_frameworks')
      .select('*')
      .eq('organization_id', orgId);

    return {
      frameworks: frameworks?.map(f => ({
        name: f.framework_name,
        status: f.compliance_status,
        gaps: f.gaps || [],
        nextDeadline: f.next_deadline
      })) || [],
      regulations: []
    };
  }

  private async getStakeholderContext(orgId: string): Promise<StakeholderContext> {
    // This would fetch from stakeholder_engagement table
    return {
      investors: {
        priorities: ["Net zero commitment", "TCFD disclosure", "Supply chain transparency"],
        concerns: ["Climate risk exposure", "Transition planning"]
      },
      customers: {
        expectations: ["Sustainable products", "Carbon neutral shipping", "Ethical sourcing"],
        feedback: ["More transparency needed", "Want recycling programs"]
      },
      employees: {
        engagement: 78,
        concerns: ["Career development", "Work-life balance", "Purpose alignment"]
      },
      communities: {
        issues: ["Local employment", "Environmental impact", "Community investment"],
        partnerships: ["Education programs", "Environmental cleanup"]
      },
      regulators: {
        focus: ["Emissions reporting", "Supply chain due diligence", "Data privacy"],
        upcoming: ["EU taxonomy", "SEC climate disclosure", "CSRD"]
      }
    };
  }

  private async getIndustryBenchmarks(orgId: string): Promise<IndustryBenchmark[]> {
    // This would fetch from industry_benchmarks table
    return [
      {
        metric: "Carbon Intensity",
        yourValue: 45,
        industryAverage: 62,
        topQuartile: 38,
        percentile: 72
      },
      {
        metric: "Renewable Energy %",
        yourValue: 35,
        industryAverage: 28,
        topQuartile: 55,
        percentile: 65
      },
      {
        metric: "Water Efficiency",
        yourValue: 0.8,
        industryAverage: 1.2,
        topQuartile: 0.6,
        percentile: 70
      }
    ];
  }

  private async getSustainabilityGoals(orgId: string): Promise<SustainabilityGoal[]> {
    const { data: _data } = await this.supabase
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'active');

    return data?.map(goal => ({
      id: goal.id,
      name: goal.name,
      type: goal.target_type,
      baseline: { year: goal.baseline_year, value: goal.baseline_value },
      target: { year: goal.target_year, value: goal.target_value },
      current: { value: goal.current_value || goal.baseline_value, progress: goal.progress_percent || 0 },
      status: goal.progress_percent > 80 ? "on-track" : goal.progress_percent > 50 ? "at-risk" : "off-track",
      initiatives: []
    })) || [];
  }

  private async getReportingFrameworks(orgId: string): Promise<ReportingFramework[]> {
    return [
      {
        name: "GRI Standards",
        disclosures: { required: 120, completed: 95 },
        lastReport: "2023-06-30",
        nextDue: "2024-06-30",
        gaps: ["305-5", "403-9", "418-1"]
      },
      {
        name: "TCFD",
        disclosures: { required: 11, completed: 8 },
        lastReport: "2023-12-31",
        nextDue: "2024-12-31",
        gaps: ["Scenario analysis", "Physical risk assessment", "Transition plan"]
      },
      {
        name: "SASB",
        disclosures: { required: 45, completed: 38 },
        lastReport: "2023-12-31",
        nextDue: "2024-12-31",
        gaps: ["EM-CM-110a.1", "EM-CM-150a.1", "EM-CM-320a.1"]
      }
    ];
  }

  private async getSupplyChainContext(orgId: string): Promise<SupplyChainContext> {
    const { data: suppliers } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', orgId);

    const criticalCount = suppliers?.filter(s => s.tier === 1).length || 0;
    const assessedCount = suppliers?.filter(s => s.sustainability_score !== null).length || 0;

    return {
      riskLevel: "medium",
      criticalSuppliers: criticalCount,
      assessedSuppliers: assessedCount,
      highRiskCategories: ["Electronics", "Textiles", "Logistics"],
      initiatives: ["Supplier code of conduct", "Annual assessments", "Capacity building"]
    };
  }

  private async getRiskAssessment(orgId: string): Promise<ESGRiskAssessment> {
    return {
      physicalRisks: [
        {
          name: "Extreme weather events",
          likelihood: 4,
          impact: 5,
          timeframe: "0-5 years",
          mitigation: ["Business continuity planning", "Insurance coverage", "Facility hardening"]
        },
        {
          name: "Water scarcity",
          likelihood: 3,
          impact: 4,
          timeframe: "5-10 years",
          mitigation: ["Water recycling", "Alternative sources", "Efficiency improvements"]
        }
      ],
      transitionRisks: [
        {
          name: "Carbon pricing",
          likelihood: 5,
          impact: 4,
          timeframe: "0-3 years",
          mitigation: ["Emissions reduction", "Renewable energy", "Carbon offsets"]
        },
        {
          name: "Technology disruption",
          likelihood: 4,
          impact: 3,
          timeframe: "3-5 years",
          mitigation: ["R&D investment", "Strategic partnerships", "Digital transformation"]
        }
      ],
      opportunities: [
        {
          name: "Green products",
          potential: 5,
          feasibility: 4,
          timeframe: "1-3 years",
          actions: ["Product redesign", "Sustainable materials", "Eco-labeling"]
        },
        {
          name: "Circular economy",
          potential: 4,
          feasibility: 3,
          timeframe: "3-5 years",
          actions: ["Take-back programs", "Remanufacturing", "Material recovery"]
        }
      ],
      overallScore: 72
    };
  }

  private async getConversationMemory(userId?: string): Promise<ConversationMemory> {
    return {
      recentTopics: ["Emissions reduction", "TCFD reporting", "Supply chain risks"],
      pendingActions: ["Review Q4 emissions data", "Schedule supplier audits"],
      commitments: ["50% emissions reduction by 2030", "100% renewable by 2025"],
      learnings: ["User prefers visual data", "Focus on financial impacts"]
    };
  }

  private async getUserProfile(userId?: string): Promise<UserProfile> {
    return {
      role: "Sustainability Manager",
      department: "ESG",
      expertise: "intermediate",
      focusAreas: ["Climate", "Reporting", "Supply chain"],
      communicationStyle: "data-driven"
    };
  }
}

// Export singleton
export const esgContextEngine = new ESGContextEngine();