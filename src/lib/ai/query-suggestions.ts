/**
 * Comprehensive Query Suggestions System for BLIPEE OS
 * Hierarchical flow from general to specific queries
 * Enables users to fully explore sustainability features through guided suggestions
 */

export interface QuerySuggestion {
  id: string;
  category: string;
  level: 'overview' | 'analysis' | 'detailed' | 'action';
  query: string;
  intent: string;
  context?: string;
  followUp?: string[];
  dataRequired?: string[];
  visualization?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface QueryCategory {
  name: string;
  icon: string;
  description: string;
  queries: QuerySuggestion[];
}

/**
 * Hierarchical Query Suggestions organized by exploration depth
 */
export const QUERY_SUGGESTIONS_HIERARCHY: QueryCategory[] = [
  // ===================================================================
  // LEVEL 1: OVERVIEW & DISCOVERY (Getting Started)
  // ===================================================================
  {
    name: "🏢 Organization Overview",
    icon: "building",
    description: "Start here to understand your organization's setup",
    queries: [
      {
        id: "org-1",
        category: "organization",
        level: "overview",
        query: "What organizations do I have access to?",
        intent: "list-organizations",
        followUp: ["org-2", "org-3", "org-4"],
        visualization: "list"
      },
      {
        id: "org-2",
        category: "organization",
        level: "overview",
        query: "Show me my organization's profile and settings",
        intent: "organization-profile",
        dataRequired: ["organizations"],
        followUp: ["org-5", "org-6"],
        visualization: "card"
      },
      {
        id: "org-3",
        category: "organization",
        level: "overview",
        query: "What is my role and permissions in this organization?",
        intent: "user-permissions",
        dataRequired: ["user_organizations", "app_users"],
        followUp: ["org-7", "team-1"],
        visualization: "info"
      },
      {
        id: "org-4",
        category: "organization",
        level: "overview",
        query: "Give me a complete overview of our sustainability status",
        intent: "sustainability-overview",
        dataRequired: ["organizations", "metrics_data"],
        followUp: ["emissions-1", "energy-1", "compliance-1"],
        visualization: "dashboard"
      },
      {
        id: "org-5",
        category: "organization",
        level: "analysis",
        query: "What compliance frameworks are we following?",
        intent: "compliance-frameworks",
        dataRequired: ["organizations"],
        followUp: ["compliance-2", "compliance-3"],
        visualization: "list"
      },
      {
        id: "org-6",
        category: "organization",
        level: "analysis",
        query: "Show me all our sites and buildings",
        intent: "list-facilities",
        dataRequired: ["sites", "buildings"],
        followUp: ["site-1", "building-1"],
        visualization: "map"
      },
      {
        id: "org-7",
        category: "organization",
        level: "detailed",
        query: "What features and modules do we have enabled?",
        intent: "enabled-features",
        dataRequired: ["organizations"],
        followUp: ["feature-1", "feature-2"],
        visualization: "grid"
      }
    ]
  },

  // ===================================================================
  // LEVEL 2: KEY METRICS & PERFORMANCE
  // ===================================================================
  {
    name: "📊 Emissions & Carbon Footprint",
    icon: "chart",
    description: "Understand your environmental impact",
    queries: [
      {
        id: "emissions-1",
        category: "emissions",
        level: "overview",
        query: "What are our current total emissions?",
        intent: "emissions-total",
        dataRequired: ["metrics_data", "emissions_data"],
        followUp: ["emissions-2", "emissions-3", "emissions-4"],
        visualization: "metric-card",
        urgency: "high"
      },
      {
        id: "emissions-2",
        category: "emissions",
        level: "analysis",
        query: "Break down our emissions by scope (1, 2, and 3)",
        intent: "emissions-by-scope",
        dataRequired: ["metrics_data"],
        followUp: ["emissions-5", "emissions-6"],
        visualization: "pie-chart"
      },
      {
        id: "emissions-3",
        category: "emissions",
        level: "analysis",
        query: "Show me emissions trends over the last 12 months",
        intent: "emissions-trend",
        dataRequired: ["metrics_data"],
        followUp: ["emissions-7", "emissions-8"],
        visualization: "line-chart"
      },
      {
        id: "emissions-4",
        category: "emissions",
        level: "analysis",
        query: "Which sites have the highest emissions?",
        intent: "emissions-by-site",
        dataRequired: ["metrics_data", "sites"],
        followUp: ["site-2", "emissions-9"],
        visualization: "bar-chart"
      },
      {
        id: "emissions-5",
        category: "emissions",
        level: "detailed",
        query: "What are our Scope 3 emission sources?",
        intent: "scope3-breakdown",
        dataRequired: ["metrics_data"],
        followUp: ["supply-1", "travel-1"],
        visualization: "tree-map"
      },
      {
        id: "emissions-6",
        category: "emissions",
        level: "detailed",
        query: "Calculate our carbon intensity per square meter",
        intent: "carbon-intensity",
        dataRequired: ["metrics_data", "sites"],
        followUp: ["benchmark-1"],
        visualization: "metric"
      },
      {
        id: "emissions-7",
        category: "emissions",
        level: "action",
        query: "Are we on track to meet our emissions targets?",
        intent: "target-progress",
        dataRequired: ["metrics_data", "organizations"],
        followUp: ["action-1", "emissions-10"],
        visualization: "progress-bar",
        urgency: "high"
      },
      {
        id: "emissions-8",
        category: "emissions",
        level: "analysis",
        query: "Compare this year's emissions to last year",
        intent: "emissions-yoy",
        dataRequired: ["metrics_data"],
        followUp: ["emissions-11"],
        visualization: "comparison"
      },
      {
        id: "emissions-9",
        category: "emissions",
        level: "detailed",
        query: "Show me emission factors we're using for calculations",
        intent: "emission-factors",
        dataRequired: ["emission_factors"],
        followUp: ["emissions-12"],
        visualization: "table"
      },
      {
        id: "emissions-10",
        category: "emissions",
        level: "action",
        query: "What actions can reduce our emissions by 20%?",
        intent: "reduction-recommendations",
        dataRequired: ["metrics_data", "ml_predictions"],
        followUp: ["action-2", "action-3"],
        visualization: "action-cards",
        urgency: "high"
      }
    ]
  },

  {
    name: "⚡ Energy Management",
    icon: "bolt",
    description: "Monitor and optimize energy consumption",
    queries: [
      {
        id: "energy-1",
        category: "energy",
        level: "overview",
        query: "What is our total energy consumption?",
        intent: "energy-total",
        dataRequired: ["energy_consumption"],
        followUp: ["energy-2", "energy-3"],
        visualization: "metric-card"
      },
      {
        id: "energy-2",
        category: "energy",
        level: "analysis",
        query: "Show energy consumption by building",
        intent: "energy-by-building",
        dataRequired: ["energy_consumption", "buildings"],
        followUp: ["building-2", "energy-4"],
        visualization: "bar-chart"
      },
      {
        id: "energy-3",
        category: "energy",
        level: "analysis",
        query: "What's our energy mix (renewable vs non-renewable)?",
        intent: "energy-mix",
        dataRequired: ["energy_consumption"],
        followUp: ["energy-5", "renewable-1"],
        visualization: "donut-chart"
      },
      {
        id: "energy-4",
        category: "energy",
        level: "detailed",
        query: "Show me peak demand periods and patterns",
        intent: "peak-demand",
        dataRequired: ["energy_consumption"],
        followUp: ["energy-6", "cost-1"],
        visualization: "heatmap"
      },
      {
        id: "energy-5",
        category: "energy",
        level: "action",
        query: "How can we increase renewable energy usage?",
        intent: "renewable-recommendations",
        dataRequired: ["energy_consumption"],
        followUp: ["action-4", "renewable-2"],
        visualization: "recommendations"
      },
      {
        id: "energy-6",
        category: "energy",
        level: "detailed",
        query: "Calculate energy intensity (kWh per sq meter)",
        intent: "energy-intensity",
        dataRequired: ["energy_consumption", "sites"],
        followUp: ["benchmark-2"],
        visualization: "metric"
      }
    ]
  },

  // ===================================================================
  // LEVEL 3: OPERATIONAL INSIGHTS
  // ===================================================================
  {
    name: "🏭 Facility & Device Management",
    icon: "factory",
    description: "Deep dive into facility operations",
    queries: [
      {
        id: "site-1",
        category: "facilities",
        level: "overview",
        query: "List all our sites with their key metrics",
        intent: "sites-overview",
        dataRequired: ["sites"],
        followUp: ["site-2", "site-3"],
        visualization: "table"
      },
      {
        id: "site-2",
        category: "facilities",
        level: "analysis",
        query: "Which site is performing best in sustainability?",
        intent: "best-performing-site",
        dataRequired: ["sites", "metrics_data"],
        followUp: ["site-4", "benchmark-3"],
        visualization: "ranking"
      },
      {
        id: "building-1",
        category: "facilities",
        level: "overview",
        query: "Show me all buildings and their current status",
        intent: "buildings-status",
        dataRequired: ["buildings"],
        followUp: ["building-2", "building-3"],
        visualization: "grid"
      },
      {
        id: "building-2",
        category: "facilities",
        level: "detailed",
        query: "What's the occupancy and utilization of Building A?",
        intent: "building-occupancy",
        context: "Requires building specification",
        dataRequired: ["buildings"],
        followUp: ["building-4", "energy-2"],
        visualization: "gauge"
      },
      {
        id: "device-1",
        category: "devices",
        level: "overview",
        query: "Show me all IoT devices and their status",
        intent: "devices-list",
        dataRequired: ["devices"],
        followUp: ["device-2", "device-3"],
        visualization: "list"
      },
      {
        id: "device-2",
        category: "devices",
        level: "analysis",
        query: "Are there any devices offline or needing maintenance?",
        intent: "device-alerts",
        dataRequired: ["devices"],
        followUp: ["device-4", "maintenance-1"],
        visualization: "alert-list",
        urgency: "high"
      },
      {
        id: "device-3",
        category: "devices",
        level: "detailed",
        query: "Show me real-time data from HVAC sensors",
        intent: "device-realtime",
        dataRequired: ["devices", "telemetry"],
        followUp: ["device-5", "hvac-1"],
        visualization: "live-chart"
      }
    ]
  },

  {
    name: "💧 Resource Management",
    icon: "water",
    description: "Water, waste, and resource optimization",
    queries: [
      {
        id: "water-1",
        category: "water",
        level: "overview",
        query: "What's our total water consumption?",
        intent: "water-total",
        dataRequired: ["water_consumption"],
        followUp: ["water-2", "water-3"],
        visualization: "metric-card"
      },
      {
        id: "water-2",
        category: "water",
        level: "analysis",
        query: "Show water usage trends and any anomalies",
        intent: "water-trends",
        dataRequired: ["water_consumption"],
        followUp: ["water-4", "anomaly-1"],
        visualization: "line-chart"
      },
      {
        id: "waste-1",
        category: "waste",
        level: "overview",
        query: "How much waste are we generating?",
        intent: "waste-total",
        dataRequired: ["waste_data"],
        followUp: ["waste-2", "waste-3"],
        visualization: "metric-card"
      },
      {
        id: "waste-2",
        category: "waste",
        level: "analysis",
        query: "What's our waste diversion rate from landfills?",
        intent: "waste-diversion",
        dataRequired: ["waste_data"],
        followUp: ["waste-4", "circular-1"],
        visualization: "percentage"
      },
      {
        id: "waste-3",
        category: "waste",
        level: "detailed",
        query: "Break down waste by type (recyclable, compost, landfill)",
        intent: "waste-breakdown",
        dataRequired: ["waste_data"],
        followUp: ["waste-5", "action-5"],
        visualization: "stacked-bar"
      }
    ]
  },

  // ===================================================================
  // LEVEL 4: COMPLIANCE & REPORTING
  // ===================================================================
  {
    name: "📋 Compliance & Reporting",
    icon: "clipboard",
    description: "Regulatory compliance and ESG reporting",
    queries: [
      {
        id: "compliance-1",
        category: "compliance",
        level: "overview",
        query: "What's our overall compliance status?",
        intent: "compliance-status",
        dataRequired: ["compliance_assessments"],
        followUp: ["compliance-2", "compliance-3"],
        visualization: "status-card",
        urgency: "high"
      },
      {
        id: "compliance-2",
        category: "compliance",
        level: "analysis",
        query: "Show me all regulatory requirements we need to meet",
        intent: "regulatory-requirements",
        dataRequired: ["compliance_requirements"],
        followUp: ["compliance-4", "compliance-5"],
        visualization: "checklist"
      },
      {
        id: "compliance-3",
        category: "compliance",
        level: "detailed",
        query: "Are we ready for GRI reporting?",
        intent: "gri-readiness",
        dataRequired: ["gri_disclosures"],
        followUp: ["report-1", "compliance-6"],
        visualization: "progress"
      },
      {
        id: "report-1",
        category: "reporting",
        level: "overview",
        query: "Generate our quarterly sustainability report",
        intent: "generate-report",
        dataRequired: ["metrics_data", "organizations"],
        followUp: ["report-2", "report-3"],
        visualization: "document",
        urgency: "medium"
      },
      {
        id: "report-2",
        category: "reporting",
        level: "detailed",
        query: "Show me all KPIs for executive dashboard",
        intent: "executive-kpis",
        dataRequired: ["metrics_data"],
        followUp: ["report-4", "kpi-1"],
        visualization: "dashboard"
      },
      {
        id: "report-3",
        category: "reporting",
        level: "analysis",
        query: "Compare our performance to industry benchmarks",
        intent: "industry-benchmark",
        dataRequired: ["metrics_data", "industry_benchmarks"],
        followUp: ["benchmark-4", "peer-1"],
        visualization: "comparison"
      }
    ]
  },

  // ===================================================================
  // LEVEL 5: PREDICTIVE & AI INSIGHTS
  // ===================================================================
  {
    name: "🤖 AI Predictions & Optimization",
    icon: "robot",
    description: "Advanced AI-driven insights and predictions",
    queries: [
      {
        id: "predict-1",
        category: "predictions",
        level: "analysis",
        query: "Predict our emissions for next quarter",
        intent: "predict-emissions",
        dataRequired: ["ml_predictions"],
        followUp: ["predict-2", "action-6"],
        visualization: "forecast"
      },
      {
        id: "predict-2",
        category: "predictions",
        level: "analysis",
        query: "When will we achieve carbon neutrality at current rate?",
        intent: "carbon-neutral-timeline",
        dataRequired: ["ml_predictions", "metrics_data"],
        followUp: ["predict-3", "scenario-1"],
        visualization: "timeline",
        urgency: "medium"
      },
      {
        id: "anomaly-1",
        category: "anomalies",
        level: "analysis",
        query: "Are there any anomalies in our sustainability data?",
        intent: "detect-anomalies",
        dataRequired: ["ml_anomalies"],
        followUp: ["anomaly-2", "action-7"],
        visualization: "alert-chart",
        urgency: "high"
      },
      {
        id: "optimize-1",
        category: "optimization",
        level: "action",
        query: "Optimize our energy schedule for cost and emissions",
        intent: "optimize-energy",
        dataRequired: ["ml_optimization"],
        followUp: ["optimize-2", "cost-2"],
        visualization: "optimization-plan"
      },
      {
        id: "scenario-1",
        category: "scenarios",
        level: "analysis",
        query: "What if we switch 50% of our fleet to electric?",
        intent: "scenario-analysis",
        dataRequired: ["ml_scenarios"],
        followUp: ["scenario-2", "action-8"],
        visualization: "scenario-comparison"
      },
      {
        id: "agent-1",
        category: "agents",
        level: "overview",
        query: "What are my AI agents doing right now?",
        intent: "agent-status",
        dataRequired: ["agent_tasks"],
        followUp: ["agent-2", "agent-3"],
        visualization: "agent-dashboard"
      },
      {
        id: "agent-2",
        category: "agents",
        level: "action",
        query: "Have the Carbon Hunter find cost savings opportunities",
        intent: "agent-carbon-hunter",
        dataRequired: ["agent_tasks"],
        followUp: ["agent-4", "cost-3"],
        visualization: "agent-results",
        urgency: "medium"
      }
    ]
  },

  // ===================================================================
  // LEVEL 6: ACTIONABLE INSIGHTS
  // ===================================================================
  {
    name: "🎯 Actions & Improvements",
    icon: "target",
    description: "Concrete actions to improve sustainability",
    queries: [
      {
        id: "action-1",
        category: "actions",
        level: "action",
        query: "What are the top 5 actions to improve our sustainability?",
        intent: "top-actions",
        dataRequired: ["ml_recommendations"],
        followUp: ["action-9", "action-10"],
        visualization: "action-list",
        urgency: "high"
      },
      {
        id: "action-2",
        category: "actions",
        level: "action",
        query: "Which quick wins can we implement this month?",
        intent: "quick-wins",
        dataRequired: ["ml_recommendations"],
        followUp: ["action-11", "cost-4"],
        visualization: "quick-actions"
      },
      {
        id: "cost-1",
        category: "costs",
        level: "analysis",
        query: "How much are we spending on energy?",
        intent: "energy-costs",
        dataRequired: ["energy_consumption"],
        followUp: ["cost-5", "optimize-3"],
        visualization: "cost-breakdown"
      },
      {
        id: "cost-2",
        category: "costs",
        level: "action",
        query: "Where can we save money while reducing emissions?",
        intent: "cost-saving-opportunities",
        dataRequired: ["ml_optimization"],
        followUp: ["cost-6", "action-12"],
        visualization: "savings-chart",
        urgency: "high"
      },
      {
        id: "initiative-1",
        category: "initiatives",
        level: "overview",
        query: "Show me all active sustainability initiatives",
        intent: "list-initiatives",
        dataRequired: ["sustainability_initiatives"],
        followUp: ["initiative-2", "initiative-3"],
        visualization: "kanban"
      },
      {
        id: "initiative-2",
        category: "initiatives",
        level: "action",
        query: "Create a new carbon reduction initiative",
        intent: "create-initiative",
        dataRequired: ["sustainability_initiatives"],
        followUp: ["initiative-4", "team-2"],
        visualization: "form"
      }
    ]
  },

  // ===================================================================
  // LEVEL 7: TEAM & COLLABORATION
  // ===================================================================
  {
    name: "👥 Team & Collaboration",
    icon: "users",
    description: "Team management and collaboration features",
    queries: [
      {
        id: "team-1",
        category: "team",
        level: "overview",
        query: "Who's on our sustainability team?",
        intent: "list-team",
        dataRequired: ["user_organizations", "app_users"],
        followUp: ["team-3", "team-4"],
        visualization: "team-list"
      },
      {
        id: "team-2",
        category: "team",
        level: "action",
        query: "Assign the energy audit task to John",
        intent: "assign-task",
        context: "Requires team member specification",
        dataRequired: ["app_users", "tasks"],
        followUp: ["team-5", "task-1"],
        visualization: "assignment"
      },
      {
        id: "notification-1",
        category: "notifications",
        level: "overview",
        query: "What alerts and notifications do I have?",
        intent: "list-notifications",
        dataRequired: ["notifications"],
        followUp: ["notification-2", "alert-1"],
        visualization: "notification-center"
      },
      {
        id: "task-1",
        category: "tasks",
        level: "overview",
        query: "Show me all pending sustainability tasks",
        intent: "list-tasks",
        dataRequired: ["tasks"],
        followUp: ["task-2", "task-3"],
        visualization: "task-board"
      }
    ]
  },

  // ===================================================================
  // LEVEL 8: EXTERNAL INTEGRATIONS
  // ===================================================================
  {
    name: "🔗 External Data & Markets",
    icon: "link",
    description: "External integrations and market data",
    queries: [
      {
        id: "weather-1",
        category: "external",
        level: "overview",
        query: "How is weather affecting our energy consumption?",
        intent: "weather-impact",
        dataRequired: ["weather_data", "energy_consumption"],
        followUp: ["weather-2", "predict-4"],
        visualization: "correlation"
      },
      {
        id: "carbon-market-1",
        category: "markets",
        level: "overview",
        query: "What's the current carbon credit price?",
        intent: "carbon-price",
        dataRequired: ["carbon_markets"],
        followUp: ["carbon-market-2", "offset-1"],
        visualization: "price-chart"
      },
      {
        id: "supply-1",
        category: "supply-chain",
        level: "analysis",
        query: "Show me our supply chain emissions",
        intent: "supply-chain-emissions",
        dataRequired: ["supply_chain_data"],
        followUp: ["supply-2", "supplier-1"],
        visualization: "supply-chain-map"
      },
      {
        id: "grid-1",
        category: "grid",
        level: "overview",
        query: "What's the current grid carbon intensity?",
        intent: "grid-intensity",
        dataRequired: ["grid_data"],
        followUp: ["grid-2", "renewable-3"],
        visualization: "intensity-gauge"
      }
    ]
  }
];

/**
 * Get contextual suggestions based on current conversation state
 */
export function getContextualSuggestions(
  currentIntent: string,
  userRole: string,
  dataAvailable: string[],
  conversationHistory: any[]
): QuerySuggestion[] {
  const suggestions: QuerySuggestion[] = [];

  // Find current query and its follow-ups
  for (const category of QUERY_SUGGESTIONS_HIERARCHY) {
    for (const query of category.queries) {
      if (query.intent === currentIntent && query.followUp) {
        // Get follow-up suggestions
        const followUpQueries = query.followUp
          .map(id => findQueryById(id))
          .filter(q => q && canUserAccessQuery(q, userRole, dataAvailable));

        suggestions.push(...followUpQueries);
      }
    }
  }

  // Add urgency-based suggestions
  const urgentQueries = getAllQueries()
    .filter(q => q.urgency === 'high' || q.urgency === 'critical')
    .filter(q => canUserAccessQuery(q, userRole, dataAvailable))
    .slice(0, 2);

  suggestions.push(...urgentQueries);

  // Remove duplicates and limit to top 5
  const uniqueSuggestions = Array.from(
    new Map(suggestions.map(item => [item.id, item])).values()
  ).slice(0, 5);

  return uniqueSuggestions;
}

/**
 * Get progressive suggestions for new users
 */
export function getProgressiveSuggestions(
  userExperience: 'new' | 'intermediate' | 'advanced'
): QuerySuggestion[] {
  let levelFilter: ('overview' | 'analysis' | 'detailed' | 'action')[] = [];

  switch (userExperience) {
    case 'new':
      levelFilter = ['overview'];
      break;
    case 'intermediate':
      levelFilter = ['overview', 'analysis'];
      break;
    case 'advanced':
      levelFilter = ['analysis', 'detailed', 'action'];
      break;
  }

  return getAllQueries()
    .filter(q => levelFilter.includes(q.level))
    .slice(0, 8);
}

/**
 * Get category-specific suggestions
 */
export function getCategorySuggestions(categoryName: string): QuerySuggestion[] {
  const category = QUERY_SUGGESTIONS_HIERARCHY.find(c => c.name.includes(categoryName));
  return category ? category.queries : [];
}

/**
 * Helper function to find query by ID
 */
function findQueryById(id: string): QuerySuggestion | undefined {
  for (const category of QUERY_SUGGESTIONS_HIERARCHY) {
    const query = category.queries.find(q => q.id === id);
    if (query) return query;
  }
  return undefined;
}

/**
 * Get all queries flattened
 */
function getAllQueries(): QuerySuggestion[] {
  return QUERY_SUGGESTIONS_HIERARCHY.flatMap(cat => cat.queries);
}

/**
 * Check if user can access a query based on role and data
 */
function canUserAccessQuery(
  query: QuerySuggestion,
  userRole: string,
  dataAvailable: string[]
): boolean {
  // Check data requirements
  if (query.dataRequired) {
    const hasRequiredData = query.dataRequired.every(table =>
      dataAvailable.includes(table)
    );
    if (!hasRequiredData) return false;
  }

  // Role-based filtering
  const restrictedQueries = ['organization-settings', 'user-management', 'billing'];
  const adminRoles = ['account_owner', 'sustainability_manager'];

  if (restrictedQueries.some(r => query.intent.includes(r))) {
    return adminRoles.includes(userRole);
  }

  return true;
}

/**
 * Get onboarding journey queries for new users
 */
export function getOnboardingJourney(): QuerySuggestion[] {
  const journey = [
    'org-1',  // What organizations do I have access to?
    'org-3',  // What is my role and permissions?
    'org-4',  // Give me a complete overview
    'emissions-1',  // What are our current total emissions?
    'energy-1',  // What is our total energy consumption?
    'compliance-1',  // What's our overall compliance status?
    'action-1',  // What are the top 5 actions to improve?
    'agent-1'  // What are my AI agents doing?
  ];

  return journey.map(id => findQueryById(id)).filter(Boolean) as QuerySuggestion[];
}

/**
 * Get smart suggestions based on time of day and patterns
 */
export function getSmartSuggestions(
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  dayOfWeek: number,
  userPattern: any
): QuerySuggestion[] {
  const suggestions: QuerySuggestion[] = [];

  // Morning: Overview and status checks
  if (timeOfDay === 'morning') {
    suggestions.push(
      findQueryById('org-4')!,  // Complete overview
      findQueryById('anomaly-1')!,  // Any anomalies?
      findQueryById('device-2')!  // Devices needing attention
    );
  }

  // End of week: Reporting
  if (dayOfWeek === 5) {  // Friday
    suggestions.push(
      findQueryById('report-1')!,  // Generate report
      findQueryById('emissions-8')!  // YoY comparison
    );
  }

  // Month end: Compliance and targets
  const today = new Date();
  if (today.getDate() >= 25) {
    suggestions.push(
      findQueryById('compliance-1')!,  // Compliance status
      findQueryById('emissions-7')!  // Target progress
    );
  }

  return suggestions.filter(Boolean).slice(0, 5);
}

export default QUERY_SUGGESTIONS_HIERARCHY;