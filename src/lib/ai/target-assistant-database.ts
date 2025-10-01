// Database integration for AI Target Setting Assistant
import { createClient } from '@supabase/supabase-js';

interface MetricCatalogItem {
  id: string;
  code: string;
  name: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  category: string;
  subcategory?: string;
  unit: string;
  description?: string;
  emission_factor?: number;
  emission_factor_unit?: string;
  ghg_protocol_category?: number;
}

interface OrganizationMetric {
  organization_id: string;
  metric_id: string;
  is_required: boolean;
  target_value?: number;
  target_year?: number;
  baseline_value?: number;
  baseline_year?: number;
  reporting_frequency: 'monthly' | 'quarterly' | 'annually';
  data_source?: 'manual' | 'IoT' | 'API' | 'AI';
}

interface MetricData {
  organization_id: string;
  metric_id: string;
  site_id?: string;
  period_start: string;
  period_end: string;
  value: number;
  unit: string;
  co2e_emissions?: number;
  data_quality: 'measured' | 'calculated' | 'estimated';
  verification_status: 'unverified' | 'verified' | 'audited';
  evidence_url?: string;
  metadata?: any;
}

export class TargetAssistantDatabase {
  private metricsCatalog: Map<string, MetricCatalogItem> = new Map();
  private organizationMetrics: Map<string, OrganizationMetric> = new Map();

  constructor() {
    this.loadMetricsCatalog();
  }

  async loadMetricsCatalog() {
    try {
      const response = await fetch('/api/sustainability/metrics/catalog');
      if (response.ok) {
        const data = await response.json();
        // The API returns an object with metrics array
        const metrics = data.metrics || data;
        if (Array.isArray(metrics)) {
          metrics.forEach((metric: MetricCatalogItem) => {
            this.metricsCatalog.set(metric.code, metric);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load metrics catalog:', error);
    }
  }

  // Map AI-discovered metrics to database catalog using AI similarity matching
  async mapDiscoveredToDatabase(discoveredName: string, scope: number): Promise<MetricCatalogItem | null> {
    // First, try to find using semantic similarity from actual database
    const lowerName = discoveredName.toLowerCase();

    // Search through actual catalog from database
    let bestMatch: MetricCatalogItem | null = null;
    let bestScore = 0;

    for (const [code, metric] of this.metricsCatalog.entries()) {
      // Check scope match
      const scopeMatch = metric.scope === `scope_${scope}`;
      if (!scopeMatch) continue;

      // Calculate similarity score
      const metricNameLower = metric.name.toLowerCase();
      const categoryLower = (metric.category || '').toLowerCase();
      const subcategoryLower = (metric.subcategory || '').toLowerCase();

      let score = 0;

      // Exact name match
      if (metricNameLower === lowerName) {
        return metric; // Perfect match, return immediately
      }

      // Partial matches
      if (metricNameLower.includes(lowerName) || lowerName.includes(metricNameLower)) {
        score += 0.7;
      }

      // Category/subcategory matches
      if (categoryLower.includes(lowerName) || lowerName.includes(categoryLower)) {
        score += 0.3;
      }
      if (subcategoryLower.includes(lowerName) || lowerName.includes(subcategoryLower)) {
        score += 0.2;
      }

      // Word-level matching
      const discoveredWords = lowerName.split(/\s+/);
      const metricWords = metricNameLower.split(/\s+/);
      const commonWords = discoveredWords.filter(w => metricWords.includes(w));
      score += commonWords.length * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = metric;
      }
    }

    // Return best match if score is high enough
    if (bestScore >= 0.5) {
      return bestMatch;
    }

    // If no good match found, suggest creating a custom metric
    console.log(`No match found for "${discoveredName}" in scope ${scope}. Consider creating custom metric.`);
    return null;
  }

  // Add discovered metric to organization's selected metrics
  async addMetricToOrganization(
    organizationId: string,
    metricId: string,
    targetValue?: number,
    targetYear: number = 2030
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/sustainability/metrics/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_ids: [metricId],
          reporting_frequency: 'monthly',
          data_source: 'AI',
          target_value: targetValue,
          target_year: targetYear,
          baseline_year: new Date().getFullYear()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to add metric to organization:', error);
      return false;
    }
  }

  // Submit actual metric data
  async submitMetricData(
    organizationId: string,
    metricId: string,
    value: number,
    unit: string,
    period: { start: string; end: string },
    metadata?: {
      aiExtracted?: boolean;
      confidence?: number;
      source?: string;
      siteId?: string;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/sustainability/metrics/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_id: metricId,
          site_id: metadata?.siteId,
          period_start: period.start,
          period_end: period.end,
          value: value,
          unit: unit,
          data_quality: metadata?.aiExtracted ? 'estimated' : 'measured',
          verification_status: 'unverified',
          metadata: {
            ai_extracted: metadata?.aiExtracted || false,
            ai_confidence: metadata?.confidence || 0.8,
            extraction_source: metadata?.source || 'conversation',
            created_by: 'AI Target Assistant'
          }
        })
      });

      if (response.ok) {
        console.log('Metric data submitted successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to submit metric data:', error);
      return false;
    }
  }

  // Get existing data for a metric
  async getMetricData(
    organizationId: string,
    metricId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<MetricData[]> {
    try {
      let url = `/api/sustainability/metrics/data?metric_id=${metricId}`;
      if (periodStart) url += `&period_start=${periodStart}`;
      if (periodEnd) url += `&period_end=${periodEnd}`;

      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch metric data:', error);
      return [];
    }
  }

  // Create a custom metric if not in catalog
  async createCustomMetric(
    name: string,
    scope: 'scope_1' | 'scope_2' | 'scope_3',
    category: string,
    unit: string,
    emissionFactor?: number
  ): Promise<string | null> {
    try {
      // Generate a unique code
      const code = `custom_${scope}_${name.toLowerCase().replace(/\s+/g, '_')}`;

      const response = await fetch('/api/sustainability/metrics/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          scope,
          category,
          unit,
          emission_factor: emissionFactor,
          emission_factor_unit: emissionFactor ? `kgCO2e/${unit}` : null,
          description: `Custom metric created by AI Assistant: ${name}`,
          is_active: true
        })
      });

      if (response.ok) {
        const created = await response.json();
        return created.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create custom metric:', error);
      return null;
    }
  }

  // Bulk data entry for multiple periods
  async submitBulkMetricData(
    organizationId: string,
    metricId: string,
    data: Array<{
      period: { start: string; end: string };
      value: number;
      unit: string;
    }>
  ): Promise<boolean> {
    try {
      const submissions = data.map(item => ({
        metric_id: metricId,
        period_start: item.period.start,
        period_end: item.period.end,
        value: item.value,
        unit: item.unit,
        data_quality: 'measured',
        verification_status: 'unverified'
      }));

      const response = await fetch('/api/sustainability/metrics/data/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: submissions })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to submit bulk metric data:', error);
      return false;
    }
  }

  // Get all organization metrics for summary
  async getOrganizationMetrics(organizationId: string): Promise<OrganizationMetric[]> {
    try {
      const response = await fetch('/api/sustainability/metrics/organization');
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch organization metrics:', error);
      return [];
    }
  }

  // Calculate baseline from historical data
  async calculateBaseline(
    organizationId: string,
    metricId: string,
    year: number
  ): Promise<number | null> {
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const data = await this.getMetricData(organizationId, metricId, startDate, endDate);

      if (data.length > 0) {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        return total;
      }
      return null;
    } catch (error) {
      console.error('Failed to calculate baseline:', error);
      return null;
    }
  }

  // Get suggested metrics dynamically based on industry using AI
  async getSuggestedMetrics(industry: string, companySize: string): Promise<MetricCatalogItem[]> {
    const suggestions: MetricCatalogItem[] = [];

    // Get ALL metrics from catalog
    const allMetrics = Array.from(this.metricsCatalog.values());

    // Filter and rank metrics based on relevance
    const rankedMetrics = await this.rankMetricsForIndustry(allMetrics, industry, companySize);

    // Return top suggestions
    return rankedMetrics.slice(0, 20);
  }

  // AI-powered metric ranking
  private async rankMetricsForIndustry(
    metrics: MetricCatalogItem[],
    industry: string,
    companySize: string
  ): Promise<MetricCatalogItem[]> {
    // For now, return all metrics sorted by scope
    // This will be enhanced with AI ranking
    return metrics.sort((a, b) => {
      // Prioritize by scope (1 > 2 > 3)
      const scopeOrder = ['scope_1', 'scope_2', 'scope_3'];
      return scopeOrder.indexOf(a.scope) - scopeOrder.indexOf(b.scope);
    });
  }
}

// Export singleton instance
export const targetDatabase = new TargetAssistantDatabase();