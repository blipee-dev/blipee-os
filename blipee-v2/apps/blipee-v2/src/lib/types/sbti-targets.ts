/**
 * SBTi Targets Types
 * Based on sustainability_targets table
 */

export type SBTiAmbition = '1.5C' | 'well-below-2C' | 'net-zero'
export type TargetScope = 'scope-1' | 'scope-2' | 'scope-1-2' | 'scope-3' | 'all-scopes'
export type TargetStatus = 'draft' | 'submitted' | 'validated' | 'approved' | 'rejected' | 'active'
export type ProgressStatus = 'on_track' | 'at_risk' | 'off_track' | 'achieved'

export interface SustainabilityTarget {
  id: string
  organization_id: string
  name: string
  description: string | null
  target_type: string

  // Baseline
  baseline_year: number
  baseline_value: number
  baseline_unit: string
  baseline_emissions: number | null
  baseline_scope_1: number | null
  baseline_scope_2: number | null
  baseline_scope_3: number | null

  // Target
  target_year: number
  target_value: number
  target_unit: string
  target_emissions: number | null
  target_reduction_percent: number | null

  // Reduction percentages
  emissions_reduction_percent: number | null
  energy_reduction_percent: number | null
  water_reduction_percent: number | null
  waste_reduction_percent: number | null
  annual_reduction_rate: number | null

  // SBTi specific
  is_science_based: boolean | null
  sbti_validated: boolean | null
  sbti_validation_date: string | null
  sbti_approved: boolean | null
  sbti_submission_date: string | null
  sbti_submission_ready: boolean | null
  sbti_ambition: string | null

  // Coverage
  scope_1_2_coverage_percent: number | null
  scope_3_coverage_percent: number | null
  scopes: string[] | null
  categories: string[] | null
  facilities: string[] | null

  // Governance
  board_approval: boolean | null
  public_commitment: boolean | null
  commitment_url: string | null
  ghg_inventory_complete: boolean | null

  // Net-Zero
  net_zero_date: number | null
  neutralization_plan: string | null
  bvcm_commitment: string | null

  // Progress
  current_value: number | null
  current_emissions: number | null
  current_emissions_date: string | null
  current_as_of: string | null
  progress_percent: number | null
  progress_status: ProgressStatus | null

  // Other
  target_scope: TargetScope | null
  target_status: TargetStatus | null
  target_name: string | null
  target_description: string | null
  methodology: string | null
  assumptions: string | null
  is_active: boolean | null
  priority: number | null
  site_id: string | null
  parent_target_id: string | null
  metadata: any | null

  created_at: string | null
  updated_at: string | null
}

export interface CreateTargetInput {
  name: string
  description?: string | null
  target_type: string

  // Baseline
  baseline_year: number
  baseline_value: number
  baseline_unit: string
  baseline_emissions?: number | null
  baseline_scope_1?: number | null
  baseline_scope_2?: number | null
  baseline_scope_3?: number | null

  // Target
  target_year: number
  target_value: number
  target_unit: string
  target_emissions?: number | null
  target_reduction_percent?: number | null

  // Reduction percentages
  emissions_reduction_percent?: number | null
  annual_reduction_rate?: number | null

  // SBTi specific
  is_science_based?: boolean
  sbti_ambition?: string | null
  sbti_submission_ready?: boolean

  // Coverage
  scope_1_2_coverage_percent?: number | null
  scope_3_coverage_percent?: number | null
  scopes?: string[] | null
  categories?: string[] | null
  facilities?: string[] | null

  // Governance
  board_approval?: boolean
  public_commitment?: boolean
  commitment_url?: string | null
  ghg_inventory_complete?: boolean

  // Net-Zero
  net_zero_date?: number | null
  neutralization_plan?: string | null

  // Other
  target_scope?: TargetScope | null
  target_status?: TargetStatus
  methodology?: string | null
  assumptions?: string | null
  priority?: number | null
}

export interface UpdateTargetInput extends Partial<CreateTargetInput> {
  id: string
}

export interface UpdateProgressInput {
  target_id: string
  current_emissions: number
  current_emissions_date: string
  current_value?: number | null
}

export interface TargetSummary {
  total_targets: number
  validated_targets: number
  submitted_targets: number
  draft_targets: number
  active_targets: number
  scope_1_2_coverage: number | null
  scope_3_coverage: number | null
  on_track_count: number
  at_risk_count: number
  off_track_count: number
}

export interface NetZeroTrajectoryData {
  baseline: {
    year: number
    emissions: number
    scope1: number
    scope2: number
    scope3: number
  }
  current: {
    year: number
    emissions: number
    scope1?: number
    scope2?: number
    scope3?: number
  }
  nearTerm: {
    year: number
    emissions: number
    reductionPercent: {
      scope1_2: number
      scope3?: number
    }
  }
  netZero: {
    year: number
    residualEmissions: number
  }
  actions: string[]
  carbonCreditsNote?: string
  targetName: string
  sbtiValidated: boolean
}

export interface TargetWithProgress extends SustainabilityTarget {
  reduction_initiatives_count?: number
  days_to_target?: number
  annual_reduction_needed?: number
  on_track_for_target?: boolean
}
