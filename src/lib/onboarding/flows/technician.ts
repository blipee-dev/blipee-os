import { OnboardingFlow } from '@/types/onboarding'
import { UserRole } from '@/types/auth'

export const technicianFlow: OnboardingFlow = {
  id: 'technician_setup',
  role: UserRole.TECHNICIAN,
  estimatedTime: 180, // 3 minutes
  steps: [
    {
      id: 'tech_welcome',
      type: 'contextual_intro',
      timeEstimate: 10,
      required: true,
      content: {
        template: "Welcome {{user_name}}! {{inviter_name}} added you to the {{building_name}} maintenance team.",
        subtitle: "Let's get you set up with the tools you need",
        context: ['inviter_name', 'building_name', 'organization_name']
      }
    },
    {
      id: 'tech_profile',
      type: 'quick_form',
      timeEstimate: 45,
      required: true,
      fields: [
        {
          name: 'specializations',
          type: 'multiple_choice',
          question: 'Your technical specialties?',
          options: [
            { value: 'hvac', label: 'HVAC Systems', icon: '❄️' },
            { value: 'electrical', label: 'Electrical', icon: '⚡' },
            { value: 'plumbing', label: 'Plumbing', icon: '🚿' },
            { value: 'lighting', label: 'Lighting', icon: '💡' },
            { value: 'security', label: 'Security Systems', icon: '🔒' },
            { value: 'building_automation', label: 'BAS/Controls', icon: '🎛️' },
            { value: 'fire_safety', label: 'Fire/Life Safety', icon: '🚨' },
            { value: 'general', label: 'General Maintenance', icon: '🔧' }
          ]
        },
        {
          name: 'experience_years',
          type: 'button_group',
          question: 'Years of experience?',
          options: [
            { value: 'entry', label: '0-2 years' },
            { value: 'mid', label: '3-5 years' },
            { value: 'senior', label: '6-10 years' },
            { value: 'expert', label: '10+ years' }
          ]
        },
        {
          name: 'certifications',
          type: 'text_input',
          question: 'Certifications (optional)',
          placeholder: 'EPA, NATE, OSHA, etc.',
          required: false
        }
      ]
    },
    {
      id: 'work_preferences',
      type: 'quick_form',
      timeEstimate: 30,
      required: true,
      fields: [
        {
          name: 'work_shift',
          type: 'button_group',
          question: 'Primary work shift?',
          options: [
            { value: 'day', label: 'Day (6AM-2PM)', icon: '☀️' },
            { value: 'swing', label: 'Swing (2PM-10PM)', icon: '🌅' },
            { value: 'night', label: 'Night (10PM-6AM)', icon: '🌙' },
            { value: 'rotating', label: 'Rotating', icon: '🔄' }
          ]
        },
        {
          name: 'notification_urgency',
          type: 'visual_select',
          question: 'When should I alert you?',
          options: [
            {
              value: 'all',
              label: 'All issues',
              description: 'Every maintenance request',
              icon: '📣'
            },
            {
              value: 'assigned',
              label: 'Assigned to me',
              description: 'Only my tasks',
              icon: '👤'
            },
            {
              value: 'urgent',
              label: 'Urgent only',
              description: 'Critical issues',
              icon: '🚨'
            }
          ]
        }
      ]
    },
    {
      id: 'building_areas',
      type: 'visual_checklist',
      timeEstimate: 45,
      required: true,
      config: {
        title: "Areas you'll maintain",
        instruction: "Select all that apply",
        categories: [
          {
            name: 'Primary Areas',
            icon: '🏢',
            options: [
              { 
                value: 'mechanical_rooms',
                label: 'Mechanical Rooms',
                impact: 'focus_equipment_monitoring'
              },
              {
                value: 'offices',
                label: 'Office Spaces',
                impact: 'focus_comfort_issues'
              },
              {
                value: 'common_areas',
                label: 'Common Areas',
                impact: 'focus_public_spaces'
              },
              {
                value: 'parking_garage',
                label: 'Parking Areas',
                impact: 'include_parking_systems'
              },
              {
                value: 'roof_exterior',
                label: 'Roof/Exterior',
                impact: 'weather_alerts_enabled'
              },
              {
                value: 'data_centers',
                label: 'IT/Server Rooms',
                impact: 'critical_monitoring'
              }
            ]
          }
        ]
      }
    },
    {
      id: 'equipment_familiarity',
      type: 'quick_form',
      timeEstimate: 30,
      required: false,
      fields: [
        {
          name: 'familiar_brands',
          type: 'text_input',
          question: 'Equipment brands you work with?',
          placeholder: 'Carrier, Trane, Johnson Controls...',
          required: false
        },
        {
          name: 'preferred_tools',
          type: 'text_input',
          question: 'Preferred diagnostic tools?',
          placeholder: 'Fluke meters, HVAC gauges...',
          required: false
        }
      ]
    },
    {
      id: 'mobile_setup',
      type: 'single_choice',
      timeEstimate: 20,
      required: true,
      config: {
        title: "Mobile app preference",
        subtitle: "Get alerts and manage tasks on the go",
        options: [
          {
            value: 'download_now',
            label: 'Set up mobile app',
            description: 'Get the app now',
            features: ['Push notifications', 'Work order management', 'Equipment manuals'],
            recommended: true
          },
          {
            value: 'text_alerts',
            label: 'SMS alerts only',
            description: 'Simple text messages',
            features: ['Critical alerts via SMS'],
            recommended: false
          },
          {
            value: 'email_only',
            label: 'Email only',
            description: 'Desktop focused',
            features: ['Email notifications'],
            recommended: false
          }
        ]
      }
    },
    {
      id: 'tech_insights',
      type: 'ai_insights',
      timeEstimate: 10,
      required: true,
      config: {
        title: "You're all set!",
        insights: [
          {
            type: 'immediate_action',
            template: "I've found {{open_work_orders}} open work orders in your areas"
          },
          {
            type: 'quick_win',
            template: "{{equipment_count}} pieces of equipment are due for PM this week"
          },
          {
            type: 'cost_estimate',
            template: "Quick tip: {{top_issue}} is the most common issue in {{building_name}}"
          }
        ],
        cta: {
          primary: "View Work Orders",
          secondary: "Equipment List"
        }
      }
    }
  ],
  completionActions: [
    {
      type: 'update_profile',
      data: 'tech_specializations',
      message: 'Saving your technical profile...'
    },
    {
      type: 'assign_areas',
      data: 'building_areas',
      message: 'Assigning maintenance areas...'
    },
    {
      type: 'configure_alerts',
      data: 'notification_preferences',
      message: 'Setting up your alerts...'
    },
    {
      type: 'load_work_orders',
      data: null,
      message: 'Loading your work orders...'
    },
    {
      type: 'send_mobile_link',
      data: 'mobile_preference',
      message: 'Sending app download link...'
    }
  ]
}