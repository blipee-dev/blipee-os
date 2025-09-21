/**
 * Universal AI Action Registry
 * Core capability mapping for all AI-executable actions
 */

import { z } from 'zod';

// Action types
export enum ActionType {
  // Navigation
  NAVIGATE_TO_PAGE = 'navigate_to_page',
  NAVIGATE_TO_SECTION = 'navigate_to_section',
  OPEN_MODAL = 'open_modal',
  CLOSE_MODAL = 'close_modal',

  // Data Management
  CREATE_ENTITY = 'create_entity',
  UPDATE_ENTITY = 'update_entity',
  DELETE_ENTITY = 'delete_entity',
  FETCH_DATA = 'fetch_data',

  // Analysis
  ANALYZE_EMISSIONS = 'analyze_emissions',
  COMPARE_PERIODS = 'compare_periods',
  GENERATE_FORECAST = 'generate_forecast',
  IDENTIFY_ANOMALIES = 'identify_anomalies',

  // Automation
  SCHEDULE_TASK = 'schedule_task',
  CREATE_WORKFLOW = 'create_workflow',
  TRIGGER_AUTOMATION = 'trigger_automation',

  // Compliance
  CHECK_COMPLIANCE = 'check_compliance',
  GENERATE_REPORT = 'generate_report',
  SUBMIT_FILING = 'submit_filing',
  TRACK_DEADLINE = 'track_deadline',

  // Reporting
  CREATE_REPORT = 'create_report',
  EXPORT_DATA = 'export_data',
  SHARE_DASHBOARD = 'share_dashboard',
  SEND_NOTIFICATION = 'send_notification'
}

// Permission levels
export enum PermissionLevel {
  PUBLIC = 'public',
  VIEWER = 'viewer',
  ANALYST = 'analyst',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Action status
export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REQUIRES_CONFIRMATION = 'requires_confirmation'
}

// Base action interface
export interface AIAction {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  category: 'navigation' | 'data' | 'analysis' | 'automation' | 'compliance' | 'reporting';
  requiredPermission: PermissionLevel;
  parameters: z.ZodSchema<any>;
  validator?: (params: any) => Promise<boolean>;
  executor: (params: any, context: ActionContext) => Promise<ActionResult>;
  rollback?: (params: any, context: ActionContext) => Promise<void>;
  confirmationRequired: boolean;
  estimatedDuration?: number; // milliseconds
  cost?: number; // AI tokens or monetary cost
  tags?: string[];
}

// Action context
export interface ActionContext {
  userId: string;
  organizationId: string;
  userRole: string;
  permissions: string[];
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Action result
export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  cost?: number;
  affectedEntities?: string[];
  nextActions?: string[];
  rollbackable?: boolean;
}

// Action execution request
export interface ActionRequest {
  actionId: string;
  parameters: Record<string, any>;
  context: ActionContext;
  confirmationToken?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

// Action history
export interface ActionHistory {
  id: string;
  actionId: string;
  userId: string;
  organizationId: string;
  status: ActionStatus;
  startTime: Date;
  endTime?: Date;
  result?: ActionResult;
  rollbackedAt?: Date;
  rollbackReason?: string;
}

/**
 * Action Registry Class
 * Manages all available AI actions
 */
export class ActionRegistry {
  private actions: Map<string, AIAction> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private permissionIndex: Map<PermissionLevel, Set<string>> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Register a new action
   */
  registerAction(action: AIAction): void {
    this.actions.set(action.id, action);

    // Update category index
    if (!this.categoryIndex.has(action.category)) {
      this.categoryIndex.set(action.category, new Set());
    }
    this.categoryIndex.get(action.category)!.add(action.id);

    // Update permission index
    if (!this.permissionIndex.has(action.requiredPermission)) {
      this.permissionIndex.set(action.requiredPermission, new Set());
    }
    this.permissionIndex.get(action.requiredPermission)!.add(action.id);
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): AIAction | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Get all actions for a category
   */
  getActionsByCategory(category: string): AIAction[] {
    const actionIds = this.categoryIndex.get(category);
    if (!actionIds) return [];

    return Array.from(actionIds)
      .map(id => this.actions.get(id))
      .filter(Boolean) as AIAction[];
  }

  /**
   * Get actions available for a permission level
   */
  getActionsForPermission(permission: PermissionLevel): AIAction[] {
    const allowedPermissions = this.getPermissionHierarchy(permission);
    const actionIds = new Set<string>();

    allowedPermissions.forEach(perm => {
      const ids = this.permissionIndex.get(perm);
      if (ids) {
        ids.forEach(id => actionIds.add(id));
      }
    });

    return Array.from(actionIds)
      .map(id => this.actions.get(id))
      .filter(Boolean) as AIAction[];
  }

  /**
   * Search actions by query
   */
  searchActions(query: string): AIAction[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.actions.values()).filter(action =>
      action.name.toLowerCase().includes(lowerQuery) ||
      action.description.toLowerCase().includes(lowerQuery) ||
      action.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Validate action parameters
   */
  async validateAction(actionId: string, parameters: any): Promise<{ valid: boolean; errors?: string[] }> {
    const action = this.actions.get(actionId);
    if (!action) {
      return { valid: false, errors: ['Action not found'] };
    }

    try {
      // Zod validation
      const result = action.parameters.safeParse(parameters);
      if (!result.success) {
        return {
          valid: false,
          errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }

      // Custom validation
      if (action.validator) {
        const isValid = await action.validator(parameters);
        if (!isValid) {
          return { valid: false, errors: ['Custom validation failed'] };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, errors: [error instanceof Error ? error.message : 'Validation error'] };
    }
  }

  /**
   * Get permission hierarchy
   */
  private getPermissionHierarchy(permission: PermissionLevel): PermissionLevel[] {
    const hierarchy: PermissionLevel[] = [PermissionLevel.PUBLIC];

    switch (permission) {
      case PermissionLevel.SUPER_ADMIN:
        hierarchy.push(
          PermissionLevel.VIEWER,
          PermissionLevel.ANALYST,
          PermissionLevel.MANAGER,
          PermissionLevel.ADMIN,
          PermissionLevel.SUPER_ADMIN
        );
        break;
      case PermissionLevel.ADMIN:
        hierarchy.push(
          PermissionLevel.VIEWER,
          PermissionLevel.ANALYST,
          PermissionLevel.MANAGER,
          PermissionLevel.ADMIN
        );
        break;
      case PermissionLevel.MANAGER:
        hierarchy.push(
          PermissionLevel.VIEWER,
          PermissionLevel.ANALYST,
          PermissionLevel.MANAGER
        );
        break;
      case PermissionLevel.ANALYST:
        hierarchy.push(
          PermissionLevel.VIEWER,
          PermissionLevel.ANALYST
        );
        break;
      case PermissionLevel.VIEWER:
        hierarchy.push(PermissionLevel.VIEWER);
        break;
    }

    return hierarchy;
  }

  /**
   * Initialize registry with default actions
   */
  private initializeRegistry(): void {
    // This will be populated with all available actions
    // We'll add specific actions in separate files
  }

  /**
   * Export action catalog for AI
   */
  exportCatalog(): {
    actions: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      parameters: string;
      examples?: string[];
    }>;
    categories: string[];
    totalActions: number;
  } {
    const actions = Array.from(this.actions.values()).map(action => ({
      id: action.id,
      name: action.name,
      description: action.description,
      category: action.category,
      parameters: JSON.stringify(action.parameters._def),
      examples: action.tags
    }));

    return {
      actions,
      categories: Array.from(this.categoryIndex.keys()),
      totalActions: this.actions.size
    };
  }
}

// Export singleton instance
export const actionRegistry = new ActionRegistry();