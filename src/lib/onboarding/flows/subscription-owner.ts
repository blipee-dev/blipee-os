import { OnboardingFlow, CompletionAction } from "@/types/onboarding";
import { UserRole } from "@/types/auth";

export const subscriptionOwnerFlow: OnboardingFlow = {
  id: "subscription_owner_setup",
  role: UserRole.SUBSCRIPTION_OWNER,
  estimatedTime: 120, // 2 minutes
  steps: [
    {
      id: "welcome",
      type: "intro_animation",
      timeEstimate: 5,
      required: true,
      content: {
        title: "Welcome to Blipee OS!",
        subtitle: "Let's get your buildings connected in under 7 minutes",
        animation: "building_intelligence",
      },
    },
    {
      id: "company_essentials",
      type: "quick_form",
      timeEstimate: 30,
      required: true,
      fields: [
        {
          name: "company_name",
          type: "text",
          placeholder: "Acme Corporation",
          validation: {
            required: true,
            minLength: 2,
            message: "Company name is required",
          },
        },
        {
          name: "industry",
          type: "smart_select",
          question: "Industry",
          options: [
            { value: "technology", label: "Technology" },
            { value: "healthcare", label: "Healthcare" },
            { value: "finance", label: "Financial Services" },
            { value: "retail", label: "Retail" },
            { value: "manufacturing", label: "Manufacturing" },
            { value: "education", label: "Education" },
            { value: "real_estate", label: "Real Estate" },
            { value: "hospitality", label: "Hospitality" },
            { value: "government", label: "Government" },
            { value: "other", label: "Other" },
          ],
          aiAssist: true,
        },
        {
          name: "company_size",
          type: "button_group",
          question: "Company size",
          options: [
            { value: "small", label: "1-50", icon: "🏢" },
            { value: "medium", label: "51-200", icon: "🏬" },
            { value: "large", label: "201-1000", icon: "🏙️" },
            { value: "enterprise", label: "1000+", icon: "🌆" },
          ],
        },
      ],
    },
    {
      id: "buildings_quick_add",
      type: "bulk_text_input",
      timeEstimate: 45,
      required: true,
      config: {
        title: "Add your buildings",
        subtitle: "Just names and cities - managers will add details",
        placeholder:
          "Main Office, Chicago\nWarehouse, Detroit\nBranch Office, New York",
        parser: "csv_building_parser",
        minEntries: 1,
        maxEntries: 20,
        format: "Building Name, City",
        example: "Enter each building on a new line",
      },
    },
    {
      id: "invite_managers",
      type: "smart_invite",
      timeEstimate: 40,
      required: false,
      config: {
        title: "Invite your site managers",
        subtitle: "They'll configure building details",
        format: "email@company.com = Building Name",
        smartSuggestions: true,
        bulkPaste: true,
        placeholder:
          "john@company.com = Main Office\nmary@company.com = Warehouse",
        skipOption: {
          label: "I'll do this later",
          consequence: "You'll need to configure buildings yourself",
        },
      },
    },
    {
      id: "subscription_selection",
      type: "single_choice",
      timeEstimate: 10,
      required: true,
      config: {
        title: "Choose your plan",
        subtitle: "Start with 30-day free trial",
        options: [
          {
            value: "starter",
            label: "Starter",
            description: "Perfect for small businesses",
            price: "$49/month",
            features: [
              "Up to 2 buildings",
              "Basic monitoring",
              "5 team members",
            ],
            recommended: false,
          },
          {
            value: "professional",
            label: "Professional",
            description: "Most popular choice",
            price: "$149/month",
            features: [
              "Up to 10 buildings",
              "Advanced AI insights",
              "25 team members",
              "Priority support",
            ],
            recommended: true,
          },
          {
            value: "enterprise",
            label: "Enterprise",
            description: "For large organizations",
            price: "Custom pricing",
            features: [
              "Unlimited buildings",
              "Custom integrations",
              "Unlimited team members",
              "Dedicated support",
            ],
            recommended: false,
          },
        ],
      },
    },
  ],
  completionActions: [
    {
      type: "create_organization",
      data: "form_data",
      message: "Creating your organization...",
    },
    {
      type: "create_buildings",
      data: "buildings_list",
      message: "Setting up your buildings...",
    },
    {
      type: "send_invitations",
      data: "manager_invites",
      message: "Sending invitations...",
    },
    {
      type: "trigger_ai_welcome",
      data: null,
      message:
        "Great! I'm analyzing your building portfolio and will have initial insights ready in a moment.",
    },
  ],
};
