/**
 * Data Residency and Compliance Manager
 * Ensures data stays within required jurisdictions for GDPR, SOC 2, and other regulations
 */

import { regionManager } from './region-manager';

export interface DataResidencyRule {
  id: string;
  name: string;
  countries: string[];
  allowedRegions: string[];
  dataTypes: string[];
  regulation: string;
  strictMode: boolean; // If true, data cannot leave allowed regions
  retentionPolicy?: {
    maxRetentionDays: number;
    autoDelete: boolean;
    backupRegions?: string[];
  };
}

export interface DataClassification {
  type: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  regulations: string[];
  residencyRequirements: string[];
  encryptionRequired: boolean;
  auditRequired: boolean;
}

export interface DataLocation {
  regionId: string;
  dataType: string;
  recordId: string;
  classification: DataClassification;
  createdAt: Date;
  lastAccessed?: Date;
  retentionUntil?: Date;
}

export interface ComplianceStatus {
  regulation: string;
  status: 'compliant' | 'non-compliant' | 'unknown';
  lastChecked: Date;
  violations: ComplianceViolation[];
  nextCheckDue: Date;
}

export interface ComplianceViolation {
  id: string;
  type: 'data_residency' | 'retention' | 'access' | 'encryption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  dataAffected: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  remediation?: string;
}

/**
 * Data Residency Manager
 */
export class DataResidencyManager {
  private residencyRules: Map<string, DataResidencyRule> = new Map();
  private dataClassifications: Map<string, DataClassification> = new Map();
  private dataLocations: Map<string, DataLocation> = new Map();
  private complianceStatus: Map<string, ComplianceStatus> = new Map();

  constructor() {
    this.initializeRules();
    this.initializeDataClassifications();
    this.initializeComplianceTracking();
  }

  /**
   * Initialize default data residency rules
   */
  private initializeRules(): void {
    const rules: DataResidencyRule[] = [
      {
        id: 'gdpr',
        name: 'GDPR - European Data Protection',
        countries: ['EU', 'GB', 'NO', 'CH', 'IS', 'LI'],
        allowedRegions: ['eu-west-1'],
        dataTypes: ['user_profile', 'user_analytics', 'user_communications'],
        regulation: 'GDPR',
        strictMode: true,
        retentionPolicy: {
          maxRetentionDays: 365 * 7, // 7 years for business records
          autoDelete: true,
          backupRegions: ['eu-west-1']
        }
      },
      {
        id: 'ccpa',
        name: 'CCPA - California Consumer Privacy Act',
        countries: ['US'],
        allowedRegions: ['us-east-1'],
        dataTypes: ['user_profile', 'user_analytics', 'user_communications'],
        regulation: 'CCPA',
        strictMode: false,
        retentionPolicy: {
          maxRetentionDays: 365 * 5, // 5 years
          autoDelete: false
        }
      },
      {
        id: 'pdpa_singapore',
        name: 'PDPA - Singapore Personal Data Protection Act',
        countries: ['SG', 'MY'],
        allowedRegions: ['ap-southeast-1'],
        dataTypes: ['user_profile', 'user_analytics'],
        regulation: 'PDPA',
        strictMode: true,
        retentionPolicy: {
          maxRetentionDays: 365 * 3, // 3 years
          autoDelete: true
        }
      },
      {
        id: 'pipeda',
        name: 'PIPEDA - Canadian Privacy Act',
        countries: ['CA'],
        allowedRegions: ['us-east-1'], // Close to Canadian border
        dataTypes: ['user_profile', 'user_communications'],
        regulation: 'PIPEDA',
        strictMode: false,
        retentionPolicy: {
          maxRetentionDays: 365 * 7, // 7 years
          autoDelete: false
        }
      },
      {
        id: 'sox_financial',
        name: 'SOX - Financial Data Compliance',
        countries: ['US', 'CA'],
        allowedRegions: ['us-east-1'],
        dataTypes: ['financial_data', 'audit_logs', 'transaction_records'],
        regulation: 'SOX',
        strictMode: true,
        retentionPolicy: {
          maxRetentionDays: 365 * 7, // 7 years for financial records
          autoDelete: false,
          backupRegions: ['us-east-1']
        }
      }
    ];

    rules.forEach(rule => {
      this.residencyRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize data classifications
   */
  private initializeDataClassifications(): void {
    const classifications: DataClassification[] = [
      {
        type: 'user_profile',
        sensitivity: 'confidential',
        regulations: ['GDPR', 'CCPA', 'PDPA', 'PIPEDA'],
        residencyRequirements: ['user_location_based'],
        encryptionRequired: true,
        auditRequired: true
      },
      {
        type: 'user_analytics',
        sensitivity: 'internal',
        regulations: ['GDPR', 'CCPA', 'PDPA'],
        residencyRequirements: ['user_location_based'],
        encryptionRequired: true,
        auditRequired: false
      },
      {
        type: 'user_communications',
        sensitivity: 'confidential',
        regulations: ['GDPR', 'CCPA', 'PIPEDA'],
        residencyRequirements: ['user_location_based'],
        encryptionRequired: true,
        auditRequired: true
      },
      {
        type: 'financial_data',
        sensitivity: 'restricted',
        regulations: ['SOX', 'GDPR'],
        residencyRequirements: ['strict_regional'],
        encryptionRequired: true,
        auditRequired: true
      },
      {
        type: 'audit_logs',
        sensitivity: 'confidential',
        regulations: ['SOX', 'GDPR', 'CCPA'],
        residencyRequirements: ['same_as_source'],
        encryptionRequired: true,
        auditRequired: true
      },
      {
        type: 'transaction_records',
        sensitivity: 'restricted',
        regulations: ['SOX', 'PCI_DSS'],
        residencyRequirements: ['strict_regional'],
        encryptionRequired: true,
        auditRequired: true
      },
      {
        type: 'system_metrics',
        sensitivity: 'internal',
        regulations: [],
        residencyRequirements: [],
        encryptionRequired: false,
        auditRequired: false
      }
    ];

    classifications.forEach(classification => {
      this.dataClassifications.set(classification.type, classification);
    });
  }

  /**
   * Initialize compliance status tracking
   */
  private initializeComplianceTracking(): void {
    const regulations = ['GDPR', 'CCPA', 'PDPA', 'PIPEDA', 'SOX', 'PCI_DSS'];
    
    regulations.forEach(regulation => {
      this.complianceStatus.set(regulation, {
        regulation,
        status: 'unknown',
        lastChecked: new Date(),
        violations: [],
        nextCheckDue: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    });
  }

  /**
   * Determine appropriate region for data based on residency requirements
   */
  async determineDataRegion(
    dataType: string,
    userLocation: string,
    organizationLocation?: string
  ): Promise<{ regionId: string; reasoning: string; complianceRules: string[] }> {
    const classification = this.dataClassifications.get(dataType);
    if (!classification) {
      throw new Error(`Unknown data type: ${dataType}`);
    }

    // Find applicable residency rules
    const applicableRules = Array.from(this.residencyRules.values())
      .filter(rule => 
        rule.dataTypes.includes(dataType) &&
        (rule.countries.includes(userLocation) || 
         (organizationLocation && rule.countries.includes(organizationLocation)))
      );

    if (applicableRules.length === 0) {
      // No specific rules, use optimal region
      const optimalRegion = await regionManager.getOptimalRegion(userLocation);
      return {
        regionId: optimalRegion.id,
        reasoning: 'No specific data residency requirements, using optimal region',
        complianceRules: []
      };
    }

    // Find strictest rule (strict mode takes precedence)
    const strictRules = applicableRules.filter(rule => rule.strictMode);
    const applicableRule = strictRules.length > 0 ? strictRules[0] : applicableRules[0];

    // Find available region from allowed regions
    const availableRegions = applicableRule.allowedRegions
      .map(regionId => regionManager.getRegion(regionId))
      .filter(region => region && region.healthStatus === 'healthy');

    if (availableRegions.length === 0) {
      throw new Error(
        `No healthy regions available for data type ${dataType} under ${applicableRule.regulation}`
      );
    }

    // Select best available region
    const selectedRegion = availableRegions[0]!;

    return {
      regionId: selectedRegion.id,
      reasoning: `Data residency required by ${applicableRule.regulation} for ${userLocation}`,
      complianceRules: [applicableRule.regulation]
    };
  }

  /**
   * Register data location for tracking
   */
  async registerDataLocation(
    recordId: string,
    dataType: string,
    regionId: string,
    metadata?: any
  ): Promise<void> {
    const classification = this.dataClassifications.get(dataType);
    if (!classification) {
      throw new Error(`Unknown data type: ${dataType}`);
    }

    const dataLocation: DataLocation = {
      regionId,
      dataType,
      recordId,
      classification,
      createdAt: new Date()
    };

    // Set retention policy if applicable
    const applicableRules = Array.from(this.residencyRules.values())
      .filter(rule => rule.dataTypes.includes(dataType));

    if (applicableRules.length > 0 && applicableRules[0].retentionPolicy) {
      const policy = applicableRules[0].retentionPolicy;
      dataLocation.retentionUntil = new Date(
        Date.now() + policy.maxRetentionDays * 24 * 60 * 60 * 1000
      );
    }

    this.dataLocations.set(recordId, dataLocation);
  }

  /**
   * Check if data access is compliant
   */
  async checkDataAccess(
    recordId: string,
    accessorLocation: string,
    accessorRole: string
  ): Promise<{ allowed: boolean; reason: string; restrictions?: string[] }> {
    const dataLocation = this.dataLocations.get(recordId);
    if (!dataLocation) {
      return {
        allowed: false,
        reason: 'Data location not found'
      };
    }

    // Update last accessed
    dataLocation.lastAccessed = new Date();
    this.dataLocations.set(recordId, dataLocation);

    // Check retention policy
    if (dataLocation.retentionUntil && new Date() > dataLocation.retentionUntil) {
      return {
        allowed: false,
        reason: 'Data retention period expired'
      };
    }

    // Find applicable rules
    const applicableRules = Array.from(this.residencyRules.values())
      .filter(rule => rule.dataTypes.includes(dataLocation.dataType));

    if (applicableRules.length === 0) {
      return {
        allowed: true,
        reason: 'No specific access restrictions'
      };
    }

    // Check access restrictions
    const restrictions: string[] = [];
    
    for (const rule of applicableRules) {
      if (rule.strictMode && !rule.countries.includes(accessorLocation)) {
        return {
          allowed: false,
          reason: `${rule.regulation} prohibits access from ${accessorLocation}`
        };
      }
      
      if (dataLocation.classification.auditRequired) {
        restrictions.push('audit_logging_required');
      }
      
      if (dataLocation.classification.encryptionRequired) {
        restrictions.push('encrypted_transmission_required');
      }
    }

    return {
      allowed: true,
      reason: 'Access permitted with restrictions',
      restrictions: restrictions.length > 0 ? restrictions : undefined
    };
  }

  /**
   * Perform compliance audit
   */
  async performComplianceAudit(): Promise<Map<string, ComplianceStatus>> {
    const results = new Map<string, ComplianceStatus>();

    for (const [regulation, status] of Array.from(this.complianceStatus)) {
      const violations: ComplianceViolation[] = [];
      
      // Check data location compliance
      for (const [recordId, dataLocation] of Array.from(this.dataLocations)) {
        const applicable = Array.from(this.residencyRules.values())
          .filter(rule => 
            rule.regulation === regulation && 
            rule.dataTypes.includes(dataLocation.dataType)
          );

        if (applicable.length > 0) {
          const rule = applicable[0];
          
          // Check if data is in allowed region
          if (!rule.allowedRegions.includes(dataLocation.regionId)) {
            violations.push({
              id: `${recordId}-region-violation`,
              type: 'data_residency',
              severity: rule.strictMode ? 'critical' : 'medium',
              description: `Data located in unauthorized region ${dataLocation.regionId}`,
              dataAffected: [recordId],
              detectedAt: new Date()
            });
          }

          // Check retention compliance
          if (rule.retentionPolicy && dataLocation.retentionUntil) {
            if (new Date() > dataLocation.retentionUntil && rule.retentionPolicy.autoDelete) {
              violations.push({
                id: `${recordId}-retention-violation`,
                type: 'retention',
                severity: 'high',
                description: `Data past retention period and not auto-deleted`,
                dataAffected: [recordId],
                detectedAt: new Date()
              });
            }
          }
        }
      }

      const updatedStatus: ComplianceStatus = {
        regulation,
        status: violations.length === 0 ? 'compliant' : 'non-compliant',
        lastChecked: new Date(),
        violations,
        nextCheckDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
      };

      results.set(regulation, updatedStatus);
      this.complianceStatus.set(regulation, updatedStatus);
    }

    return results;
  }

  /**
   * Get compliance status for all regulations
   */
  getComplianceStatus(): Map<string, ComplianceStatus> {
    return new Map(this.complianceStatus);
  }

  /**
   * Get data locations for audit
   */
  getDataLocations(): Map<string, DataLocation> {
    return new Map(this.dataLocations);
  }

  /**
   * Get residency rules
   */
  getResidencyRules(): Map<string, DataResidencyRule> {
    return new Map(this.residencyRules);
  }

  /**
   * Update residency rule
   */
  updateResidencyRule(ruleId: string, updates: Partial<DataResidencyRule>): void {
    const existingRule = this.residencyRules.get(ruleId);
    if (existingRule) {
      this.residencyRules.set(ruleId, { ...existingRule, ...updates });
    }
  }

  /**
   * Delete expired data according to retention policies
   */
  async deleteExpiredData(): Promise<{ deleted: string[]; errors: string[] }> {
    const deleted: string[] = [];
    const errors: string[] = [];
    const now = new Date();

    for (const [recordId, dataLocation] of Array.from(this.dataLocations)) {
      if (dataLocation.retentionUntil && now > dataLocation.retentionUntil) {
        try {
          // In real implementation, this would delete from database
          this.dataLocations.delete(recordId);
          deleted.push(recordId);
        } catch (error) {
          errors.push(`Failed to delete ${recordId}: ${error}`);
        }
      }
    }

    return { deleted, errors };
  }
}

/**
 * Global data residency manager instance
 */
export const dataResidencyManager = new DataResidencyManager();