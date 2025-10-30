/**
 * Core Types for Unified Dashboard API Pattern
 *
 * This file defines generic types that work across all domains:
 * - Energy (Electricity + Gas)
 * - Water (Potable + Residual)
 * - Waste (Recycling + Other)
 * - Transport (future)
 */

// ============================================================================
// Request & Response Types
// ============================================================================

export interface DashboardRequest {
  organizationId: string;
  siteId: string | null;
  period: string;
  targetYear?: number;
}

export interface DashboardResponse {
  current: DashboardMetrics;
  projected: DashboardMetrics;
  historical: HistoricalDataPoint[];
  monthlyBreakdown: MonthlyBreakdownItem[];
  forecast: ForecastDataPoint[];
  sustainability: SustainabilityMetrics;
  insights: InsightItem[];
  cache: CacheMetadata;
}

// ============================================================================
// Domain Configuration
// ============================================================================

export interface DomainConfig {
  domain: 'energy' | 'water' | 'waste' | 'transport';
  displayName: string;
  unit: string;

  // Metric categories for this domain (e.g., Energy: ['Electricity', 'Gas'])
  categories: string[];

  // Subcategory mapping for aggregation
  // Example: { renewable: 'Electricity', fossil: 'Gas' }
  subcategoryMapping: {
    renewable: string;
    fossil: string;
  };

  // Prophet forecast configuration
  prophetConfig: {
    enabled: boolean;
    category: string; // 'Energy', 'Water', 'Waste'
    subcategories: string[]; // ['Electricity', 'Gas']
  };

  // Sustainability calculator configuration
  calculatorConfig: {
    domain: 'energy' | 'water' | 'waste';
  };

  // Insights configuration
  insightsConfig: {
    targetKey: string; // 'energyTarget', 'waterTarget', 'wasteTarget'
    thresholds: {
      excellentPerformance: number; // e.g., 0.8 (80% of target)
      goodPerformance: number; // e.g., 0.9 (90% of target)
      warning: number; // e.g., 1.0 (100% of target)
    };
  };
}

// ============================================================================
// Metrics & Data Points
// ============================================================================

export interface DashboardMetrics {
  value: number;
  ytd: number;
  renewable?: number;
  fossil?: number;
  breakdown: {
    renewable: number;
    fossil: number;
  };
  unit: string;
}

export interface HistoricalDataPoint {
  month: string;
  monthKey: string;
  total: number;
  renewable: number;
  fossil: number;
  isComplete?: boolean;
}

export interface MonthlyBreakdownItem {
  month: string;
  monthKey: string;
  value: number;
  renewable?: number;
  fossil?: number;
}

export interface ForecastDataPoint {
  monthKey: string;
  month: string;
  total: number;
  renewable?: number;
  fossil?: number;
  isForecast: true;
  confidence: {
    totalLower: number;
    totalUpper: number;
    renewableLower?: number;
    renewableUpper?: number;
    fossilLower?: number;
    fossilUpper?: number;
  };
}

// ============================================================================
// Sustainability & Targets
// ============================================================================

export interface SustainabilityMetrics {
  targetValue: number;
  actualValue: number;
  progress: number;
  status: 'on-track' | 'at-risk' | 'off-track';
  percentageOfTarget: number;
  remainingToTarget: number;
}

export interface SustainabilityTarget {
  id: string;
  organization_id: string;
  site_id: string | null;
  target_year: number;
  energy_target: number | null;
  water_target: number | null;
  waste_target: number | null;
  emissions_target: number | null;
  renewable_energy_percentage: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Insights
// ============================================================================

export type InsightType =
  | 'excellent-performance'
  | 'on-track'
  | 'near-target'
  | 'above-target'
  | 'no-target'
  | 'seasonal-peak'
  | 'forecast-increase'
  | 'forecast-decrease';

export interface InsightItem {
  type: InsightType;
  title: string;
  description: string;
  severity: 'success' | 'warning' | 'error' | 'info';
  value?: number;
  unit?: string;
}

// ============================================================================
// Cache & Metadata
// ============================================================================

export interface CacheMetadata {
  generatedAt: string;
  ttl: number;
  source: 'database' | 'cache';
  dataFreshness: {
    metrics: string;
    forecast: string;
    targets: string;
  };
}

// ============================================================================
// Data Fetching Strategies
// ============================================================================

export interface DataFetchStrategy<T> {
  fetch(params: DashboardRequest, config: DomainConfig): Promise<T>;
}

export interface ForecastResult {
  forecast: ForecastDataPoint[];
  model: 'prophet' | 'enterprise';
  confidence: number;
  metadata: {
    totalTrend: string;
    dataPoints: number;
    generatedAt: string;
    method: string;
    forecastHorizon: number;
  };
  hasProphetData: boolean;
}

// ============================================================================
// Unified Calculator Types
// ============================================================================

export interface CalculatorCurrentResult {
  value: number;
  ytd: number;
  breakdown: {
    renewable: number;
    fossil: number;
  };
}

export interface CalculatorProjectedResult {
  value: number;
  ytd: number;
  forecast: ForecastDataPoint[];
  method: string;
  metadata?: {
    confidence?: number;
    source?: string;
  };
}

export interface CalculatorHistoricalResult {
  historical: HistoricalDataPoint[];
  monthlyBreakdown: MonthlyBreakdownItem[];
}
