// ============================================================================
// INITIATIVES SYSTEM TYPES
// ============================================================================

export type InitiativeStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
export type InitiativePriority = 'high' | 'medium' | 'low'
export type ParticipantRole = 'owner' | 'member' | 'viewer'
export type InvitationStatus = 'pending' | 'accepted' | 'rejected'

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface Initiative {
  id: string
  organization_id: string

  // Basic info
  name: string
  description: string | null
  status: InitiativeStatus
  priority: InitiativePriority

  // Timeline
  start_date: string | null // ISO date string
  target_date: string | null
  completion_date: string | null

  // Resources
  budget: number | null
  budget_spent: number

  // Ownership
  owner_id: string | null
  team_members: string[] // Array of user IDs

  // Metadata
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface InitiativeMetric {
  id: string
  initiative_id: string
  metric_code: string

  // Targets
  target_value: number | null
  target_unit: string | null
  baseline_value: number | null
  baseline_date: string | null

  // Current progress
  current_value: number | null
  current_value_date: string | null
  progress_percentage: number | null // 0-100

  // Notes
  notes: string | null

  // Metadata
  created_at: string
  updated_at: string
}

export interface InitiativeMilestone {
  id: string
  initiative_id: string

  // Milestone info
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  completed_at: string | null
  completed_by: string | null

  // Order
  display_order: number

  // Metadata
  created_at: string
  updated_at: string
}

export interface InitiativeActivityLog {
  id: string
  initiative_id: string
  activity_type: string
  description: string
  metadata: Record<string, any>
  user_id: string | null
  created_at: string
}

// ============================================================================
// EXTENDED TYPES (with joins/calculations)
// ============================================================================

export interface InitiativeWithDetails extends Initiative {
  // Owner info
  owner_name?: string
  owner_email?: string

  // Calculated fields
  overall_progress?: number // Average of all metrics progress
  metrics_count?: number
  milestones_count?: number
  completed_milestones_count?: number

  // Relationships
  metrics?: InitiativeMetricWithDetails[]
  milestones?: InitiativeMilestone[]
}

export interface InitiativeMetricWithDetails extends InitiativeMetric {
  // Metric info from gri_metrics table
  metric_name?: string
  metric_category?: string
  metric_subcategory?: string
  gri_disclosure?: string
}

export interface InitiativeParticipant {
  id: string
  initiative_id: string
  user_id: string | null // NULL for external participants
  email: string
  name: string | null
  role: ParticipantRole
  can_edit: boolean
  can_view_metrics: boolean
  can_add_comments: boolean
  invitation_status: InvitationStatus
  access_token: string
  invited_at: string
  invited_by: string | null
  responded_at: string | null
  last_accessed_at: string | null
  created_at: string
  updated_at: string
}

export interface OrgUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

export interface CreateInitiativeInput {
  name: string
  description?: string
  status?: InitiativeStatus
  priority?: InitiativePriority
  start_date?: string
  target_date?: string
  budget?: number
  budget_currency?: string
  owner_id?: string
  team_members?: string[] // Legacy - deprecated
  participants?: AddParticipantInput[]
}

export interface UpdateInitiativeInput {
  name?: string
  description?: string
  status?: InitiativeStatus
  priority?: InitiativePriority
  start_date?: string
  target_date?: string
  completion_date?: string
  budget?: number
  budget_spent?: number
  owner_id?: string
  team_members?: string[]
}

export interface CreateInitiativeMetricInput {
  metric_code: string
  target_value?: number
  target_unit?: string
  baseline_value?: number
  baseline_date?: string
  notes?: string
}

export interface UpdateInitiativeMetricInput {
  target_value?: number
  target_unit?: string
  baseline_value?: number
  baseline_date?: string
  current_value?: number
  current_value_date?: string
  progress_percentage?: number
  notes?: string
}

export interface CreateMilestoneInput {
  title: string
  description?: string
  due_date?: string
  display_order?: number
}

export interface UpdateMilestoneInput {
  title?: string
  description?: string
  due_date?: string
  completed?: boolean
  display_order?: number
}

export interface AddParticipantInput {
  email: string
  name?: string
  role: ParticipantRole
  can_edit?: boolean
  can_view_metrics?: boolean
  can_add_comments?: boolean
}

export interface UpdateParticipantInput {
  role?: ParticipantRole
  can_edit?: boolean
  can_view_metrics?: boolean
  can_add_comments?: boolean
  invitation_status?: InvitationStatus
}

// ============================================================================
// DASHBOARD/SUMMARY TYPES
// ============================================================================

export interface InitiativesSummary {
  total_initiatives: number
  in_progress: number
  completed: number
  planning: number
  on_hold: number
  cancelled: number
  total_metrics_tracked: number
  total_milestones: number
  completed_milestones: number
}

export interface InitiativeCardData {
  id: string
  name: string
  status: InitiativeStatus
  priority: InitiativePriority
  overall_progress: number
  metrics_count: number
  owner_name: string | null
  target_date: string | null
  is_overdue: boolean
}

// ============================================================================
// IMPORT FROM GAP ANALYSIS
// ============================================================================

export interface MetricForImport {
  metric_code: string
  metric_name: string
  category: string
  subcategory: string | null
  gri_disclosure: string
  unit: string
  difficulty: 'easy' | 'medium' | 'hard'
  priority: 'high' | 'medium' | 'low'
  is_quick_win: boolean
  is_tracked: boolean // Already in an initiative
}

export interface ImportFromGapAnalysisInput {
  initiative_id?: string // If null, create new initiative
  initiative_name?: string // Required if creating new
  metric_codes: string[]
  auto_set_targets?: boolean // Auto-populate targets based on industry benchmarks
}
