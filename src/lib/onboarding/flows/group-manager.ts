import { OnboardingFlow } from '@/types/onboarding'
import { UserRole } from '@/types/auth'

export const groupManagerFlow: OnboardingFlow = {
  id: 'group_manager_setup',
  role: UserRole.GROUP_MANAGER,
  estimatedTime: 240, // 4 minutes
  steps: [
    {
      id: 'group_welcome',
      type: 'contextual_intro',
      timeEstimate: 10,
      required: true,
      content: {
        template: "Hi {{user_name}}! {{inviter_name}} invited you to manage groups at {{building_name}}.",
        subtitle: "Let's set up your team management tools",
        context: ['inviter_name', 'building_name', 'organization_name']
      }
    },
    {
      id: 'group_info',
      type: 'quick_form',
      timeEstimate: 60,
      required: true,
      fields: [
        {
          name: 'department',
          type: 'smart_select',
          question: 'Your department/group?',
          placeholder: 'Sales, Engineering, HR...',
          validation: { required: true },
          aiAssist: true
        },
        {
          name: 'team_size',
          type: 'number_slider',
          question: 'Team size?',
          range: { min: 1, max: 500 },
          quickOptions: [5, 10, 25, 50, 100]
        },
        {
          name: 'group_location',
          type: 'text_input',
          question: 'Primary location/floor?',
          placeholder: '3rd Floor, East Wing',
          validation: { required: true }
        }
      ]
    },
    {
      id: 'space_requirements',
      type: 'priority_matrix',
      timeEstimate: 45,
      required: true,
      config: {
        question: "What matters most to your team?",
        instruction: "Drag to rank top 3 priorities",
        options: [
          {
            id: 'comfort',
            label: 'Temperature comfort',
            icon: '🌡️',
            aiContext: 'Monitor and optimize HVAC zones'
          },
          {
            id: 'lighting',
            label: 'Good lighting',
            icon: '💡',
            aiContext: 'Track lighting levels and quality'
          },
          {
            id: 'air_quality',
            label: 'Fresh air',
            icon: '💨',
            aiContext: 'Monitor CO2 and ventilation'
          },
          {
            id: 'quiet',
            label: 'Noise control',
            icon: '🔇',
            aiContext: 'Track acoustic comfort'
          },
          {
            id: 'meeting_rooms',
            label: 'Meeting space availability',
            icon: '📅',
            aiContext: 'Optimize room scheduling'
          },
          {
            id: 'sustainability',
            label: 'Green initiatives',
            icon: '🌱',
            aiContext: 'Track team sustainability metrics'
          }
        ],
        maxPriorities: 3
      }
    },
    {
      id: 'operational_needs',
      type: 'visual_checklist',
      timeEstimate: 45,
      required: true,
      config: {
        title: "Your team's needs",
        instruction: "Select all that apply",
        categories: [
          {
            name: 'Work Patterns',
            icon: '⏰',
            options: [
              { 
                value: 'standard_hours',
                label: '9-5 schedule',
                impact: 'optimize_comfort_business_hours'
              },
              {
                value: 'flexible_hours',
                label: 'Flexible schedule',
                impact: 'extended_comfort_hours'
              },
              {
                value: '24_7_operations',
                label: '24/7 operations',
                impact: 'continuous_monitoring'
              },
              {
                value: 'hybrid_work',
                label: 'Hybrid workforce',
                impact: 'occupancy_based_control'
              }
            ]
          },
          {
            name: 'Special Requirements',
            icon: '⚡',
            options: [
              {
                value: 'high_compute',
                label: 'High computing needs',
                impact: 'monitor_power_cooling'
              },
              {
                value: 'sensitive_equipment',
                label: 'Sensitive equipment',
                impact: 'stability_monitoring'
              },
              {
                value: 'customer_facing',
                label: 'Customer areas',
                impact: 'premium_comfort_zones'
              },
              {
                value: 'secure_areas',
                label: 'Secure zones',
                impact: 'access_monitoring'
              }
            ]
          }
        ]
      }
    },
    {
      id: 'team_contacts',
      type: 'smart_invite',
      timeEstimate: 45,
      required: false,
      config: {
        title: "Add key team contacts",
        subtitle: "They'll receive important building updates",
        format: "email@company.com = Name/Role",
        smartSuggestions: false,
        bulkPaste: true,
        placeholder: "admin@company.com = Office Admin\nit@company.com = IT Lead",
        skipOption: {
          label: "Just me for now",
          consequence: "You can add team members later"
        }
      }
    },
    {
      id: 'reporting_preferences',
      type: 'quick_form',
      timeEstimate: 30,
      required: true,
      fields: [
        {
          name: 'report_frequency',
          type: 'button_group',
          question: 'How often do you want reports?',
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'on_demand', label: 'On-demand only' }
          ]
        },
        {
          name: 'metrics_interest',
          type: 'multiple_choice',
          question: 'Metrics to track?',
          options: [
            { value: 'comfort_scores', label: 'Comfort scores' },
            { value: 'energy_usage', label: 'Energy consumption' },
            { value: 'space_utilization', label: 'Space usage' },
            { value: 'maintenance_requests', label: 'Issue reports' },
            { value: 'sustainability', label: 'Green metrics' }
          ]
        }
      ]
    },
    {
      id: 'budget_awareness',
      type: 'single_choice',
      timeEstimate: 15,
      required: false,
      config: {
        title: "Budget visibility",
        subtitle: "Track your group's facility costs?",
        options: [
          {
            value: 'full_visibility',
            label: 'Yes, show costs',
            description: 'See energy and space costs',
            features: ['Monthly cost reports', 'Budget tracking', 'Savings opportunities'],
            recommended: true
          },
          {
            value: 'no_costs',
            label: 'No, just operations',
            description: 'Focus on comfort and function',
            features: ['Operational metrics only'],
            recommended: false
          }
        ]
      }
    },
    {
      id: 'group_insights',
      type: 'ai_insights',
      timeEstimate: 10,
      required: true,
      config: {
        title: "Here's what I'll do for your team:",
        insights: [
          {
            type: 'immediate_action',
            template: "I'll monitor {{group_location}} for optimal {{top_priority}}"
          },
          {
            type: 'quick_win',
            template: "Based on {{team_size}} people, I can save {{estimated_savings}}% on energy during off-hours"
          },
          {
            type: 'cost_estimate',
            template: "Your team's space typically costs ${{cost_per_person}}/person monthly to operate"
          }
        ],
        cta: {
          primary: "View Team Dashboard",
          secondary: "Schedule Setup Call"
        }
      }
    }
  ],
  completionActions: [
    {
      type: 'create_group',
      data: 'group_info',
      message: 'Creating your group profile...'
    },
    {
      type: 'configure_zones',
      data: 'space_requirements',
      message: 'Configuring comfort zones...'
    },
    {
      type: 'setup_monitoring',
      data: 'priorities',
      message: 'Setting up team monitoring...'
    },
    {
      type: 'invite_team',
      data: 'team_contacts',
      message: 'Inviting team members...'
    },
    {
      type: 'schedule_reports',
      data: 'reporting_preferences',
      message: 'Scheduling your reports...'
    }
  ]
}