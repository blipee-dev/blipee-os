/**
 * Compliance Framework Types and Interfaces
 *
 * Core types for the comprehensive compliance framework system.
 * Supports 7 major frameworks with automated monitoring and intelligence.
 */

export interface ComplianceFramework {
  id: string;
  name: string;
  code: string;
  version: string;
  jurisdiction: string[];
  applicability: FrameworkApplicability;
  requirements: ComplianceRequirement[];
  deadlines: ComplianceDeadline[];
  status: ComplianceStatus;
  lastUpdated: Date;
  regulatoryBody: string;
  website: string;
  description: string;
}

export interface FrameworkApplicability {
  industries: string[];
  regions: string[];
  companySize: ('small' | 'medium' | 'large' | 'enterprise')[];
  revenue: {
    min?: number;
    max?: number;
    currency: string;
  };
  employees: {
    min?: number;
    max?: number;
  };
  publiclyTraded: boolean;
  mandatoryDate?: Date;
  voluntaryAdoption: boolean;
}

export interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  section: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dataRequirements: DataRequirement[];
  evidenceTypes: EvidenceType[];
  frequency: ReportingFrequency;
  deadline?: Date;
  dependencies: string[];
  tags: string[];
  guidance: string[];
  examples: string[];
}

export type RequirementType =
  | 'disclosure'
  | 'governance'
  | 'measurement'
  | 'reporting'
  | 'verification'
  | 'strategy'
  | 'risk_management'
  | 'targets'
  | 'implementation';

export interface DataRequirement {
  id: string;
  name: string;
  description: string;
  type: DataType;
  unit?: string;
  source: DataSource;
  frequency: DataFrequency;
  quality: DataQuality;
  validation: ValidationRule[];
  mandatory: boolean;
}

export type DataType =
  | 'quantitative'
  | 'qualitative'
  | 'binary'
  | 'categorical'
  | 'temporal'
  | 'financial'
  | 'environmental'
  | 'social';

export type DataSource =
  | 'internal_systems'
  | 'manual_input'
  | 'third_party'
  | 'external_api'
  | 'document_extraction'
  | 'sensor_data'
  | 'calculated';

export type DataFrequency =
  | 'real_time'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually'
  | 'ad_hoc';

export interface DataQuality {
  accuracy: number; // 0-1
  completeness: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  validity: number; // 0-1
  lastAssessed: Date;
}

export interface ValidationRule {
  id: string;
  type: 'range' | 'format' | 'logic' | 'cross_reference' | 'custom';
  condition: string;
  errorMessage: string;
  severity: 'warning' | 'error' | 'critical';
}

export type EvidenceType =
  | 'policy_document'
  | 'procedure_document'
  | 'training_record'
  | 'audit_report'
  | 'certification'
  | 'measurement_data'
  | 'financial_statement'
  | 'board_resolution'
  | 'stakeholder_feedback'
  | 'third_party_verification';

export type ReportingFrequency =
  | 'annual'
  | 'biannual'
  | 'quarterly'
  | 'monthly'
  | 'on_demand'
  | 'event_driven';

export interface ComplianceDeadline {
  id: string;
  frameworkId: string;
  requirementId?: string;
  name: string;
  description: string;
  dueDate: Date;
  type: DeadlineType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recurrence?: RecurrencePattern;
  preparationTime: number; // days
  stakeholders: string[];
  dependencies: string[];
  status: DeadlineStatus;
  completedDate?: Date;
  extensions?: DeadlineExtension[];
}

export type DeadlineType =
  | 'submission'
  | 'implementation'
  | 'review'
  | 'audit'
  | 'renewal'
  | 'training'
  | 'assessment';

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  interval: number;
  endDate?: Date;
  occurrences?: number;
}

export type DeadlineStatus =
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'extended'
  | 'cancelled';

export interface DeadlineExtension {
  requestedDate: Date;
  approvedDate?: Date;
  newDueDate: Date;
  reason: string;
  approved: boolean;
  approver?: string;
}

export type ComplianceStatus =
  | 'compliant'
  | 'partially_compliant'
  | 'non_compliant'
  | 'in_progress'
  | 'not_applicable'
  | 'under_review';

export interface ComplianceAssessment {
  id: string;
  frameworkId: string;
  organizationId: string;
  assessmentDate: Date;
  assessor: string;
  type: AssessmentType;
  scope: AssessmentScope;
  methodology: string;
  findings: ComplianceFinding[];
  score: ComplianceScore;
  recommendations: ComplianceRecommendation[];
  nextReviewDate: Date;
  status: 'draft' | 'final' | 'approved' | 'archived';
}

export type AssessmentType =
  | 'self_assessment'
  | 'internal_audit'
  | 'external_audit'
  | 'regulatory_review'
  | 'peer_review'
  | 'automated_assessment';

export interface AssessmentScope {
  requirements: string[];
  departments: string[];
  timeframe: {
    start: Date;
    end: Date;
  };
  exclusions: string[];
  inclusions: string[];
}

export interface ComplianceFinding {
  id: string;
  requirementId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'gap' | 'non_compliance' | 'observation' | 'opportunity';
  description: string;
  evidence: string[];
  impact: ImpactAssessment;
  recommendation: string;
  deadline?: Date;
  assignee?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdDate: Date;
  updatedDate: Date;
}

export interface ImpactAssessment {
  financial: number; // 0-10 scale
  operational: number; // 0-10 scale
  reputational: number; // 0-10 scale
  regulatory: number; // 0-10 scale
  environmental: number; // 0-10 scale
  social: number; // 0-10 scale
  description: string;
}

export interface ComplianceScore {
  overall: number; // 0-100
  byRequirement: Record<string, number>;
  byCategory: Record<string, number>;
  trend: ScoreTrend;
  benchmarks: {
    industry: number;
    region: number;
    size: number;
  };
  calculatedDate: Date;
  methodology: string;
  confidence: number; // 0-1
}

export interface ScoreTrend {
  period: string;
  direction: 'improving' | 'declining' | 'stable';
  changePercent: number;
  previousScore: number;
  factors: string[];
}

export interface ComplianceRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: RecommendationType;
  effort: EffortEstimate;
  impact: ImpactEstimate;
  timeline: string;
  resources: string[];
  dependencies: string[];
  risks: string[];
  benefits: string[];
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
}

export type RecommendationType =
  | 'process_improvement'
  | 'system_enhancement'
  | 'training'
  | 'policy_update'
  | 'technology_implementation'
  | 'organizational_change'
  | 'external_service';

export interface EffortEstimate {
  hours: number;
  cost: number;
  complexity: 'low' | 'medium' | 'high';
  skillsRequired: string[];
}

export interface ImpactEstimate {
  complianceImprovement: number; // 0-100
  riskReduction: number; // 0-100
  efficiency: number; // 0-100
  timeToValue: string;
}

export interface RegulatoryUpdate {
  id: string;
  frameworkId: string;
  title: string;
  description: string;
  type: UpdateType;
  effectiveDate: Date;
  mandatoryDate?: Date;
  source: string;
  url?: string;
  impact: RegulatoryImpact;
  analysis: UpdateAnalysis;
  actionItems: ActionItem[];
  stakeholders: string[];
  status: 'detected' | 'analyzed' | 'implemented' | 'verified';
  publishedDate: Date;
  detectedDate: Date;
}

export type UpdateType =
  | 'new_regulation'
  | 'amendment'
  | 'interpretation'
  | 'guidance'
  | 'technical_standard'
  | 'enforcement_action'
  | 'consultation'
  | 'withdrawal';

export interface RegulatoryImpact {
  scope: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  effort: 'minimal' | 'moderate' | 'significant' | 'major';
  cost: number;
  timeline: string;
  affectedRequirements: string[];
  newRequirements: string[];
  removedRequirements: string[];
}

export interface UpdateAnalysis {
  summary: string;
  keyChanges: string[];
  businessImplications: string[];
  technicalImplications: string[];
  complianceGaps: string[];
  opportunities: string[];
  risks: string[];
  confidence: number; // 0-1
  analyst: string;
  analysisDate: Date;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  resources: string[];
}

export interface ComplianceReport {
  id: string;
  frameworkId: string;
  organizationId: string;
  reportType: ReportType;
  title: string;
  description: string;
  period: ReportingPeriod;
  sections: ReportSection[];
  data: ReportData;
  status: ReportStatus;
  metadata: ReportMetadata;
  submission?: SubmissionDetails;
  approval?: ApprovalDetails;
  createdDate: Date;
  lastModified: Date;
}

export type ReportType =
  | 'annual_report'
  | 'sustainability_report'
  | 'compliance_report'
  | 'regulatory_filing'
  | 'disclosure_statement'
  | 'gap_analysis'
  | 'audit_report'
  | 'progress_report';

export interface ReportingPeriod {
  start: Date;
  end: Date;
  fiscalYear?: number;
  quarter?: number;
  description: string;
}

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  order: number;
  content: SectionContent;
  requirements: string[];
  status: 'draft' | 'complete' | 'reviewed' | 'approved';
  author?: string;
  reviewer?: string;
  lastModified: Date;
}

export interface SectionContent {
  text?: string;
  data?: any;
  charts?: ChartDefinition[];
  tables?: TableDefinition[];
  attachments?: AttachmentReference[];
}

export interface ChartDefinition {
  type: string;
  title: string;
  data: any;
  config: any;
}

export interface TableDefinition {
  title: string;
  headers: string[];
  rows: any[][];
  formatting?: any;
}

export interface AttachmentReference {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface ReportData {
  emissions: EmissionsData;
  governance: GovernanceData;
  performance: PerformanceData;
  targets: TargetsData;
  risks: RiskData;
  custom: Record<string, any>;
}

export interface EmissionsData {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  intensity: number;
  methodology: string;
  verification: string;
  uncertainty: number;
  breakdown: Record<string, number>;
}

export interface GovernanceData {
  boardOversight: boolean;
  executiveAccountability: boolean;
  policies: string[];
  training: TrainingData;
  stakeholderEngagement: StakeholderData;
}

export interface TrainingData {
  totalHours: number;
  participants: number;
  completion: number;
  effectiveness: number;
}

export interface StakeholderData {
  groups: string[];
  engagementMethods: string[];
  frequency: string;
  feedback: string;
}

export interface PerformanceData {
  kpis: Record<string, number>;
  trends: Record<string, number[]>;
  benchmarks: Record<string, number>;
  achievements: string[];
}

export interface TargetsData {
  emissions: EmissionsTarget[];
  renewable: RenewableTarget[];
  efficiency: EfficiencyTarget[];
  other: GenericTarget[];
}

export interface EmissionsTarget {
  scope: string;
  baseYear: number;
  targetYear: number;
  reduction: number;
  status: 'on_track' | 'at_risk' | 'off_track';
  progress: number;
}

export interface RenewableTarget {
  type: string;
  targetYear: number;
  percentage: number;
  current: number;
  status: 'on_track' | 'at_risk' | 'off_track';
}

export interface EfficiencyTarget {
  metric: string;
  improvement: number;
  targetYear: number;
  current: number;
  status: 'on_track' | 'at_risk' | 'off_track';
}

export interface GenericTarget {
  name: string;
  description: string;
  metric: string;
  target: number;
  current: number;
  targetYear: number;
  status: 'on_track' | 'at_risk' | 'off_track';
}

export interface RiskData {
  climateRisks: ClimateRisk[];
  regulatoryRisks: RegulatoryRisk[];
  operationalRisks: OperationalRisk[];
  reputationalRisks: ReputationalRisk[];
}

export interface ClimateRisk {
  type: 'physical' | 'transition';
  category: string;
  description: string;
  probability: number;
  impact: number;
  timeframe: string;
  mitigation: string[];
}

export interface RegulatoryRisk {
  regulation: string;
  description: string;
  probability: number;
  impact: number;
  timeframe: string;
  mitigation: string[];
}

export interface OperationalRisk {
  area: string;
  description: string;
  probability: number;
  impact: number;
  mitigation: string[];
}

export interface ReputationalRisk {
  stakeholder: string;
  description: string;
  probability: number;
  impact: number;
  mitigation: string[];
}

export type ReportStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'submitted'
  | 'published'
  | 'archived';

export interface ReportMetadata {
  version: string;
  template: string;
  language: string;
  currency: string;
  units: Record<string, string>;
  methodology: string;
  standards: string[];
  assurance: AssuranceDetails;
  confidentiality: 'public' | 'confidential' | 'restricted';
}

export interface AssuranceDetails {
  provider?: string;
  level: 'limited' | 'reasonable' | 'none';
  scope: string[];
  opinion?: string;
  date?: Date;
}

export interface SubmissionDetails {
  channel: string;
  submittedDate: Date;
  submittedBy: string;
  confirmationNumber?: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  feedback?: string;
}

export interface ApprovalDetails {
  approver: string;
  approvedDate: Date;
  comments?: string;
  conditions?: string[];
  nextReview?: Date;
}

export interface CrossFrameworkMapping {
  id: string;
  sourceFramework: string;
  targetFramework: string;
  sourceRequirement: string;
  targetRequirement: string;
  mappingType: MappingType;
  coverage: number; // 0-1
  notes: string;
  lastReviewed: Date;
}

export type MappingType =
  | 'exact_match'
  | 'partial_match'
  | 'related'
  | 'complementary'
  | 'conflicting'
  | 'no_match';

export interface ComplianceAlert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  frameworkId?: string;
  requirementId?: string;
  deadlineId?: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export type AlertType =
  | 'deadline_approaching'
  | 'deadline_missed'
  | 'compliance_gap'
  | 'regulatory_update'
  | 'data_quality_issue'
  | 'system_error'
  | 'audit_finding'
  | 'score_decline';

export interface AlertAction {
  id: string;
  title: string;
  description: string;
  url?: string;
  type: 'view' | 'edit' | 'submit' | 'approve' | 'escalate';
  priority: number;
}

// Configuration and Settings
export interface ComplianceConfiguration {
  organizationId: string;
  activeFrameworks: string[];
  preferences: CompliancePreferences;
  notifications: NotificationSettings;
  automation: AutomationSettings;
  integration: IntegrationSettings;
  security: SecuritySettings;
}

export interface CompliancePreferences {
  language: string;
  timezone: string;
  currency: string;
  units: Record<string, string>;
  reportingPeriod: 'calendar' | 'fiscal';
  fiscalYearStart: number; // month 1-12
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  deadlineReminders: number[]; // days before deadline
  escalationLevels: string[];
  recipients: NotificationRecipient[];
}

export interface NotificationRecipient {
  email: string;
  role: string;
  frameworks: string[];
  alertTypes: AlertType[];
}

export interface AutomationSettings {
  dataCollection: boolean;
  reportGeneration: boolean;
  deadlineTracking: boolean;
  regualtoryMonitoring: boolean;
  scoreCalculation: boolean;
  alertGeneration: boolean;
}

export interface IntegrationSettings {
  erp: SystemIntegration;
  sustainability: SystemIntegration;
  governance: SystemIntegration;
  external: ExternalIntegration[];
}

export interface SystemIntegration {
  enabled: boolean;
  system: string;
  apiUrl?: string;
  credentials?: any;
  dataMappings: Record<string, string>;
  syncFrequency: string;
}

export interface ExternalIntegration {
  name: string;
  type: string;
  enabled: boolean;
  apiUrl: string;
  credentials: any;
  purpose: string;
}

export interface SecuritySettings {
  encryption: boolean;
  accessControl: boolean;
  auditLogging: boolean;
  dataRetention: number; // days
  anonymization: boolean;
  backupFrequency: string;
}

// Framework-specific types for the 7 major frameworks
export interface SECClimateData {
  governanceSection: SECGovernanceSection;
  strategySection: SECStrategySection;
  riskManagementSection: SECRiskManagementSection;
  metricsSection: SECMetricsSection;
}

export interface SECGovernanceSection {
  boardOversight: string;
  managementRole: string;
  processes: string[];
  expertise: string;
}

export interface SECStrategySection {
  climateImpacts: string;
  businessStrategy: string;
  financialStatements: string;
  transitionPlans: string;
}

export interface SECRiskManagementSection {
  processes: string;
  integration: string;
  riskAssessment: string;
}

export interface SECMetricsSection {
  scope1Emissions: number;
  scope2Emissions: number;
  emissionsIntensity?: number;
  targets: SECTarget[];
}

export interface SECTarget {
  description: string;
  timeframe: string;
  baseline: number;
  progress: number;
}

// Add other framework-specific types as needed...