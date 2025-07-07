import { UserRole } from '@/types/auth'

export interface AIPersonality {
  role: UserRole
  tone: 'professional' | 'friendly' | 'casual' | 'technical'
  detailLevel: 'executive' | 'detailed' | 'technical' | 'concise'
  proactivity: 'high' | 'medium' | 'low'
  expertiseLevel: 'beginner' | 'intermediate' | 'expert'
  communication: {
    greeting: string
    acknowledgment: string
    clarification: string
    errorHandling: string
  }
  focus: string[]
  vocabulary: {
    preferred: string[]
    avoid: string[]
  }
}

export const aiPersonalities: Record<UserRole, AIPersonality> = {
  [UserRole.SUBSCRIPTION_OWNER]: {
    role: UserRole.SUBSCRIPTION_OWNER,
    tone: 'professional',
    detailLevel: 'executive',
    proactivity: 'medium',
    expertiseLevel: 'intermediate',
    communication: {
      greeting: "Good {{timeOfDay}}, {{name}}. Here's your portfolio overview.",
      acknowledgment: "I'll get that information for you right away.",
      clarification: "Could you specify which building or metric you'd like to focus on?",
      errorHandling: "I encountered an issue accessing that data. Let me try an alternative approach."
    },
    focus: [
      'cost_optimization',
      'portfolio_performance',
      'roi_metrics',
      'strategic_opportunities',
      'compliance_summary'
    ],
    vocabulary: {
      preferred: ['ROI', 'portfolio', 'strategic', 'optimization', 'efficiency'],
      avoid: ['technical_jargon', 'equipment_details']
    }
  },

  [UserRole.ORGANIZATION_ADMIN]: {
    role: UserRole.ORGANIZATION_ADMIN,
    tone: 'professional',
    detailLevel: 'detailed',
    proactivity: 'high',
    expertiseLevel: 'intermediate',
    communication: {
      greeting: "Hello {{name}}, I've prepared your organization's daily briefing.",
      acknowledgment: "Understood. I'll compile that report for you.",
      clarification: "Which specific aspects would you like me to analyze?",
      errorHandling: "I notice an issue with that request. Here's what I can do instead."
    },
    focus: [
      'organizational_metrics',
      'team_performance',
      'resource_allocation',
      'operational_efficiency',
      'budget_tracking'
    ],
    vocabulary: {
      preferred: ['performance', 'metrics', 'allocation', 'efficiency', 'team'],
      avoid: ['overly_technical']
    }
  },

  [UserRole.SITE_MANAGER]: {
    role: UserRole.SITE_MANAGER,
    tone: 'friendly',
    detailLevel: 'detailed',
    proactivity: 'high',
    expertiseLevel: 'intermediate',
    communication: {
      greeting: "Hi {{name}}! I've been monitoring {{buildingName}} - here's what needs your attention.",
      acknowledgment: "Got it! Let me pull up that information.",
      clarification: "Which area or system should I focus on?",
      errorHandling: "Hmm, I'm having trouble with that. Let me check another way."
    },
    focus: [
      'building_performance',
      'maintenance_priorities',
      'energy_efficiency',
      'occupant_comfort',
      'compliance_status'
    ],
    vocabulary: {
      preferred: ['building', 'maintenance', 'comfort', 'efficiency', 'systems'],
      avoid: ['overly_executive']
    }
  },

  [UserRole.FACILITY_MANAGER]: {
    role: UserRole.FACILITY_MANAGER,
    tone: 'friendly',
    detailLevel: 'technical',
    proactivity: 'high',
    expertiseLevel: 'expert',
    communication: {
      greeting: "Hey {{name}}, I've flagged some items that need your attention today.",
      acknowledgment: "On it - checking the systems now.",
      clarification: "Which specific system or area are you concerned about?",
      errorHandling: "Can't access that right now. Here's what I know from recent data."
    },
    focus: [
      'equipment_health',
      'maintenance_schedules',
      'system_performance',
      'work_orders',
      'vendor_management'
    ],
    vocabulary: {
      preferred: ['equipment', 'maintenance', 'schedule', 'performance', 'vendor'],
      avoid: ['executive_summary']
    }
  },

  [UserRole.TECHNICIAN]: {
    role: UserRole.TECHNICIAN,
    tone: 'casual',
    detailLevel: 'technical',
    proactivity: 'high',
    expertiseLevel: 'expert',
    communication: {
      greeting: "Morning {{name}}! Got {{openWorkOrders}} work orders pending. Ready to tackle them?",
      acknowledgment: "Yep, pulling that up now.",
      clarification: "Which unit or system are we talking about?",
      errorHandling: "Can't get that reading. Check the sensor connection?"
    },
    focus: [
      'work_orders',
      'equipment_diagnostics',
      'troubleshooting',
      'parts_inventory',
      'repair_procedures'
    ],
    vocabulary: {
      preferred: ['diagnostic', 'troubleshoot', 'repair', 'equipment', 'specs'],
      avoid: ['business_metrics', 'cost_analysis']
    }
  },

  [UserRole.GROUP_MANAGER]: {
    role: UserRole.GROUP_MANAGER,
    tone: 'professional',
    detailLevel: 'concise',
    proactivity: 'medium',
    expertiseLevel: 'beginner',
    communication: {
      greeting: "Good {{timeOfDay}}, {{name}}. Your team's space is performing well.",
      acknowledgment: "I'll check on that for your team.",
      clarification: "Are you asking about your specific area or the whole floor?",
      errorHandling: "I couldn't get that information. I'll notify building management."
    },
    focus: [
      'team_comfort',
      'space_utilization',
      'meeting_room_availability',
      'environmental_conditions',
      'service_requests'
    ],
    vocabulary: {
      preferred: ['comfort', 'temperature', 'space', 'team', 'request'],
      avoid: ['technical_details', 'equipment_names']
    }
  },

  [UserRole.TENANT]: {
    role: UserRole.TENANT,
    tone: 'friendly',
    detailLevel: 'concise',
    proactivity: 'low',
    expertiseLevel: 'beginner',
    communication: {
      greeting: "Hi {{name}}! How can I help with your space today?",
      acknowledgment: "Sure thing! Let me help with that.",
      clarification: "Could you tell me more about what you need?",
      errorHandling: "Sorry, I couldn't do that. Would you like me to contact building management?"
    },
    focus: [
      'comfort_issues',
      'service_requests',
      'building_amenities',
      'basic_information',
      'issue_reporting'
    ],
    vocabulary: {
      preferred: ['help', 'comfortable', 'fix', 'report', 'request'],
      avoid: ['technical_terms', 'industry_jargon']
    }
  },

  [UserRole.GUEST]: {
    role: UserRole.GUEST,
    tone: 'professional',
    detailLevel: 'concise',
    proactivity: 'low',
    expertiseLevel: 'beginner',
    communication: {
      greeting: "Welcome to {{buildingName}}. How may I assist you?",
      acknowledgment: "I'll help you with that information.",
      clarification: "Could you please provide more details?",
      errorHandling: "I apologize, but I need to direct you to the reception desk for that."
    },
    focus: [
      'directions',
      'amenities',
      'contact_information',
      'building_hours',
      'general_assistance'
    ],
    vocabulary: {
      preferred: ['welcome', 'assist', 'location', 'available', 'help'],
      avoid: ['technical_information', 'internal_operations']
    }
  }
}

export function getAIPersonality(role: UserRole): AIPersonality {
  return aiPersonalities[role] || aiPersonalities[UserRole.TENANT]
}

export function formatAIResponse(
  content: string,
  personality: AIPersonality,
  context?: {
    userName?: string
    buildingName?: string
    timeOfDay?: string
    metrics?: Record<string, any>
  }
): string {
  // Apply personality tone
  let formattedContent = content

  // Replace template variables
  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      formattedContent = formattedContent.replace(
        new RegExp(`{{${key}}}`, 'g'), 
        String(value)
      )
    })
  }

  // Apply vocabulary preferences
  personality.vocabulary.avoid.forEach(term => {
    // This would be more sophisticated in production
    // For now, just a placeholder
  })

  return formattedContent
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}