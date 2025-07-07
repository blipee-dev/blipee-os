// Onboarding Flow Types

export interface OnboardingFlow {
  id: string
  role: string
  estimatedTime: number // seconds
  steps: OnboardingStep[]
  conditionalLogic?: ConditionalRule[]
  completionActions: CompletionAction[]
}

export type StepType = 
  | 'intro_animation'
  | 'intro'
  | 'quick_form'
  | 'bulk_text_input'
  | 'smart_invite'
  | 'contextual_intro'
  | 'quick_profile'
  | 'smart_building_form'
  | 'priority_matrix'
  | 'visual_checklist'
  | 'role_assignment'
  | 'ai_insights'
  | 'form_group'
  | 'single_choice'
  | 'multiple_choice'
  | 'text_input'
  | 'number_input'
  | 'button_group'
  | 'visual_select'
  | 'timeline_select'
  | 'number_slider'
  | 'visual_counter'

export interface OnboardingStep {
  id: string
  type: StepType
  timeEstimate: number
  required: boolean
  skipCondition?: string
  validation?: ValidationRule[]
  aiAssistance?: AIAssistance
  content?: any
  config?: any
  fields?: FormField[]
}

export interface FormField {
  name: string
  type: string
  label?: string
  question?: string
  placeholder?: string
  required?: boolean
  validation?: ValidationRule
  options?: FieldOption[]
  aiAssist?: boolean
  unit?: string
  range?: {
    min: number
    max: number
  }
  quickOptions?: any[]
  followUp?: {
    type: string
    question: string
  }
}

export interface FieldOption {
  value: string
  label: string
  description?: string
  icon?: string
  impact?: string
  aiPersonality?: string
  systems?: string[]
  auto_fill?: Record<string, any>
  auto_features?: string[]
}

export interface ValidationRule {
  type?: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message?: string
  required?: boolean
  minLength?: number
  maxLength?: number
}

export interface AIAssistance {
  enabled: boolean
  type: 'suggestion' | 'auto_complete' | 'validation' | 'explanation'
  context?: string
}

export interface ConditionalRule {
  condition: string
  action: 'show' | 'hide' | 'skip' | 'require'
  targetSteps: string[]
}

export interface CompletionAction {
  type: string
  data: any
  message?: string
}

export interface OnboardingProgress {
  id: string
  user_id: string
  organization_id: string
  step_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  data: Record<string, any>
  started_at?: string
  completed_at?: string
  time_spent_seconds?: number
  created_at: string
}

// Specific flow configurations

export interface QuickFormConfig {
  title?: string
  subtitle?: string
  fields: FormField[]
}

export interface BulkTextInputConfig {
  title: string
  subtitle: string
  placeholder: string
  parser: string
  minEntries: number
  maxEntries: number
  format?: string
  example?: string
}

export interface SmartInviteConfig {
  title: string
  subtitle: string
  format: string
  smartSuggestions: boolean
  bulkPaste: boolean
  skipOption?: {
    label: string
    consequence: string
  }
}

export interface PriorityMatrixConfig {
  question: string
  instruction: string
  options: PriorityOption[]
  maxPriorities: number
}

export interface PriorityOption {
  id: string
  label: string
  icon: string
  aiContext: string
}

export interface VisualChecklistConfig {
  title: string
  instruction: string
  categories: ChecklistCategory[]
}

export interface ChecklistCategory {
  name: string
  icon: string
  options: ChecklistOption[]
}

export interface ChecklistOption {
  value: string
  label: string
  impact: string
  followUp?: {
    type: string
    question: string
  }
}

export interface AIInsightsConfig {
  title: string
  insights: InsightTemplate[]
  cta: {
    primary: string
    secondary: string
  }
}

export interface InsightTemplate {
  type: 'cost_estimate' | 'quick_win' | 'immediate_action'
  template: string
}

// Smart defaults

export interface SmartDefault {
  buildingType: string
  size: string
  age: string
  defaults: BuildingDefaults
}

export interface BuildingDefaults {
  occupancy: {
    schedule: string
    density: string
    patterns: string
  }
  systems: {
    hvac: string
    lighting: string
    controls: string
  }
  consumption: {
    energy_intensity: string
    peak_demand: string
    utility_cost: string
  }
  common_issues: string[]
}