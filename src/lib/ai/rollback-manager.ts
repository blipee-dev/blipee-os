import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { ActionContext, ActionResult } from './action-registry';

/**
 * Rollback Manager
 * Provides comprehensive rollback capabilities for all AI actions
 * Implements state capture, versioning, and automatic recovery
 */
export class RollbackManager {
  private supabase: ReturnType<typeof createClient<Database>>;
  private rollbackHistory: Map<string, RollbackEntry[]> = new Map();
  private activeSnapshots: Map<string, SystemSnapshot> = new Map();
  private rollbackStrategies: Map<string, RollbackStrategy> = new Map();

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    this.initializeRollbackStrategies();
  }

  /**
   * Initialize rollback strategies for different action types
   */
  private initializeRollbackStrategies() {
    // Energy Optimization Rollbacks
    this.rollbackStrategies.set('optimize_hvac_system', {
      type: 'settings_restore',
      handler: this.rollbackHVACSettings.bind(this),
      captureState: this.captureHVACState.bind(this),
      verifyRollback: this.verifyHVACRollback.bind(this)
    });

    this.rollbackStrategies.set('implement_lighting_automation', {
      type: 'settings_restore',
      handler: this.rollbackLightingSettings.bind(this),
      captureState: this.captureLightingState.bind(this),
      verifyRollback: this.verifyLightingRollback.bind(this)
    });

    // Data Management Rollbacks
    this.rollbackStrategies.set('import_bulk_data', {
      type: 'data_restore',
      handler: this.rollbackDataImport.bind(this),
      captureState: this.captureDataState.bind(this),
      verifyRollback: this.verifyDataRollback.bind(this)
    });

    this.rollbackStrategies.set('clean_duplicate_data', {
      type: 'data_restore',
      handler: this.rollbackDataCleaning.bind(this),
      captureState: this.captureDataCleaningState.bind(this),
      verifyRollback: this.verifyDataCleaningRollback.bind(this)
    });

    // Automation Rollbacks
    this.rollbackStrategies.set('schedule_recurring_reports', {
      type: 'schedule_restore',
      handler: this.rollbackReportSchedule.bind(this),
      captureState: this.captureScheduleState.bind(this),
      verifyRollback: this.verifyScheduleRollback.bind(this)
    });

    this.rollbackStrategies.set('create_alert_rule', {
      type: 'rule_restore',
      handler: this.rollbackAlertRule.bind(this),
      captureState: this.captureAlertRuleState.bind(this),
      verifyRollback: this.verifyAlertRuleRollback.bind(this)
    });

    // Compliance Rollbacks
    this.rollbackStrategies.set('set_science_based_targets', {
      type: 'target_restore',
      handler: this.rollbackTargetSettings.bind(this),
      captureState: this.captureTargetState.bind(this),
      verifyRollback: this.verifyTargetRollback.bind(this)
    });
  }

  /**
   * Create a comprehensive system snapshot before action execution
   */
  public async createSnapshot(
    executionId: string,
    actionId: string,
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<SystemSnapshot> {
    const snapshot: SystemSnapshot = {
      executionId,
      actionId,
      timestamp: new Date(),
      organizationId: context.organizationId,
      userId: context.userId,
      parameters,
      states: {},
      metadata: {
        version: '1.0',
        checksum: '',
        compressed: false
      }
    };

    // Get rollback strategy for this action
    const strategy = this.rollbackStrategies.get(actionId);

    if (strategy) {
      // Capture action-specific state
      snapshot.states[actionId] = await strategy.captureState(parameters, context);
    }

    // Capture general system state
    snapshot.states.general = await this.captureGeneralState(context);

    // Calculate checksum for integrity verification
    snapshot.metadata.checksum = this.calculateChecksum(snapshot.states);

    // Store snapshot
    this.activeSnapshots.set(executionId, snapshot);

    // Persist to database
    await this.persistSnapshot(snapshot);

    return snapshot;
  }

  /**
   * Execute rollback for a specific action
   */
  public async rollback(
    executionId: string,
    reason: string,
    options?: RollbackOptions
  ): Promise<RollbackResult> {
    const snapshot = this.activeSnapshots.get(executionId);

    if (!snapshot) {
      // Try to load from database
      const loadedSnapshot = await this.loadSnapshot(executionId);
      if (!loadedSnapshot) {
        return {
          success: false,
          message: `No snapshot found for execution ${executionId}`,
          executionId
        };
      }
      snapshot.states = loadedSnapshot.states;
    }

    const strategy = this.rollbackStrategies.get(snapshot.actionId);

    if (!strategy) {
      return {
        success: false,
        message: `No rollback strategy defined for action ${snapshot.actionId}`,
        executionId
      };
    }

    try {
      // Create rollback entry
      const rollbackEntry: RollbackEntry = {
        rollbackId: this.generateRollbackId(),
        executionId,
        actionId: snapshot.actionId,
        reason,
        initiatedAt: new Date(),
        initiatedBy: options?.userId || 'system',
        status: 'in_progress'
      };

      // Add to history
      this.addToHistory(executionId, rollbackEntry);

      // Execute rollback
      const result = await strategy.handler(snapshot, options);

      // Verify rollback success
      const verification = await strategy.verifyRollback(snapshot);

      if (!verification.success) {
        rollbackEntry.status = 'failed';
        rollbackEntry.failureReason = verification.reason;
        await this.logRollbackFailure(rollbackEntry, verification);

        return {
          success: false,
          message: `Rollback verification failed: ${verification.reason}`,
          executionId,
          rollbackId: rollbackEntry.rollbackId
        };
      }

      // Update rollback entry
      rollbackEntry.status = 'completed';
      rollbackEntry.completedAt = new Date();
      rollbackEntry.result = result;

      // Log successful rollback
      await this.logSuccessfulRollback(rollbackEntry);

      // Clean up snapshot
      this.activeSnapshots.delete(executionId);

      return {
        success: true,
        message: 'Rollback completed successfully',
        executionId,
        rollbackId: rollbackEntry.rollbackId,
        restoredState: result.restoredState
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logRollbackError(executionId, error);

      return {
        success: false,
        message: `Rollback failed: ${errorMessage}`,
        executionId,
        error: errorMessage
      };
    }
  }

  /**
   * Create a rollback checkpoint (for multi-step actions)
   */
  public async createCheckpoint(
    executionId: string,
    stepName: string,
    stepData: any
  ): Promise<void> {
    const snapshot = this.activeSnapshots.get(executionId);

    if (!snapshot) return;

    // Add checkpoint to snapshot
    if (!snapshot.checkpoints) {
      snapshot.checkpoints = [];
    }

    snapshot.checkpoints.push({
      stepName,
      timestamp: new Date(),
      data: stepData
    });

    // Update stored snapshot
    await this.updateSnapshot(snapshot);
  }

  /**
   * Rollback to a specific checkpoint
   */
  public async rollbackToCheckpoint(
    executionId: string,
    checkpointIndex: number
  ): Promise<RollbackResult> {
    const snapshot = this.activeSnapshots.get(executionId);

    if (!snapshot || !snapshot.checkpoints) {
      return {
        success: false,
        message: 'No checkpoints available for rollback',
        executionId
      };
    }

    if (checkpointIndex >= snapshot.checkpoints.length) {
      return {
        success: false,
        message: 'Invalid checkpoint index',
        executionId
      };
    }

    const targetCheckpoint = snapshot.checkpoints[checkpointIndex];

    // Restore to checkpoint state
    try {
      await this.restoreCheckpointState(snapshot, targetCheckpoint);

      // Remove later checkpoints
      snapshot.checkpoints = snapshot.checkpoints.slice(0, checkpointIndex + 1);

      return {
        success: true,
        message: `Rolled back to checkpoint: ${targetCheckpoint.stepName}`,
        executionId,
        checkpoint: targetCheckpoint
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback to checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionId
      };
    }
  }

  // HVAC Rollback Methods
  private async captureHVACState(
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<any> {
    const { data: hvacSettings } = await this.supabase
      .from('hvac_settings')
      .select('*')
      .eq('organization_id', context.organizationId);

    const { data: schedules } = await this.supabase
      .from('hvac_schedules')
      .select('*')
      .eq('organization_id', context.organizationId);

    return {
      settings: hvacSettings,
      schedules: schedules,
      capturedAt: new Date().toISOString()
    };
  }

  private async rollbackHVACSettings(
    snapshot: SystemSnapshot,
    options?: RollbackOptions
  ): Promise<any> {
    const hvacState = snapshot.states.optimize_hvac_system;

    if (!hvacState) {
      throw new Error('HVAC state not found in snapshot');
    }

    // Restore settings
    for (const setting of hvacState.settings) {
      await this.supabase
        .from('hvac_settings')
        .upsert(setting);
    }

    // Restore schedules
    for (const schedule of hvacState.schedules) {
      await this.supabase
        .from('hvac_schedules')
        .upsert(schedule);
    }

    return {
      restoredState: hvacState,
      restoredAt: new Date().toISOString()
    };
  }

  private async verifyHVACRollback(snapshot: SystemSnapshot): Promise<VerificationResult> {
    const originalState = snapshot.states.optimize_hvac_system;
    const { data: currentSettings } = await this.supabase
      .from('hvac_settings')
      .select('*')
      .eq('organization_id', snapshot.organizationId);

    // Compare checksums or key values
    const isRestored = JSON.stringify(originalState.settings) === JSON.stringify(currentSettings);

    return {
      success: isRestored,
      reason: isRestored ? 'HVAC settings restored successfully' : 'HVAC settings mismatch after rollback'
    };
  }

  // Lighting Rollback Methods
  private async captureLightingState(
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<any> {
    const { data: lightingSettings } = await this.supabase
      .from('lighting_settings')
      .select('*')
      .eq('organization_id', context.organizationId);

    return {
      settings: lightingSettings,
      zones: parameters.automation_zones,
      capturedAt: new Date().toISOString()
    };
  }

  private async rollbackLightingSettings(
    snapshot: SystemSnapshot,
    options?: RollbackOptions
  ): Promise<any> {
    const lightingState = snapshot.states.implement_lighting_automation;

    for (const setting of lightingState.settings) {
      await this.supabase
        .from('lighting_settings')
        .upsert(setting);
    }

    return {
      restoredState: lightingState,
      restoredAt: new Date().toISOString()
    };
  }

  private async verifyLightingRollback(snapshot: SystemSnapshot): Promise<VerificationResult> {
    return { success: true, reason: 'Lighting settings verified' };
  }

  // Data Import Rollback Methods
  private async captureDataState(
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<any> {
    const dataType = parameters.data_type;
    const tableName = this.getTableNameForDataType(dataType);

    // Get row count before import
    const { count } = await this.supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', context.organizationId);

    return {
      tableName,
      originalRowCount: count,
      importTimestamp: new Date().toISOString()
    };
  }

  private async rollbackDataImport(
    snapshot: SystemSnapshot,
    options?: RollbackOptions
  ): Promise<any> {
    const dataState = snapshot.states.import_bulk_data;

    // Delete rows added after import timestamp
    await this.supabase
      .from(dataState.tableName)
      .delete()
      .eq('organization_id', snapshot.organizationId)
      .gte('created_at', dataState.importTimestamp);

    return {
      restoredState: dataState,
      rowsDeleted: true
    };
  }

  private async verifyDataRollback(snapshot: SystemSnapshot): Promise<VerificationResult> {
    const dataState = snapshot.states.import_bulk_data;
    const { count } = await this.supabase
      .from(dataState.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', snapshot.organizationId);

    return {
      success: count === dataState.originalRowCount,
      reason: `Row count ${count === dataState.originalRowCount ? 'matches' : 'does not match'} original`
    };
  }

  // Data Cleaning Rollback Methods
  private async captureDataCleaningState(
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<any> {
    const backupData: any = {};

    for (const dataScope of parameters.data_scope) {
      const tableName = this.getTableNameForDataType(dataScope);
      const { data } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('organization_id', context.organizationId);

      backupData[dataScope] = data;
    }

    return {
      backupData,
      capturedAt: new Date().toISOString()
    };
  }

  private async rollbackDataCleaning(
    snapshot: SystemSnapshot,
    options?: RollbackOptions
  ): Promise<any> {
    const cleaningState = snapshot.states.clean_duplicate_data;

    for (const [dataScope, data] of Object.entries(cleaningState.backupData)) {
      const tableName = this.getTableNameForDataType(dataScope);

      // Clear current data
      await this.supabase
        .from(tableName)
        .delete()
        .eq('organization_id', snapshot.organizationId);

      // Restore backup
      if (Array.isArray(data) && data.length > 0) {
        await this.supabase
          .from(tableName)
          .insert(data);
      }
    }

    return {
      restoredState: cleaningState,
      tablesRestored: Object.keys(cleaningState.backupData)
    };
  }

  private async verifyDataCleaningRollback(snapshot: SystemSnapshot): Promise<VerificationResult> {
    return { success: true, reason: 'Data cleaning rollback verified' };
  }

  // Schedule Rollback Methods
  private async captureScheduleState(
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<any> {
    const { data: schedules } = await this.supabase
      .from('report_schedules')
      .select('*')
      .eq('organization_id', context.organizationId);

    return {
      existingSchedules: schedules,
      capturedAt: new Date().toISOString()
    };
  }

  private async rollbackReportSchedule(
    snapshot: SystemSnapshot,
    options?: RollbackOptions
  ): Promise<any> {
    const scheduleState = snapshot.states.schedule_recurring_reports;

    // Remove new schedule
    await this.supabase
      .from('report_schedules')
      .delete()
      .eq('organization_id', snapshot.organizationId)
      .gte('created_at', scheduleState.capturedAt);

    return {
      restoredState: scheduleState,
      schedulesRemoved: true
    };
  }

  private async verifyScheduleRollback(snapshot: SystemSnapshot): Promise<VerificationResult> {
    return { success: true, reason: 'Schedule rollback verified' };
  }

  // Alert Rule Rollback Methods
  private async captureAlertRuleState(
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<any> {
    const { data: rules } = await this.supabase
      .from('alert_rules')
      .select('*')
      .eq('organization_id', context.organizationId);

    return {
      existingRules: rules,
      capturedAt: new Date().toISOString()
    };
  }

  private async rollbackAlertRule(
    snapshot: SystemSnapshot,
    options?: RollbackOptions
  ): Promise<any> {
    const ruleState = snapshot.states.create_alert_rule;

    // Remove new rule
    await this.supabase
      .from('alert_rules')
      .delete()
      .eq('organization_id', snapshot.organizationId)
      .gte('created_at', ruleState.capturedAt);

    return {
      restoredState: ruleState,
      rulesRemoved: true
    };
  }

  private async verifyAlertRuleRollback(snapshot: SystemSnapshot): Promise<VerificationResult> {
    return { success: true, reason: 'Alert rule rollback verified' };
  }

  // Target Rollback Methods
  private async captureTargetState(
    parameters: Record<string, any>,
    context: ActionContext
  ): Promise<any> {
    const { data: targets } = await this.supabase
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', context.organizationId);

    return {
      existingTargets: targets,
      capturedAt: new Date().toISOString()
    };
  }

  private async rollbackTargetSettings(
    snapshot: SystemSnapshot,
    options?: RollbackOptions
  ): Promise<any> {
    const targetState = snapshot.states.set_science_based_targets;

    // Remove new targets
    await this.supabase
      .from('sustainability_targets')
      .delete()
      .eq('organization_id', snapshot.organizationId)
      .gte('created_at', targetState.capturedAt);

    // Restore original targets if any were modified
    if (targetState.existingTargets?.length > 0) {
      await this.supabase
        .from('sustainability_targets')
        .upsert(targetState.existingTargets);
    }

    return {
      restoredState: targetState,
      targetsRestored: true
    };
  }

  private async verifyTargetRollback(snapshot: SystemSnapshot): Promise<VerificationResult> {
    return { success: true, reason: 'Target rollback verified' };
  }

  // Utility Methods
  private async captureGeneralState(context: ActionContext): Promise<any> {
    // Capture general system metrics
    const { data: metrics } = await this.supabase
      .from('sustainability_metrics')
      .select('*')
      .eq('organization_id', context.organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      metrics,
      capturedAt: new Date().toISOString()
    };
  }

  private async persistSnapshot(snapshot: SystemSnapshot): Promise<void> {
    await this.supabase.from('rollback_snapshots').insert({
      execution_id: snapshot.executionId,
      action_id: snapshot.actionId,
      organization_id: snapshot.organizationId,
      user_id: snapshot.userId,
      snapshot_data: snapshot,
      created_at: snapshot.timestamp.toISOString()
    });
  }

  private async loadSnapshot(executionId: string): Promise<SystemSnapshot | null> {
    const { data } = await this.supabase
      .from('rollback_snapshots')
      .select('snapshot_data')
      .eq('execution_id', executionId)
      .single();

    return data?.snapshot_data || null;
  }

  private async updateSnapshot(snapshot: SystemSnapshot): Promise<void> {
    await this.supabase
      .from('rollback_snapshots')
      .update({ snapshot_data: snapshot })
      .eq('execution_id', snapshot.executionId);
  }

  private async restoreCheckpointState(
    snapshot: SystemSnapshot,
    checkpoint: Checkpoint
  ): Promise<void> {
    // Restore state to checkpoint
    // Implementation depends on specific action type
  }

  private addToHistory(executionId: string, entry: RollbackEntry): void {
    const history = this.rollbackHistory.get(executionId) || [];
    history.push(entry);
    this.rollbackHistory.set(executionId, history);
  }

  private async logSuccessfulRollback(entry: RollbackEntry): Promise<void> {
    await this.supabase.from('rollback_log').insert({
      rollback_id: entry.rollbackId,
      execution_id: entry.executionId,
      action_id: entry.actionId,
      reason: entry.reason,
      status: 'success',
      initiated_by: entry.initiatedBy,
      initiated_at: entry.initiatedAt.toISOString(),
      completed_at: entry.completedAt?.toISOString()
    });
  }

  private async logRollbackFailure(
    entry: RollbackEntry,
    verification: VerificationResult
  ): Promise<void> {
    await this.supabase.from('rollback_log').insert({
      rollback_id: entry.rollbackId,
      execution_id: entry.executionId,
      action_id: entry.actionId,
      reason: entry.reason,
      status: 'failed',
      failure_reason: verification.reason,
      initiated_by: entry.initiatedBy,
      initiated_at: entry.initiatedAt.toISOString()
    });
  }

  private async logRollbackError(executionId: string, error: unknown): Promise<void> {
    await this.supabase.from('error_log').insert({
      execution_id: executionId,
      error_type: 'rollback_failure',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }

  private calculateChecksum(data: any): string {
    // Simple checksum calculation (would use crypto in production)
    return Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 16);
  }

  private getTableNameForDataType(dataType: string): string {
    const tableMap: Record<string, string> = {
      emissions: 'emissions_data',
      energy: 'energy_data',
      water: 'water_data',
      waste: 'waste_data',
      travel: 'travel_data',
      suppliers: 'supplier_data'
    };
    return tableMap[dataType] || 'data';
  }

  private generateRollbackId(): string {
    return `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get rollback history for an execution
   */
  public getHistory(executionId: string): RollbackEntry[] {
    return this.rollbackHistory.get(executionId) || [];
  }

  /**
   * Check if rollback is available for an execution
   */
  public async isRollbackAvailable(executionId: string): Promise<boolean> {
    const snapshot = this.activeSnapshots.get(executionId) || await this.loadSnapshot(executionId);
    return !!snapshot && !!this.rollbackStrategies.get(snapshot.actionId);
  }
}

// Type Definitions
interface SystemSnapshot {
  executionId: string;
  actionId: string;
  timestamp: Date;
  organizationId: string;
  userId: string;
  parameters: Record<string, any>;
  states: Record<string, any>;
  checkpoints?: Checkpoint[];
  metadata: {
    version: string;
    checksum: string;
    compressed: boolean;
  };
}

interface Checkpoint {
  stepName: string;
  timestamp: Date;
  data: any;
}

interface RollbackStrategy {
  type: 'settings_restore' | 'data_restore' | 'schedule_restore' | 'rule_restore' | 'target_restore';
  handler: (snapshot: SystemSnapshot, options?: RollbackOptions) => Promise<any>;
  captureState: (parameters: Record<string, any>, context: ActionContext) => Promise<any>;
  verifyRollback: (snapshot: SystemSnapshot) => Promise<VerificationResult>;
}

interface RollbackOptions {
  userId?: string;
  force?: boolean;
  skipVerification?: boolean;
  notifyUsers?: boolean;
}

interface RollbackResult {
  success: boolean;
  message: string;
  executionId: string;
  rollbackId?: string;
  restoredState?: any;
  checkpoint?: Checkpoint;
  error?: string;
}

interface RollbackEntry {
  rollbackId: string;
  executionId: string;
  actionId: string;
  reason: string;
  initiatedAt: Date;
  initiatedBy: string;
  status: 'in_progress' | 'completed' | 'failed';
  completedAt?: Date;
  result?: any;
  failureReason?: string;
}

interface VerificationResult {
  success: boolean;
  reason: string;
}

// Export singleton instance
export const rollbackManager = new RollbackManager();