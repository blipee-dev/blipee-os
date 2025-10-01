import { GHGProtocolCategories } from '@/lib/sustainability/ghg-protocol';

// Universal metric discovery system that covers ALL scopes comprehensively
export interface MetricDiscoveryPhase {
  phase: 'existence' | 'measurement' | 'enhancement';
  currentScope: 1 | 2 | 3;
  currentCategory?: string;
  discoveredMetrics: DiscoveredMetric[];
  suggestedMetrics: SuggestedMetric[];
}

export interface DiscoveredMetric {
  scope: number;
  category: string;
  name: string;
  description: string;
  dataAvailable: boolean;
  measurementMethod?: string;
  currentValue?: number;
  unit?: string;
  frequency?: 'monthly' | 'quarterly' | 'annually';
  confidence: 'high' | 'medium' | 'low';
  source?: string;
}

export interface SuggestedMetric {
  scope: number;
  category: string;
  name: string;
  rationale: string;
  estimationMethod?: string;
  requiredData: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  impact: 'high' | 'medium' | 'low';
}

export interface TargetRecommendation {
  metric: string;
  baselineValue: number;
  targetValue: number;
  targetYear: number;
  reductionPercentage: number;
  methodology: 'SBTi' | 'Net-Zero' | 'Custom';
  rationale: string;
  milestones: Milestone[];
  confidence: number;
}

export interface Milestone {
  year: number;
  target: number;
  actions: string[];
}

// Comprehensive Scope 1 discovery questions
const SCOPE_1_DISCOVERY = {
  initial: "Let's explore your direct emissions. I'll ask about various sources - just let me know what applies to your organization.",

  categories: [
    {
      name: "Mobile Combustion",
      questions: [
        "Does your organization own or lease any vehicles? (cars, trucks, forklifts, etc.)",
        "Do you have company boats or aircraft?",
        "Any construction or agricultural equipment?"
      ],
      metrics: [
        { name: "Fleet fuel consumption", unit: "liters/gallons", frequency: "monthly" },
        { name: "Vehicle mileage", unit: "km/miles", frequency: "monthly" },
        { name: "Equipment runtime", unit: "hours", frequency: "monthly" }
      ]
    },
    {
      name: "Stationary Combustion",
      questions: [
        "Do you use natural gas for heating or cooking?",
        "Do you have backup generators?",
        "Any boilers or furnaces on-site?",
        "Manufacturing equipment that burns fuel?"
      ],
      metrics: [
        { name: "Natural gas consumption", unit: "m³/therms", frequency: "monthly" },
        { name: "Generator fuel usage", unit: "liters", frequency: "monthly" },
        { name: "Process fuel consumption", unit: "varies", frequency: "monthly" }
      ]
    },
    {
      name: "Process Emissions",
      questions: [
        "Do you manufacture or process any materials?",
        "Any chemical processes in your operations?",
        "Cement, steel, or aluminum production?"
      ],
      metrics: [
        { name: "Process CO2 emissions", unit: "tCO2", frequency: "monthly" },
        { name: "Chemical reactions", unit: "varies", frequency: "batch" }
      ]
    },
    {
      name: "Fugitive Emissions",
      questions: [
        "Do you have air conditioning or refrigeration systems?",
        "Any equipment using refrigerants?",
        "Fire suppression systems?",
        "Any potential for methane leaks?"
      ],
      metrics: [
        { name: "Refrigerant leakage", unit: "kg", frequency: "annually" },
        { name: "Methane emissions", unit: "m³", frequency: "monthly" }
      ]
    }
  ]
};

// Universal Scope 2 discovery
const SCOPE_2_DISCOVERY = {
  initial: "Now let's look at your energy consumption. Every organization uses electricity, and many also purchase heating or cooling.",

  categories: [
    {
      name: "Electricity",
      questions: [
        "What are your monthly electricity bills?",
        "Do you have multiple facilities?",
        "Any renewable energy contracts or on-site generation?"
      ],
      metrics: [
        { name: "Grid electricity", unit: "kWh", frequency: "monthly" },
        { name: "Renewable energy", unit: "kWh", frequency: "monthly" },
        { name: "Peak demand", unit: "kW", frequency: "monthly" }
      ]
    },
    {
      name: "Purchased Heat/Steam/Cooling",
      questions: [
        "Do you purchase district heating or cooling?",
        "Any steam purchases for your processes?",
        "Connected to a central heating/cooling system?"
      ],
      metrics: [
        { name: "District heating", unit: "GJ/MWh", frequency: "monthly" },
        { name: "Purchased steam", unit: "tonnes", frequency: "monthly" },
        { name: "District cooling", unit: "ton-hours", frequency: "monthly" }
      ]
    }
  ]
};

// Complete Scope 3 discovery (all 15 categories)
const SCOPE_3_DISCOVERY = {
  initial: "Finally, let's explore your value chain emissions. These are often the largest portion but also where you can influence positive change.",

  categories: [
    {
      id: 1,
      name: "Purchased goods and services",
      questions: [
        "What are your main purchased materials or services?",
        "Do you track spending by category?",
        "Any major suppliers you work with regularly?"
      ],
      metrics: [
        { name: "Spend by category", unit: "currency", frequency: "annually" },
        { name: "Material quantities", unit: "varies", frequency: "monthly" },
        { name: "Service contracts", unit: "currency", frequency: "annually" }
      ]
    },
    {
      id: 2,
      name: "Capital goods",
      questions: [
        "Have you purchased equipment, buildings, or vehicles recently?",
        "Any IT equipment or infrastructure?",
        "Furniture or fixtures?"
      ],
      metrics: [
        { name: "Capital expenditure", unit: "currency", frequency: "annually" },
        { name: "Asset lifecycle", unit: "years", frequency: "one-time" }
      ]
    },
    {
      id: 3,
      name: "Fuel and energy activities",
      questions: [
        "This covers emissions from producing the fuel and electricity you use.",
        "We can calculate this from your Scope 1 & 2 data automatically."
      ],
      metrics: [
        { name: "Upstream fuel emissions", unit: "tCO2e", frequency: "monthly" },
        { name: "T&D losses", unit: "kWh", frequency: "monthly" }
      ]
    },
    {
      id: 4,
      name: "Upstream transportation",
      questions: [
        "How do purchased goods reach you?",
        "Do you track inbound logistics?",
        "Any air freight or international shipping?"
      ],
      metrics: [
        { name: "Inbound freight", unit: "tonne-km", frequency: "monthly" },
        { name: "Shipping modes", unit: "varies", frequency: "shipment" }
      ]
    },
    {
      id: 5,
      name: "Waste generated",
      questions: [
        "What types of waste do you generate?",
        "Do you track waste by disposal method?",
        "Any recycling or composting programs?"
      ],
      metrics: [
        { name: "Landfill waste", unit: "tonnes", frequency: "monthly" },
        { name: "Recycling", unit: "tonnes", frequency: "monthly" },
        { name: "Hazardous waste", unit: "kg", frequency: "quarterly" }
      ]
    },
    {
      id: 6,
      name: "Business travel",
      questions: [
        "Do employees travel for business?",
        "How do you track travel expenses or bookings?",
        "Any company travel policies?"
      ],
      metrics: [
        { name: "Air travel", unit: "passenger-km", frequency: "monthly" },
        { name: "Hotel nights", unit: "nights", frequency: "monthly" },
        { name: "Ground transport", unit: "km", frequency: "monthly" }
      ]
    },
    {
      id: 7,
      name: "Employee commuting",
      questions: [
        "How many employees do you have?",
        "Any data on commute patterns?",
        "Remote work policies?",
        "Company shuttles or transit subsidies?"
      ],
      metrics: [
        { name: "Commute distance", unit: "km/employee", frequency: "annually" },
        { name: "Transport modes", unit: "percentage", frequency: "annually" },
        { name: "Remote work days", unit: "days", frequency: "monthly" }
      ]
    },
    {
      id: 8,
      name: "Upstream leased assets",
      questions: [
        "Do you lease any facilities or equipment not in Scope 1&2?",
        "Any assets you lease to others?"
      ],
      metrics: [
        { name: "Leased space", unit: "m²", frequency: "monthly" },
        { name: "Leased equipment", unit: "varies", frequency: "monthly" }
      ]
    },
    {
      id: 9,
      name: "Downstream transportation",
      questions: [
        "Do you ship products to customers?",
        "How are your products distributed?",
        "Any direct-to-consumer shipping?"
      ],
      metrics: [
        { name: "Outbound freight", unit: "tonne-km", frequency: "monthly" },
        { name: "Distribution modes", unit: "varies", frequency: "shipment" }
      ]
    },
    {
      id: 10,
      name: "Processing of sold products",
      questions: [
        "Do your products require further processing?",
        "Are you selling intermediate products?",
        "Any B2B sales requiring transformation?"
      ],
      metrics: [
        { name: "Products requiring processing", unit: "tonnes", frequency: "monthly" },
        { name: "Processing energy", unit: "kWh/unit", frequency: "estimate" }
      ]
    },
    {
      id: 11,
      name: "Use of sold products",
      questions: [
        "Do your products consume energy when used?",
        "What's the typical product lifetime?",
        "Any consumables or maintenance required?"
      ],
      metrics: [
        { name: "Product energy use", unit: "kWh/unit", frequency: "lifetime" },
        { name: "Product lifetime", unit: "years", frequency: "estimate" }
      ]
    },
    {
      id: 12,
      name: "End-of-life treatment",
      questions: [
        "What happens to your products after use?",
        "Are they recyclable or compostable?",
        "Any take-back programs?"
      ],
      metrics: [
        { name: "Product disposal", unit: "tonnes", frequency: "annually" },
        { name: "Recycling rate", unit: "percentage", frequency: "estimate" }
      ]
    },
    {
      id: 13,
      name: "Downstream leased assets",
      questions: [
        "Do you lease assets to others?",
        "Any franchises using your assets?"
      ],
      metrics: [
        { name: "Leased asset energy", unit: "kWh", frequency: "monthly" },
        { name: "Asset utilization", unit: "percentage", frequency: "monthly" }
      ]
    },
    {
      id: 14,
      name: "Franchises",
      questions: [
        "Do you have franchise operations?",
        "Any licensing arrangements?"
      ],
      metrics: [
        { name: "Franchise energy", unit: "kWh", frequency: "monthly" },
        { name: "Franchise operations", unit: "count", frequency: "annually" }
      ]
    },
    {
      id: 15,
      name: "Investments",
      questions: [
        "Do you have equity investments?",
        "Any joint ventures or subsidiaries?",
        "Investment portfolio?"
      ],
      metrics: [
        { name: "Portfolio emissions", unit: "tCO2e", frequency: "annually" },
        { name: "Financed emissions", unit: "tCO2e", frequency: "annually" }
      ]
    }
  ]
};

export class TargetSettingAssistant {
  private conversationHistory: any[] = [];
  private discoveredMetrics: DiscoveredMetric[] = [];
  private currentPhase: MetricDiscoveryPhase = {
    phase: 'existence',
    currentScope: 1,
    discoveredMetrics: [],
    suggestedMetrics: []
  };

  async startDiscovery(): Promise<string> {
    return `Hi! I'm here to help you identify all your emission sources and set science-based targets.

We'll explore all possible emission categories - even ones you might not have considered. This ensures we don't miss anything important.

Let's start with understanding your organization:
- What industry are you in?
- How many employees do you have?
- How many facilities/offices do you operate?

Don't worry if you're not sure about something - we'll figure it out together!`;
  }

  async processResponse(userInput: string): Promise<{
    message: string;
    metrics?: DiscoveredMetric[];
    suggestions?: SuggestedMetric[];
    nextQuestions?: string[];
  }> {
    // Analyze user input to extract metric information
    const extractedMetrics = await this.extractMetricsFromResponse(userInput);

    // Determine next questions based on current phase and scope
    const nextQuestions = this.getNextQuestions();

    // Generate intelligent response
    const message = this.generateResponse(extractedMetrics, nextQuestions);

    return {
      message,
      metrics: extractedMetrics,
      suggestions: this.generateSuggestions(extractedMetrics),
      nextQuestions
    };
  }

  private async extractMetricsFromResponse(input: string): Promise<DiscoveredMetric[]> {
    const metrics: DiscoveredMetric[] = [];

    // AI-powered extraction logic
    // Look for keywords indicating different emission sources
    const patterns = {
      vehicles: /\b(\d+)\s*(vehicles?|cars?|trucks?|vans?)\b/gi,
      electricity: /\b(\d+)\s*(kwh|mwh|electricity|power)\b/gi,
      gas: /\b(\d+)\s*(gas|natural gas|heating)\b/gi,
      travel: /\b(travel|flights?|hotels?|trips?)\b/gi,
      waste: /\b(waste|recycl|disposal|landfill)\b/gi,
      employees: /\b(\d+)\s*(employees?|staff|people|workers?)\b/gi
    };

    // Check for each pattern and create metrics
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(input)) {
        const scope = this.categorizeScope(category);
        metrics.push({
          scope,
          category,
          name: this.generateMetricName(category),
          description: `Discovered from: "${input}"`,
          dataAvailable: input.includes('track') || input.includes('measure') || input.includes('have'),
          confidence: 'medium'
        });
      }
    }

    return metrics;
  }

  private categorizeScope(category: string): number {
    const scopeMapping: Record<string, number> = {
      vehicles: 1,
      gas: 1,
      electricity: 2,
      travel: 3,
      waste: 3,
      employees: 3
    };
    return scopeMapping[category] || 3;
  }

  private generateMetricName(category: string): string {
    const nameMapping: Record<string, string> = {
      vehicles: 'Fleet emissions',
      electricity: 'Electricity consumption',
      gas: 'Natural gas consumption',
      travel: 'Business travel emissions',
      waste: 'Waste emissions',
      employees: 'Employee commuting'
    };
    return nameMapping[category] || `${category} emissions`;
  }

  private getNextQuestions(): string[] {
    const { phase, currentScope } = this.currentPhase;

    if (phase === 'existence') {
      switch (currentScope) {
        case 1:
          return SCOPE_1_DISCOVERY.categories[0].questions;
        case 2:
          return SCOPE_2_DISCOVERY.categories[0].questions;
        case 3:
          return [SCOPE_3_DISCOVERY.categories[0].questions[0]];
        default:
          return [];
      }
    }

    return [];
  }

  private generateResponse(metrics: DiscoveredMetric[], nextQuestions: string[]): string {
    let response = '';

    if (metrics.length > 0) {
      response += `Great! I've identified ${metrics.length} potential emission sources:\n`;
      metrics.forEach(m => {
        response += `• ${m.name} (Scope ${m.scope})\n`;
      });
      response += '\n';
    }

    if (nextQuestions.length > 0) {
      response += 'Let me ask about a few more areas:\n';
      nextQuestions.forEach(q => {
        response += `• ${q}\n`;
      });
    }

    return response;
  }

  private generateSuggestions(existingMetrics: DiscoveredMetric[]): SuggestedMetric[] {
    const suggestions: SuggestedMetric[] = [];

    // Suggest related metrics based on what was discovered
    existingMetrics.forEach(metric => {
      if (metric.name === 'Fleet emissions' && !existingMetrics.find(m => m.name === 'Fleet maintenance')) {
        suggestions.push({
          scope: 1,
          category: 'Mobile Combustion',
          name: 'Fleet maintenance emissions',
          rationale: 'Since you have vehicles, tracking maintenance-related emissions can help optimize fleet performance',
          requiredData: ['Service records', 'Parts replacements'],
          complexity: 'simple',
          impact: 'low'
        });
      }

      if (metric.name === 'Electricity consumption' && !existingMetrics.find(m => m.name === 'Renewable energy')) {
        suggestions.push({
          scope: 2,
          category: 'Electricity',
          name: 'Renewable energy procurement',
          rationale: 'Transitioning to renewable energy is one of the fastest ways to reduce Scope 2 emissions',
          requiredData: ['Energy contracts', 'Grid mix data'],
          complexity: 'moderate',
          impact: 'high'
        });
      }
    });

    return suggestions;
  }

  async generateTargets(metrics: DiscoveredMetric[]): Promise<TargetRecommendation[]> {
    const targets: TargetRecommendation[] = [];

    // Group metrics by scope
    const scope1Metrics = metrics.filter(m => m.scope === 1);
    const scope2Metrics = metrics.filter(m => m.scope === 2);
    const scope3Metrics = metrics.filter(m => m.scope === 3);

    // Generate SBTi-aligned targets
    if (scope1Metrics.length > 0 || scope2Metrics.length > 0) {
      targets.push({
        metric: 'Scope 1 & 2 emissions',
        baselineValue: 1000, // Would be calculated from actual data
        targetValue: 580,
        targetYear: 2030,
        reductionPercentage: 42,
        methodology: 'SBTi',
        rationale: 'Science-based target aligned with 1.5°C pathway requiring 4.2% annual reduction',
        milestones: [
          {
            year: 2025,
            target: 850,
            actions: ['Energy audit', 'LED retrofits', 'Fleet electrification planning']
          },
          {
            year: 2027,
            target: 720,
            actions: ['30% fleet electrified', 'Renewable energy procurement', 'Building automation']
          },
          {
            year: 2030,
            target: 580,
            actions: ['60% renewable energy', '50% fleet electric', 'Heat pump installation']
          }
        ],
        confidence: 0.85
      });
    }

    if (scope3Metrics.length > 0) {
      targets.push({
        metric: 'Scope 3 emissions',
        baselineValue: 5000,
        targetValue: 3750,
        targetYear: 2030,
        reductionPercentage: 25,
        methodology: 'SBTi',
        rationale: 'Supplier engagement target covering 67% of emissions',
        milestones: [
          {
            year: 2025,
            target: 4500,
            actions: ['Supplier engagement program', 'Travel policy update']
          },
          {
            year: 2027,
            target: 4100,
            actions: ['Key supplier commitments', 'Circular economy initiatives']
          },
          {
            year: 2030,
            target: 3750,
            actions: ['Supply chain transformation', 'Product redesign']
          }
        ],
        confidence: 0.75
      });
    }

    return targets;
  }

  // Method to handle when users say they don't have certain emissions
  async handleNonApplicable(scope: number, category: string): Promise<string> {
    // Never dismiss completely - always probe gently
    const probes: Record<string, string> = {
      'vehicles': "That's fine! Just to double-check - no company cars, not even for executives? No delivery vehicles or forklifts in warehouses?",
      'manufacturing': 'Understood. What about any equipment that might use fuel - generators, heating systems, or even small equipment?',
      'refrigerants': 'Got it. Just confirming - no air conditioning, refrigerators, or server cooling systems? These often contain refrigerants that can leak.',
      'travel': 'Interesting! Even occasional client meetings or conferences? Sometimes these emissions hide in expense reports.',
    };

    return probes[category] || `Noted! Let's continue exploring other areas. Sometimes emissions show up in unexpected places, so we'll keep all options open as your business evolves.`;
  }
}

// Export singleton instance
export const targetAssistant = new TargetSettingAssistant();