/**
 * Industry Intelligence Type Definitions
 * Core types for GRI sector standards integration and industry-specific intelligence
 */

/**
 * GRI Sector Standards
 */
export enum GRISectorStandard {
  GRI_11_OIL_GAS = 'GRI 11',
  GRI_12_COAL = 'GRI 12',
  GRI_13_AGRICULTURE = 'GRI 13',
  // Phase 2 Standards
  GRI_14_MINING = 'GRI 14',
  GRI_15_CONSTRUCTION = 'GRI 15', 
  GRI_16_FINANCIAL_SERVICES = 'GRI 16',
  GRI_17_PUBLIC_SECTOR = 'GRI 17',
}

/**
 * Industry Classification Systems
 */
export interface IndustryClassificationData {
  naicsCode?: string;
  sicCode?: string;
  gicsCode?: string;
  customCode?: string;
  confidence: number;
}

/**
 * Industry Classification Enum for common industry types
 */
export enum IndustryClassification {
  OIL_AND_GAS = 'oil_and_gas',
  COAL = 'coal',
  AGRICULTURE = 'agriculture',
  MANUFACTURING = 'manufacturing',
  TECHNOLOGY = 'technology',
  MINING = 'mining',
  CONSTRUCTION = 'construction',
  FINANCIAL_SERVICES = 'financial_services',
  PUBLIC_SECTOR = 'public_sector'
}

/**
 * Material Topic as defined by GRI Standards
 */
export interface MaterialTopic {
  id: string;
  name: string;
  description: string;
  griStandard: string;
  relevance: 'high' | 'medium' | 'low';
  impactAreas: string[];
  managementApproach?: string;
  metrics: IndustryMetric[];
  disclosures: GRIDisclosure[];
}

/**
 * GRI Disclosure Requirement
 */
export interface GRIDisclosure {
  code: string; // e.g., "GRI 305-1"
  title: string;
  description: string;
  requirements: string[];
  dataPoints: DataPoint[];
  reportingGuidance: string;
}

/**
 * Industry-Specific Metric
 */
export interface IndustryMetric {
  id: string;
  name: string;
  unit: string;
  category: 'environmental' | 'social' | 'governance' | 'economic';
  calculationMethod: string;
  benchmarkAvailable: boolean;
  regulatoryRequired: boolean;
  griAlignment: string[];
}

/**
 * Data Point for Reporting
 */
export interface DataPoint {
  name: string;
  type: 'quantitative' | 'qualitative';
  unit?: string;
  required: boolean;
  guidance: string;
}

/**
 * Industry Benchmark Data
 */
export interface IndustryBenchmark {
  metricId: string;
  industry: string;
  region?: string;
  year: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  average: number;
  sampleSize: number;
  leaders: string[]; // Top performing company IDs
}

/**
 * Regulatory Requirement
 */
export interface RegulatoryRequirement {
  id: string;
  name: string;
  jurisdiction: string;
  applicableIndustries: string[];
  effectiveDate: Date;
  requirements: string[];
  penalties: string;
  griAlignment: string[];
  complianceDeadline?: Date;
}

/**
 * Industry Analysis Result
 */
export interface IndustryAnalysis {
  organizationId: string;
  industry: IndustryClassification;
  applicableGRIStandards: GRISectorStandard[];
  materialTopics: MaterialTopic[];
  requiredDisclosures: GRIDisclosure[];
  benchmarks: IndustryBenchmark[];
  regulations: RegulatoryRequirement[];
  peerComparison: PeerComparison;
  recommendations: IndustryRecommendation[];
}

/**
 * Peer Comparison Result
 */
export interface PeerComparison {
  industryAverage: Record<string, number>;
  percentileRank: Record<string, number>;
  topPerformers: Array<{
    companyId: string;
    name: string;
    metrics: Record<string, number>;
  }>;
  improvementOpportunities: string[];
}

/**
 * Industry-Specific Recommendation
 */
export interface IndustryRecommendation {
  type: 'compliance' | 'performance' | 'reporting' | 'strategic';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  griAlignment: string[];
  estimatedCost?: number;
  estimatedTimeline?: string;
}

/**
 * Industry Model Configuration
 */
export interface IndustryModelConfig {
  industryName: string;
  griStandards: GRISectorStandard[];
  naicsCodes: string[];
  sicCodes: string[];
  materialTopics: string[];
  specificMetrics: IndustryMetric[];
  regulatoryFrameworks: string[];
  certifications: string[];
}

/**
 * Industry Intelligence Context
 */
export interface IndustryContext {
  classification: IndustryClassification;
  griStandards: GRISectorStandard[];
  materialTopics: MaterialTopic[];
  currentPerformance: Record<string, number>;
  benchmarks: IndustryBenchmark[];
  regulations: RegulatoryRequirement[];
  historicalData: Array<{
    year: number;
    metrics: Record<string, number>;
  }>;
}

/**
 * GRI Mapping Result
 */
export interface GRIMappingResult {
  applicableStandards: GRISectorStandard[];
  materialTopics: MaterialTopic[];
  requiredDisclosures: GRIDisclosure[];
  optionalDisclosures: GRIDisclosure[];
  sectorSpecificRequirements: string[];
  reportingGuidance: string;
}