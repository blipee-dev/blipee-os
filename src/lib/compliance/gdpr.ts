import { supabaseAdmin } from '@/lib/supabase/admin';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import {
  UserConsent,
  ConsentType,
  ConsentStatus,
  DataExportRequest,
  DataDeletionRequest,
  PrivacySettings,
  ComplianceFramework,
} from './types';

/**
 * GDPR Compliance Service
 * Handles GDPR-specific requirements including consent, data portability, and erasure
 */
export class GDPRComplianceService {
  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    type: ConsentType,
    status: ConsentStatus,
    version: string = '1.0',
    metadata?: Record<string, any>
  ): Promise<UserConsent> {
    try {
      const consent: UserConsent = {
        id: crypto.randomUUID(),
        userId,
        type,
        status,
        version,
        metadata,
        grantedAt: status === ConsentStatus.GRANTED ? new Date() : undefined,
        withdrawnAt: status === ConsentStatus.WITHDRAWN ? new Date() : undefined,
      };

      // Store consent record
      const { data, error } = await supabaseAdmin
        .from('user_consents')
        .insert({
          id: consent.id,
          user_id: consent.userId,
          type: consent.type,
          status: consent.status,
          granted_at: consent.grantedAt,
          withdrawn_at: consent.withdrawnAt,
          version: consent.version,
          metadata: consent.metadata,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Audit log
      await auditService.log({
        type: AuditEventType.USER_UPDATED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'user', id: userId },
        context: {},
        metadata: {
          action: 'consent_recorded',
          framework: ComplianceFramework.GDPR,
          consentType: type,
          consentStatus: status,
          version,
        },
        result: 'success',
      });

      return consent;
    } catch (error) {
      await auditService.log({
        type: AuditEventType.SYSTEM_ERROR,
        severity: AuditEventSeverity.ERROR,
        actor: { type: 'user', id: userId },
        context: {},
        metadata: {
          action: 'consent_record_failed',
          framework: ComplianceFramework.GDPR,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
      });

      throw error;
    }
  }

  /**
   * Get user consents
   */
  async getUserConsents(userId: string): Promise<UserConsent[]> {
    const { data, error } = await supabaseAdmin
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(this.mapConsentFromDb);
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(userId: string, type: ConsentType): Promise<void> {
    await this.recordConsent(userId, type, ConsentStatus.WITHDRAWN);
  }

  /**
   * Request data export (GDPR Article 20 - Data Portability)
   */
  async requestDataExport(
    userId: string,
    format: 'json' | 'csv' | 'pdf' = 'json',
    scope: string[] = ['profile', 'activities', 'consents', 'preferences']
  ): Promise<DataExportRequest> {
    try {
      const request: DataExportRequest = {
        id: crypto.randomUUID(),
        userId,
        requestedAt: new Date(),
        status: 'pending',
        format,
        scope,
      };

      // Store export request
      const { data, error } = await supabaseAdmin
        .from('data_export_requests')
        .insert({
          id: request.id,
          user_id: request.userId,
          requested_at: request.requestedAt,
          status: request.status,
          format: request.format,
          scope: request.scope,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Audit log
      await auditService.log({
        type: AuditEventType.DATA_ACCESS,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'user', id: userId },
        context: {},
        metadata: {
          action: 'data_export_requested',
          framework: ComplianceFramework.GDPR,
          format,
          scope,
          requestId: request.id,
        },
        result: 'success',
      });

      // TODO: Trigger async job to process export
      // In production, this would be handled by a background job

      return request;
    } catch (error) {
      await auditService.log({
        type: AuditEventType.SYSTEM_ERROR,
        severity: AuditEventSeverity.ERROR,
        actor: { type: 'user', id: userId },
        context: {},
        metadata: {
          action: 'data_export_request_failed',
          framework: ComplianceFramework.GDPR,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
      });

      throw error;
    }
  }

  /**
   * Request account deletion (GDPR Article 17 - Right to Erasure)
   */
  async requestAccountDeletion(
    userId: string,
    reason?: string
  ): Promise<DataDeletionRequest> {
    try {
      // Check if there's already a pending request
      const { data: existing } = await supabaseAdmin
        .from('data_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'confirmed', 'processing'])
        .single();

      if (existing) {
        throw new Error('A deletion request is already in progress');
      }

      const request: DataDeletionRequest = {
        id: crypto.randomUUID(),
        userId,
        requestedAt: new Date(),
        status: 'pending',
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        reason,
      };

      // Store deletion request
      const { data, error } = await supabaseAdmin
        .from('data_deletion_requests')
        .insert({
          id: request.id,
          user_id: request.userId,
          requested_at: request.requestedAt,
          status: request.status,
          scheduled_for: request.scheduledFor,
          reason: request.reason,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Audit log
      await auditService.log({
        type: AuditEventType.USER_DELETED,
        severity: AuditEventSeverity.WARNING,
        actor: { type: 'user', id: userId },
        context: {},
        metadata: {
          action: 'account_deletion_requested',
          framework: ComplianceFramework.GDPR,
          scheduledFor: request.scheduledFor,
          reason,
          requestId: request.id,
        },
        result: 'success',
      });

      // TODO: Send confirmation email
      // TODO: Schedule deletion job

      return request;
    } catch (error) {
      await auditService.log({
        type: AuditEventType.SYSTEM_ERROR,
        severity: AuditEventSeverity.ERROR,
        actor: { type: 'user', id: userId },
        context: {},
        metadata: {
          action: 'account_deletion_request_failed',
          framework: ComplianceFramework.GDPR,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
      });

      throw error;
    }
  }

  /**
   * Cancel deletion request
   */
  async cancelDeletionRequest(userId: string, requestId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('data_deletion_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      throw error;
    }

    // Audit log
    await auditService.log({
      type: AuditEventType.USER_UPDATED,
      severity: AuditEventSeverity.INFO,
      actor: { type: 'user', id: userId },
      context: {},
      metadata: {
        action: 'deletion_request_cancelled',
        framework: ComplianceFramework.GDPR,
        requestId,
      },
      result: 'success',
    });
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    try {
      // Get current settings
      const { data: current } = await supabaseAdmin
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      const updatedSettings: PrivacySettings = {
        userId,
        dataProcessing: {
          ...current?.data_processing,
          ...settings.dataProcessing,
        },
        communication: {
          ...current?.communication,
          ...settings.communication,
        },
        visibility: {
          ...current?.visibility,
          ...settings.visibility,
        },
      };

      // Update settings
      const { data, error } = await supabaseAdmin
        .from('privacy_settings')
        .upsert({
          user_id: userId,
          data_processing: updatedSettings.dataProcessing,
          communication: updatedSettings.communication,
          visibility: updatedSettings.visibility,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Audit log
      await auditService.log({
        type: AuditEventType.USER_UPDATED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'user', id: userId },
        context: {},
        metadata: {
          action: 'privacy_settings_updated',
          framework: ComplianceFramework.GDPR,
          changes: settings,
        },
        result: 'success',
      });

      return updatedSettings;
    } catch (error) {
      await auditService.log({
        type: AuditEventType.SYSTEM_ERROR,
        severity: AuditEventSeverity.ERROR,
        actor: { type: 'user', id: userId },
        context: {},
        metadata: {
          action: 'privacy_settings_update_failed',
          framework: ComplianceFramework.GDPR,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
      });

      throw error;
    }
  }

  /**
   * Get data export status
   */
  async getExportStatus(userId: string, requestId: string): Promise<DataExportRequest> {
    const { data, error } = await supabaseAdmin
      .from('data_export_requests')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return this.mapExportRequestFromDb(data);
  }

  /**
   * Process data export (would be called by background job)
   */
  async processDataExport(requestId: string): Promise<void> {
    // This would be implemented as a background job in production
    // For now, we'll just update the status
    
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('data_export_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new Error('Export request not found');
    }

    // Update status to processing
    await supabaseAdmin
      .from('data_export_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);

    try {
      // Collect user data based on scope
      const userData = await this.collectUserData(request.user_id, request.scope);

      // Generate export file
      const exportUrl = await this.generateExportFile(
        request.user_id,
        userData,
        request.format
      );

      // Update request with completion
      await supabaseAdmin
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          download_url: exportUrl,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .eq('id', requestId);

      // TODO: Send email notification with download link
    } catch (error) {
      await supabaseAdmin
        .from('data_export_requests')
        .update({
          status: 'failed',
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        })
        .eq('id', requestId);

      throw error;
    }
  }

  /**
   * Collect user data for export
   */
  private async collectUserData(
    userId: string,
    scope: string[]
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    if (scope.includes('profile')) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      data.profile = profile;
    }

    if (scope.includes('activities')) {
      const { data: activities } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);
      data.activities = activities;
    }

    if (scope.includes('consents')) {
      const { data: consents } = await supabaseAdmin
        .from('user_consents')
        .select('*')
        .eq('user_id', userId);
      data.consents = consents;
    }

    if (scope.includes('preferences')) {
      const { data: preferences } = await supabaseAdmin
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      data.preferences = preferences;
    }

    return data;
  }

  /**
   * Generate export file
   */
  private async generateExportFile(
    userId: string,
    data: Record<string, any>,
    format: string
  ): Promise<string> {
    // In production, this would generate actual files and upload to storage
    // For now, we'll return a mock URL
    return `https://storage.example.com/exports/${userId}/${crypto.randomUUID()}.${format}`;
  }

  /**
   * Map consent from database
   */
  private mapConsentFromDb(data: any): UserConsent {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      status: data.status,
      grantedAt: data.granted_at ? new Date(data.granted_at) : undefined,
      withdrawnAt: data.withdrawn_at ? new Date(data.withdrawn_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      version: data.version,
      metadata: data.metadata,
    };
  }

  /**
   * Map export request from database
   */
  private mapExportRequestFromDb(data: any): DataExportRequest {
    return {
      id: data.id,
      userId: data.user_id,
      requestedAt: new Date(data.requested_at),
      status: data.status,
      format: data.format,
      scope: data.scope,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      downloadUrl: data.download_url,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      metadata: data.metadata,
    };
  }
}

// Export singleton instance
export const gdprService = new GDPRComplianceService();