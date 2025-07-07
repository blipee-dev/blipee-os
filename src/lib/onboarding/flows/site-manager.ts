import { OnboardingFlow } from "@/types/onboarding";
import { UserRole } from "@/types/auth";

export const siteManagerFlow: OnboardingFlow = {
  id: "site_manager_setup",
  role: UserRole.SITE_MANAGER,
  estimatedTime: 300, // 5 minutes
  steps: [
    {
      id: "personalized_welcome",
      type: "contextual_intro",
      timeEstimate: 10,
      required: true,
      content: {
        template:
          "Hi {{user_name}}! {{inviter_name}} invited you to manage {{building_name}}. I'm Blipee, your AI assistant.",
        subtitle: "Let's get your building set up in just 5 minutes",
        context: ["inviter_name", "building_name", "organization_name"],
      },
    },
    {
      id: "profile_setup",
      type: "quick_profile",
      timeEstimate: 30,
      required: true,
      fields: [
        {
          name: "experience_level",
          type: "button_select",
          question: "Your facility management experience?",
          options: [
            {
              value: "expert",
              label: "5+ years",
              description: "I know buildings inside out",
              aiPersonality: "technical_peer",
            },
            {
              value: "experienced",
              label: "2-5 years",
              description: "I have solid experience",
              aiPersonality: "helpful_guide",
            },
            {
              value: "new",
              label: "New to this",
              description: "Guide me through",
              aiPersonality: "patient_teacher",
            },
          ],
        },
        {
          name: "notification_preference",
          type: "visual_select",
          question: "How should I keep you informed?",
          options: [
            {
              value: "proactive",
              label: "Stay ahead",
              description: "Alert me before issues arise",
              icon: "🔮",
            },
            {
              value: "reactive",
              label: "When needed",
              description: "Only when action required",
              icon: "🔔",
            },
            {
              value: "summary",
              label: "Daily digest",
              description: "Summarize each day",
              icon: "📅",
            },
          ],
        },
      ],
    },
    {
      id: "building_basics",
      type: "smart_building_form",
      timeEstimate: 60,
      required: true,
      aiAssistance: {
        enabled: true,
        type: "auto_complete",
        context: "building_address",
      },
      fields: [
        {
          name: "exact_size",
          type: "number_slider",
          question: "Building size?",
          unit: "sq ft",
          range: { min: 1000, max: 1000000 },
          quickOptions: [10000, 25000, 50000, 100000, 250000],
        },
        {
          name: "floors",
          type: "visual_counter",
          question: "Number of floors?",
          range: { min: 1, max: 50 },
        },
        {
          name: "age_systems",
          type: "timeline_select",
          question: "When was it built/renovated?",
          options: [
            {
              value: "brand_new",
              label: "2020+",
              description: "Latest technology",
              systems: ["led", "smart_hvac", "iot_ready"],
            },
            {
              value: "modern",
              label: "2010-2019",
              description: "Modern systems",
              systems: ["mixed_lighting", "digital_controls"],
            },
            {
              value: "aging",
              label: "2000-2009",
              description: "Needs updates",
              systems: ["fluorescent", "basic_digital"],
            },
            {
              value: "vintage",
              label: "Pre-2000",
              description: "Legacy systems",
              systems: ["legacy_systems", "manual_controls"],
            },
          ],
        },
        {
          name: "occupancy_type",
          type: "multiple_choice",
          question: "What's in your building?",
          options: [
            { value: "offices", label: "Office spaces", icon: "💼" },
            { value: "meeting_rooms", label: "Conference rooms", icon: "👥" },
            { value: "retail", label: "Retail/customer areas", icon: "🛍️" },
            { value: "warehouse", label: "Storage/warehouse", icon: "📦" },
            { value: "manufacturing", label: "Production areas", icon: "🏭" },
            { value: "data_center", label: "Server/IT rooms", icon: "🖥️" },
            { value: "cafeteria", label: "Kitchen/cafeteria", icon: "🍽️" },
            { value: "parking", label: "Parking garage", icon: "🚗" },
          ],
        },
      ],
    },
    {
      id: "pain_points",
      type: "priority_matrix",
      timeEstimate: 45,
      required: true,
      config: {
        question: "What are your biggest challenges?",
        instruction: "Drag to prioritize (top 3)",
        options: [
          {
            id: "energy_costs",
            label: "High energy bills",
            icon: "💰",
            aiContext: "Focus on efficiency and cost reduction",
          },
          {
            id: "comfort",
            label: "Temperature complaints",
            icon: "🌡️",
            aiContext: "Prioritize HVAC optimization and comfort zones",
          },
          {
            id: "maintenance",
            label: "Equipment failures",
            icon: "🔧",
            aiContext: "Set up predictive maintenance alerts",
          },
          {
            id: "compliance",
            label: "Meeting regulations",
            icon: "📋",
            aiContext: "Track compliance metrics and deadlines",
          },
          {
            id: "sustainability",
            label: "Going green",
            icon: "🌱",
            aiContext: "Focus on sustainable practices and reporting",
          },
          {
            id: "data_visibility",
            label: "Lack of insights",
            icon: "📊",
            aiContext: "Provide comprehensive analytics and reporting",
          },
        ],
        maxPriorities: 3,
      },
    },
    {
      id: "systems_baseline",
      type: "visual_checklist",
      timeEstimate: 60,
      required: true,
      config: {
        title: "What's already upgraded?",
        instruction: "Check all that apply - I won't suggest these again",
        categories: [
          {
            name: "Lighting",
            icon: "💡",
            options: [
              {
                value: "led_installed",
                label: "LED lighting",
                impact: "exclude_led_recommendations",
              },
              {
                value: "sensors_installed",
                label: "Occupancy sensors",
                impact: "exclude_sensor_recommendations",
              },
              {
                value: "daylight_harvesting",
                label: "Daylight controls",
                impact: "exclude_daylight_recommendations",
              },
              {
                value: "smart_controls",
                label: "Smart lighting system",
                impact: "advanced_lighting_exists",
              },
            ],
          },
          {
            name: "HVAC",
            icon: "❄️",
            options: [
              {
                value: "smart_thermostats",
                label: "Smart thermostats",
                impact: "exclude_thermostat_recommendations",
              },
              {
                value: "vfd_installed",
                label: "Variable speed drives",
                impact: "exclude_vfd_recommendations",
              },
              {
                value: "building_automation",
                label: "BAS/BMS system",
                impact: "advanced_integration_available",
              },
              {
                value: "high_efficiency",
                label: "High-efficiency equipment",
                impact: "exclude_equipment_upgrade",
              },
            ],
          },
          {
            name: "Energy",
            icon: "⚡",
            options: [
              {
                value: "solar_panels",
                label: "Solar installed",
                impact: "exclude_solar_recommendations",
                followUp: {
                  type: "number",
                  question: "System size (kW)?",
                },
              },
              {
                value: "battery_storage",
                label: "Battery backup",
                impact: "demand_response_ready",
              },
              {
                value: "sub_metering",
                label: "Sub-metering installed",
                impact: "detailed_monitoring_available",
              },
              {
                value: "power_monitoring",
                label: "Real-time monitoring",
                impact: "advanced_analytics_possible",
              },
            ],
          },
        ],
      },
    },
    {
      id: "quick_team",
      type: "role_assignment",
      timeEstimate: 45,
      required: false,
      config: {
        title: "Add your key team members",
        subtitle: "They'll help manage day-to-day operations",
        roles: [
          {
            role: "technician",
            label: "Maintenance Tech",
            icon: "🔧",
            placeholder: "tech@company.com",
            description: "Handles repairs and maintenance",
          },
          {
            role: "facility_manager",
            label: "Facility Manager",
            icon: "👔",
            placeholder: "manager@company.com",
            description: "Day-to-day operations",
          },
          {
            role: "admin",
            label: "Office Manager",
            icon: "💼",
            placeholder: "admin@company.com",
            description: "Administrative tasks",
          },
        ],
        skipOption: {
          label: "Just me for now",
          consequence: "You can add team members anytime",
        },
      },
    },
    {
      id: "instant_value",
      type: "ai_insights",
      timeEstimate: 30,
      required: true,
      config: {
        title: "Here's what I found:",
        insights: [
          {
            type: "cost_estimate",
            template:
              "Based on your {{size}} sq ft {{building_type}}, you're likely spending ${{estimated_monthly}} on energy",
          },
          {
            type: "quick_win",
            template:
              "I can help reduce that by {{savings_percent}}% with {{top_recommendation}}",
          },
          {
            type: "immediate_action",
            template: "I'll start monitoring {{priority_system}} right away",
          },
        ],
        cta: {
          primary: "Start Monitoring",
          secondary: "Tour Dashboard",
        },
      },
    },
  ],
  completionActions: [
    {
      type: "update_building",
      data: "building_details",
      message: "Saving building configuration...",
    },
    {
      type: "create_baseline",
      data: "systems_baseline",
      message: "Recording your current systems...",
    },
    {
      type: "setup_monitoring",
      data: "priority_systems",
      message: "Setting up real-time monitoring...",
    },
    {
      type: "send_team_invites",
      data: "team_members",
      message: "Inviting your team...",
    },
    {
      type: "generate_insights",
      data: null,
      message: "Analyzing your building for optimization opportunities...",
    },
  ],
};
