import { OnboardingFlow } from "@/types/onboarding";
import { UserRole } from "@/types/auth";

export const tenantFlow: OnboardingFlow = {
  id: "tenant_setup",
  role: UserRole.TENANT,
  estimatedTime: 120, // 2 minutes
  steps: [
    {
      id: "tenant_welcome",
      type: "intro",
      timeEstimate: 10,
      required: true,
      content: {
        title: "Welcome to {{building_name}}!",
        subtitle:
          "I'm Blipee, your building assistant. Let me help you get comfortable.",
        animation: "building_helper",
      },
    },
    {
      id: "basic_info",
      type: "quick_form",
      timeEstimate: 30,
      required: true,
      fields: [
        {
          name: "unit_number",
          type: "text",
          placeholder: "Suite 405, Apt 12B, etc.",
          question: "Your unit/office number?",
          validation: { required: true },
        },
        {
          name: "occupancy_type",
          type: "button_group",
          question: "Space type?",
          options: [
            { value: "office", label: "Office", icon: "💼" },
            { value: "retail", label: "Retail", icon: "🛍️" },
            { value: "residential", label: "Residential", icon: "🏠" },
            { value: "other", label: "Other", icon: "🏢" },
          ],
        },
      ],
    },
    {
      id: "comfort_preferences",
      type: "visual_select",
      timeEstimate: 20,
      required: true,
      config: {
        title: "Your comfort preference?",
        subtitle: "I'll work with building management to optimize",
        options: [
          {
            value: "cooler",
            label: "Cooler",
            description: "I prefer it chilly",
            icon: "❄️",
          },
          {
            value: "moderate",
            label: "Moderate",
            description: "Standard temperature",
            icon: "😊",
          },
          {
            value: "warmer",
            label: "Warmer",
            description: "I like it warm",
            icon: "☀️",
          },
        ],
      },
    },
    {
      id: "contact_preferences",
      type: "quick_form",
      timeEstimate: 20,
      required: true,
      fields: [
        {
          name: "preferred_contact",
          type: "button_group",
          question: "How should I reach you?",
          options: [
            { value: "email", label: "Email", icon: "📧" },
            { value: "text", label: "Text/SMS", icon: "💬" },
            { value: "phone", label: "Phone call", icon: "📞" },
          ],
        },
        {
          name: "notification_types",
          type: "multiple_choice",
          question: "Notify me about:",
          options: [
            { value: "maintenance", label: "Scheduled maintenance" },
            { value: "emergencies", label: "Building emergencies" },
            { value: "events", label: "Building events" },
            { value: "savings", label: "Energy saving tips" },
          ],
        },
      ],
    },
    {
      id: "quick_needs",
      type: "single_choice",
      timeEstimate: 15,
      required: false,
      config: {
        title: "Need help with something now?",
        subtitle: "I can assist right away",
        options: [
          {
            value: "report_issue",
            label: "Report an issue",
            description: "Something needs fixing",
            icon: "🔧",
          },
          {
            value: "building_info",
            label: "Building information",
            description: "Hours, contacts, amenities",
            icon: "ℹ️",
          },
          {
            value: "how_to",
            label: "How do I...?",
            description: "Get help with building features",
            icon: "❓",
          },
          {
            value: "nothing_now",
            label: "All good for now",
            description: "I'll explore on my own",
            icon: "👍",
          },
        ],
      },
    },
    {
      id: "tenant_complete",
      type: "ai_insights",
      timeEstimate: 10,
      required: true,
      config: {
        title: "You're all set!",
        insights: [
          {
            type: "immediate_action",
            template:
              "I'll keep {{unit_number}} at your preferred {{comfort_preference}} comfort level",
          },
          {
            type: "quick_win",
            template:
              "Pro tip: Report issues through me for {{response_time}}% faster response",
          },
          {
            type: "cost_estimate",
            template: "Chat with me anytime - just say 'Hey Blipee!'",
          },
        ],
        cta: {
          primary: "Explore Building",
          secondary: "Report Issue",
        },
      },
    },
  ],
  completionActions: [
    {
      type: "create_tenant_profile",
      data: "tenant_info",
      message: "Setting up your profile...",
    },
    {
      type: "register_unit",
      data: "unit_details",
      message: "Registering your space...",
    },
    {
      type: "configure_comfort",
      data: "preferences",
      message: "Applying comfort settings...",
    },
    {
      type: "setup_notifications",
      data: "contact_preferences",
      message: "Configuring notifications...",
    },
    {
      type: "handle_immediate_need",
      data: "quick_need",
      message: "Processing your request...",
    },
  ],
};
