// Network Intelligence Types and Interfaces

export interface NetworkNode {
  id: string;
  organizationId?: string;
  externalId?: string;
  type: 'organization' | 'supplier' | 'customer' | 'partner' | 'contractor';
  name: string;
  industry?: string;
  subIndustry?: string;
  location?: {
    country: string;
    region?: string;
    city?: string;
    coordinates?: [number, number]; // [lat, lng]
  };
  sizeCategory?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  certifications: string[];
  esgScore?: number;
  sustainabilityRating?: 'A' | 'B' | 'C' | 'D' | 'F';
  dataSharingLevel: 'full' | 'anonymous' | 'aggregated' | 'none';
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'flagged';
  metadata: Record<string, any>;
  joinedNetworkAt: Date;
  lastActivityAt?: Date;
}

export interface NetworkEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: 'supplies_to' | 'buys_from' | 'partners_with' | 'subsidiary_of' | 'joint_venture' | 'competitor';
  relationshipStrength?: number; // 0-1
  relationshipStatus: 'active' | 'inactive' | 'terminated' | 'pending';
  volumeInfo?: {
    annualVolume: number;
    currency: string;
    volumeType: string;
  };
  contractValue?: number;
  contractDurationMonths?: number;
  sustainabilityScore?: number;
  riskScore?: number;
  tierLevel: number; // Supply chain tier (1-10)
  criticality?: 'critical' | 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metrics: NetworkMetrics;
}

export interface NetworkMetrics {
  totalNodes: number;
  totalEdges: number;
  density: number;
  clusteringCoefficient: number;
  averagePathLength: number;
  centrality: {
    degree: Record<string, number>;
    betweenness: Record<string, number>;
    eigenvector: Record<string, number>;
  };
  communities: Community[];
  resilience: ResilienceMetrics;
}

export interface Community {
  id: string;
  nodes: string[];
  cohesion: number;
  size: number;
  industry?: string;
}

export interface ResilienceMetrics {
  redundancy: number;
  robustness: number;
  criticalNodes: string[];
  vulnerabilityScore: number;
}

export interface PrivacySettings {
  organizationId: string;
  dataCategory: string;
  sharingLevel: 'public' | 'network' | 'partners' | 'verified_only' | 'private';
  anonymizationMethod?: 'k_anonymity' | 'differential_privacy' | 'pseudonymization' | 'aggregation_only';
  kValue?: number;
  epsilon?: number;
  consentGiven: boolean;
  consentDate?: Date;
  consentExpiresAt?: Date;
  autoRenew: boolean;
}

export interface AnonymizedData {
  data: any;
  privacyLevel: string;
  informationLoss: number;
  participantCount: number;
  confidence: number;
}

export interface PeerGroup {
  id: string;
  name: string;
  type: 'industry' | 'size' | 'geography' | 'custom';
  industry?: string;
  sizeRange?: string;
  geographicScope?: string;
  criteria: Record<string, any>;
  minMembers: number;
  maxMembers: number;
  memberCount: number;
  privacyLevel: 'anonymous' | 'pseudonymous' | 'named';
  benchmarkFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

export interface Peer {
  organizationId: string;
  name: string;
  similarity: number;
  sharedAttributes: Record<string, any>;
}

export interface PeerCriteria {
  industry?: string;
  sizeCategory?: string;
  location?: string;
  minSimilarity?: number;
  maxPeers?: number;
}

export interface AnonymousBenchmark {
  id: string;
  benchmarkType: string;
  industry?: string;
  metricName: string;
  metricCategory: string;
  period: string;
  participantCount: number;
  statistics: {
    mean: number;
    median: number;
    p25: number;
    p75: number;
    p90: number;
    stdDev: number;
  };
  qualityScore: number;
  confidenceLevel: number;
  methodology: string;
  expiresAt: Date;
}

export interface BenchmarkFilters {
  industry?: string;
  geographicScope?: string;
  sizeCategory?: string;
  minParticipants?: number;
  period?: string;
}

export interface SupplierData {
  name: string;
  industry: string;
  location: any;
  size?: string;
  certifications?: string[];
  existingScores?: Record<string, number>;
  contact?: any;
  website?: string;
  description?: string;
}

export interface OnboardingResult {
  nodeId: string;
  verificationStatus: any;
  assessmentScore: number;
  onboardingTasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface SupplierAssessment {
  id: string;
  supplierId: string;
  sustainabilityScore: number;
  riskScore: number;
  compliance: ComplianceCheck[];
  certifications: CertificationVerification[];
  recommendations: Recommendation[];
  assessmentDate: Date;
  validUntil: Date;
}

export interface ComplianceCheck {
  regulation: string;
  status: 'compliant' | 'non_compliant' | 'unknown';
  details: string;
  lastChecked: Date;
}

export interface CertificationVerification {
  name: string;
  issuer: string;
  status: 'verified' | 'expired' | 'invalid';
  expiryDate?: Date;
  verificationDate: Date;
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  estimatedTimeframe: string;
}

export interface ImprovementPlan {
  initiatives: Initiative[];
  timeline: Timeline;
  expectedImpact: Impact;
  costSharing: CostSharing;
}

export interface Initiative {
  id: string;
  name: string;
  description: string;
  category: string;
  objectives: string[];
  resources: Resource[];
  timeline: string;
  successMetrics: string[];
}

export interface Resource {
  type: 'funding' | 'expertise' | 'technology' | 'data';
  description: string;
  provider: string;
  cost?: number;
  availability: string;
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  dependencies: string[];
}

export interface Milestone {
  name: string;
  date: Date;
  deliverables: string[];
  responsible: string;
}

export interface Impact {
  environmental: Record<string, number>;
  social: Record<string, number>;
  economic: Record<string, number>;
  timeline: string;
  confidence: number;
}

export interface CostSharing {
  totalCost: number;
  participantShares: Record<string, number>;
  paymentSchedule: PaymentSchedule[];
  riskSharing: Record<string, string>;
}

export interface PaymentSchedule {
  date: Date;
  amount: number;
  description: string;
  responsible: string[];
}

export interface SupplierRequirements {
  industry: string;
  capabilities: string[];
  location?: string;
  certifications?: string[];
  minSustainabilityScore?: number;
  maxRiskScore?: number;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  deliveryRequirements?: any;
  qualityStandards?: any;
}

export interface AlternativeSuppliers {
  recommendations: SupplierRecommendation[];
  comparisonMatrix: ComparisonMatrix;
  switchingCosts: SwitchingCosts;
  riskAnalysis: RiskAnalysis;
}

export interface SupplierRecommendation {
  nodeId: string;
  name: string;
  matchScore: number;
  sustainabilityScore: number;
  riskScore: number;
  costEstimate?: number;
  deliveryTime?: string;
  strengths: string[];
  concerns: string[];
}

export interface ComparisonMatrix {
  criteria: string[];
  suppliers: Record<string, Record<string, number>>;
  weights: Record<string, number>;
}

export interface SwitchingCosts {
  setup: number;
  training: number;
  integration: number;
  opportunity: number;
  total: number;
  timeframe: string;
}

export interface RiskAnalysis {
  directRisks: Risk[];
  indirectRisks: Risk[];
  propagationPaths: PropagationPath[];
  recommendations: string[];
}

export interface Risk {
  id: string;
  type: string;
  description: string;
  probability: number;
  impact: number;
  score: number;
  tier: number;
  mitigation: string[];
}

export interface PropagationPath {
  source: string;
  target: string;
  path: string[];
  probability: number;
  impact: number;
}

export interface Pattern {
  description: string;
  confidence: number;
  applicableTo: string[];
}

export interface CollectiveLearning {
  pattern: string;
  accuracy: number;
  contributors: number;
  insights: string[];
  applicability: string[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence: number;
  source: string;
  applicableTo: string[];
  impact: string;
}

export interface NetworkValue {
  theoretical: {
    metcalfe: number;
    reed: number;
  };
  actual: number;
  perMember: number;
  growth: GrowthProjection;
}

export interface GrowthProjection {
  currentSize: number;
  projectedSize: Record<string, number>; // month -> size
  growthRate: number;
  confidence: number;
}

export interface Network {
  id: string;
  name: string;
  size: number;
  connections: number;
  qualityScore: number;
  industries: string[];
  geographicScope: string[];
}

export interface GrowthStrategy {
  priorityTargets: Target[];
  networkingEvents: NetworkingEvent[];
  incentives: Incentive[];
  projectedGrowth: GrowthProjection;
}

export interface Target {
  organizationId: string;
  name: string;
  industry: string;
  value: number;
  roi: number;
  acquisitionCost: number;
  priority: number;
}

export interface NetworkingEvent {
  type: string;
  title: string;
  description: string;
  targetAudience: string[];
  expectedAttendees: number;
  cost: number;
  expectedAcquisitions: number;
}

export interface Incentive {
  type: string;
  description: string;
  targetSegment: string;
  cost: number;
  expectedResponse: number;
  duration: string;
}

export interface Consortium {
  id: string;
  name: string;
  industry: string;
  charter: ConsortiumCharter;
  governance: Governance;
  members: string[];
  dataAgreements: DataAgreement[];
  resources: SharedResource[];
}

export interface ConsortiumCharter {
  mission: string;
  objectives: string[];
  scope: string;
  duration?: string;
  dataPolicy: DataPolicy;
  governanceRules: any;
  membershipCriteria: any;
  resources: string[];
}

export interface DataPolicy {
  sharingLevel: string;
  anonymization: boolean;
  retentionPeriod: string;
  accessRules: any;
  complianceRequirements: string[];
}

export interface Governance {
  model: 'democratic' | 'weighted' | 'council' | 'rotating';
  votingRules: any;
  decisionThresholds: any;
  committees: Committee[];
  leadership: Leadership[];
}

export interface Committee {
  name: string;
  purpose: string;
  members: string[];
  authority: string[];
}

export interface Leadership {
  role: string;
  organizationId: string;
  term: string;
  responsibilities: string[];
}

export interface DataAgreement {
  type: string;
  participants: string[];
  terms: any;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface SharedResource {
  type: string;
  description: string;
  provider?: string;
  accessRules: any;
  cost?: number;
}

export interface ProjectProposal {
  name: string;
  description: string;
  objectives: string[];
  budget: number;
  timeline: string;
  requiredVotes: number;
  proposer: string;
}

export interface CollaborativeProject {
  id: string;
  name: string;
  description: string;
  status: 'proposed' | 'approved' | 'active' | 'completed' | 'cancelled';
  participants: string[];
  budget: number;
  timeline: Timeline;
  resources: Resource[];
  workStreams: WorkStream[];
  monitoring: ProjectMonitoring;
}

export interface WorkStream {
  name: string;
  lead: string;
  participants: string[];
  objectives: string[];
  deliverables: string[];
  timeline: string;
}

export interface ProjectMonitoring {
  metrics: string[];
  reportingFrequency: string;
  stakeholders: string[];
  escalationRules: any;
}

export interface DatasetListing {
  title: string;
  name: string;
  type: string;
  description: string;
  period: {
    start: Date;
    end: Date;
  };
  format: string;
  qualityScore: number;
  price: number;
  currency: string;
  sampleData: any;
  tags: string[];
}

export interface ListingResult {
  listingId: string;
  status: 'active' | 'pending' | 'rejected';
  message?: string;
}

export interface ExchangeTerms {
  accessType: 'one_time' | 'subscription';
  duration?: string;
  paymentMethod: string;
  usageLimitations?: any;
}

export interface DataExchange {
  status: 'completed' | 'failed' | 'pending';
  accessKey?: string;
  downloadUrl?: string;
  expiresAt?: Date;
  message?: string;
}

export interface OrchestrationPlan {
  immediate: Activity[];
  planned: Activity[];
  monitoring: MonitoringPlan;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: string;
  scheduledFor: Date;
  estimatedDuration: string;
  resources: string[];
  dependencies: string[];
}

export interface MonitoringPlan {
  metrics: string[];
  frequency: string;
  alerts: AlertRule[];
  dashboards: string[];
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  action: string;
  recipients: string[];
}

export interface NetworkLoad {
  requestsPerSecond: number;
  activeConnections: number;
  dataProcessingVolume: number;
  storageUsage: number;
  networkLatency: number;
}

export interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain';
  resources?: ResourceAllocation;
  timing: 'immediate' | 'scheduled' | 'gradual';
  monitoring?: string;
}

export interface ResourceAllocation {
  cpu: number;
  memory: number;
  storage: number;
  bandwidth: number;
}

export interface ImpactAnalysis {
  current: Impact;
  networkEffect: number;
  projection: GrowthProjection;
  influenceRadius: number;
}

export interface HealthStatus {
  overall: boolean;
  details: HealthCheck[];
  timestamp: Date;
}

export interface HealthCheck {
  component: string;
  healthy: boolean;
  responseTime?: number;
  errorRate?: number;
  message?: string;
}

export interface IntegrationHealth {
  agentML: boolean;
  industryNetwork: boolean;
  mlNetwork: boolean;
  crossStream: boolean;
}