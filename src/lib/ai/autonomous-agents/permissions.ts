import { createClient } from '@supabase/supabase-js';
import { AgentTask, AgentCapability } from './agent-framework';

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  organizationId: string;
  task: AgentTask;
  requester: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: Date;
  decidedAt?: Date;
  decidedBy?: string;
  notes?: string;
}

export interface PermissionMatrix {
  agentId: string;
  organizationId: string;
  permissions: Permission[];
  autonomyLevel: number;
  restrictions: string[];
}

export class AgentPermissionSystem {
  private supabase: ReturnType<typeof createClient>;
  private permissionCache: Map<string, PermissionMatrix> = new Map();
  
  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_KEY']!
    );
  }
  
  // Check if an agent has permission to perform an action
  async checkPermission(
    agentId: string,
    organizationId: string,
    action: string,
    resource?: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const matrix = await this.getPermissionMatrix(agentId, organizationId);
    
    // Check if action is explicitly allowed
    const hasPermission = matrix.permissions.some(perm => {
      if (perm.action !== action) return false;
      if (resource && perm.resource !== resource && perm.resource !== '*') return false;
      
      // Check conditions if any
      if (perm.conditions && context) {
        return Object.entries(perm.conditions).every(([key, value]) => 
          context[key] === value
        );
      }
      
      return true;
    });
    
    // Check if action is restricted
    const isRestricted = matrix.restrictions.some(restriction => 
      action.startsWith(restriction) || restriction === '*'
    );
    
    return hasPermission && !isRestricted;
  }
  
  // Get permission matrix for an agent
  async getPermissionMatrix(
    agentId: string,
    organizationId: string
  ): Promise<PermissionMatrix> {
    const cacheKey = `${agentId}-${organizationId}`;
    
    // Check cache
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }
    
    // Load from database
    const { data: config } = await this.supabase
      .from('agent_configs')
      .select('capabilities, max_autonomy_level')
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .single();
      
    if (!config) {
      // Return default restrictive permissions
      return {
        agentId,
        organizationId,
        permissions: [],
        autonomyLevel: 1,
        restrictions: ['*']
      };
    }
    
    // Convert capabilities to permissions
    const permissions = this.capabilitiesToPermissions(config.capabilities as AgentCapability[]);
    
    const matrix: PermissionMatrix = {
      agentId,
      organizationId,
      permissions,
      autonomyLevel: config.max_autonomy_level as number,
      restrictions: this.getRestrictionsForAutonomyLevel(config.max_autonomy_level as number)
    };
    
    // Cache for 5 minutes
    this.permissionCache.set(cacheKey, matrix);
    setTimeout(() => this.permissionCache.delete(cacheKey), 5 * 60 * 1000);
    
    return matrix;
  }
  
  // Convert agent capabilities to permissions
  private capabilitiesToPermissions(capabilities: AgentCapability[]): Permission[] {
    const permissions: Permission[] = [];
    
    for (const capability of capabilities) {
      // Map capability permissions to actions
      for (const perm of capability.requiredPermissions) {
        const [action, resource] = perm.split(':');
        permissions.push({
          action,
          resource: resource || '*'
        });
      }
      
      // Add capability-specific permissions
      switch (capability.name) {
        case 'analyze_metrics':
          permissions.push(
            { action: 'read', resource: 'emissions' },
            { action: 'read', resource: 'targets' },
            { action: 'read', resource: 'energy' }
          );
          break;
          
        case 'generate_reports':
          permissions.push(
            { action: 'read', resource: '*' },
            { action: 'write', resource: 'reports' },
            { action: 'send', resource: 'notifications' }
          );
          break;
          
        case 'optimize_operations':
          permissions.push(
            { action: 'read', resource: '*' },
            { action: 'write', resource: 'recommendations' },
            { action: 'execute', resource: 'optimizations', conditions: { risk: 'low' } }
          );
          break;
      }
    }
    
    return permissions;
  }
  
  // Get restrictions based on autonomy level
  private getRestrictionsForAutonomyLevel(level: number): string[] {
    switch (level) {
      case 1: // Minimal autonomy
        return ['execute', 'modify', 'delete', 'send'];
      case 2: // Low autonomy
        return ['modify', 'delete'];
      case 3: // Medium autonomy
        return ['delete'];
      case 4: // High autonomy
        return ['delete:critical'];
      case 5: // Full autonomy
        return [];
      default:
        return ['*']; // Restrict everything by default
    }
  }
  
  // Request approval for a task
  async requestApproval(
    agentId: string,
    organizationId: string,
    task: AgentTask,
    reason?: string
  ): Promise<ApprovalRequest> {
    const _request = {
      agent_id: agentId,
      organization_id: organizationId,
      task,
      status: 'pending',
      requested_at: new Date().toISOString(),
      reason
    };
    
    const { data, error } = await this.supabase
      .from('agent_approvals')
      .insert(request)
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create approval request: ${error?.message}`);
    }
    
    // Send notification to approvers
    await this.notifyApprovers(organizationId, data);
    
    return {
      id: data.id as string,
      agentId: data.agent_id as string,
      organizationId: data.organization_id as string,
      task: data.task as AgentTask,
      requester: agentId,
      status: data.status as 'pending' | 'approved' | 'rejected' | 'expired',
      requestedAt: new Date(data.created_at as string)
    };
  }
  
  // Process approval decision
  async processApproval(
    approvalId: string,
    decision: 'approved' | 'rejected',
    decidedBy: string,
    notes?: string
  ): Promise<void> {
    const { error: _error } = await this.supabase
      .from('agent_approvals')
      .update({
        status: decision,
        approved_by: decidedBy,
        approval_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .eq('status', 'pending'); // Only update if still pending
      
    if (error) {
      throw new Error(`Failed to process approval: ${error.message}`);
    }
  }
  
  // Get pending approvals for an organization
  async getPendingApprovals(organizationId: string): Promise<ApprovalRequest[]> {
    const { data, error } = await this.supabase
      .from('agent_approvals')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (error || !data) {
      return [];
    }
    
    return data.map((approval: any) => ({
      id: approval.id as string,
      agentId: approval.agent_id as string,
      organizationId: approval.organization_id as string,
      task: approval.task as AgentTask,
      requester: approval.agent_id as string,
      status: approval.status as 'pending' | 'approved' | 'rejected' | 'expired',
      requestedAt: new Date(approval.created_at as string)
    }));
  }
  
  // Notify approvers of pending request
  private async notifyApprovers(
    organizationId: string,
    approval: any
  ): Promise<void> {
    // Get users with approval permissions
    const { data: approvers } = await this.supabase
      .from('team_members')
      .select('user_id, role')
      .eq('organization_id', organizationId)
      .in('role', ['account_owner', 'sustainability_manager', 'facility_manager']);
      
    if (!approvers || approvers.length === 0) return;
    
    // Create notifications for each approver
    const notifications = approvers.map(approver => ({
      user_id: approver.user_id,
      type: 'agent_approval_required',
      title: `Agent Approval Required: ${approval.task.type}`,
      message: `The ${approval.agent_id} agent is requesting approval for a ${approval.task.priority} priority task.`,
      data: {
        approvalId: approval.id,
        agentId: approval.agent_id,
        taskType: approval.task.type,
        priority: approval.task.priority
      },
      created_at: new Date().toISOString()
    }));
    
    await this.supabase
      .from('notifications')
      .insert(notifications);
  }
  
  // Check if task requires approval based on risk assessment
  async requiresApproval(
    agentId: string,
    organizationId: string,
    task: AgentTask
  ): Promise<boolean> {
    // Always require approval if explicitly set
    if (task.requiresApproval) return true;
    
    const matrix = await this.getPermissionMatrix(agentId, organizationId);
    
    // Require approval for critical priority tasks at lower autonomy levels
    if (task.priority === 'critical' && matrix.autonomyLevel < 4) {
      return true;
    }
    
    // Check if task type requires approval based on risk
    const highRiskTasks = [
      'modify_targets',
      'execute_optimization',
      'send_external_report',
      'modify_compliance_data'
    ];
    
    if (highRiskTasks.includes(task.type) && matrix.autonomyLevel < 5) {
      return true;
    }
    
    return false;
  }
  
  // Audit log for permission checks
  async logPermissionCheck(
    agentId: string,
    organizationId: string,
    action: string,
    resource: string,
    granted: boolean
  ): Promise<void> {
    await this.supabase
      .from('agent_events')
      .insert({
        agent_id: agentId,
        organization_id: organizationId,
        event: 'permission_check',
        details: {
          action,
          resource,
          granted,
          timestamp: new Date().toISOString()
        }
      });
  }
}