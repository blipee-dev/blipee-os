/**
 * Automated Data Retention System
 * Implements GDPR-compliant data retention and automated deletion
 */

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataCategory: 'Personal Data' | 'Financial Data' | 'Audit Logs' | 'System Logs' | 'Communication Data' | 'Analytics Data';
  legalBasis: 'Contract' | 'Legal Obligation' | 'Legitimate Interests' | 'Consent' | 'Public Task' | 'Vital Interests';
  retentionPeriod: number; // days
  gracePeriod: number; // additional days before deletion
  automaticDeletion: boolean;
  requiresManualReview: boolean;
  exceptionCriteria: string[];
  regulations: ('GDPR' | 'SOC2' | 'CCPA' | 'HIPAA' | 'PCI-DSS')[];
  createdAt: Date;
  lastUpdated: Date;
  isActive: boolean;
}

export interface DataRetentionRecord {
  id: string;
  policyId: string;
  dataType: string;
  dataIdentifier: string; // primary key or unique identifier
  location: string; // database table, file path, etc.
  createdAt: Date;
  retentionDeadline: Date;
  gracePeriodEnd: Date;
  status: 'Active' | 'Pending Deletion' | 'Under Review' | 'Deleted' | 'Exception Granted' | 'Legal Hold';
  legalHoldReason?: string;
  lastReviewed?: Date;
  reviewedBy?: string;
  deletionScheduled?: Date;
  actualDeletion?: Date;
  metadata: Record<string, any>;
}

export interface DeletionJob {
  id: string;
  scheduledFor: Date;
  status: 'Scheduled' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  recordIds: string[];
  batchSize: number;
  progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  };
  startedAt?: Date;
  completedAt?: Date;
  errors: string[];
  dryRun: boolean;
}

/**
 * Data Retention Manager
 */
export class DataRetentionManager {
  private policies: Map<string, RetentionPolicy> = new Map();
  private records: Map<string, DataRetentionRecord> = new Map();
  private deletionJobs: Map<string, DeletionJob> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default retention policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: RetentionPolicy[] = [
      {
        id: 'user-profile-data',
        name: 'User Profile Data',
        description: 'Personal information and account data',
        dataCategory: 'Personal Data',
        legalBasis: 'Contract',
        retentionPeriod: 2555, // 7 years
        gracePeriod: 30, // 30 days grace period
        automaticDeletion: true,
        requiresManualReview: true,
        exceptionCriteria: ['Active subscription', 'Legal proceedings', 'Regulatory requirement'],
        regulations: ['GDPR', 'CCPA'],
        createdAt: new Date(),
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: 'analytics-data',
        name: 'Analytics and Usage Data',
        description: 'User behavior and system usage analytics',
        dataCategory: 'Analytics Data',
        legalBasis: 'Legitimate Interests',
        retentionPeriod: 365, // 1 year
        gracePeriod: 0, // No grace period for analytics
        automaticDeletion: true,
        requiresManualReview: false,
        exceptionCriteria: ['Ongoing analysis', 'Product improvement needs'],
        regulations: ['GDPR'],
        createdAt: new Date(),
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: 'financial-records',
        name: 'Financial and Billing Records',
        description: 'Payment information, invoices, and financial transactions',
        dataCategory: 'Financial Data',
        legalBasis: 'Legal Obligation',
        retentionPeriod: 2555, // 7 years (tax requirements)
        gracePeriod: 90, // 3 months grace period
        automaticDeletion: false, // Manual review required for financial data
        requiresManualReview: true,
        exceptionCriteria: ['Tax audit', 'Legal proceedings', 'Regulatory investigation'],
        regulations: ['SOC2', 'PCI-DSS'],
        createdAt: new Date(),
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: 'audit-logs',
        name: 'Compliance Audit Logs',
        description: 'SOC 2 and GDPR compliance audit trails',
        dataCategory: 'Audit Logs',
        legalBasis: 'Legal Obligation',
        retentionPeriod: 2555, // 7 years
        gracePeriod: 0, // No grace period for audit logs
        automaticDeletion: false, // Keep for compliance
        requiresManualReview: true,
        exceptionCriteria: ['Active audit', 'Compliance investigation', 'Legal hold'],
        regulations: ['SOC2', 'GDPR'],
        createdAt: new Date(),
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: 'system-logs',
        name: 'System and Application Logs',
        description: 'Technical system logs and error reports',
        dataCategory: 'System Logs',
        legalBasis: 'Legitimate Interests',
        retentionPeriod: 90, // 3 months
        gracePeriod: 0,
        automaticDeletion: true,
        requiresManualReview: false,
        exceptionCriteria: ['Active incident investigation', 'Security investigation'],
        regulations: ['SOC2'],
        createdAt: new Date(),
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: 'communication-data',
        name: 'Communication Records',
        description: 'Emails, support tickets, and customer communications',
        dataCategory: 'Communication Data',
        legalBasis: 'Contract',
        retentionPeriod: 1095, // 3 years
        gracePeriod: 30,
        automaticDeletion: true,
        requiresManualReview: true,
        exceptionCriteria: ['Ongoing support case', 'Legal proceedings', 'Customer dispute'],
        regulations: ['GDPR', 'SOC2'],
        createdAt: new Date(),
        lastUpdated: new Date(),
        isActive: true
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  /**
   * Create a retention record for data
   */
  createRetentionRecord(
    policyId: string,
    dataType: string,
    dataIdentifier: string,
    location: string,
    createdAt: Date = new Date(),
    metadata: Record<string, any> = {}
  ): string {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Retention policy ${policyId} not found`);
    }

    const recordId = `retention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const retentionDeadline = new Date(createdAt.getTime() + policy.retentionPeriod * 24 * 60 * 60 * 1000);
    const gracePeriodEnd = new Date(retentionDeadline.getTime() + policy.gracePeriod * 24 * 60 * 60 * 1000);

    const record: DataRetentionRecord = {
      id: recordId,
      policyId,
      dataType,
      dataIdentifier,
      location,
      createdAt,
      retentionDeadline,
      gracePeriodEnd,
      status: 'Active',
      metadata
    };

    this.records.set(recordId, record);


    return recordId;
  }

  /**
   * Check for data eligible for deletion
   */
  findDataForDeletion(dryRun: boolean = true): {
    eligibleRecords: DataRetentionRecord[];
    requiresReview: DataRetentionRecord[];
    onLegalHold: DataRetentionRecord[];
  } {
    const now = new Date();
    const eligibleRecords: DataRetentionRecord[] = [];
    const requiresReview: DataRetentionRecord[] = [];
    const onLegalHold: DataRetentionRecord[] = [];

    for (const record of Array.from(this.records.values())) {
      const policy = this.policies.get(record.policyId);
      if (!policy || !policy.isActive) {
        continue;
      }

      // Skip if on legal hold
      if (record.status === 'Legal Hold') {
        onLegalHold.push(record);
        continue;
      }

      // Check if past retention deadline
      if (record.retentionDeadline <= now) {
        if (policy.requiresManualReview) {
          requiresReview.push(record);
        } else if (policy.automaticDeletion) {
          eligibleRecords.push(record);
        }
      }
    }

    if (!dryRun) {
    }

    return {
      eligibleRecords,
      requiresReview,
      onLegalHold
    };
  }

  /**
   * Schedule deletion job
   */
  scheduleDeletion(
    recordIds: string[],
    scheduledFor: Date = new Date(),
    batchSize: number = 100,
    dryRun: boolean = false
  ): string {
    const jobId = `deletion_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: DeletionJob = {
      id: jobId,
      scheduledFor,
      status: 'Scheduled',
      recordIds,
      batchSize,
      progress: {
        total: recordIds.length,
        processed: 0,
        succeeded: 0,
        failed: 0
      },
      errors: [],
      dryRun
    };

    this.deletionJobs.set(jobId, job);


    return jobId;
  }

  /**
   * Execute deletion job
   */
  async executeDeletion(jobId: string): Promise<{
    jobId: string;
    status: 'Completed' | 'Failed';
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const job = this.deletionJobs.get(jobId);
    if (!job) {
      throw new Error(`Deletion job ${jobId} not found`);
    }

    if (job.status !== 'Scheduled') {
      throw new Error(`Job ${jobId} is not in scheduled state`);
    }


    job.status = 'Running';
    job.startedAt = new Date();
    this.deletionJobs.set(jobId, job);

    try {
      // Process records in batches
      for (let i = 0; i < job.recordIds.length; i += job.batchSize) {
        const batch = job.recordIds.slice(i, i + job.batchSize);
        
        for (const recordId of batch) {
          try {
            const record = this.records.get(recordId);
            if (!record) {
              job.errors.push(`Record ${recordId} not found`);
              job.progress.failed++;
              continue;
            }

            if (job.dryRun) {
            } else {
              // In a real implementation, this would call the actual deletion logic
              // For now, we'll just mark the record as deleted
              record.status = 'Deleted';
              record.actualDeletion = new Date();
              this.records.set(recordId, record);
              
            }

            job.progress.succeeded++;
          } catch (error) {
            const errorMessage = `Failed to delete record ${recordId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            job.errors.push(errorMessage);
            job.progress.failed++;
            console.error(`❌ ${errorMessage}`);
          }

          job.progress.processed++;
        }

        // Small delay between batches to avoid overwhelming the system
        if (i + job.batchSize < job.recordIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      job.status = job.progress.failed > 0 ? 'Failed' : 'Completed';
      job.completedAt = new Date();

      const result = {
        jobId,
        status: job.status as 'Completed' | 'Failed',
        processed: job.progress.processed,
        succeeded: job.progress.succeeded,
        failed: job.progress.failed,
        errors: job.errors
      };


      return result;

    } catch (error) {
      job.status = 'Failed';
      job.completedAt = new Date();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.errors.push(`Job execution failed: ${errorMessage}`);
      
      console.error(`❌ Deletion job failed: ${jobId} - ${errorMessage}`);
      
      throw error;
    } finally {
      this.deletionJobs.set(jobId, job);
    }
  }

  /**
   * Place data on legal hold
   */
  placeLegalHold(
    recordId: string,
    reason: string,
    placedBy: string
  ): void {
    const record = this.records.get(recordId);
    if (!record) {
      throw new Error(`Retention record ${recordId} not found`);
    }

    record.status = 'Legal Hold';
    record.legalHoldReason = reason;
    record.lastReviewed = new Date();
    record.reviewedBy = placedBy;

    this.records.set(recordId, record);

  }

  /**
   * Remove legal hold
   */
  removeLegalHold(
    recordId: string,
    removedBy: string
  ): void {
    const record = this.records.get(recordId);
    if (!record) {
      throw new Error(`Retention record ${recordId} not found`);
    }

    if (record.status !== 'Legal Hold') {
      throw new Error(`Record ${recordId} is not on legal hold`);
    }

    // Determine new status based on retention deadline
    const now = new Date();
    if (record.retentionDeadline <= now) {
      record.status = 'Pending Deletion';
    } else {
      record.status = 'Active';
    }

    record.legalHoldReason = undefined;
    record.lastReviewed = new Date();
    record.reviewedBy = removedBy;

    this.records.set(recordId, record);

  }

  /**
   * Get retention statistics
   */
  getRetentionStatistics(): {
    totalRecords: number;
    activeRecords: number;
    pendingDeletion: number;
    underReview: number;
    deleted: number;
    onLegalHold: number;
    overdueDeletions: number;
  } {
    const stats = {
      totalRecords: this.records.size,
      activeRecords: 0,
      pendingDeletion: 0,
      underReview: 0,
      deleted: 0,
      onLegalHold: 0,
      overdueDeletions: 0
    };

    const now = new Date();

    for (const record of Array.from(this.records.values())) {
      switch (record.status) {
        case 'Active':
          stats.activeRecords++;
          break;
        case 'Pending Deletion':
          stats.pendingDeletion++;
          break;
        case 'Under Review':
          stats.underReview++;
          break;
        case 'Deleted':
          stats.deleted++;
          break;
        case 'Legal Hold':
          stats.onLegalHold++;
          break;
      }

      // Check for overdue deletions
      if (record.status !== 'Deleted' && record.status !== 'Legal Hold' && record.gracePeriodEnd < now) {
        stats.overdueDeletions++;
      }
    }

    return stats;
  }

  /**
   * Get all policies
   */
  getPolicies(): Map<string, RetentionPolicy> {
    return new Map(this.policies);
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): RetentionPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get all retention records
   */
  getRecords(): Map<string, DataRetentionRecord> {
    return new Map(this.records);
  }

  /**
   * Get record by ID
   */
  getRecord(recordId: string): DataRetentionRecord | undefined {
    return this.records.get(recordId);
  }

  /**
   * Get all deletion jobs
   */
  getDeletionJobs(): Map<string, DeletionJob> {
    return new Map(this.deletionJobs);
  }

  /**
   * Get deletion job by ID
   */
  getDeletionJob(jobId: string): DeletionJob | undefined {
    return this.deletionJobs.get(jobId);
  }
}

/**
 * Global data retention manager instance
 */
export const dataRetentionManager = new DataRetentionManager();

/**
 * Helper function to create retention record with automatic policy selection
 */
export function createDataRetentionRecord(
  dataType: string,
  dataIdentifier: string,
  location: string,
  dataCategory: RetentionPolicy['dataCategory'],
  createdAt: Date = new Date(),
  metadata: Record<string, any> = {}
): string {
  // Find appropriate policy based on data category
  const policies = dataRetentionManager.getPolicies();
  const matchingPolicy = Array.from(policies.values())
    .find(policy => policy.dataCategory === dataCategory && policy.isActive);

  if (!matchingPolicy) {
    throw new Error(`No active retention policy found for data category: ${dataCategory}`);
  }

  return dataRetentionManager.createRetentionRecord(
    matchingPolicy.id,
    dataType,
    dataIdentifier,
    location,
    createdAt,
    metadata
  );
}