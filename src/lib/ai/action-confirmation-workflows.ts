import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Action, ActionContext } from './action-registry';
import { rollbackManager } from './rollback-manager';

/**
 * Action Confirmation Workflows
 * Manages multi-level approval processes for critical AI actions
 * Implements risk-based confirmation requirements and delegation
 */
export class ActionConfirmationWorkflows {
  private supabase: ReturnType<typeof createClient<Database>>;
  private pendingWorkflows: Map<string, ConfirmationWorkflow> = new Map();
  private workflowRules: Map<string, WorkflowRule[]> = new Map();
  private confirmationTemplates: Map<string, ConfirmationTemplate> = new Map();

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    this.initializeWorkflowRules();
    this.initializeConfirmationTemplates();
  }

  /**
   * Initialize workflow rules for different action categories
   */
  private initializeWorkflowRules() {
    // High-risk actions requiring executive approval
    this.workflowRules.set('high_risk', [
      {
        id: 'exec_approval',
        name: 'Executive Approval Required',
        condition: (action, context, params) => action.riskLevel === 'high',
        requiredApprovers: ['account_owner', 'sustainability_manager'],
        approvalCount: 1,
        timeoutHours: 24,
        escalation: {
          enabled: true,
          escalateAfterHours: 4,
          escalateTo: 'account_owner'
        }
      }
    ]);

    // Financial impact requiring budget approval
    this.workflowRules.set('financial_impact', [
      {
        id: 'budget_approval',
        name: 'Budget Approval Required',
        condition: (action, context, params) => {
          const savings = action.businessImpact.estimatedSavings;
          return savings && Math.abs(savings) > 10000;
        },
        requiredApprovers: ['account_owner', 'sustainability_manager'],
        approvalCount: 2,
        timeoutHours: 48,
        escalation: {
          enabled: true,
          escalateAfterHours: 12,
          escalateTo: 'account_owner'
        }
      }
    ]);

    // Energy system modifications
    this.workflowRules.set('energy_modifications', [
      {
        id: 'facility_approval',
        name: 'Facility Manager Approval',
        condition: (action, context, params) =>
          action.category.name === 'Energy Optimization' &&
          params.target_energy_reduction > 10,
        requiredApprovers: ['facility_manager', 'sustainability_manager'],
        approvalCount: 1,
        timeoutHours: 4,
        escalation: {
          enabled: true,
          escalateAfterHours: 1,
          escalateTo: 'sustainability_manager'
        }
      }
    ]);

    // Compliance and regulatory actions
    this.workflowRules.set('compliance_actions', [
      {
        id: 'compliance_approval',
        name: 'Compliance Team Approval',
        condition: (action, context, params) =>
          action.category.name === 'Advanced Compliance' ||
          action.id.includes('disclosure') ||
          action.id.includes('regulatory'),
        requiredApprovers: ['sustainability_manager', 'account_owner'],
        approvalCount: 2,
        timeoutHours: 72,
        escalation: {
          enabled: false
        }
      }
    ]);

    // Data modification requiring verification
    this.workflowRules.set('data_modifications', [
      {
        id: 'data_approval',
        name: 'Data Modification Approval',
        condition: (action, context, params) =>
          action.id === 'clean_duplicate_data' ||
          action.id === 'import_bulk_data',
        requiredApprovers: ['analyst', 'sustainability_manager'],
        approvalCount: 1,
        timeoutHours: 8,
        verification: {
          required: true,
          method: 'data_preview',
          samples: 10
        }
      }
    ]);

    // Automated workflow changes
    this.workflowRules.set('automation_changes', [
      {
        id: 'automation_approval',
        name: 'Automation Change Approval',
        condition: (action, context, params) =>
          action.category.name === 'Workflow Automation',
        requiredApprovers: ['facility_manager', 'sustainability_manager'],
        approvalCount: 1,
        timeoutHours: 12,
        testMode: {
          enabled: true,
          testDurationHours: 24
        }
      }
    ]);
  }

  /**
   * Initialize confirmation templates for different scenarios
   */
  private initializeConfirmationTemplates() {
    this.confirmationTemplates.set('high_risk', {
      id: 'high_risk',
      title: '⚠️ High-Risk Action Confirmation Required',
      template: `
This action has been classified as HIGH RISK and requires your approval.

**Action:** {{actionName}}
**Requested by:** {{requesterName}}
**Organization:** {{organizationName}}
**Risk Level:** HIGH

**Action Details:**
{{actionDescription}}

**Potential Impact:**
- Business Impact: {{businessImpact}}
- Estimated Duration: {{estimatedDuration}}
- Rollback Available: {{rollbackAvailable}}

**Parameters:**
{{parameters}}

**Reason for Request:**
{{reason}}

Please review carefully before approving.
      `,
      fields: ['actionName', 'requesterName', 'organizationName', 'actionDescription',
               'businessImpact', 'estimatedDuration', 'rollbackAvailable', 'parameters', 'reason']
    });

    this.confirmationTemplates.set('financial_impact', {
      id: 'financial_impact',
      title: '💰 Financial Impact Approval Required',
      template: `
This action has significant financial implications and requires approval.

**Action:** {{actionName}}
**Financial Impact:** {{financialImpact}}
**ROI Period:** {{roiPeriod}}
**Certainty:** {{certainty}}%

**Cost-Benefit Analysis:**
{{costBenefitAnalysis}}

**Budget Allocation:**
{{budgetDetails}}

Please approve if this aligns with budget and strategic objectives.
      `,
      fields: ['actionName', 'financialImpact', 'roiPeriod', 'certainty',
               'costBenefitAnalysis', 'budgetDetails']
    });

    this.confirmationTemplates.set('energy_modification', {
      id: 'energy_modification',
      title: '⚡ Energy System Modification Approval',
      template: `
Energy system modification requires approval for safety and compliance.

**System:** {{systemName}}
**Modification Type:** {{modificationType}}
**Energy Reduction Target:** {{reductionTarget}}%
**Affected Areas:** {{affectedAreas}}

**Safety Considerations:**
{{safetyConsiderations}}

**Rollback Plan:**
{{rollbackPlan}}

Approval indicates you've reviewed safety protocols and impact assessment.
      `,
      fields: ['systemName', 'modificationType', 'reductionTarget', 'affectedAreas',
               'safetyConsiderations', 'rollbackPlan']
    });
  }

  /**
   * Create a confirmation workflow for an action
   */
  public async createWorkflow(
    executionId: string,
    action: Action,
    parameters: Record<string, any>,
    context: ActionContext,
    reason?: string
  ): Promise<ConfirmationWorkflow> {
    // Determine applicable workflow rules
    const applicableRules = this.getApplicableRules(action, context, parameters);

    if (applicableRules.length === 0) {
      throw new Error('No workflow rules applicable for this action');
    }

    // Create workflow
    const workflow: ConfirmationWorkflow = {
      workflowId: this.generateWorkflowId(),
      executionId,
      actionId: action.id,
      status: 'pending',
      createdAt: new Date(),
      createdBy: context.userId,
      organizationId: context.organizationId,
      rules: applicableRules,
      approvals: [],
      currentStep: 0,
      metadata: {
        action,
        parameters,
        context,
        reason: reason || 'No reason provided'
      }
    };

    // Store workflow
    this.pendingWorkflows.set(workflow.workflowId, workflow);

    // Initialize approval steps
    await this.initializeApprovalSteps(workflow);

    // Send initial notifications
    await this.sendApprovalRequests(workflow);

    // Start timeout timer
    this.startTimeoutTimer(workflow);

    // Persist to database
    await this.persistWorkflow(workflow);

    return workflow;
  }

  /**
   * Process an approval response
   */
  public async processApproval(
    workflowId: string,
    approverId: string,
    decision: 'approve' | 'reject',
    comments?: string
  ): Promise<ApprovalResult> {
    const workflow = this.pendingWorkflows.get(workflowId);

    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found or expired'
      };
    }

    // Verify approver is authorized
    const isAuthorized = await this.verifyApprover(workflow, approverId);
    if (!isAuthorized) {
      return {
        success: false,
        message: 'You are not authorized to approve this action'
      };
    }

    // Check if already processed by this approver
    const existingApproval = workflow.approvals.find(a => a.approverId === approverId);
    if (existingApproval) {
      return {
        success: false,
        message: 'You have already responded to this approval request'
      };
    }

    // Record approval
    const approval: Approval = {
      approverId,
      decision,
      comments,
      timestamp: new Date(),
      stepIndex: workflow.currentStep
    };

    workflow.approvals.push(approval);

    // Check if workflow is complete
    const isComplete = await this.checkWorkflowCompletion(workflow);

    if (isComplete) {
      await this.completeWorkflow(workflow);
      return {
        success: true,
        message: 'Workflow completed',
        workflowComplete: true,
        finalDecision: workflow.status === 'approved' ? 'approved' : 'rejected'
      };
    }

    // Check if rejected
    if (decision === 'reject') {
      await this.rejectWorkflow(workflow, approverId, comments);
      return {
        success: true,
        message: 'Action rejected',
        workflowComplete: true,
        finalDecision: 'rejected'
      };
    }

    // Move to next step if needed
    const currentRule = workflow.rules[workflow.currentStep];
    const stepApprovals = workflow.approvals.filter(a =>
      a.stepIndex === workflow.currentStep && a.decision === 'approve'
    );

    if (stepApprovals.length >= currentRule.approvalCount) {
      workflow.currentStep++;
      if (workflow.currentStep < workflow.rules.length) {
        await this.sendApprovalRequests(workflow);
      }
    }

    // Update database
    await this.updateWorkflow(workflow);

    return {
      success: true,
      message: 'Approval recorded',
      workflowComplete: false
    };
  }

  /**
   * Get applicable workflow rules for an action
   */
  private getApplicableRules(
    action: Action,
    context: ActionContext,
    parameters: Record<string, any>
  ): WorkflowRule[] {
    const applicableRules: WorkflowRule[] = [];

    for (const [category, rules] of this.workflowRules) {
      for (const rule of rules) {
        if (rule.condition(action, context, parameters)) {
          applicableRules.push(rule);
        }
      }
    }

    // Sort by priority (financial > compliance > operational)
    return applicableRules.sort((a, b) => {
      const priority: Record<string, number> = {
        'budget_approval': 1,
        'compliance_approval': 2,
        'exec_approval': 3,
        'facility_approval': 4,
        'data_approval': 5,
        'automation_approval': 6
      };
      return (priority[a.id] || 99) - (priority[b.id] || 99);
    });
  }

  /**
   * Initialize approval steps for workflow
   */
  private async initializeApprovalSteps(workflow: ConfirmationWorkflow): Promise<void> {
    for (const rule of workflow.rules) {
      // Get eligible approvers
      const eligibleApprovers = await this.getEligibleApprovers(
        workflow.organizationId,
        rule.requiredApprovers
      );

      // Store eligible approvers for this step
      if (!workflow.eligibleApprovers) {
        workflow.eligibleApprovers = {};
      }
      workflow.eligibleApprovers[rule.id] = eligibleApprovers;

      // Set up verification if required
      if (rule.verification?.required) {
        await this.prepareVerification(workflow, rule);
      }

      // Set up test mode if required
      if (rule.testMode?.enabled) {
        await this.initializeTestMode(workflow, rule);
      }
    }
  }

  /**
   * Send approval requests to eligible approvers
   */
  private async sendApprovalRequests(workflow: ConfirmationWorkflow): Promise<void> {
    const currentRule = workflow.rules[workflow.currentStep];
    const eligibleApprovers = workflow.eligibleApprovers![currentRule.id];

    // Select template based on rule type
    const templateId = this.getTemplateForRule(currentRule);
    const template = this.confirmationTemplates.get(templateId);

    if (!template) return;

    // Generate message from template
    const message = this.generateMessageFromTemplate(template, workflow);

    // Send notifications to each eligible approver
    for (const approver of eligibleApprovers) {
      await this.sendNotification({
        recipientId: approver.id,
        type: 'approval_request',
        title: template.title,
        message,
        workflowId: workflow.workflowId,
        actionId: workflow.actionId,
        urgency: currentRule.timeoutHours < 8 ? 'high' : 'normal',
        expiresAt: new Date(Date.now() + currentRule.timeoutHours * 60 * 60 * 1000)
      });
    }

    // Log notification sent
    await this.logNotificationSent(workflow, eligibleApprovers);
  }

  /**
   * Start timeout timer for workflow
   */
  private startTimeoutTimer(workflow: ConfirmationWorkflow): void {
    const currentRule = workflow.rules[workflow.currentStep];
    const timeoutMs = currentRule.timeoutHours * 60 * 60 * 1000;

    setTimeout(async () => {
      const currentWorkflow = this.pendingWorkflows.get(workflow.workflowId);
      if (currentWorkflow && currentWorkflow.status === 'pending') {
        await this.handleTimeout(currentWorkflow);
      }
    }, timeoutMs);

    // Set up escalation if enabled
    if (currentRule.escalation?.enabled) {
      const escalationMs = currentRule.escalation.escalateAfterHours * 60 * 60 * 1000;
      setTimeout(async () => {
        const currentWorkflow = this.pendingWorkflows.get(workflow.workflowId);
        if (currentWorkflow && currentWorkflow.status === 'pending') {
          await this.escalateWorkflow(currentWorkflow);
        }
      }, escalationMs);
    }
  }

  /**
   * Handle workflow timeout
   */
  private async handleTimeout(workflow: ConfirmationWorkflow): Promise<void> {
    workflow.status = 'timeout';
    workflow.completedAt = new Date();

    // Remove from pending
    this.pendingWorkflows.delete(workflow.workflowId);

    // Notify requester
    await this.sendNotification({
      recipientId: workflow.createdBy,
      type: 'approval_timeout',
      title: 'Approval Request Timed Out',
      message: `Your action "${workflow.metadata.action.name}" has timed out without approval.`,
      workflowId: workflow.workflowId,
      actionId: workflow.actionId,
      urgency: 'normal'
    });

    // Update database
    await this.updateWorkflow(workflow);
  }

  /**
   * Escalate workflow to higher authority
   */
  private async escalateWorkflow(workflow: ConfirmationWorkflow): Promise<void> {
    const currentRule = workflow.rules[workflow.currentStep];
    if (!currentRule.escalation?.escalateTo) return;

    // Get escalation target
    const escalationTargets = await this.getEligibleApprovers(
      workflow.organizationId,
      [currentRule.escalation.escalateTo]
    );

    if (escalationTargets.length === 0) return;

    // Send escalation notification
    for (const target of escalationTargets) {
      await this.sendNotification({
        recipientId: target.id,
        type: 'approval_escalation',
        title: '🚨 Escalated Approval Request',
        message: `An approval request has been escalated to you: "${workflow.metadata.action.name}"`,
        workflowId: workflow.workflowId,
        actionId: workflow.actionId,
        urgency: 'high'
      });
    }

    // Update workflow with escalation
    if (!workflow.escalations) {
      workflow.escalations = [];
    }
    workflow.escalations.push({
      timestamp: new Date(),
      escalatedTo: escalationTargets.map(t => t.id),
      reason: 'Timeout on initial approval'
    });

    await this.updateWorkflow(workflow);
  }

  /**
   * Check if workflow is complete
   */
  private async checkWorkflowCompletion(workflow: ConfirmationWorkflow): Promise<boolean> {
    // Check all rules are satisfied
    for (let i = 0; i <= workflow.currentStep && i < workflow.rules.length; i++) {
      const rule = workflow.rules[i];
      const stepApprovals = workflow.approvals.filter(a =>
        a.stepIndex === i && a.decision === 'approve'
      );

      if (stepApprovals.length < rule.approvalCount) {
        return false;
      }
    }

    // Check if all steps are complete
    return workflow.currentStep >= workflow.rules.length - 1;
  }

  /**
   * Complete the workflow
   */
  private async completeWorkflow(workflow: ConfirmationWorkflow): Promise<void> {
    workflow.status = 'approved';
    workflow.completedAt = new Date();

    // Remove from pending
    this.pendingWorkflows.delete(workflow.workflowId);

    // Notify requester
    await this.sendNotification({
      recipientId: workflow.createdBy,
      type: 'approval_complete',
      title: '✅ Action Approved',
      message: `Your action "${workflow.metadata.action.name}" has been approved and will be executed.`,
      workflowId: workflow.workflowId,
      actionId: workflow.actionId,
      urgency: 'normal'
    });

    // Update database
    await this.updateWorkflow(workflow);
  }

  /**
   * Reject the workflow
   */
  private async rejectWorkflow(
    workflow: ConfirmationWorkflow,
    rejectedBy: string,
    reason?: string
  ): Promise<void> {
    workflow.status = 'rejected';
    workflow.completedAt = new Date();
    workflow.rejectionReason = reason;
    workflow.rejectedBy = rejectedBy;

    // Remove from pending
    this.pendingWorkflows.delete(workflow.workflowId);

    // Notify requester
    await this.sendNotification({
      recipientId: workflow.createdBy,
      type: 'approval_rejected',
      title: '❌ Action Rejected',
      message: `Your action "${workflow.metadata.action.name}" has been rejected. Reason: ${reason || 'No reason provided'}`,
      workflowId: workflow.workflowId,
      actionId: workflow.actionId,
      urgency: 'normal'
    });

    // Update database
    await this.updateWorkflow(workflow);
  }

  /**
   * Verify if user is authorized to approve
   */
  private async verifyApprover(
    workflow: ConfirmationWorkflow,
    approverId: string
  ): Promise<boolean> {
    const currentRule = workflow.rules[workflow.currentStep];
    const eligibleApprovers = workflow.eligibleApprovers![currentRule.id];

    return eligibleApprovers.some(a => a.id === approverId);
  }

  /**
   * Get eligible approvers for roles
   */
  private async getEligibleApprovers(
    organizationId: string,
    requiredRoles: string[]
  ): Promise<Approver[]> {
    const { data } = await this.supabase
      .from('organization_members')
      .select(`
        user_id,
        role,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .in('role', requiredRoles);

    return (data || []).map(member => ({
      id: member.user_id,
      name: member.profiles?.full_name || 'Unknown',
      email: member.profiles?.email || '',
      role: member.role
    }));
  }

  /**
   * Prepare verification data for approval
   */
  private async prepareVerification(
    workflow: ConfirmationWorkflow,
    rule: WorkflowRule
  ): Promise<void> {
    if (!rule.verification) return;

    if (rule.verification.method === 'data_preview') {
      // Generate data preview
      const preview = await this.generateDataPreview(
        workflow.metadata.parameters,
        rule.verification.samples || 10
      );

      if (!workflow.verificationData) {
        workflow.verificationData = {};
      }
      workflow.verificationData[rule.id] = preview;
    }
  }

  /**
   * Initialize test mode for workflow
   */
  private async initializeTestMode(
    workflow: ConfirmationWorkflow,
    rule: WorkflowRule
  ): Promise<void> {
    if (!rule.testMode) return;

    // Create test environment
    const testEnvironment = {
      enabled: true,
      startTime: new Date(),
      endTime: new Date(Date.now() + rule.testMode.testDurationHours * 60 * 60 * 1000),
      parameters: { ...workflow.metadata.parameters, testMode: true }
    };

    if (!workflow.testMode) {
      workflow.testMode = {};
    }
    workflow.testMode[rule.id] = testEnvironment;
  }

  /**
   * Generate data preview for verification
   */
  private async generateDataPreview(
    parameters: Record<string, any>,
    samples: number
  ): Promise<any> {
    // Implementation would generate preview based on parameters
    return {
      sampleCount: samples,
      preview: 'Data preview would be generated here'
    };
  }

  /**
   * Get template for workflow rule
   */
  private getTemplateForRule(rule: WorkflowRule): string {
    const templateMap: Record<string, string> = {
      'exec_approval': 'high_risk',
      'budget_approval': 'financial_impact',
      'facility_approval': 'energy_modification',
      'compliance_approval': 'high_risk',
      'data_approval': 'high_risk',
      'automation_approval': 'high_risk'
    };
    return templateMap[rule.id] || 'high_risk';
  }

  /**
   * Generate message from template
   */
  private generateMessageFromTemplate(
    template: ConfirmationTemplate,
    workflow: ConfirmationWorkflow
  ): string {
    let message = template.template;

    // Replace template variables
    const replacements: Record<string, any> = {
      actionName: workflow.metadata.action.name,
      actionDescription: workflow.metadata.action.description,
      requesterName: 'User', // Would fetch actual name
      organizationName: 'Organization', // Would fetch actual name
      businessImpact: workflow.metadata.action.businessImpact.category,
      estimatedDuration: workflow.metadata.action.estimatedDuration,
      rollbackAvailable: workflow.metadata.action.rollbackPlan ? 'Yes' : 'No',
      parameters: JSON.stringify(workflow.metadata.parameters, null, 2),
      reason: workflow.metadata.reason
    };

    for (const [key, value] of Object.entries(replacements)) {
      message = message.replace(`{{${key}}}`, value);
    }

    return message;
  }

  /**
   * Send notification to user
   */
  private async sendNotification(notification: Notification): Promise<void> {
    await this.supabase.from('notifications').insert({
      recipient_id: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: {
        workflowId: notification.workflowId,
        actionId: notification.actionId
      },
      urgency: notification.urgency,
      expires_at: notification.expiresAt?.toISOString(),
      created_at: new Date().toISOString()
    });
  }

  /**
   * Log notification sent
   */
  private async logNotificationSent(
    workflow: ConfirmationWorkflow,
    recipients: Approver[]
  ): Promise<void> {
    await this.supabase.from('workflow_notifications').insert({
      workflow_id: workflow.workflowId,
      recipients: recipients.map(r => r.id),
      sent_at: new Date().toISOString(),
      rule_id: workflow.rules[workflow.currentStep].id
    });
  }

  /**
   * Persist workflow to database
   */
  private async persistWorkflow(workflow: ConfirmationWorkflow): Promise<void> {
    await this.supabase.from('confirmation_workflows').insert({
      workflow_id: workflow.workflowId,
      execution_id: workflow.executionId,
      action_id: workflow.actionId,
      organization_id: workflow.organizationId,
      created_by: workflow.createdBy,
      status: workflow.status,
      workflow_data: workflow,
      created_at: workflow.createdAt.toISOString()
    });
  }

  /**
   * Update workflow in database
   */
  private async updateWorkflow(workflow: ConfirmationWorkflow): Promise<void> {
    await this.supabase
      .from('confirmation_workflows')
      .update({
        status: workflow.status,
        workflow_data: workflow,
        completed_at: workflow.completedAt?.toISOString()
      })
      .eq('workflow_id', workflow.workflowId);
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get pending workflows for user
   */
  public async getPendingWorkflows(userId: string): Promise<ConfirmationWorkflow[]> {
    const workflows: ConfirmationWorkflow[] = [];

    for (const workflow of this.pendingWorkflows.values()) {
      const currentRule = workflow.rules[workflow.currentStep];
      const eligibleApprovers = workflow.eligibleApprovers![currentRule.id];

      if (eligibleApprovers.some(a => a.id === userId)) {
        workflows.push(workflow);
      }
    }

    return workflows;
  }

  /**
   * Get workflow status
   */
  public async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus | null> {
    const workflow = this.pendingWorkflows.get(workflowId);

    if (!workflow) {
      // Try to load from database
      const { data } = await this.supabase
        .from('confirmation_workflows')
        .select('workflow_data')
        .eq('workflow_id', workflowId)
        .single();

      if (!data) return null;

      return {
        workflowId,
        status: data.workflow_data.status,
        currentStep: data.workflow_data.currentStep,
        totalSteps: data.workflow_data.rules.length,
        approvals: data.workflow_data.approvals,
        createdAt: data.workflow_data.createdAt,
        completedAt: data.workflow_data.completedAt
      };
    }

    return {
      workflowId,
      status: workflow.status,
      currentStep: workflow.currentStep,
      totalSteps: workflow.rules.length,
      approvals: workflow.approvals,
      createdAt: workflow.createdAt,
      completedAt: workflow.completedAt
    };
  }
}

// Type Definitions
interface ConfirmationWorkflow {
  workflowId: string;
  executionId: string;
  actionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  createdAt: Date;
  createdBy: string;
  organizationId: string;
  rules: WorkflowRule[];
  approvals: Approval[];
  currentStep: number;
  completedAt?: Date;
  rejectionReason?: string;
  rejectedBy?: string;
  metadata: {
    action: Action;
    parameters: Record<string, any>;
    context: ActionContext;
    reason: string;
  };
  eligibleApprovers?: Record<string, Approver[]>;
  verificationData?: Record<string, any>;
  testMode?: Record<string, any>;
  escalations?: Escalation[];
}

interface WorkflowRule {
  id: string;
  name: string;
  condition: (action: Action, context: ActionContext, params: Record<string, any>) => boolean;
  requiredApprovers: string[];
  approvalCount: number;
  timeoutHours: number;
  escalation?: {
    enabled: boolean;
    escalateAfterHours: number;
    escalateTo: string;
  };
  verification?: {
    required: boolean;
    method: string;
    samples?: number;
  };
  testMode?: {
    enabled: boolean;
    testDurationHours: number;
  };
}

interface Approval {
  approverId: string;
  decision: 'approve' | 'reject';
  comments?: string;
  timestamp: Date;
  stepIndex: number;
}

interface Approver {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ConfirmationTemplate {
  id: string;
  title: string;
  template: string;
  fields: string[];
}

interface Notification {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  workflowId?: string;
  actionId?: string;
  urgency: 'low' | 'normal' | 'high';
  expiresAt?: Date;
}

interface Escalation {
  timestamp: Date;
  escalatedTo: string[];
  reason: string;
}

interface ApprovalResult {
  success: boolean;
  message: string;
  workflowComplete?: boolean;
  finalDecision?: 'approved' | 'rejected';
}

interface WorkflowStatus {
  workflowId: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  approvals: Approval[];
  createdAt: Date;
  completedAt?: Date;
}

// Export singleton instance
export const actionConfirmationWorkflows = new ActionConfirmationWorkflows();