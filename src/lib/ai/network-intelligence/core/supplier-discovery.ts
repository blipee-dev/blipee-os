/**
 * Supplier Discovery Engine
 * Automated discovery and assessment of sustainable suppliers
 */

import { createBrowserClient } from '@/lib/supabase/client';
import { NetworkGraphEngine } from './graph-engine';
import { PeerBenchmarkingService } from './peer-benchmarking';

export interface SupplierProfile {
  id: string;
  name: string;
  industry: string;
  location: {
    country: string;
    region: string;
    city?: string;
  };
  size: 'small' | 'medium' | 'large' | 'enterprise';
  certifications: string[];
  esgScore: {
    overall: number;
    environmental: number;
    social: number;
    governance: number;
  };
  capabilities: string[];
  products: string[];
  capacity: {
    current: number;
    maximum: number;
    unit: string;
  };
  reliability: {
    onTimeDelivery: number;
    qualityScore: number;
    responseTime: number;
  };
  discovered: Date;
  verified: boolean;
}

export interface SupplierMatch {
  supplier: SupplierProfile;
  matchScore: number;
  matchReasons: string[];
  riskFactors: string[];
  opportunities: string[];
  alternativeTo?: string; // Current supplier they could replace
}

export interface DiscoveryRequest {
  organizationId: string;
  requirements: {
    products?: string[];
    capabilities?: string[];
    minEsgScore?: number;
    certifications?: string[];
    location?: {
      countries?: string[];
      maxDistance?: number;
    };
    capacity?: {
      minimum: number;
      unit: string;
    };
  };
  preferences: {
    prioritizeLocal?: boolean;
    prioritizeDiversity?: boolean;
    prioritizeInnovation?: boolean;
  };
}

export interface SupplierAssessment {
  supplierId: string;
  assessmentDate: Date;
  scores: {
    sustainability: number;
    risk: number;
    innovation: number;
    costCompetitiveness: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  comparisonToPeers: {
    percentile: number;
    benchmark: string;
  };
}

export class SupplierDiscoveryEngine {
  private supabase;
  private graphEngine: NetworkGraphEngine;
  private benchmarkingService: PeerBenchmarkingService;

  constructor() {
    this.supabase = createBrowserClient();
    this.graphEngine = new NetworkGraphEngine();
    this.benchmarkingService = new PeerBenchmarkingService();
  }

  /**
   * Discover new sustainable suppliers
   */
  async discoverSuppliers(request: DiscoveryRequest): Promise<SupplierMatch[]> {
    console.log('🔍 Discovering sustainable suppliers...');

    try {
      // Get organization's current suppliers for comparison
      const { data: currentSuppliers } = await this.supabase
        .from('suppliers')
        .select('*')
        .eq('organization_id', request.organizationId);

      // Search global supplier database
      const potentialSuppliers = await this.searchGlobalSuppliers(request.requirements);

      // Score and rank suppliers
      const matches = await this.scoreSuppliers(
        potentialSuppliers,
        request,
        currentSuppliers || []
      );

      // Filter by minimum match score
      const qualifiedMatches = matches.filter(m => m.matchScore >= 70);

      // Sort by match score
      qualifiedMatches.sort((a, b) => b.matchScore - a.matchScore);

      // Limit to top 20 matches
      return qualifiedMatches.slice(0, 20);
    } catch (error) {
      console.error('Error discovering suppliers:', error);
      throw error;
    }
  }

  /**
   * Assess a specific supplier
   */
  async assessSupplier(supplierId: string, organizationId: string): Promise<SupplierAssessment> {
    console.log(`🔍 Assessing supplier ${supplierId}...`);

    try {
      // Get supplier data
      const { data: supplier } = await this.supabase
        .from('global_suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Calculate detailed scores
      const scores = {
        sustainability: this.calculateSustainabilityScore(supplier),
        risk: this.calculateRiskScore(supplier),
        innovation: this.calculateInnovationScore(supplier),
        costCompetitiveness: await this.calculateCostScore(supplier),
        overall: 0,
      };

      // Calculate weighted overall score
      scores.overall = 
        scores.sustainability * 0.35 +
        scores.risk * 0.25 +
        scores.innovation * 0.2 +
        scores.costCompetitiveness * 0.2;

      // Identify strengths and weaknesses
      const { strengths, weaknesses } = this.analyzeSupplierProfile(supplier, scores);

      // Generate recommendations
      const recommendations = this.generateRecommendations(supplier, scores, weaknesses);

      // Compare to peers
      const peerComparison = await this.compareToPeers(supplier);

      // Store assessment
      await this.supabase
        .from('supplier_assessments')
        .insert({
          supplier_id: supplierId,
          organization_id: organizationId,
          scores,
          strengths,
          weaknesses,
          recommendations,
          peer_comparison: peerComparison,
          assessment_date: new Date(),
        });

      return {
        supplierId,
        assessmentDate: new Date(),
        scores,
        strengths,
        weaknesses,
        recommendations,
        comparisonToPeers: peerComparison,
      };
    } catch (error) {
      console.error('Error assessing supplier:', error);
      throw error;
    }
  }

  /**
   * Monitor supplier network for risks and opportunities
   */
  async monitorSupplierNetwork(organizationId: string): Promise<{
    alerts: Array<{
      type: 'risk' | 'opportunity';
      severity: 'low' | 'medium' | 'high';
      supplier: string;
      message: string;
      action: string;
    }>;
    networkHealth: number;
    recommendations: string[];
  }> {
    console.log('🔍 Monitoring supplier network...');

    try {
      // Build supplier network graph
      const networkGraph = await this.graphEngine.buildSupplyChainGraph(organizationId);

      // Identify vulnerabilities
      const vulnerabilities = await this.graphEngine.identifyVulnerabilities(networkGraph);

      // Get supplier updates
      const supplierUpdates = await this.getSupplierUpdates(organizationId);

      // Generate alerts
      const alerts: any[] = [];

      // Risk alerts from vulnerabilities
      vulnerabilities.singlePointsOfFailure.forEach(node => {
        alerts.push({
          type: 'risk',
          severity: 'high',
          supplier: node.name,
          message: `${node.name} is a single point of failure in your supply chain`,
          action: 'Consider adding alternative suppliers',
        });
      });

      // Risk alerts from ESG scores
      supplierUpdates.forEach(update => {
        if (update.esgScore < 50) {
          alerts.push({
            type: 'risk',
            severity: update.esgScore < 30 ? 'high' : 'medium',
            supplier: update.name,
            message: `Low ESG score (${update.esgScore}/100) for ${update.name}`,
            action: 'Review supplier or find alternatives',
          });
        }
      });

      // Opportunity alerts
      const opportunities = await this.identifyOpportunities(organizationId, networkGraph);
      opportunities.forEach(opp => {
        alerts.push({
          type: 'opportunity',
          severity: 'low',
          supplier: opp.supplier,
          message: opp.message,
          action: opp.action,
        });
      });

      // Calculate network health
      const networkHealth = this.calculateNetworkHealth(networkGraph, vulnerabilities, supplierUpdates);

      // Generate recommendations
      const recommendations = this.generateNetworkRecommendations(
        networkHealth,
        vulnerabilities,
        alerts
      );

      return {
        alerts,
        networkHealth,
        recommendations,
      };
    } catch (error) {
      console.error('Error monitoring supplier network:', error);
      throw error;
    }
  }

  /**
   * Find alternative suppliers for risk mitigation
   */
  async findAlternatives(
    currentSupplierId: string,
    organizationId: string
  ): Promise<SupplierMatch[]> {
    console.log(`🔍 Finding alternatives to supplier ${currentSupplierId}...`);

    try {
      // Get current supplier details
      const { data: currentSupplier } = await this.supabase
        .from('suppliers')
        .select('*')
        .eq('id', currentSupplierId)
        .single();

      if (!currentSupplier) {
        throw new Error('Current supplier not found');
      }

      // Create discovery request based on current supplier
      const request: DiscoveryRequest = {
        organizationId,
        requirements: {
          products: currentSupplier.products || [],
          capabilities: currentSupplier.capabilities || [],
          minEsgScore: Math.max(currentSupplier.esg_score || 0, 60),
          capacity: {
            minimum: currentSupplier.volume || 0,
            unit: currentSupplier.volume_unit || 'units',
          },
        },
        preferences: {
          prioritizeLocal: false,
          prioritizeDiversity: true,
          prioritizeInnovation: false,
        },
      };

      // Discover alternatives
      const alternatives = await this.discoverSuppliers(request);

      // Mark as alternatives
      return alternatives.map(alt => ({
        ...alt,
        alternativeTo: currentSupplier.name,
      }));
    } catch (error) {
      console.error('Error finding alternatives:', error);
      throw error;
    }
  }

  // Private helper methods

  private async searchGlobalSuppliers(requirements: any): Promise<SupplierProfile[]> {
    let query = this.supabase
      .from('global_suppliers')
      .select('*')
      .eq('active', true)
      .eq('verified', true);

    // Apply filters
    if (requirements.products?.length > 0) {
      query = query.contains('products', requirements.products);
    }
    if (requirements.capabilities?.length > 0) {
      query = query.contains('capabilities', requirements.capabilities);
    }
    if (requirements.minEsgScore) {
      query = query.gte('esg_score->overall', requirements.minEsgScore);
    }
    if (requirements.certifications?.length > 0) {
      query = query.contains('certifications', requirements.certifications);
    }
    if (requirements.location?.countries?.length > 0) {
      query = query.in('location->country', requirements.location.countries);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    // Transform to SupplierProfile format
    return (data || []).map(this.transformToSupplierProfile);
  }

  private transformToSupplierProfile(data: any): SupplierProfile {
    return {
      id: data.id,
      name: data.name,
      industry: data.industry,
      location: data.location,
      size: data.size,
      certifications: data.certifications || [],
      esgScore: data.esg_score || {
        overall: 50,
        environmental: 50,
        social: 50,
        governance: 50,
      },
      capabilities: data.capabilities || [],
      products: data.products || [],
      capacity: data.capacity || {
        current: 0,
        maximum: 0,
        unit: 'units',
      },
      reliability: data.reliability || {
        onTimeDelivery: 85,
        qualityScore: 85,
        responseTime: 24,
      },
      discovered: new Date(data.created_at),
      verified: data.verified || false,
    };
  }

  private async scoreSuppliers(
    suppliers: SupplierProfile[],
    request: DiscoveryRequest,
    currentSuppliers: any[]
  ): Promise<SupplierMatch[]> {
    return Promise.all(
      suppliers.map(async supplier => {
        let matchScore = 0;
        const matchReasons: string[] = [];
        const riskFactors: string[] = [];
        const opportunities: string[] = [];

        // ESG score matching (30%)
        const esgWeight = 30;
        const esgScore = supplier.esgScore.overall;
        matchScore += (esgScore / 100) * esgWeight;
        if (esgScore >= 80) {
          matchReasons.push('Excellent ESG performance');
        }
        if (esgScore < 50) {
          riskFactors.push('Low ESG score');
        }

        // Product/capability matching (25%)
        const capabilityMatch = this.calculateCapabilityMatch(
          supplier,
          request.requirements
        );
        matchScore += capabilityMatch * 25;
        if (capabilityMatch > 0.8) {
          matchReasons.push('Strong capability alignment');
        }

        // Location scoring (15%)
        const locationScore = this.calculateLocationScore(
          supplier.location,
          request.requirements.location,
          request.preferences?.prioritizeLocal
        );
        matchScore += locationScore * 15;
        if (locationScore > 0.8) {
          matchReasons.push('Favorable location');
        }

        // Reliability scoring (15%)
        const reliabilityScore = 
          (supplier.reliability.onTimeDelivery + supplier.reliability.qualityScore) / 200;
        matchScore += reliabilityScore * 15;
        if (reliabilityScore > 0.9) {
          matchReasons.push('High reliability');
        }

        // Innovation and diversity (15%)
        if (request.preferences?.prioritizeDiversity) {
          const isDiverse = supplier.certifications.some(cert => 
            cert.includes('diversity') || cert.includes('minority') || cert.includes('women')
          );
          if (isDiverse) {
            matchScore += 10;
            matchReasons.push('Diverse supplier');
            opportunities.push('Supports supplier diversity goals');
          }
        }

        // Identify specific opportunities
        if (supplier.certifications.includes('B-Corp')) {
          opportunities.push('B-Corp certified for social responsibility');
        }
        if (supplier.esgScore.environmental > 85) {
          opportunities.push('Leader in environmental sustainability');
        }

        // Identify risks
        if (supplier.capacity.current / supplier.capacity.maximum > 0.9) {
          riskFactors.push('Near capacity limit');
        }
        if (!supplier.verified) {
          riskFactors.push('Pending verification');
        }

        return {
          supplier,
          matchScore: Math.round(matchScore),
          matchReasons,
          riskFactors,
          opportunities,
        };
      })
    );
  }

  private calculateCapabilityMatch(supplier: SupplierProfile, requirements: any): number {
    if (!requirements.products && !requirements.capabilities) {
      return 1; // No specific requirements
    }

    let matches = 0;
    let total = 0;

    if (requirements.products) {
      total += requirements.products.length;
      matches += requirements.products.filter((p: string) => 
        supplier.products.includes(p)
      ).length;
    }

    if (requirements.capabilities) {
      total += requirements.capabilities.length;
      matches += requirements.capabilities.filter((c: string) => 
        supplier.capabilities.includes(c)
      ).length;
    }

    return total > 0 ? matches / total : 0;
  }

  private calculateLocationScore(
    supplierLocation: any,
    requirements: any,
    prioritizeLocal?: boolean
  ): number {
    if (!requirements || !requirements.countries) {
      return prioritizeLocal ? 0.5 : 1;
    }

    if (requirements.countries.includes(supplierLocation.country)) {
      return 1;
    }

    // Calculate distance-based score
    // Simplified: same region = 0.7, different region = 0.3
    return 0.5;
  }

  private calculateSustainabilityScore(supplier: any): number {
    const esg = supplier.esg_score || {};
    const certWeight = supplier.certifications?.length > 0 ? 10 : 0;
    
    return Math.min(
      100,
      (esg.overall || 50) + certWeight
    );
  }

  private calculateRiskScore(supplier: any): number {
    let riskScore = 100; // Start with low risk

    // Financial stability
    if (!supplier.verified) riskScore -= 20;
    
    // Capacity utilization
    if (supplier.capacity) {
      const utilization = supplier.capacity.current / supplier.capacity.maximum;
      if (utilization > 0.9) riskScore -= 15;
      if (utilization > 0.95) riskScore -= 10;
    }

    // ESG risks
    if (supplier.esg_score?.overall < 50) riskScore -= 20;
    if (supplier.esg_score?.overall < 30) riskScore -= 20;

    // Reliability
    if (supplier.reliability?.onTimeDelivery < 80) riskScore -= 15;

    return Math.max(0, riskScore);
  }

  private calculateInnovationScore(supplier: any): number {
    let score = 50; // Base score

    // R&D indicators
    if (supplier.capabilities?.includes('R&D')) score += 20;
    if (supplier.capabilities?.includes('innovation')) score += 15;
    
    // Certifications
    if (supplier.certifications?.includes('ISO-14001')) score += 10;
    if (supplier.certifications?.includes('patent-holder')) score += 15;

    // ESG innovation
    if (supplier.esg_score?.environmental > 80) score += 10;

    return Math.min(100, score);
  }

  private async calculateCostScore(supplier: any): Promise<number> {
    // In real implementation, would compare pricing data
    // For now, return a simulated score based on size and location
    const sizeScore = {
      enterprise: 70,
      large: 80,
      medium: 90,
      small: 85,
    }[supplier.size] || 75;

    return sizeScore;
  }

  private analyzeSupplierProfile(supplier: any, scores: any): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze scores
    if (scores.sustainability > 80) {
      strengths.push('Strong sustainability performance');
    } else if (scores.sustainability < 50) {
      weaknesses.push('Weak sustainability practices');
    }

    if (scores.risk > 80) {
      strengths.push('Low risk profile');
    } else if (scores.risk < 50) {
      weaknesses.push('High risk factors');
    }

    // Analyze capabilities
    if (supplier.certifications?.length > 3) {
      strengths.push('Well-certified and compliant');
    }

    if (supplier.reliability?.onTimeDelivery > 90) {
      strengths.push('Excellent delivery performance');
    } else if (supplier.reliability?.onTimeDelivery < 75) {
      weaknesses.push('Poor delivery reliability');
    }

    return { strengths, weaknesses };
  }

  private generateRecommendations(
    supplier: any,
    scores: any,
    weaknesses: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (scores.sustainability < 70) {
      recommendations.push('Request sustainability improvement plan');
    }

    if (scores.risk < 60) {
      recommendations.push('Implement risk mitigation measures');
      recommendations.push('Consider backup suppliers');
    }

    if (weaknesses.includes('Poor delivery reliability')) {
      recommendations.push('Establish SLA with penalties for late delivery');
    }

    if (scores.overall > 80) {
      recommendations.push('Consider strategic partnership');
      recommendations.push('Explore volume discounts');
    }

    return recommendations;
  }

  private async compareToPeers(supplier: any): Promise<any> {
    // Use benchmarking service for anonymous comparison
    try {
      const benchmark = await this.benchmarkingService.getIndustryInsights(supplier.industry);
      const avgEsg = benchmark.leaders.find(l => l.metric.includes('esg'))?.averagePerformance || 60;
      
      return {
        percentile: Math.round((supplier.esg_score.overall / avgEsg) * 50),
        benchmark: `Industry average ESG: ${avgEsg}`,
      };
    } catch {
      return {
        percentile: 50,
        benchmark: 'Peer comparison unavailable',
      };
    }
  }

  private async getSupplierUpdates(organizationId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('suppliers')
      .select('id, name, esg_score, updated_at')
      .eq('organization_id', organizationId)
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Last 30 days

    return data || [];
  }

  private async identifyOpportunities(
    organizationId: string,
    networkGraph: any
  ): Promise<any[]> {
    const opportunities: any[] = [];

    // Look for consolidation opportunities
    const suppliersByProduct = new Map<string, string[]>();
    networkGraph.nodes
      .filter((n: any) => n.type === 'supplier')
      .forEach((supplier: any) => {
        supplier.metadata.products?.forEach((product: string) => {
          if (!suppliersByProduct.has(product)) {
            suppliersByProduct.set(product, []);
          }
          suppliersByProduct.get(product)!.push(supplier.name);
        });
      });

    suppliersByProduct.forEach((suppliers, product) => {
      if (suppliers.length > 3) {
        opportunities.push({
          supplier: suppliers[0],
          message: `${suppliers.length} suppliers for ${product} - consolidation opportunity`,
          action: 'Consider reducing supplier count for efficiency',
        });
      }
    });

    return opportunities;
  }

  private calculateNetworkHealth(
    graph: any,
    vulnerabilities: any,
    updates: any[]
  ): number {
    let health = 100;

    // Deduct for vulnerabilities
    health -= vulnerabilities.singlePointsOfFailure.length * 10;
    health -= vulnerabilities.highRiskClusters.length * 5;
    health -= vulnerabilities.weakLinks.length * 3;

    // Deduct for low ESG scores
    const lowEsgCount = updates.filter(u => u.esg_score < 50).length;
    health -= lowEsgCount * 5;

    // Network density bonus
    if (graph.metadata.density > 0.3) {
      health += 10; // Well-connected network
    }

    return Math.max(0, Math.min(100, health));
  }

  private generateNetworkRecommendations(
    health: number,
    vulnerabilities: any,
    alerts: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (health < 70) {
      recommendations.push('Network health is concerning - immediate action needed');
    }

    if (vulnerabilities.singlePointsOfFailure.length > 0) {
      recommendations.push('Add redundancy for critical suppliers');
    }

    if (alerts.filter(a => a.type === 'risk' && a.severity === 'high').length > 2) {
      recommendations.push('Multiple high-risk suppliers detected - diversify supply base');
    }

    const opportunities = alerts.filter(a => a.type === 'opportunity').length;
    if (opportunities > 3) {
      recommendations.push(`${opportunities} improvement opportunities identified`);
    }

    return recommendations;
  }
}