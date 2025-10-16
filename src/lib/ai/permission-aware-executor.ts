import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Action, ActionContext, ActionResult } from './action-registry';
import { enhancedActionRegistry } from './action-registry-enhanced';

/**
 * Permission-Aware Execution Framework
 * Ensures all AI actions respect user permissions and organizational boundaries
 * Implements RBAC (Role-Based Access Control) with audit logging
 */
export class PermissionAwareExecutor {
  private supabase: ReturnType<typeof createClient<Database>>;
  private executionQueue: Map<string, ExecutionRequest> = new Map();
  private rollbackStack: RollbackRecord[] = [];

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  /**
   * Execute an action with full permission checks and audit trail
   */
  public async executeWithPermissions(
    actionId: string,
    parameters: Record<string, any>,
    userId: string,
    organizationId: string
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();

    try {
      // Step 1: Fetch user context and permissions
      const context = await this.buildUserContext(userId, organizationId);

      // Step 2: Get action definition
      const action = enhancedActionRegistry.getAction(actionId);
      if (!action) {
        return this.createErrorResult(executionId, `Action ${actionId} not found`);
      }

      // Step 3: Check permissions
      const permissionCheck = await this.checkPermissions(action, context);
      if (!permissionCheck.allowed) {
        await this.logPermissionDenial(executionId, action, context, permissionCheck.reason);
        return this.createErrorResult(executionId, permissionCheck.reason);
      }

      // Step 4: Validate organizational boundaries
      const boundaryCheck = await this.validateOrganizationalBoundaries(action, parameters, context);
      if (!boundaryCheck.valid) {
        return this.createErrorResult(executionId, boundaryCheck.reason);
      }

      // Step 5: Create execution request
      const request: ExecutionRequest = {
        executionId,
        actionId,
        action,
        parameters,
        context,
        status: 'pending',
        createdAt: new Date(),
        userId,
        organizationId
      };

      this.executionQueue.set(executionId, request);

      // Step 6: Check if confirmation is required
      if (this.requiresConfirmation(action)) {
        await this.requestConfirmation(request);
        return {
          executionId,
          status: 'pending_confirmation',
          message: 'Action requires confirmation before execution',
          requiresConfirmation: true
        };
      }

      // Step 7: Execute the action
      const result = await this.executeAction(request);

      // Step 8: Log successful execution
      await this.logSuccessfulExecution(request, result);

      return {
        executionId,
        status: 'completed',
        result,
        message: result.message
      };

    } catch (error) {
      await this.logExecutionError(executionId, error);
      return this.createErrorResult(
        executionId,
        `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.executionQueue.delete(executionId);
    }
  }

  /**
   * Build comprehensive user context for permission checking
   */
  private async buildUserContext(userId: string, organizationId: string): Promise<ActionContext> {
    // Fetch user profile and role
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*, organizations!inner(*)')
      .eq('id', userId)
      .eq('organizations.id', organizationId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Fetch user's organization member role
    const { data: member } = await this.supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!member) {
      throw new Error('User not a member of organization');
    }

    // Fetch buildings the user has access to
    const { data: buildings } = await this.supabase
      .from('buildings')
      .select('id')
      .eq('organization_id', organizationId);

    const buildingIds = buildings?.map(b => b.id) || [];

    // Get role permissions based on role hierarchy
    const rolePermissions = this.getRolePermissions(member.role);

    // Fetch current metrics for context
    const { data: metrics } = await this.supabase
      .from('sustainability_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      userId,
      organizationId,
      rolePermissions,
      buildingIds,
      currentMetrics: metrics || {},
      historicalData: {}, // Would fetch historical data here
      weatherData: {} // Would fetch weather data here
    };
  }

  /**
   * Get permissions based on role hierarchy
   */
  private getRolePermissions(role: string): string[] {
    const roleHierarchy: Record<string, string[]> = {
      account_owner: [
        'account_owner',
        'sustainability_manager',
        'facility_manager',
        'analyst',
        'viewer'
      ],
      sustainability_manager: [
        'sustainability_manager',
        'facility_manager',
        'analyst',
        'viewer'
      ],
      facility_manager: [
        'facility_manager',
        'analyst',
        'viewer'
      ],
      analyst: [
        'analyst',
        'viewer'
      ],
      viewer: [
        'viewer'
      ]
    };

    return roleHierarchy[role] || ['viewer'];
  }

  /**
   * Check if user has required permissions for action
   */
  private async checkPermissions(
    action: Action,
    context: ActionContext
  ): Promise<PermissionCheckResult> {
    // Check if user has any of the required permissions
    const hasPermission = action.requiredPermissions.some(requiredPerm =>
      context.rolePermissions.includes(requiredPerm)
    );

    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Insufficient permissions. Required: ${action.requiredPermissions.join(', ')}, Available: ${context.rolePermissions.join(', ')}`
      };
    }

    // Additional checks for high-risk actions
    if (action.riskLevel === 'high') {
      const isOwnerOrManager = context.rolePermissions.includes('account_owner') ||
                              context.rolePermissions.includes('sustainability_manager');

      if (!isOwnerOrManager) {
        return {
          allowed: false,
          reason: 'High-risk actions require Account Owner or Sustainability Manager role'
        };
      }
    }

    // Check for specific action restrictions
    const restrictions = await this.getActionRestrictions(action.id, context.organizationId);
    if (restrictions.length > 0) {
      for (const restriction of restrictions) {
        if (restriction.type === 'blacklist' && restriction.userIds?.includes(context.userId)) {
          return {
            allowed: false,
            reason: `User is blacklisted from executing action: ${restriction.reason}`
          };
        }

        if (restriction.type === 'whitelist' && !restriction.userIds?.includes(context.userId)) {
          return {
            allowed: false,
            reason: 'User is not whitelisted for this action'
          };
        }

        if (restriction.type === 'time_based') {
          const now = new Date();
          const restrictedStart = new Date(restriction.startTime!);
          const restrictedEnd = new Date(restriction.endTime!);

          if (now >= restrictedStart && now <= restrictedEnd) {
            return {
              allowed: false,
              reason: `Action is restricted during: ${restriction.startTime} - ${restriction.endTime}`
            };
          }
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Validate that action parameters respect organizational boundaries
   */
  private async validateOrganizationalBoundaries(
    action: Action,
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<BoundaryValidationResult> {
    // Check if action is trying to access resources outside organization
    if (parameters.facility_ids) {
      const facilityIds = Array.isArray(parameters.facility_ids)
        ? parameters.facility_ids
        : [parameters.facility_ids];

      for (const facilityId of facilityIds) {
        if (!context.buildingIds.includes(facilityId)) {
          return {
            valid: false,
            reason: `Access denied: Facility ${facilityId} not in user's organization`
          };
        }
      }
    }

    // Check data access boundaries
    if (parameters.date_range) {
      const dataRetentionPolicy = await this.getDataRetentionPolicy(context.organizationId);
      if (dataRetentionPolicy) {
        const requestedStart = new Date(parameters.date_range.start);
        const allowedStart = new Date(dataRetentionPolicy.earliestAccessDate);

        if (requestedStart < allowedStart) {
          return {
            valid: false,
            reason: `Data access restricted before ${dataRetentionPolicy.earliestAccessDate}`
          };
        }
      }
    }

    // Check export restrictions
    if (action.id.includes('export') || action.id.includes('download')) {
      const exportPolicy = await this.getExportPolicy(context.organizationId);
      if (exportPolicy?.restrictedFormats?.includes(parameters.format)) {
        return {
          valid: false,
          reason: `Export format ${parameters.format} is restricted for this organization`
        };
      }
    }

    // Check modification limits
    if (action.category.name === 'Energy Optimization') {
      const energyLimits = await this.getEnergyModificationLimits(context.organizationId);
      if (energyLimits) {
        if (parameters.target_energy_reduction > energyLimits.maxReductionPercent) {
          return {
            valid: false,
            reason: `Energy reduction exceeds organization limit of ${energyLimits.maxReductionPercent}%`
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Check if action requires explicit confirmation
   */
  private requiresConfirmation(action: Action): boolean {
    // High-risk actions always require confirmation
    if (action.riskLevel === 'high') return true;

    // Actions that modify physical systems require confirmation
    const criticalCategories = [
      'Energy Optimization',
      'Workflow Automation',
      'Advanced Compliance'
    ];

    if (criticalCategories.includes(action.category.name)) return true;

    // Actions with significant financial impact require confirmation
    if (action.businessImpact.estimatedSavings &&
        Math.abs(action.businessImpact.estimatedSavings) > 10000) {
      return true;
    }

    return false;
  }

  /**
   * Request confirmation from user for critical actions
   */
  private async requestConfirmation(request: ExecutionRequest): Promise<void> {
    // Store confirmation request
    await this.supabase.from('action_confirmations').insert({
      execution_id: request.executionId,
      action_id: request.actionId,
      user_id: request.userId,
      organization_id: request.organizationId,
      parameters: request.parameters,
      requested_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      status: 'pending'
    });

    // Send notification to user (would integrate with notification service)
    await this.sendConfirmationNotification(request);
  }

  /**
   * Execute the action after all checks pass
   */
  private async executeAction(request: ExecutionRequest): Promise<ActionResult> {
    const { action, parameters, context } = request;

    // Create rollback record before execution
    const rollbackRecord = await this.createRollbackRecord(request);

    try {
      // Execute using the action registry
      const result = await enhancedActionRegistry.executeAction(
        action.id,
        parameters,
        context
      );

      // Store rollback record if action was successful and has rollback plan
      if (result.success && action.rollbackPlan) {
        this.rollbackStack.push(rollbackRecord);
      }

      return result;
    } catch (error) {
      // Attempt automatic rollback for failed actions
      if (rollbackRecord.canRollback) {
        await this.attemptRollback(rollbackRecord);
      }
      throw error;
    }
  }

  /**
   * Create a rollback record for potential reversal
   */
  private async createRollbackRecord(request: ExecutionRequest): Promise<RollbackRecord> {
    const snapshot = await this.captureStateSnapshot(request);

    return {
      executionId: request.executionId,
      actionId: request.actionId,
      parameters: request.parameters,
      context: request.context,
      snapshot,
      canRollback: !!request.action.rollbackPlan,
      rollbackPlan: request.action.rollbackPlan,
      createdAt: new Date()
    };
  }

  /**
   * Capture current state before action execution
   */
  private async captureStateSnapshot(request: ExecutionRequest): Promise<StateSnapshot> {
    // Capture relevant state based on action type
    const snapshot: StateSnapshot = {
      timestamp: new Date(),
      data: {}
    };

    // For energy optimization actions, capture current settings
    if (request.action.category.name === 'Energy Optimization') {
      const { data: energySettings } = await this.supabase
        .from('energy_settings')
        .select('*')
        .eq('organization_id', request.organizationId);

      snapshot.data.energySettings = energySettings;
    }

    // For data management actions, capture data checksums
    if (request.action.category.name === 'Data Management') {
      // Would calculate checksums of affected data
      snapshot.data.dataChecksums = {};
    }

    return snapshot;
  }

  /**
   * Attempt to rollback a failed action
   */
  private async attemptRollback(rollbackRecord: RollbackRecord): Promise<void> {
    if (!rollbackRecord.canRollback) return;

    try {
      // Log rollback attempt
      await this.supabase.from('rollback_log').insert({
        execution_id: rollbackRecord.executionId,
        action_id: rollbackRecord.actionId,
        rollback_reason: 'Action execution failed',
        snapshot: rollbackRecord.snapshot,
        initiated_at: new Date().toISOString()
      });

      // Execute rollback based on action type
      // This would contain specific rollback logic for each action type
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  /**
   * Log successful execution for audit trail
   */
  private async logSuccessfulExecution(
    request: ExecutionRequest,
    result: ActionResult
  ): Promise<void> {
    await this.supabase.from('audit_log').insert({
      event_type: 'action_executed',
      user_id: request.userId,
      organization_id: request.organizationId,
      resource_type: 'action',
      resource_id: request.actionId,
      details: {
        executionId: request.executionId,
        parameters: request.parameters,
        result: result,
        duration: Date.now() - request.createdAt.getTime()
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log permission denial for security audit
   */
  private async logPermissionDenial(
    executionId: string,
    action: Action,
    context: ActionContext,
    reason: string
  ): Promise<void> {
    await this.supabase.from('security_log').insert({
      event_type: 'permission_denied',
      user_id: context.userId,
      organization_id: context.organizationId,
      action_id: action.id,
      reason: reason,
      context: {
        executionId,
        requiredPermissions: action.requiredPermissions,
        userPermissions: context.rolePermissions
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log execution errors for debugging
   */
  private async logExecutionError(executionId: string, error: unknown): Promise<void> {
    await this.supabase.from('error_log').insert({
      execution_id: executionId,
      error_type: 'execution_failure',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get action restrictions for organization
   */
  private async getActionRestrictions(
    actionId: string,
    organizationId: string
  ): Promise<ActionRestriction[]> {
    const { data } = await this.supabase
      .from('action_restrictions')
      .select('*')
      .eq('action_id', actionId)
      .eq('organization_id', organizationId)
      .eq('active', true);

    return data || [];
  }

  /**
   * Get organization's data retention policy
   */
  private async getDataRetentionPolicy(
    organizationId: string
  ): Promise<DataRetentionPolicy | null> {
    const { data } = await this.supabase
      .from('organization_policies')
      .select('data_retention_policy')
      .eq('organization_id', organizationId)
      .single();

    return data?.data_retention_policy || null;
  }

  /**
   * Get organization's export policy
   */
  private async getExportPolicy(organizationId: string): Promise<ExportPolicy | null> {
    const { data } = await this.supabase
      .from('organization_policies')
      .select('export_policy')
      .eq('organization_id', organizationId)
      .single();

    return data?.export_policy || null;
  }

  /**
   * Get energy modification limits for organization
   */
  private async getEnergyModificationLimits(
    organizationId: string
  ): Promise<EnergyLimits | null> {
    const { data } = await this.supabase
      .from('organization_policies')
      .select('energy_modification_limits')
      .eq('organization_id', organizationId)
      .single();

    return data?.energy_modification_limits || null;
  }

  /**
   * Send confirmation notification to user
   */
  private async sendConfirmationNotification(request: ExecutionRequest): Promise<void> {
    // This would integrate with your notification service
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create error result
   */
  private createErrorResult(executionId: string, message: string): ExecutionResult {
    return {
      executionId,
      status: 'failed',
      message,
      error: true
    };
  }

  /**
   * Confirm a pending action execution
   */
  public async confirmExecution(
    executionId: string,
    userId: string,
    confirmed: boolean
  ): Promise<ExecutionResult> {
    const request = this.executionQueue.get(executionId);
    if (!request) {
      return this.createErrorResult(executionId, 'Execution request not found or expired');
    }

    // Verify the confirming user is the same as the requesting user
    if (request.userId !== userId) {
      return this.createErrorResult(executionId, 'Only the requesting user can confirm this action');
    }

    // Update confirmation status
    await this.supabase
      .from('action_confirmations')
      .update({
        status: confirmed ? 'confirmed' : 'rejected',
        confirmed_at: new Date().toISOString()
      })
      .eq('execution_id', executionId);

    if (!confirmed) {
      this.executionQueue.delete(executionId);
      return {
        executionId,
        status: 'cancelled',
        message: 'Action execution cancelled by user'
      };
    }

    // Execute the confirmed action
    const result = await this.executeAction(request);
    await this.logSuccessfulExecution(request, result);

    return {
      executionId,
      status: 'completed',
      result,
      message: result.message
    };
  }

  /**
   * Get pending confirmations for user
   */
  public async getPendingConfirmations(userId: string): Promise<PendingConfirmation[]> {
    const { data } = await this.supabase
      .from('action_confirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .order('requested_at', { ascending: false });

    return data || [];
  }
}

// Type definitions
interface ExecutionRequest {
  executionId: string;
  actionId: string;
  action: Action;
  parameters: Record<string, any>;
  context: ActionContext;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  userId: string;
  organizationId: string;
}

interface ExecutionResult {
  executionId: string;
  status: 'pending_confirmation' | 'completed' | 'failed' | 'cancelled';
  message: string;
  result?: ActionResult;
  requiresConfirmation?: boolean;
  error?: boolean;
}

interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

interface BoundaryValidationResult {
  valid: boolean;
  reason?: string;
}

interface ActionRestriction {
  type: 'blacklist' | 'whitelist' | 'time_based';
  userIds?: string[];
  reason?: string;
  startTime?: string;
  endTime?: string;
}

interface DataRetentionPolicy {
  earliestAccessDate: string;
  retentionDays: number;
}

interface ExportPolicy {
  restrictedFormats?: string[];
  maxRecordsPerExport?: number;
}

interface EnergyLimits {
  maxReductionPercent: number;
  requiresApproval: boolean;
}

interface RollbackRecord {
  executionId: string;
  actionId: string;
  parameters: Record<string, any>;
  context: ActionContext;
  snapshot: StateSnapshot;
  canRollback: boolean;
  rollbackPlan?: string;
  createdAt: Date;
}

interface StateSnapshot {
  timestamp: Date;
  data: Record<string, any>;
}

interface PendingConfirmation {
  execution_id: string;
  action_id: string;
  parameters: Record<string, any>;
  requested_at: string;
  expires_at: string;
}

// Export singleton instance
export const permissionAwareExecutor = new PermissionAwareExecutor();