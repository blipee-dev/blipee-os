export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: "select" | "multiselect" | "number" | "boolean" | "text";
  options?: Array<{ value: string; label: string; description?: string }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  dependsOn?: {
    step: string;
    value: any;
  };
  estimatedTime: number; // seconds
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export const SYSTEM_ROLES: UserRole[] = [
  {
    id: "account_owner",
    name: "Account Owner",
    description: "Full access to all features, billing, and team management",
    permissions: ["*"],
  },
  {
    id: "sustainability_manager",
    name: "Sustainability Manager",
    description: "Manage targets, compliance, and sustainability initiatives",
    permissions: [
      "targets.create",
      "targets.edit",
      "targets.delete",
      "compliance.view",
      "compliance.manage",
      "reports.create",
      "reports.export",
      "emissions.view",
      "emissions.edit",
    ],
  },
  {
    id: "facility_manager",
    name: "Facility Manager",
    description: "Manage buildings, equipment, and operational data",
    permissions: [
      "buildings.view",
      "buildings.edit",
      "equipment.view",
      "equipment.manage",
      "emissions.view",
      "emissions.edit",
      "reports.view",
    ],
  },
  {
    id: "analyst",
    name: "Analyst",
    description: "View data, create reports, and analyze trends",
    permissions: [
      "emissions.view",
      "reports.view",
      "reports.create",
      "analytics.view",
      "targets.view",
    ],
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to dashboards and reports",
    permissions: ["emissions.view", "reports.view", "targets.view"],
  },
];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  // Step 1: Organization Type (30 seconds)
  {
    id: "org_type",
    title: "What type of organization are you?",
    description: "This helps us customize your sustainability journey",
    type: "select",
    options: [
      {
        value: "corporate",
        label: "Corporate/Enterprise",
        description: "Multi-location businesses",
      },
      {
        value: "manufacturing",
        label: "Manufacturing",
        description: "Production facilities",
      },
      {
        value: "real_estate",
        label: "Real Estate",
        description: "Property management",
      },
      {
        value: "hospitality",
        label: "Hospitality",
        description: "Hotels, restaurants",
      },
      {
        value: "healthcare",
        label: "Healthcare",
        description: "Hospitals, clinics",
      },
      {
        value: "education",
        label: "Education",
        description: "Schools, universities",
      },
      {
        value: "government",
        label: "Government",
        description: "Public sector",
      },
      {
        value: "nonprofit",
        label: "Non-Profit",
        description: "NGOs, foundations",
      },
    ],
    validation: { required: true },
    estimatedTime: 30,
  },

  // Step 2: Organization Size (20 seconds)
  {
    id: "org_size",
    title: "How large is your organization?",
    description: "Number of employees",
    type: "select",
    options: [
      { value: "1-50", label: "Small (1-50)" },
      { value: "51-250", label: "Medium (51-250)" },
      { value: "251-1000", label: "Large (251-1,000)" },
      { value: "1001-5000", label: "Enterprise (1,001-5,000)" },
      { value: "5000+", label: "Global (5,000+)" },
    ],
    validation: { required: true },
    estimatedTime: 20,
  },

  // Step 3: Number of Locations (20 seconds)
  {
    id: "locations",
    title: "How many locations do you operate?",
    description: "Include offices, facilities, stores, etc.",
    type: "select",
    options: [
      { value: "1", label: "Single location" },
      { value: "2-5", label: "2-5 locations" },
      { value: "6-20", label: "6-20 locations" },
      { value: "21-50", label: "21-50 locations" },
      { value: "50+", label: "50+ locations" },
    ],
    validation: { required: true },
    estimatedTime: 20,
  },

  // Step 4: Primary Goals (30 seconds)
  {
    id: "primary_goals",
    title: "What are your main sustainability goals?",
    description: "Select all that apply",
    type: "multiselect",
    options: [
      { value: "carbon_neutral", label: "Achieve Carbon Neutrality" },
      { value: "net_zero", label: "Reach Net Zero" },
      { value: "compliance", label: "Meet Compliance Requirements" },
      { value: "cost_reduction", label: "Reduce Energy Costs" },
      { value: "reporting", label: "Improve ESG Reporting" },
      { value: "certification", label: "Obtain Certifications (LEED, BREEAM)" },
      { value: "investor_requirements", label: "Meet Investor Requirements" },
    ],
    validation: { required: true },
    estimatedTime: 30,
  },

  // Step 5: Current Tracking (25 seconds)
  {
    id: "current_tracking",
    title: "Do you currently track emissions?",
    description: "How do you manage sustainability data today?",
    type: "select",
    options: [
      { value: "none", label: "Not tracking yet" },
      { value: "spreadsheets", label: "Using spreadsheets" },
      { value: "basic_software", label: "Basic software" },
      { value: "advanced_platform", label: "Advanced platform" },
    ],
    validation: { required: true },
    estimatedTime: 25,
  },

  // Step 6: Emission Scopes (30 seconds)
  {
    id: "emission_scopes",
    title: "Which emission scopes will you track?",
    description: "Select all that apply",
    type: "multiselect",
    options: [
      {
        value: "scope1",
        label: "Scope 1",
        description: "Direct emissions (vehicles, facilities)",
      },
      {
        value: "scope2",
        label: "Scope 2",
        description: "Electricity and energy",
      },
      {
        value: "scope3",
        label: "Scope 3",
        description: "Supply chain and indirect",
      },
    ],
    validation: { required: true },
    estimatedTime: 30,
  },

  // Step 7: Data Sources (40 seconds)
  {
    id: "data_sources",
    title: "Where is your emissions data?",
    description: "Select all sources you want to connect",
    type: "multiselect",
    options: [
      { value: "utility_bills", label: "Utility Bills (PDF/Excel)" },
      { value: "fleet_data", label: "Fleet Management Systems" },
      { value: "travel_expenses", label: "Travel & Expense Reports" },
      { value: "erp_systems", label: "ERP Systems (SAP, Oracle)" },
      { value: "iot_sensors", label: "IoT Sensors & Building Systems" },
      { value: "manual_entry", label: "Manual Data Entry" },
    ],
    estimatedTime: 40,
  },

  // Step 8: Compliance Standards (35 seconds)
  {
    id: "compliance_standards",
    title: "Which standards do you need to comply with?",
    description: "Select all that apply",
    type: "multiselect",
    options: [
      { value: "ghg_protocol", label: "GHG Protocol" },
      { value: "sbti", label: "Science Based Targets (SBTi)" },
      { value: "tcfd", label: "TCFD" },
      { value: "cdp", label: "CDP" },
      { value: "gri", label: "GRI Standards" },
      { value: "iso14001", label: "ISO 14001" },
      { value: "eu_taxonomy", label: "EU Taxonomy" },
    ],
    estimatedTime: 35,
  },

  // Step 9: Target Year (20 seconds)
  {
    id: "target_year",
    title: "When do you aim to achieve your main goal?",
    description: "Select your target year",
    type: "select",
    options: [
      { value: "2025", label: "2025" },
      { value: "2027", label: "2027" },
      { value: "2030", label: "2030" },
      { value: "2035", label: "2035" },
      { value: "2040", label: "2040" },
      { value: "2050", label: "2050" },
    ],
    validation: { required: true },
    estimatedTime: 20,
  },

  // Step 10: Budget Range (25 seconds)
  {
    id: "budget_range",
    title: "What's your annual sustainability budget?",
    description: "This helps us recommend appropriate solutions",
    type: "select",
    options: [
      { value: "under_50k", label: "Under $50,000" },
      { value: "50k_200k", label: "$50,000 - $200,000" },
      { value: "200k_500k", label: "$200,000 - $500,000" },
      { value: "500k_1m", label: "$500,000 - $1M" },
      { value: "over_1m", label: "Over $1M" },
    ],
    estimatedTime: 25,
  },

  // Step 11: Team Size (20 seconds)
  {
    id: "team_size",
    title: "How many people will use blipee?",
    description: "We'll help you set up the right roles",
    type: "select",
    options: [
      { value: "1-5", label: "1-5 users" },
      { value: "6-20", label: "6-20 users" },
      { value: "21-50", label: "21-50 users" },
      { value: "50+", label: "50+ users" },
    ],
    validation: { required: true },
    estimatedTime: 20,
  },

  // Step 12: Immediate Actions (30 seconds)
  {
    id: "immediate_actions",
    title: "What would you like to do first?",
    description: "We'll prioritize these features",
    type: "multiselect",
    options: [
      { value: "upload_bills", label: "Upload utility bills" },
      { value: "set_targets", label: "Set emission targets" },
      { value: "invite_team", label: "Invite team members" },
      { value: "connect_systems", label: "Connect data sources" },
      { value: "generate_report", label: "Generate first report" },
    ],
    estimatedTime: 30,
  },
];

// Total estimated time: 330 seconds (5.5 minutes)
// With buffer and transitions: ~7 minutes

export class OnboardingOrchestrator {
  private responses: Map<string, any> = new Map();
  private startTime: number = Date.now();

  getCurrentStep(stepIndex: number): OnboardingStep | null {
    if (stepIndex >= ONBOARDING_STEPS.length) return null;

    const step = ONBOARDING_STEPS[stepIndex];

    // Check dependencies
    if (step.dependsOn) {
      const dependencyValue = this.responses.get(step.dependsOn.step);
      if (dependencyValue !== step.dependsOn.value) {
        // Skip this step
        return this.getCurrentStep(stepIndex + 1);
      }
    }

    return step;
  }

  recordResponse(stepId: string, value: any) {
    this.responses.set(stepId, value);
  }

  getProgress(): {
    percentage: number;
    timeElapsed: number;
    estimatedRemaining: number;
  } {
    const completedSteps = this.responses.size;
    const totalSteps = ONBOARDING_STEPS.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    const timeElapsed = Math.round((Date.now() - this.startTime) / 1000);
    const avgTimePerStep =
      completedSteps > 0 ? timeElapsed / completedSteps : 30;
    const remainingSteps = totalSteps - completedSteps;
    const estimatedRemaining = Math.round(remainingSteps * avgTimePerStep);

    return { percentage, timeElapsed, estimatedRemaining };
  }

  generateConfiguration() {
    return {
      organization: {
        type: this.responses.get("org_type"),
        size: this.responses.get("org_size"),
        locations: this.responses.get("locations"),
        team_size: this.responses.get("team_size"),
      },
      sustainability: {
        goals: this.responses.get("primary_goals"),
        target_year: this.responses.get("target_year"),
        emission_scopes: this.responses.get("emission_scopes"),
        current_tracking: this.responses.get("current_tracking"),
      },
      data: {
        sources: this.responses.get("data_sources"),
        compliance: this.responses.get("compliance_standards"),
      },
      preferences: {
        budget: this.responses.get("budget_range"),
        immediate_actions: this.responses.get("immediate_actions"),
      },
    };
  }
}
