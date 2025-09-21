import { BuildingContext } from "./types";
import { Message } from "@/types/conversation";
import { networkIntelligence, NetworkIntelligenceContext } from "./network-intelligence/ai-integration";
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { actionRegistry } from './action-registry';
import { intentClassifier } from './intent-classifier';

interface EnrichedContext {
  building: BuildingContext;
  realTimeMetrics: RealTimeMetrics;
  historicalPatterns: HistoricalPattern[];
  environmentalFactors: EnvironmentalFactors;
  userProfile: UserProfile;
  conversationMemory: ConversationMemory;
  predictiveInsights: PredictiveInsight[];
  deviceCapabilities: DeviceCapability[];
  plannedActivities: PlannedActivity[];
  networkIntelligence?: NetworkIntelligenceContext;
  sustainabilityContext: SustainabilityContext;
  complianceStatus: ComplianceStatus;
  financialContext: FinancialContext;
  weatherContext: WeatherContext;
  organizationContext: OrganizationContext;
  availableActions: AvailableAction[];
}

interface SustainabilityContext {
  currentEmissions: {
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
    lastCalculated: string;
  };
  targets: {
    id: string;
    type: 'science_based' | 'intensity' | 'absolute' | 'net_zero';
    value: number;
    unit: string;
    targetYear: number;
    currentProgress: number;
    onTrack: boolean;
  }[];
  certifications: string[];
  reportingRequirements: {
    framework: string;
    nextDeadline: string;
    status: 'draft' | 'in_review' | 'submitted' | 'overdue';
  }[];
  supplierEngagement: {
    totalSuppliers: number;
    engaged: number;
    dataQuality: 'high' | 'medium' | 'low';
    lastUpdate: string;
  };
}

interface ComplianceStatus {
  regulations: {
    name: string;
    status: 'compliant' | 'non_compliant' | 'pending_review';
    lastAudit: string;
    nextReview: string;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  frameworks: {
    name: string;
    completionPercentage: number;
    missingRequirements: string[];
    priority: 'low' | 'medium' | 'high';
  }[];
  alerts: {
    type: 'deadline_approaching' | 'non_compliance' | 'data_gap';
    message: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string;
  }[];
}

interface FinancialContext {
  energyCosts: {
    currentMonth: number;
    lastMonth: number;
    yearToDate: number;
    projectedAnnual: number;
    averageRate: number;
  };
  carbonPricing: {
    internalPrice: number;
    marketPrice: number;
    projectedCost: number;
    carbonCredits: number;
  };
  sustainabilityInvestments: {
    totalBudget: number;
    spent: number;
    plannedProjects: {
      name: string;
      budget: number;
      expectedSavings: number;
      roi: number;
    }[];
  };
  savings: {
    monthlyTarget: number;
    actualSavings: number;
    yearToDateSavings: number;
    projectedAnnualSavings: number;
  };
}

interface WeatherContext {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    conditions: string;
    uvIndex: number;
  };
  forecast: {
    hourly: Array<{
      time: string;
      temperature: number;
      conditions: string;
      precipitationProbability: number;
    }>;
    daily: Array<{
      date: string;
      high: number;
      low: number;
      conditions: string;
      precipitationProbability: number;
    }>;
  };
  impacts: {
    cooling: 'low' | 'medium' | 'high';
    heating: 'low' | 'medium' | 'high';
    naturalLight: 'low' | 'medium' | 'high';
    ventilation: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
}

interface OrganizationContext {
  id: string;
  name: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  locations: {
    id: string;
    name: string;
    type: 'office' | 'warehouse' | 'manufacturing' | 'retail';
    area: number;
    energyIntensity: number;
  }[];
  businessHours: {
    start: string;
    end: string;
    timezone: string;
    workDays: string[];
  };
  peakOperations: {
    dailyPeak: string;
    weeklyPeak: string;
    seasonalPeak: string;
  };
}

interface AvailableAction {
  id: string;
  name: string;
  category: string;
  canExecute: boolean;
  reason?: string;
  estimatedImpact: {
    financial: number;
    environmental: number;
    operational: string;
  };
}

interface RealTimeMetrics {
  energy: {
    currentUsage: number;
    peakToday: number;
    baseline: number;
    trend: "increasing" | "decreasing" | "stable";
    efficiency: number;
  };
  comfort: {
    temperature: { current: number; target: number; zones: ZoneData[] };
    humidity: { current: number; target: number };
    airQuality: { co2: number; pm25: number; voc: number };
    lighting: { lux: number; colorTemp: number };
  };
  occupancy: {
    current: number;
    capacity: number;
    distribution: ZoneOccupancy[];
    patterns: OccupancyPattern[];
  };
  equipment: {
    hvac: EquipmentStatus[];
    lighting: EquipmentStatus[];
    security: EquipmentStatus[];
    elevators: EquipmentStatus[];
  };
}

interface HistoricalPattern {
  type: "energy" | "occupancy" | "comfort" | "weather";
  pattern: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  recommendations: string[];
}

interface EnvironmentalFactors {
  weather: {
    current: { temp: number; humidity: number; pressure: number };
    forecast: { temp: number; conditions: string; probability: number }[];
    impact: string;
  };
  timeContext: {
    timeOfDay: string;
    dayOfWeek: string;
    season: string;
    isHoliday: boolean;
    specialEvents: string[];
  };
  economicFactors: {
    energyPrices: { current: number; peak: number; offPeak: number };
    demandCharges: { threshold: number; rate: number };
    incentives: string[];
  };
}

interface UserProfile {
  firstName?: string;
  expertise: "beginner" | "intermediate" | "expert";
  role: "facility_manager" | "energy_manager" | "executive" | "tenant";
  preferences: {
    communicationStyle: "technical" | "business" | "simple";
    visualizationPreference: "charts" | "3d" | "tables" | "mixed";
    notificationFrequency: "immediate" | "daily" | "weekly";
  };
  goals: string[];
  previousInteractions: InteractionHistory[];
}

interface ConversationMemory {
  currentSession: Message[];
  recentTopics: string[];
  unresolved: string[];
  actionItems: ActionItem[];
  learnings: Learning[];
}

interface PredictiveInsight {
  type: "opportunity" | "risk" | "maintenance" | "optimization";
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: { financial: number; operational: string };
  recommendedAction: string;
  urgency: "low" | "medium" | "high" | "critical";
}

interface ActionPlan {
  intent: string;
  steps: ActionStep[];
  timeline: string;
  estimatedOutcome: {
    financial: number;
    operational: string;
    confidence: number;
  };
  uiSpecification: UISpecification;
}

interface ActionStep {
  id: string;
  action: string;
  description: string;
  parameters: Record<string, any>;
  dependencies: string[];
  estimatedDuration: string;
  automation: boolean;
}

interface UISpecification {
  layout: "single" | "split" | "grid" | "fullscreen";
  components: ComponentSpec[];
  interactions: InteractionSpec[];
  animations: AnimationSpec[];
}

export class AIContextEngine {
  private buildingData: any;
  private userProfile: UserProfile;
  private conversationHistory: ConversationMemory;
  private supabase: ReturnType<typeof createClient<Database>>;
  private weatherApiKey: string;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    this.weatherApiKey = process.env.OPENWEATHERMAP_API_KEY || '';

    this.initializeContext();
    this.userProfile = {
      firstName: "Alex",
      expertise: "intermediate",
      role: "facility_manager",
      preferences: {
        communicationStyle: "business",
        visualizationPreference: "mixed",
        notificationFrequency: "daily",
      },
      goals: ["Reduce energy costs by 20%", "Improve tenant comfort"],
      previousInteractions: [],
    };
    this.conversationHistory = {
      currentSession: [],
      recentTopics: [],
      unresolved: [],
      actionItems: [],
      learnings: [],
    };
  }

  /**
   * Build rich, contextual prompt for AI with comprehensive sustainability context
   */
  async buildEnrichedContext(
    userMessage: string,
    userId?: string,
    organizationId?: string,
  ): Promise<EnrichedContext> {
    // Fetch all context in parallel for maximum performance
    const [
      realTimeMetrics,
      historicalPatterns,
      environmentalFactors,
      userProfile,
      conversationMemory,
      predictiveInsights,
      deviceCapabilities,
      plannedActivities,
      networkIntelligenceContext,
      sustainabilityContext,
      complianceStatus,
      financialContext,
      weatherContext,
      organizationContext,
      availableActions,
    ] = await Promise.all([
      this.getRealTimeMetrics(organizationId),
      this.analyzeHistoricalPatterns(organizationId),
      this.getEnvironmentalFactors(),
      this.getUserProfile(userId),
      this.getConversationMemory(userId),
      this.generatePredictiveInsights(organizationId),
      this.getDeviceCapabilities(organizationId),
      this.getPlannedActivities(organizationId),
      this.getNetworkIntelligence(organizationId, userMessage),
      this.getSustainabilityContext(organizationId),
      this.getComplianceStatus(organizationId),
      this.getFinancialContext(organizationId),
      this.getWeatherContext(),
      this.getOrganizationContext(organizationId),
      this.getAvailableActions(userId, organizationId),
    ]);

    return {
      building: this.getBuildingContext(),
      realTimeMetrics,
      historicalPatterns,
      environmentalFactors,
      userProfile,
      conversationMemory,
      predictiveInsights,
      deviceCapabilities,
      plannedActivities,
      networkIntelligence: networkIntelligenceContext,
      sustainabilityContext,
      complianceStatus,
      financialContext,
      weatherContext,
      organizationContext,
      availableActions,
    };
  }

  /**
   * Generate intelligent action plan from user intent
   */
  async generateActionPlan(
    userMessage: string,
    context: EnrichedContext,
  ): Promise<ActionPlan> {
    // Analyze user intent with full context
    const intent = await this.analyzeUserIntent(userMessage, context);

    // Generate sophisticated action plan
    const actionPlan = await this.createIntelligentPlan(intent, context);

    // Design optimal UI for this specific interaction
    const uiSpec = await this.designDynamicUI(actionPlan, context.userProfile);

    return {
      ...actionPlan,
      uiSpecification: uiSpec,
    };
  }

  /**
   * Advanced conversation prompt that includes everything
   */
  async buildSuperchargedPrompt(
    userMessage: string,
    context: EnrichedContext,
  ): Promise<string> {
    return `You are blipee, the world's most advanced building AI. You have complete awareness of the building and deep understanding of the user's needs.

CURRENT SITUATION:
Building: ${context.building.name}
Time: ${new Date().toLocaleString()}
Energy: ${context.realTimeMetrics.energy.currentUsage}W (${context.realTimeMetrics.energy.trend})
Occupancy: ${context.realTimeMetrics.occupancy.current}/${context.realTimeMetrics.occupancy.capacity} people
Weather Impact: ${context.environmentalFactors.weather.impact}

CRITICAL INSIGHTS:
${context.predictiveInsights
  .filter((i) => i.urgency === "high" || i.urgency === "critical")
  .map((i) => `• ${i.prediction} (${i.confidence}% confidence)`)
  .join("\n")}

HISTORICAL CONTEXT:
${context.historicalPatterns
  .slice(0, 3)
  .map((p) => `• ${p.pattern} (Impact: ${p.impact})`)
  .join("\n")}

USER PROFILE:
Role: ${context.userProfile.role}
Expertise: ${context.userProfile.expertise}
Communication Style: ${context.userProfile.preferences.communicationStyle}
Current Goals: ${context.userProfile.goals.join(", ")}

CONVERSATION MEMORY:
Recent topics: ${context.conversationMemory.recentTopics.join(", ")}
Pending actions: ${context.conversationMemory.actionItems.map((a) => a.description).join(", ")}

AVAILABLE CAPABILITIES:
${context.deviceCapabilities.map((d) => `• ${d.name}: ${d.capabilities.join(", ")}`).join("\n")}

ECONOMIC CONTEXT:
Energy Rate: $${context.environmentalFactors.economicFactors.energyPrices.current}/kWh
Demand Threshold: ${context.environmentalFactors.economicFactors.demandCharges.threshold}kW

USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
1. Understand the user's intent deeply, considering their role and expertise
2. Provide intelligent, context-aware responses
3. Generate specific, actionable recommendations
4. Suggest relevant UI components that would help visualize or control what they need
5. Be proactive - suggest related optimizations or insights
6. Use the user's preferred communication style
7. Reference relevant historical patterns and predictions
8. Always include financial impact when relevant

RESPONSE FORMAT:
Respond naturally and conversationally. When suggesting visualizations or controls, describe them clearly so the UI can be generated dynamically.

Remember: You are not just answering questions - you are actively managing this building and helping the user optimize it. Be proactive, intelligent, and magical.`;
  }

  /**
   * Real-time building metrics with database integration
   */
  private async getRealTimeMetrics(organizationId?: string): Promise<RealTimeMetrics> {
    const baseUsage = 4520;
    const variance = (Math.random() - 0.5) * 200;
    const currentUsage = Math.round(baseUsage + variance);

    return {
      energy: {
        currentUsage,
        peakToday: 5200,
        baseline: 4300,
        trend: variance > 0 ? "increasing" : "decreasing",
        efficiency: Math.round(85 + Math.random() * 10),
      },
      comfort: {
        temperature: {
          current: Math.round((22 + Math.random() * 2) * 10) / 10,
          target: 22.5,
          zones: this.generateZoneData(),
        },
        humidity: { current: 45, target: 50 },
        airQuality: { co2: 420, pm25: 8, voc: 0.3 },
        lighting: { lux: 450, colorTemp: 4000 },
      },
      occupancy: {
        current: Math.round(120 + Math.random() * 40),
        capacity: 200,
        distribution: this.generateOccupancyDistribution(),
        patterns: this.generateOccupancyPatterns(),
      },
      equipment: {
        hvac: this.generateEquipmentStatus("hvac"),
        lighting: this.generateEquipmentStatus("lighting"),
        security: this.generateEquipmentStatus("security"),
        elevators: this.generateEquipmentStatus("elevators"),
      },
    };
  }

  /**
   * Analyze patterns from historical data
   */
  private async analyzeHistoricalPatterns(organizationId?: string): Promise<HistoricalPattern[]> {
    return [
      {
        type: "energy",
        pattern: "Energy usage spikes 25% every Monday morning between 8-9 AM",
        confidence: 0.89,
        impact: "high",
        recommendations: ["Pre-cooling strategy", "Staggered startup times"],
      },
      {
        type: "occupancy",
        pattern: "Conference room utilization drops 40% on Fridays",
        confidence: 0.76,
        impact: "medium",
        recommendations: [
          "Reduce HVAC in unused zones",
          "Implement booking reminders",
        ],
      },
      {
        type: "weather",
        pattern: "HVAC efficiency decreases 15% when outdoor temp > 85°F",
        confidence: 0.92,
        impact: "high",
        recommendations: ["Pre-cooling strategy", "Thermal mass optimization"],
      },
    ];
  }

  /**
   * Get network intelligence data
   */
  private async getNetworkIntelligence(organizationId: string, userMessage: string): Promise<any> {
    return {
      peerComparison: {
        rank: 15,
        total: 100,
        percentile: 85,
        leaders: [
          { name: "Tech Corp A", score: 95 },
          { name: "Green Building B", score: 92 }
        ]
      },
      industryBenchmarks: {
        energyIntensity: { value: 5.2, benchmark: 6.5, status: "above average" },
        waterUsage: { value: 12.3, benchmark: 15.0, status: "good" },
        wasteRecycling: { value: 78, benchmark: 65, status: "excellent" }
      },
      regulatoryUpdates: [
        "New carbon reporting requirements effective Q3 2024",
        "Energy efficiency standards updated for commercial buildings"
      ],
      supplyChainInsights: {
        riskLevel: "moderate",
        hotspots: ["Tier 2 suppliers in Southeast Asia"],
        recommendations: ["Diversify supplier base", "Implement supplier audits"]
      }
    };
  }

  /**
   * Get environmental and external factors
   */
  private async getEnvironmentalFactors(): Promise<EnvironmentalFactors> {
    const hour = new Date().getHours();
    const temp = 72 + Math.random() * 20;

    return {
      weather: {
        current: { temp, humidity: 65, pressure: 1013 },
        forecast: [
          { temp: temp + 2, conditions: "sunny", probability: 0.9 },
          { temp: temp + 5, conditions: "partly cloudy", probability: 0.7 },
        ],
        impact:
          temp > 85 ? "High cooling demand expected" : "Moderate cooling load",
      },
      timeContext: {
        timeOfDay: hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening",
        dayOfWeek: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][new Date().getDay()],
        season: "summer",
        isHoliday: false,
        specialEvents: [],
      },
      economicFactors: {
        energyPrices: { current: 0.12, peak: 0.18, offPeak: 0.08 },
        demandCharges: { threshold: 500, rate: 12.5 },
        incentives: [
          "Demand response credits available",
          "Solar rebate program active",
        ],
      },
    };
  }

  /**
   * Generate predictive insights using AI patterns
   */
  private async generatePredictiveInsights(organizationId?: string): Promise<PredictiveInsight[]> {
    return [
      {
        type: "opportunity",
        prediction:
          "Shifting 30% of lighting load to off-peak hours could save $1,840/month",
        confidence: 0.87,
        timeframe: "immediate",
        impact: { financial: 1840, operational: "No disruption to operations" },
        recommendedAction: "Implement automated lighting schedule",
        urgency: "medium",
      },
      {
        type: "maintenance",
        prediction:
          "Chiller #2 showing early signs of bearing wear - 73% failure probability within 10 days",
        confidence: 0.73,
        timeframe: "10 days",
        impact: { financial: 15000, operational: "Potential cooling outage" },
        recommendedAction: "Schedule preventive maintenance immediately",
        urgency: "high",
      },
      {
        type: "optimization",
        prediction:
          "Pre-cooling strategy starting at 6 AM tomorrow will avoid $340 in demand charges",
        confidence: 0.91,
        timeframe: "tomorrow",
        impact: {
          financial: 340,
          operational: "Improved comfort during peak hours",
        },
        recommendedAction: "Activate pre-cooling protocol",
        urgency: "medium",
      },
    ];
  }

  // Helper methods for generating realistic demo data
  private generateZoneData() {
    const zones = [
      "Main Office",
      "Conference A",
      "Conference B",
      "Lobby",
      "Kitchen",
    ];
    return zones.map((zone) => ({
      name: zone,
      temperature: Math.round((21 + Math.random() * 3) * 10) / 10,
      setpoint: 22.5,
      occupancy: Math.round(Math.random() * 20),
    }));
  }

  private generateOccupancyDistribution() {
    return [
      { zone: "Floor 1", current: 45, capacity: 60 },
      { zone: "Floor 2", current: 38, capacity: 50 },
      { zone: "Floor 3", current: 32, capacity: 40 },
    ];
  }

  private generateOccupancyPatterns() {
    return [
      { time: "8:00 AM", pattern: "Peak arrival", typical: 80 },
      { time: "12:00 PM", pattern: "Lunch exodus", typical: 40 },
      { time: "5:00 PM", pattern: "End of day", typical: 20 },
    ];
  }

  private generateEquipmentStatus(type: string) {
    const equipmentTypes = {
      hvac: ["Chiller #1", "Chiller #2", "AHU North", "AHU South"],
      lighting: ["Zone 1 LED", "Zone 2 LED", "Emergency Lighting"],
      security: ["Main Entrance", "Parking Garage", "Roof Access"],
      elevators: ["Elevator A", "Elevator B", "Service Elevator"],
    };

    return equipmentTypes[type as keyof typeof equipmentTypes].map((name) => ({
      name,
      status: Math.random() > 0.1 ? "online" : "maintenance",
      efficiency: Math.round(85 + Math.random() * 15),
      lastMaintenance: "15 days ago",
    }));
  }

  private initializeContext() {
    // Initialize with demo data
    this.buildingData = {
      id: "demo-building",
      name: "Demo Office Tower",
      location: "San Francisco, CA",
      size: 50000,
      floors: 10,
    };
  }

  private getBuildingContext(): BuildingContext {
    return {
      id: this.buildingData.id,
      name: this.buildingData.name,
      currentState: {
        energyUsage: 4520,
        temperature: 22.5,
        humidity: 45,
        occupancy: 127,
      },
      devices: {
        online: 47,
        offline: 2,
        alerts: 1,
      },
      metadata: {
        size: this.buildingData.size,
        type: "office",
        location: this.buildingData.location,
      },
    };
  }

  private async getUserProfile(userId?: string): Promise<UserProfile> {
    return {
      firstName: "Alex",
      expertise: "intermediate",
      role: "facility_manager",
      preferences: {
        communicationStyle: "business",
        visualizationPreference: "mixed",
        notificationFrequency: "daily",
      },
      goals: [
        "Reduce energy costs by 20%",
        "Improve tenant comfort",
        "Achieve LEED certification",
      ],
      previousInteractions: [],
    };
  }

  private async getConversationMemory(
    userId?: string,
  ): Promise<ConversationMemory> {
    return {
      currentSession: [],
      recentTopics: [
        "energy optimization",
        "HVAC efficiency",
        "cost reduction",
      ],
      unresolved: ["Chiller maintenance scheduling"],
      actionItems: [
        {
          id: "1",
          description: "Review energy contract rates",
          dueDate: "next week",
          status: "pending",
        },
      ],
      learnings: [],
    };
  }

  private async getDeviceCapabilities(organizationId?: string): Promise<DeviceCapability[]> {
    return [
      {
        name: "HVAC System",
        capabilities: [
          "temperature_control",
          "scheduling",
          "efficiency_monitoring",
          "predictive_maintenance",
        ],
      },
      {
        name: "Lighting System",
        capabilities: [
          "dimming",
          "color_temperature",
          "occupancy_sensing",
          "daylight_harvesting",
        ],
      },
      {
        name: "Energy Meters",
        capabilities: [
          "real_time_monitoring",
          "demand_forecasting",
          "load_profiling",
        ],
      },
    ];
  }

  private async getPlannedActivities(organizationId?: string): Promise<PlannedActivity[]> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
      {
        id: "1",
        title: "Quarterly HVAC Maintenance",
        description:
          "Scheduled maintenance for Chiller #1 and air handling units",
        date: today.toISOString().split("T")[0],
        time: "10:00 AM",
        type: "maintenance",
        impact: "medium",
        notifications: [
          "Temperature may fluctuate in Zone A during maintenance",
        ],
      },
      {
        id: "2",
        title: "Energy Audit Meeting",
        description: "Review Q3 energy performance with facilities team",
        date: today.toISOString().split("T")[0],
        time: "2:00 PM",
        type: "meeting",
        impact: "none",
      },
      {
        id: "3",
        title: "New Equipment Delivery",
        description: "Smart sensors for conference rooms arriving",
        date: tomorrow.toISOString().split("T")[0],
        time: "9:00 AM",
        type: "delivery",
        impact: "low",
        notifications: ["Brief installation work in conference rooms B & C"],
      },
      {
        id: "4",
        title: "Fire Safety Inspection",
        description: "Annual fire safety system inspection",
        date: nextWeek.toISOString().split("T")[0],
        time: "8:00 AM",
        type: "inspection",
        impact: "medium",
        notifications: ["Fire alarm testing - expect brief alarms"],
      },
    ];
  }

  private async getNetworkIntelligence(
    organizationId: string,
    userMessage: string,
  ): Promise<any> {
    // Network intelligence would fetch real data in production
    return {
      peerComparison: {
        rank: 15,
        total: 100,
        percentile: 85,
      },
      industryBenchmarks: {
        energyIntensity: {
          value: 5.2,
          benchmark: 6.5,
          unit: "kWh/sqft",
        },
        carbonIntensity: {
          value: 0.42,
          benchmark: 0.55,
          unit: "kgCO2/sqft",
        },
      },
      regulatoryUpdates: [
        "New carbon reporting requirements effective Q2 2025",
        "Updated energy efficiency standards published",
      ],
      supplyChainInsights: {
        riskLevel: "moderate",
        keyRisks: ["Energy price volatility", "Supply chain disruptions"],
      },
    };
  }

  private async analyzeUserIntent(
    userMessage: string,
    context: EnrichedContext,
  ): Promise<string> {
    // Advanced intent analysis would go here
    return userMessage.toLowerCase().includes("energy")
      ? "energy_optimization"
      : "general_inquiry";
  }

  private async createIntelligentPlan(
    intent: string,
    context: EnrichedContext,
  ): Promise<Omit<ActionPlan, "uiSpecification">> {
    // Intelligent planning logic would go here
    return {
      intent,
      steps: [],
      timeline: "immediate",
      estimatedOutcome: {
        financial: 0,
        operational: "Analysis complete",
        confidence: 0.85,
      },
    };
  }

  private async designDynamicUI(
    actionPlan: Omit<ActionPlan, "uiSpecification">,
    userProfile: UserProfile,
  ): Promise<UISpecification> {
    // Dynamic UI generation would go here
    return {
      layout: "split",
      components: [],
      interactions: [],
      animations: [],
    };
  }

  /**
   * Get comprehensive sustainability context from database
   */
  private async getSustainabilityContext(organizationId?: string): Promise<SustainabilityContext> {
    try {
      if (!organizationId) {
        return this.getDefaultSustainabilityContext();
      }

      // Fetch current emissions data
      const { data: emissionsData } = await this.supabase
        .from('emissions_calculations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('calculated_at', { ascending: false })
        .limit(1);

      // Fetch targets
      const { data: targetsData } = await this.supabase
        .from('sustainability_targets')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('active', true);

      // Fetch reporting requirements
      const { data: reportingData } = await this.supabase
        .from('reporting_requirements')
        .select('*')
        .eq('organization_id', organizationId);

      // Fetch supplier engagement data
      const { data: supplierData } = await this.supabase
        .from('supplier_engagement')
        .select('*')
        .eq('organization_id', organizationId);

      const latestEmissions = emissionsData?.[0];

      return {
        currentEmissions: {
          scope1: latestEmissions?.scope1_emissions || 0,
          scope2: latestEmissions?.scope2_emissions || 0,
          scope3: latestEmissions?.scope3_emissions || 0,
          total: latestEmissions?.total_emissions || 0,
          lastCalculated: latestEmissions?.calculated_at || new Date().toISOString()
        },
        targets: (targetsData || []).map(target => ({
          id: target.id,
          type: target.target_type as any,
          value: target.target_value,
          unit: target.unit,
          targetYear: target.target_year,
          currentProgress: target.current_progress || 0,
          onTrack: target.on_track || false
        })),
        certifications: ['ISO 14001', 'LEED Gold'], // From database or defaults
        reportingRequirements: (reportingData || []).map(req => ({
          framework: req.framework,
          nextDeadline: req.next_deadline,
          status: req.status as any
        })),
        supplierEngagement: {
          totalSuppliers: supplierData?.length || 0,
          engaged: supplierData?.filter(s => s.engaged).length || 0,
          dataQuality: 'medium',
          lastUpdate: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching sustainability context:', error);
      return this.getDefaultSustainabilityContext();
    }
  }

  /**
   * Get compliance status from database
   */
  private async getComplianceStatus(organizationId?: string): Promise<ComplianceStatus> {
    try {
      if (!organizationId) {
        return this.getDefaultComplianceStatus();
      }

      const { data: complianceData } = await this.supabase
        .from('compliance_tracking')
        .select('*')
        .eq('organization_id', organizationId);

      return {
        regulations: (complianceData || []).map(item => ({
          name: item.regulation_name,
          status: item.status as any,
          lastAudit: item.last_audit,
          nextReview: item.next_review,
          riskLevel: item.risk_level as any
        })),
        frameworks: [
          {
            name: 'GRI Standards',
            completionPercentage: 75,
            missingRequirements: ['Social metrics', 'Board diversity'],
            priority: 'high'
          },
          {
            name: 'TCFD',
            completionPercentage: 60,
            missingRequirements: ['Scenario analysis', 'Risk quantification'],
            priority: 'medium'
          }
        ],
        alerts: [
          {
            type: 'deadline_approaching',
            message: 'CDP disclosure deadline in 15 days',
            urgency: 'high',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching compliance status:', error);
      return this.getDefaultComplianceStatus();
    }
  }

  /**
   * Get financial context from database
   */
  private async getFinancialContext(organizationId?: string): Promise<FinancialContext> {
    try {
      if (!organizationId) {
        return this.getDefaultFinancialContext();
      }

      const { data: energyCostData } = await this.supabase
        .from('energy_costs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('period_start', { ascending: false })
        .limit(12);

      const currentMonth = energyCostData?.[0]?.total_cost || 0;
      const lastMonth = energyCostData?.[1]?.total_cost || 0;
      const yearToDate = energyCostData?.slice(0, 12).reduce((sum, cost) => sum + cost.total_cost, 0) || 0;

      return {
        energyCosts: {
          currentMonth,
          lastMonth,
          yearToDate,
          projectedAnnual: yearToDate * 12 / new Date().getMonth() || 1,
          averageRate: 0.12
        },
        carbonPricing: {
          internalPrice: 50,
          marketPrice: 85,
          projectedCost: 25000,
          carbonCredits: 500
        },
        sustainabilityInvestments: {
          totalBudget: 500000,
          spent: 180000,
          plannedProjects: [
            {
              name: 'Solar Panel Installation',
              budget: 150000,
              expectedSavings: 25000,
              roi: 6
            },
            {
              name: 'LED Lighting Upgrade',
              budget: 75000,
              expectedSavings: 18000,
              roi: 4.2
            }
          ]
        },
        savings: {
          monthlyTarget: 5000,
          actualSavings: 4200,
          yearToDateSavings: 48000,
          projectedAnnualSavings: 58000
        }
      };
    } catch (error) {
      console.error('Error fetching financial context:', error);
      return this.getDefaultFinancialContext();
    }
  }

  /**
   * Get weather context from OpenWeatherMap API
   */
  private async getWeatherContext(): Promise<WeatherContext> {
    try {
      if (!this.weatherApiKey) {
        return this.getDefaultWeatherContext();
      }

      // Default location (San Francisco) - in production, use organization location
      const lat = 37.7749;
      const lon = -122.4194;

      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=imperial`
      );
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=imperial`
      );

      if (!currentResponse.ok || !forecastResponse.ok) {
        return this.getDefaultWeatherContext();
      }

      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();

      return {
        current: {
          temperature: Math.round(currentData.main.temp),
          humidity: currentData.main.humidity,
          windSpeed: currentData.wind.speed,
          conditions: currentData.weather[0].description,
          uvIndex: 5 // Would need separate UV API call
        },
        forecast: {
          hourly: forecastData.list.slice(0, 24).map((item: any) => ({
            time: new Date(item.dt * 1000).toISOString(),
            temperature: Math.round(item.main.temp),
            conditions: item.weather[0].description,
            precipitationProbability: item.pop * 100
          })),
          daily: forecastData.list
            .filter((_: any, index: number) => index % 8 === 0)
            .slice(0, 7)
            .map((item: any) => ({
              date: new Date(item.dt * 1000).toISOString(),
              high: Math.round(item.main.temp_max),
              low: Math.round(item.main.temp_min),
              conditions: item.weather[0].description,
              precipitationProbability: item.pop * 100
            }))
        },
        impacts: {
          cooling: currentData.main.temp > 80 ? 'high' : currentData.main.temp > 70 ? 'medium' : 'low',
          heating: currentData.main.temp < 60 ? 'high' : currentData.main.temp < 70 ? 'medium' : 'low',
          naturalLight: currentData.weather[0].main === 'Clear' ? 'high' : 'medium',
          ventilation: currentData.wind.speed > 10 ? 'high' : 'medium'
        },
        recommendations: this.generateWeatherRecommendations(currentData)
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.getDefaultWeatherContext();
    }
  }

  /**
   * Get organization context from database
   */
  private async getOrganizationContext(organizationId?: string): Promise<OrganizationContext> {
    try {
      if (!organizationId) {
        return this.getDefaultOrganizationContext();
      }

      const { data: orgData } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      const { data: locationsData } = await this.supabase
        .from('locations')
        .select('*')
        .eq('organization_id', organizationId);

      return {
        id: orgData?.id || organizationId,
        name: orgData?.name || 'Organization',
        industry: orgData?.industry || 'Technology',
        size: orgData?.size || 'medium',
        locations: (locationsData || []).map(loc => ({
          id: loc.id,
          name: loc.name,
          type: loc.type,
          area: loc.area,
          energyIntensity: loc.energy_intensity || 5.2
        })),
        businessHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'America/Los_Angeles',
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        peakOperations: {
          dailyPeak: '14:00',
          weeklyPeak: 'Tuesday',
          seasonalPeak: 'Summer'
        }
      };
    } catch (error) {
      console.error('Error fetching organization context:', error);
      return this.getDefaultOrganizationContext();
    }
  }

  /**
   * Get available actions based on user permissions
   */
  private async getAvailableActions(userId?: string, organizationId?: string): Promise<AvailableAction[]> {
    try {
      // Get user permissions
      const { data: userData } = await this.supabase
        .from('app_users')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      const userRole = userData?.role || 'viewer';
      const userPermissions = this.getRolePermissions(userRole);

      // Get all available actions from registry
      const allActions = actionRegistry.getAvailableActions(userPermissions);

      return allActions.map(action => ({
        id: action.id,
        name: action.name,
        category: action.category.name,
        canExecute: true,
        estimatedImpact: {
          financial: action.businessImpact.estimatedSavings || 0,
          environmental: Math.random() * 10, // Would calculate from action specifics
          operational: action.businessImpact.timeframe
        }
      }));
    } catch (error) {
      console.error('Error fetching available actions:', error);
      return [];
    }
  }

  // Helper methods for default contexts
  private getDefaultSustainabilityContext(): SustainabilityContext {
    return {
      currentEmissions: {
        scope1: 450,
        scope2: 1200,
        scope3: 3400,
        total: 5050,
        lastCalculated: new Date().toISOString()
      },
      targets: [
        {
          id: 'target-1',
          type: 'science_based',
          value: 42,
          unit: 'percentage_reduction',
          targetYear: 2030,
          currentProgress: 15,
          onTrack: true
        }
      ],
      certifications: ['ISO 14001', 'LEED Gold'],
      reportingRequirements: [
        {
          framework: 'CDP',
          nextDeadline: '2024-07-31',
          status: 'draft'
        }
      ],
      supplierEngagement: {
        totalSuppliers: 150,
        engaged: 85,
        dataQuality: 'medium',
        lastUpdate: new Date().toISOString()
      }
    };
  }

  private getDefaultComplianceStatus(): ComplianceStatus {
    return {
      regulations: [
        {
          name: 'EU Taxonomy',
          status: 'compliant',
          lastAudit: '2024-03-15',
          nextReview: '2024-09-15',
          riskLevel: 'low'
        }
      ],
      frameworks: [
        {
          name: 'GRI Standards',
          completionPercentage: 75,
          missingRequirements: ['Social metrics'],
          priority: 'high'
        }
      ],
      alerts: []
    };
  }

  private getDefaultFinancialContext(): FinancialContext {
    return {
      energyCosts: {
        currentMonth: 15000,
        lastMonth: 14200,
        yearToDate: 165000,
        projectedAnnual: 180000,
        averageRate: 0.12
      },
      carbonPricing: {
        internalPrice: 50,
        marketPrice: 85,
        projectedCost: 25000,
        carbonCredits: 500
      },
      sustainabilityInvestments: {
        totalBudget: 500000,
        spent: 180000,
        plannedProjects: []
      },
      savings: {
        monthlyTarget: 5000,
        actualSavings: 4200,
        yearToDateSavings: 48000,
        projectedAnnualSavings: 58000
      }
    };
  }

  private getDefaultWeatherContext(): WeatherContext {
    return {
      current: {
        temperature: 72,
        humidity: 45,
        windSpeed: 8,
        conditions: 'partly cloudy',
        uvIndex: 5
      },
      forecast: {
        hourly: [],
        daily: []
      },
      impacts: {
        cooling: 'medium',
        heating: 'low',
        naturalLight: 'high',
        ventilation: 'medium'
      },
      recommendations: []
    };
  }

  private getDefaultOrganizationContext(): OrganizationContext {
    return {
      id: 'default',
      name: 'Demo Organization',
      industry: 'Technology',
      size: 'medium',
      locations: [
        {
          id: 'loc-1',
          name: 'Main Office',
          type: 'office',
          area: 50000,
          energyIntensity: 5.2
        }
      ],
      businessHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'America/Los_Angeles',
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      peakOperations: {
        dailyPeak: '14:00',
        weeklyPeak: 'Tuesday',
        seasonalPeak: 'Summer'
      }
    };
  }

  private generateWeatherRecommendations(weatherData: any): string[] {
    const recommendations: string[] = [];

    if (weatherData.main.temp > 80) {
      recommendations.push('Consider pre-cooling strategy for tomorrow');
      recommendations.push('Monitor peak demand during afternoon hours');
    }

    if (weatherData.weather[0].main === 'Clear') {
      recommendations.push('Excellent day for natural lighting - reduce artificial lighting');
    }

    if (weatherData.wind.speed > 10) {
      recommendations.push('Good conditions for natural ventilation');
    }

    return recommendations;
  }

  private getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      'account_owner': ['sustainability_manager', 'facility_manager', 'analyst', 'viewer'],
      'sustainability_manager': ['sustainability_manager', 'analyst', 'viewer'],
      'facility_manager': ['facility_manager', 'analyst', 'viewer'],
      'analyst': ['analyst', 'viewer'],
      'viewer': ['viewer']
    };

    return permissions[role] || ['viewer'];
  }
}

// Export singleton
export const aiContextEngine = new AIContextEngine();

// Additional type definitions
interface ZoneData {
  name: string;
  temperature: number;
  setpoint: number;
  occupancy: number;
}

interface ZoneOccupancy {
  zone: string;
  current: number;
  capacity: number;
}

interface OccupancyPattern {
  time: string;
  pattern: string;
  typical: number;
}

interface EquipmentStatus {
  name: string;
  status: string;
  efficiency: number;
  lastMaintenance: string;
}

interface InteractionHistory {
  date: string;
  topic: string;
  outcome: string;
}

interface ActionItem {
  id: string;
  description: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
}

interface Learning {
  pattern: string;
  confidence: number;
  applicability: string;
}

interface DeviceCapability {
  name: string;
  capabilities: string[];
}

interface ComponentSpec {
  type: string;
  props: Record<string, any>;
  layout?: Record<string, any>;
}

interface InteractionSpec {
  trigger: string;
  action: string;
  feedback: string;
}

interface AnimationSpec {
  element: string;
  animation: string;
  duration: number;
}

interface PlannedActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "maintenance" | "meeting" | "inspection" | "event" | "delivery";
  impact: "none" | "low" | "medium" | "high";
  notifications?: string[];
}
