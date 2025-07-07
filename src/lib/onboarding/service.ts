import { createClient } from '@/lib/supabase/client'
import { getOnboardingFlow } from './flows'
import { parsers } from './parsers'
import { authService } from '@/lib/auth/service'
import { organizationService } from '@/lib/organizations/service'
import { UserRole } from '@/types/auth'
import type {
  OnboardingFlow,
  OnboardingStep,
  OnboardingProgress,
  CompletionAction
} from '@/types/onboarding'

export class OnboardingService {
  private supabase = createClient()

  /**
   * Start onboarding for a user
   */
  async startOnboarding(userId: string, role: UserRole): Promise<OnboardingFlow> {
    const flow = getOnboardingFlow(role)
    
    // Create onboarding progress record
    const { error } = await this.supabase
      .from('onboarding_progress')
      .insert({
        user_id: userId,
        flow_id: flow.id,
        current_step: flow.steps[0].id,
        status: 'in_progress',
        data: {}
      })

    if (error) {
      console.error('Error starting onboarding:', error)
    }

    return flow
  }

  /**
   * Get current onboarding progress
   */
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    const { data, error } = await this.supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single()

    if (error) {
      console.error('Error fetching progress:', error)
      return null
    }

    return data
  }

  /**
   * Save step data and move to next step
   */
  async completeStep(
    userId: string,
    stepId: string,
    data: Record<string, any>
  ): Promise<{ nextStep: OnboardingStep | null; isComplete: boolean }> {
    // Get current progress
    const progress = await this.getProgress(userId)
    if (!progress) {
      throw new Error('No active onboarding found')
    }

    // Get the flow
    const flow = getOnboardingFlow(progress.data.role || UserRole.TENANT)
    const currentStepIndex = flow.steps.findIndex(s => s.id === stepId)
    
    if (currentStepIndex === -1) {
      throw new Error('Invalid step ID')
    }

    // Update progress data
    const updatedData = {
      ...progress.data,
      [stepId]: data
    }

    // Check if this is the last step
    const isLastStep = currentStepIndex === flow.steps.length - 1
    const nextStep = isLastStep ? null : flow.steps[currentStepIndex + 1]

    // Update progress
    const { error } = await this.supabase
      .from('onboarding_progress')
      .update({
        current_step: nextStep?.id || stepId,
        status: isLastStep ? 'completed' : 'in_progress',
        data: updatedData,
        completed_at: isLastStep ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('flow_id', flow.id)

    if (error) {
      throw error
    }

    // If complete, execute completion actions
    if (isLastStep) {
      await this.executeCompletionActions(flow.completionActions, updatedData, userId)
    }

    return {
      nextStep,
      isComplete: isLastStep
    }
  }

  /**
   * Skip a step
   */
  async skipStep(userId: string, stepId: string): Promise<{ nextStep: OnboardingStep | null; isComplete: boolean }> {
    return this.completeStep(userId, stepId, { skipped: true })
  }

  /**
   * Execute completion actions
   */
  private async executeCompletionActions(
    actions: CompletionAction[],
    data: Record<string, any>,
    userId: string
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_organization':
            await this.createOrganization(data, userId)
            break
          case 'create_buildings':
            await this.createBuildings(data, userId)
            break
          case 'send_invitations':
            await this.sendInvitations(data, userId)
            break
          case 'update_building':
            await this.updateBuildingDetails(data, userId)
            break
          case 'create_baseline':
            await this.createSystemBaseline(data, userId)
            break
          case 'setup_monitoring':
            await this.setupMonitoring(data, userId)
            break
          case 'send_team_invites':
            await this.sendTeamInvites(data, userId)
            break
          case 'update_profile':
            await this.updateUserProfile(data, userId)
            break
          case 'assign_areas':
            await this.assignMaintenanceAreas(data, userId)
            break
          case 'configure_alerts':
            await this.configureAlerts(data, userId)
            break
          case 'create_group':
            await this.createGroupProfile(data, userId)
            break
          case 'configure_zones':
            await this.configureComfortZones(data, userId)
            break
          case 'create_tenant_profile':
            await this.createTenantProfile(data, userId)
            break
          case 'register_unit':
            await this.registerUnit(data, userId)
            break
          default:
            console.log(`Unhandled action type: ${action.type}`)
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error)
      }
    }

    // Mark onboarding as complete in user profile
    await this.supabase
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', userId)
  }

  /**
   * Parse bulk input data
   */
  parseBulkInput(type: string, input: string): any[] {
    const parser = parsers[type]
    if (!parser) {
      throw new Error(`No parser found for type: ${type}`)
    }
    return parser(input)
  }

  // Action implementations

  private async createOrganization(data: Record<string, any>, userId: string): Promise<void> {
    const { company_essentials } = data
    if (!company_essentials) return

    const slug = this.generateSlug(company_essentials.company_name)
    
    await this.supabase.rpc('create_organization_with_owner', {
      org_name: company_essentials.company_name,
      org_slug: slug,
      owner_id: userId,
      org_data: {
        industry: company_essentials.industry,
        company_size: company_essentials.company_size,
        subscription_tier: data.subscription_selection?.subscription || 'starter'
      }
    })
  }

  private async createBuildings(data: Record<string, any>, userId: string): Promise<void> {
    const { buildings_quick_add } = data
    if (!buildings_quick_add) return

    const buildings = this.parseBulkInput('csv_building_parser', buildings_quick_add.input)
    
    // Get user's organization
    const { data: membership } = await this.supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .single()

    if (!membership) return

    // Create buildings
    for (const building of buildings) {
      await organizationService.createBuilding(membership.organization_id, {
        name: building.name,
        city: building.city,
        address: building.address || `${building.city}`,
        status: 'pending_setup'
      })
    }
  }

  private async sendInvitations(data: Record<string, any>, userId: string): Promise<void> {
    const { invite_managers } = data
    if (!invite_managers || invite_managers.skipped) return

    const invites = this.parseBulkInput('smart_invite_parser', invite_managers.input)
    
    // Get user's organization
    const { data: membership } = await this.supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .single()

    if (!membership) return

    // Send invitations
    for (const invite of invites) {
      await organizationService.inviteUser(
        membership.organization_id,
        invite.email,
        UserRole.SITE_MANAGER,
        userId
      )

      // If building specified, create assignment
      if (invite.building) {
        const { data: building } = await this.supabase
          .from('buildings')
          .select('id')
          .eq('organization_id', membership.organization_id)
          .eq('name', invite.building)
          .single()

        if (building) {
          // This will be linked when the user accepts the invitation
          await this.supabase
            .from('pending_assignments')
            .insert({
              email: invite.email,
              building_id: building.id,
              role: UserRole.SITE_MANAGER
            })
        }
      }
    }
  }

  private async updateBuildingDetails(data: Record<string, any>, userId: string): Promise<void> {
    const { building_basics } = data
    if (!building_basics) return

    // Get user's building assignment
    const { data: assignment } = await this.supabase
      .from('building_assignments')
      .select('building_id')
      .eq('user_id', userId)
      .single()

    if (!assignment) return

    await organizationService.updateBuilding(assignment.building_id, {
      size_sqft: building_basics.exact_size,
      floors: building_basics.floors,
      age_category: building_basics.age_systems,
      occupancy_types: building_basics.occupancy_type,
      status: 'active'
    })
  }

  private async createSystemBaseline(data: Record<string, any>, userId: string): Promise<void> {
    const { systems_baseline } = data
    if (!systems_baseline) return

    // Get user's building
    const { data: assignment } = await this.supabase
      .from('building_assignments')
      .select('building_id')
      .eq('user_id', userId)
      .single()

    if (!assignment) return

    // Store baseline in building metadata
    const baseline = {
      lighting: systems_baseline.Lighting || [],
      hvac: systems_baseline.HVAC || [],
      energy: systems_baseline.Energy || [],
      recorded_at: new Date().toISOString(),
      recorded_by: userId
    }

    await this.supabase
      .from('buildings')
      .update({
        metadata: {
          systems_baseline: baseline
        }
      })
      .eq('id', assignment.building_id)
  }

  private async setupMonitoring(data: Record<string, any>, userId: string): Promise<void> {
    const { pain_points } = data
    if (!pain_points) return

    // Get user's building
    const { data: assignment } = await this.supabase
      .from('building_assignments')
      .select('building_id')
      .eq('user_id', userId)
      .single()

    if (!assignment) return

    // Create monitoring preferences
    await this.supabase
      .from('monitoring_preferences')
      .insert({
        building_id: assignment.building_id,
        user_id: userId,
        priorities: pain_points.priorities || [],
        metrics: this.mapPrioritiesToMetrics(pain_points.priorities || []),
        alert_thresholds: this.getDefaultThresholds(pain_points.priorities || [])
      })
  }

  private async sendTeamInvites(data: Record<string, any>, userId: string): Promise<void> {
    const { quick_team } = data
    if (!quick_team || quick_team.skipped) return

    // Implementation similar to sendInvitations but for team members
  }

  private async updateUserProfile(data: Record<string, any>, userId: string): Promise<void> {
    const updates: any = {}

    if (data.tech_profile) {
      updates.specializations = data.tech_profile.specializations
      updates.experience_years = data.tech_profile.experience_years
      updates.certifications = data.tech_profile.certifications
    }

    if (data.profile_setup) {
      updates.experience_level = data.profile_setup.experience_level
      updates.notification_preference = data.profile_setup.notification_preference
    }

    if (Object.keys(updates).length > 0) {
      await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
    }
  }

  private async assignMaintenanceAreas(data: Record<string, any>, userId: string): Promise<void> {
    const { building_areas } = data
    if (!building_areas) return

    // Get user's building assignment
    const { data: assignment } = await this.supabase
      .from('building_assignments')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!assignment) return

    // Update assignment with areas
    await this.supabase
      .from('building_assignments')
      .update({
        areas: building_areas['Primary Areas'] || []
      })
      .eq('id', assignment.id)
  }

  private async configureAlerts(data: Record<string, any>, userId: string): Promise<void> {
    const { work_preferences } = data
    if (!work_preferences) return

    await this.supabase
      .from('user_profiles')
      .update({
        preferences: {
          work_shift: work_preferences.work_shift,
          notification_urgency: work_preferences.notification_urgency
        }
      })
      .eq('id', userId)
  }

  private async createGroupProfile(data: Record<string, any>, userId: string): Promise<void> {
    const { group_info } = data
    if (!group_info) return

    // Implementation for creating group profile
  }

  private async configureComfortZones(data: Record<string, any>, userId: string): Promise<void> {
    const { space_requirements, pain_points } = data
    if (!space_requirements && !pain_points) return

    // Implementation for configuring comfort zones
  }

  private async createTenantProfile(data: Record<string, any>, userId: string): Promise<void> {
    const { basic_info, comfort_preferences } = data
    if (!basic_info) return

    await this.supabase
      .from('user_profiles')
      .update({
        metadata: {
          unit_number: basic_info.unit_number,
          occupancy_type: basic_info.occupancy_type,
          comfort_preference: comfort_preferences?.preference
        }
      })
      .eq('id', userId)
  }

  private async registerUnit(data: Record<string, any>, userId: string): Promise<void> {
    const { basic_info } = data
    if (!basic_info) return

    // Implementation for registering tenant unit
  }

  // Helper methods

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private mapPrioritiesToMetrics(priorities: string[]): string[] {
    const metricsMap: Record<string, string[]> = {
      energy_costs: ['energy_consumption', 'peak_demand', 'utility_cost'],
      comfort: ['temperature', 'humidity', 'occupant_complaints'],
      maintenance: ['equipment_runtime', 'fault_detection', 'mtbf'],
      compliance: ['iaq_metrics', 'safety_checks', 'certification_status'],
      sustainability: ['carbon_footprint', 'energy_intensity', 'waste_metrics'],
      data_visibility: ['all_metrics']
    }

    return priorities.flatMap(p => metricsMap[p] || [])
  }

  private getDefaultThresholds(priorities: string[]): Record<string, any> {
    // Return default alert thresholds based on priorities
    const thresholds: Record<string, any> = {}

    if (priorities.includes('energy_costs')) {
      thresholds.peak_demand = { high: 0.9, critical: 0.95 }
      thresholds.daily_cost = { high: 1.2, critical: 1.5 } // 20% and 50% above average
    }

    if (priorities.includes('comfort')) {
      thresholds.temperature_variance = { high: 2, critical: 4 } // degrees from setpoint
      thresholds.complaint_rate = { high: 0.05, critical: 0.1 } // per occupant
    }

    if (priorities.includes('maintenance')) {
      thresholds.fault_count = { high: 5, critical: 10 } // per day
      thresholds.response_time = { high: 4, critical: 8 } // hours
    }

    return thresholds
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService()