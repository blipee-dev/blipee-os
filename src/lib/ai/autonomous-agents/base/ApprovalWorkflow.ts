/**
 * ApprovalWorkflow - Human-AI Collaboration System
 * 
 * Manages approval workflows for autonomous agent decisions requiring human oversight.
 * Enables seamless collaboration between AI employees and human stakeholders.
 * 
 * Revolutionary human-AI hybrid intelligence for sustainability management.
 */

import { createClient } from '../utils/supabase-stub';
import { Decision } from './AutonomousAgent';

export interface ApprovalRequest {
  id: string;
  taskId: string;
  agentName: string;
  decision: Decision;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string[];
  requestedAt: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  stakeholders: string[]; // User IDs who can approve
  requiredApprovals: number; // Number of approvals needed
  autoExpiry?: Date; // Auto-reject if no response by this time
  context: {
    organizationId: string;
    buildingId?: string;
    impactEstimate: {
      financial?: number;
      environmental?: number;
      compliance?: number;
      reputation?: number;
    };
  };
}

export interface ApprovalResponse {
  id: string;
  requestId: string;
  approverId: string;
  approved: boolean;
  reason?: string;
  conditions?: string[];
  respondedAt: Date;
  delegatedTo?: string;
}

export interface ApprovalDecision {
  approved: boolean;
  reason?: string;
  conditions?: string[];
  finalApproverId?: string;
  approvalChain: ApprovalResponse[];
  decidedAt: Date;
}

export interface ApprovalRule {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  conditions: ApprovalCondition[];
  approvers: ApprovalApprover[];
  requiredApprovals: number;
  timeoutHours: number;
  escalationChain?: string[];
  isActive: boolean;
}

export interface ApprovalCondition {
  type: 'risk_level' | 'financial_impact' | 'agent_type' | 'decision_type' | 'environmental_impact';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface ApprovalApprover {
  userId: string;
  role: string;
  canDelegate: boolean;
  weight: number; // For weighted approval systems
}

export interface ApprovalNotification {
  requestId: string;
  recipientId: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'sms' | 'app' | 'slack' | 'teams')[];
  sentAt: Date;
}

export class ApprovalWorkflow {
  private readonly supabase = createClient();
  private readonly defaultTimeoutHours = 24;
  
  /**
   * Request approval for an agent decision
   */
  async requestApproval(request: Omit<ApprovalRequest, 'id' | 'requestedAt'>): Promise<ApprovalDecision> {
    console.log(`🤝 Requesting approval for ${request.agentName} decision`);
    
    const approvalRequest: ApprovalRequest = {
      ...request,
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestedAt: new Date()
    };
    
    try {
      // 1. Find applicable approval rules
      const rules = await this.findApplicableRules(approvalRequest);
      
      // 2. Determine stakeholders and requirements
      const { stakeholders, requiredApprovals, timeoutHours } = this.determineApprovalRequirements(
        approvalRequest,
        rules
      );
      
      // 3. Store approval request
      await this.storeApprovalRequest({
        ...approvalRequest,
        stakeholders,
        requiredApprovals,
        autoExpiry: new Date(Date.now() + timeoutHours * 60 * 60 * 1000)
      });
      
      // 4. Send notifications to stakeholders
      await this.sendApprovalNotifications(approvalRequest, stakeholders);
      
      // 5. Wait for approval or timeout (in real implementation, this would be event-driven)
      const decision = await this.waitForApproval(approvalRequest.id, timeoutHours);
      
      console.log(`✅ Approval ${decision.approved ? 'granted' : 'denied'} for ${request.agentName}`);
      
      return decision;
      
    } catch (error) {
      console.error('Error in approval workflow:', error);
      
      // Default to requiring approval
      return {
        approved: false,
        reason: 'Approval workflow error - manual review required',
        approvalChain: [],
        decidedAt: new Date()
      };
    }
  }
  
  /**
   * Submit an approval response
   */
  async submitApproval(
    requestId: string,
    approverId: string,
    approved: boolean,
    reason?: string,
    conditions?: string[]
  ): Promise<boolean> {
    console.log(`📝 Processing approval response for request ${requestId}`);
    
    try {
      // Get approval request
      const request = await this.getApprovalRequest(requestId);
      if (!request) {
        throw new Error('Approval request not found');
      }
      
      // Check if user is authorized to approve
      if (!request.stakeholders.includes(approverId)) {
        throw new Error('User not authorized to approve this request');
      }
      
      // Create approval response
      const response: ApprovalResponse = {
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        approverId,
        approved,
        reason,
        conditions,
        respondedAt: new Date()
      };
      
      // Store response
      await this.storeApprovalResponse(response);
      
      // Check if we have enough approvals
      const allResponses = await this.getApprovalResponses(requestId);
      const approvals = allResponses.filter(r => r.approved).length;
      
      if (approvals >= request.requiredApprovals) {
        // Mark as approved
        await this.finalizeApproval(requestId, true, response.approverId);
        console.log(`✅ Request ${requestId} approved (${approvals}/${request.requiredApprovals} approvals)`);
      } else {
        // Check if any rejection makes it final
        const rejections = allResponses.filter(r => !r.approved).length;
        const remainingStakeholders = request.stakeholders.length - allResponses.length;
        
        if (approvals + remainingStakeholders < request.requiredApprovals) {
          // Not enough potential approvals left
          await this.finalizeApproval(requestId, false, response.approverId);
          console.log(`❌ Request ${requestId} rejected (insufficient approvals)`);
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Error submitting approval:', error);
      return false;
    }
  }
  
  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId: string, organizationId: string): Promise<ApprovalRequest[]> {
    try {
      const { data, error } = await this.supabase
        .from('agent_approval_requests')
        .select(`
          *,
          approval_responses (*)
        `)
        .eq('context->organizationId', organizationId)
        .contains('stakeholders', [userId])
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(this.mapDatabaseToApprovalRequest);
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return [];
    }
  }
  
  /**
   * Get approval history for an organization
   */
  async getApprovalHistory(
    organizationId: string,
    limit: number = 50
  ): Promise<(ApprovalRequest & { decision?: ApprovalDecision })[]> {
    try {
      const { data, error } = await this.supabase
        .from('agent_approval_requests')
        .select(`
          *,
          approval_responses (*),
          approval_decisions (*)
        `)
        .eq('context->organizationId', organizationId)
        .order('requested_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...this.mapDatabaseToApprovalRequest(item),
        decision: item.approval_decisions?.[0] ? {
          approved: item.approval_decisions[0].approved,
          reason: item.approval_decisions[0].reason,
          conditions: item.approval_decisions[0].conditions,
          finalApproverId: item.approval_decisions[0].final_approver_id,
          approvalChain: item.approval_responses || [],
          decidedAt: new Date(item.approval_decisions[0].decided_at)
        } : undefined
      }));
    } catch (error) {
      console.error('Error getting approval history:', error);
      return [];
    }
  }
  
  /**
   * Create or update approval rules for an organization
   */
  async manageApprovalRules(
    organizationId: string,
    rules: Omit<ApprovalRule, 'id' | 'organizationId'>[]
  ): Promise<ApprovalRule[]> {
    console.log(`⚙️ Managing ${rules.length} approval rules for organization ${organizationId}`);
    
    try {
      const rulesToStore = rules.map(rule => ({
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organization_id: organizationId,
        name: rule.name,
        description: rule.description,
        conditions: rule.conditions,
        approvers: rule.approvers,
        required_approvals: rule.requiredApprovals,
        timeout_hours: rule.timeoutHours,
        escalation_chain: rule.escalationChain,
        is_active: rule.isActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { data, error } = await this.supabase
        .from('agent_approval_rules')
        .upsert(rulesToStore)
        .select();
      
      if (error) throw error;
      
      return (data || []).map(this.mapDatabaseToApprovalRule);
    } catch (error) {
      console.error('Error managing approval rules:', error);
      return [];
    }
  }
  
  /**
   * Get approval statistics for an organization
   */
  async getApprovalStats(organizationId: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    averageResponseTime: number; // hours
    approvalRate: number; // percentage
    topRequesters: { agentName: string; count: number }[];
  }> {
    try {
      const { data, error } = await this.supabase
        .from('agent_approval_requests')
        .select(`
          *,
          approval_decisions (*)
        `)
        .eq('context->organizationId', organizationId)
        .gte('requested_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
      if (error) throw error;
      
      const requests = data || [];
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      const approvedRequests = requests.filter(r => 
        r.approval_decisions?.[0]?.approved === true
      ).length;
      const rejectedRequests = requests.filter(r => 
        r.approval_decisions?.[0]?.approved === false
      ).length;
      
      // Calculate average response time
      const completedRequests = requests.filter(r => r.approval_decisions?.[0]);
      const responseTimes = completedRequests.map(r => {
        const requested = new Date(r.requested_at).getTime();
        const decided = new Date(r.approval_decisions[0].decided_at).getTime();
        return (decided - requested) / (1000 * 60 * 60); // hours
      });
      
      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;
      
      const approvalRate = totalRequests > 0
        ? (approvedRequests / totalRequests) * 100
        : 0;
      
      // Top requesters
      const requesterCounts: Record<string, number> = {};
      requests.forEach(r => {
        requesterCounts[r.agent_name] = (requesterCounts[r.agent_name] || 0) + 1;
      });
      
      const topRequesters = Object.entries(requesterCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([agentName, count]) => ({ agentName, count }));
      
      return {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        averageResponseTime,
        approvalRate,
        topRequesters
      };
      
    } catch (error) {
      console.error('Error getting approval stats:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        averageResponseTime: 0,
        approvalRate: 0,
        topRequesters: []
      };
    }
  }
  
  /**
   * Find applicable approval rules for a request
   */
  private async findApplicableRules(request: ApprovalRequest): Promise<ApprovalRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('agent_approval_rules')
        .select('*')
        .eq('organization_id', request.context.organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const rules = (data || []).map(this.mapDatabaseToApprovalRule);
      
      return rules.filter(rule => this.ruleApplies(rule, request));
    } catch (error) {
      console.error('Error finding approval rules:', error);
      return [];
    }
  }
  
  /**
   * Check if a rule applies to a request
   */
  private ruleApplies(rule: ApprovalRule, request: ApprovalRequest): boolean {
    return rule.conditions.every(condition => {
      let value;
      
      switch (condition.type) {
        case 'risk_level':
          value = request.riskLevel;
          break;
        case 'financial_impact':
          value = Math.abs(request.context.impactEstimate.financial || 0);
          break;
        case 'environmental_impact':
          value = Math.abs(request.context.impactEstimate.environmental || 0);
          break;
        case 'agent_type':
          value = request.agentName;
          break;
        case 'decision_type':
          value = request.decision.type;
          break;
        default:
          return true;
      }
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        case 'contains':
          return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
        default:
          return true;
      }
    });
  }
  
  /**
   * Determine approval requirements based on rules
   */
  private determineApprovalRequirements(
    request: ApprovalRequest,
    rules: ApprovalRule[]
  ): {
    stakeholders: string[];
    requiredApprovals: number;
    timeoutHours: number;
  } {
    if (rules.length === 0) {
      // Default fallback rules
      return {
        stakeholders: [], // Would need to be populated from organization settings
        requiredApprovals: request.riskLevel === 'critical' ? 2 : 1,
        timeoutHours: this.defaultTimeoutHours
      };
    }
    
    // Use the most restrictive rule
    const applicableRule = rules.reduce((most, current) => 
      current.requiredApprovals > most.requiredApprovals ? current : most
    );
    
    return {
      stakeholders: applicableRule.approvers.map(a => a.userId),
      requiredApprovals: applicableRule.requiredApprovals,
      timeoutHours: applicableRule.timeoutHours
    };
  }
  
  /**
   * Store approval request in database
   */
  private async storeApprovalRequest(request: ApprovalRequest): Promise<void> {
    await this.supabase
      .from('agent_approval_requests')
      .insert({
        id: request.id,
        task_id: request.taskId,
        agent_name: request.agentName,
        decision: request.decision,
        risk_level: request.riskLevel,
        reasoning: request.reasoning,
        requested_at: request.requestedAt.toISOString(),
        urgency: request.urgency,
        stakeholders: request.stakeholders,
        required_approvals: request.requiredApprovals,
        auto_expiry: request.autoExpiry?.toISOString(),
        context: request.context,
        status: 'pending'
      });
  }
  
  /**
   * Send notifications to stakeholders
   */
  private async sendApprovalNotifications(
    request: ApprovalRequest,
    stakeholders: string[]
  ): Promise<void> {
    // This would integrate with notification system (email, Slack, etc.)
    console.log(`📧 Sending approval notifications to ${stakeholders.length} stakeholders`);
    
    const notifications = stakeholders.map(stakeholderId => ({
      request_id: request.id,
      recipient_id: stakeholderId,
      message: `Approval required: ${request.agentName} requests approval for ${request.decision.description}`,
      urgency: request.urgency,
      channels: ['app', 'email'] as const,
      sent_at: new Date().toISOString()
    }));
    
    try {
      await this.supabase
        .from('agent_approval_notifications')
        .insert(notifications);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }
  
  /**
   * Wait for approval decision (simplified implementation)
   */
  private async waitForApproval(
    requestId: string,
    timeoutHours: number
  ): Promise<ApprovalDecision> {
    // In a real implementation, this would be event-driven
    // For now, return a default decision
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate wait
    
    return {
      approved: false,
      reason: 'Waiting for human approval - this is a simplified implementation',
      approvalChain: [],
      decidedAt: new Date()
    };
  }
  
  // Database mapping helpers
  private getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    // Implementation would fetch from database
    return Promise.resolve(null);
  }
  
  private storeApprovalResponse(response: ApprovalResponse): Promise<void> {
    return this.supabase
      .from('agent_approval_responses')
      .insert({
        id: response.id,
        request_id: response.requestId,
        approver_id: response.approverId,
        approved: response.approved,
        reason: response.reason,
        conditions: response.conditions,
        responded_at: response.respondedAt.toISOString(),
        delegated_to: response.delegatedTo
      })
      .then(() => {});
  }
  
  private getApprovalResponses(requestId: string): Promise<ApprovalResponse[]> {
    return this.supabase
      .from('agent_approval_responses')
      .select('*')
      .eq('request_id', requestId)
      .then(({ data }) => (data || []).map(this.mapDatabaseToApprovalResponse));
  }
  
  private async finalizeApproval(
    requestId: string,
    approved: boolean,
    finalApproverId: string
  ): Promise<void> {
    await Promise.all([
      this.supabase
        .from('agent_approval_requests')
        .update({ status: approved ? 'approved' : 'rejected' })
        .eq('id', requestId),
      
      this.supabase
        .from('agent_approval_decisions')
        .insert({
          request_id: requestId,
          approved,
          final_approver_id: finalApproverId,
          decided_at: new Date().toISOString()
        })
    ]);
  }
  
  // Mapping functions
  private mapDatabaseToApprovalRequest(data: any): ApprovalRequest {
    return {
      id: data.id,
      taskId: data.task_id,
      agentName: data.agent_name,
      decision: data.decision,
      riskLevel: data.risk_level,
      reasoning: data.reasoning,
      requestedAt: new Date(data.requested_at),
      urgency: data.urgency,
      stakeholders: data.stakeholders,
      requiredApprovals: data.required_approvals,
      autoExpiry: data.auto_expiry ? new Date(data.auto_expiry) : undefined,
      context: data.context
    };
  }
  
  private mapDatabaseToApprovalResponse(data: any): ApprovalResponse {
    return {
      id: data.id,
      requestId: data.request_id,
      approverId: data.approver_id,
      approved: data.approved,
      reason: data.reason,
      conditions: data.conditions,
      respondedAt: new Date(data.responded_at),
      delegatedTo: data.delegated_to
    };
  }
  
  private mapDatabaseToApprovalRule(data: any): ApprovalRule {
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      conditions: data.conditions,
      approvers: data.approvers,
      requiredApprovals: data.required_approvals,
      timeoutHours: data.timeout_hours,
      escalationChain: data.escalation_chain,
      isActive: data.is_active
    };
  }
}