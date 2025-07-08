/**
 * Compliance types and interfaces
 */

export enum ComplianceFramework {
  GDPR = 'gdpr',
  SOC2 = 'soc2',
  HIPAA = 'hipaa',
  ISO27001 = 'iso27001',
  CCPA = 'ccpa',
}

export enum ConsentType {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  FUNCTIONAL = 'functional',
  NECESSARY = 'necessary',
}

export enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PENDING = 'pending',
  WITHDRAWN = 'withdrawn',
}

export interface UserConsent {
  id: string;
  userId: string;
  type: ConsentType;
  status: ConsentStatus;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  version: string;
  metadata?: Record<string, any>;
}

export interface PrivacySettings {
  userId: string;
  dataProcessing: {
    allowAnalytics: boolean;
    allowMarketing: boolean;
    allowDataSharing: boolean;
    allowProfiling: boolean;
  };
  communication: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
  };
  visibility: {
    profileVisibility: 'public' | 'organization' | 'private';
    activityVisibility: 'all' | 'team' | 'none';
  };
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'json' | 'csv' | 'pdf';
  scope: string[]; // Which data to include
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  scheduledFor: Date; // Usually 30 days after request
  reason?: string;
  confirmedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ComplianceAuditLog {
  id: string;
  userId: string;
  action: string;
  framework: ComplianceFramework;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionDays: number;
  framework: ComplianceFramework;
  autoDelete: boolean;
  exceptions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  framework: ComplianceFramework;
  version: string;
  requirements: SecurityRequirement[];
  effectiveDate: Date;
  reviewDate: Date;
  approved: boolean;
  approvedBy?: string;
}

export interface SecurityRequirement {
  id: string;
  category: string;
  requirement: string;
  description: string;
  implemented: boolean;
  evidence?: string[];
  lastVerified?: Date;
}

export interface ComplianceReport {
  id: string;
  framework: ComplianceFramework;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRequirements: number;
    implemented: number;
    inProgress: number;
    notStarted: number;
    complianceScore: number; // 0-100
  };
  findings: ComplianceFinding[];
  recommendations: string[];
}

export interface ComplianceFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  remediation: string;
  dueDate?: Date;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: string;
  safeguards: string[];
  crossBorderTransfers: boolean;
  transferMechanisms?: string[];
}

export interface PrivacyImpactAssessment {
  id: string;
  projectName: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  dataProcessingActivities: string[];
  risks: PrivacyRisk[];
  mitigations: RiskMitigation[];
  approvals: Approval[];
}

export interface PrivacyRisk {
  id: string;
  description: string;
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain';
  impact: 'negligible' | 'minor' | 'moderate' | 'major' | 'severe';
  riskScore: number;
  category: string;
}

export interface RiskMitigation {
  id: string;
  riskId: string;
  description: string;
  effectiveness: 'low' | 'medium' | 'high';
  implementationStatus: 'planned' | 'in_progress' | 'completed';
  completionDate?: Date;
}

export interface Approval {
  id: string;
  approverName: string;
  approverRole: string;
  decision: 'approved' | 'rejected' | 'conditional';
  comments?: string;
  date: Date;
  conditions?: string[];
}