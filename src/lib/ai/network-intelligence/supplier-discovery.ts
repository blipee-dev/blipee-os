import { createClient } from '@supabase/supabase-js';
import {
  Supplier,
  SupplierSearchCriteria,
  SupplierAssessment,
  SupplierRecommendation,
  SupplierMatch
} from './types';

interface DiscoveryOptions {
  maxResults?: number;
  includeUnverified?: boolean;
  sortBy?: 'relevance' | 'esg_score' | 'reliability' | 'distance';
  radius?: number; // km for location-based search
}

export class SupplierDiscoveryEngine {
  private supabase: ReturnType<typeof createClient>;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Discover suppliers matching criteria
   */
  async discoverSuppliers(
    criteria: SupplierSearchCriteria,
    options: DiscoveryOptions = {}
  ): Promise<SupplierMatch[]> {
    const cacheKey = `discovery-${JSON.stringify(criteria)}-${JSON.stringify(options)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Build query
      let query = this.supabase
        .from('global_suppliers')
        .select('*')
        .eq('active', true);

      // Apply filters
      if (!options.includeUnverified) {
        query = query.eq('verified', true);
      }

      if (criteria.industry) {
        query = query.eq('industry', criteria.industry);
      }

      if (criteria.products && criteria.products.length > 0) {
        query = query.contains('products', criteria.products);
      }

      if (criteria.capabilities && criteria.capabilities.length > 0) {
        query = query.contains('capabilities', criteria.capabilities);
      }

      if (criteria.certifications && criteria.certifications.length > 0) {
        query = query.contains('certifications', criteria.certifications);
      }

      if (criteria.minEsgScore) {
        query = query.gte('esg_score->overall', criteria.minEsgScore);
      }

      if (criteria.size) {
        query = query.eq('size', criteria.size);
      }

      // Execute query
      const { data: suppliers, error } = await query.limit(options.maxResults || 50);

      if (error) throw error;

      // Calculate match scores and recommendations
      const matches = await Promise.all(
        suppliers.map(async (supplier) => {
          const matchScore = this.calculateMatchScore(supplier, criteria);
          const assessment = await this.assessSupplier(supplier, criteria);
          
          return {
            supplier: this.mapToSupplier(supplier),
            matchScore,
            assessment,
            recommendations: this.generateRecommendations(supplier, assessment, criteria)
          };
        })
      );

      // Sort results
      const sortedMatches = this.sortResults(matches, options.sortBy || 'relevance');

      // Apply location filtering if needed
      const finalMatches = criteria.location && options.radius
        ? this.filterByLocation(sortedMatches, criteria.location, options.radius)
        : sortedMatches;

      this.setCached(cacheKey, finalMatches);
      return finalMatches;

    } catch (error) {
      console.error('Error discovering suppliers:', error);
      throw error;
    }
  }

  /**
   * Get supplier recommendations for an organization
   */
  async getSupplierRecommendations(
    organizationId: string,
    category: string,
    limit: number = 10
  ): Promise<SupplierRecommendation[]> {
    try {
      // Get organization profile
      const { data: org } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (!org) throw new Error('Organization not found');

      // Get current suppliers to avoid duplicates
      const { data: currentSuppliers } = await this.supabase
        .from('suppliers')
        .select('external_id')
        .eq('organization_id', organizationId);

      const excludeIds = currentSuppliers?.map(s => s.external_id) || [];

      // Build search criteria based on organization needs
      const criteria: SupplierSearchCriteria = {
        industry: category,
        minEsgScore: org.sustainability_goals?.min_supplier_esg_score || 60,
        location: org.location,
        size: this.getCompatibleSupplierSize(org.size_category)
      };

      // Discover suppliers
      const matches = await this.discoverSuppliers(criteria, {
        maxResults: limit * 2, // Get extra to filter
        sortBy: 'relevance'
      });

      // Filter out current suppliers and convert to recommendations
      const recommendations: SupplierRecommendation[] = matches
        .filter(m => !excludeIds.includes(m.supplier.id))
        .slice(0, limit)
        .map(match => ({
          supplierId: match.supplier.id,
          supplier: match.supplier,
          reason: this.generateRecommendationReason(match, org),
          benefits: this.calculateBenefits(match.supplier, org),
          risks: this.identifyRisks(match.supplier, org),
          integrationEffort: this.estimateIntegrationEffort(match.supplier, org),
          alternativeSuppliers: this.findAlternatives(match.supplier, matches)
        }));

      return recommendations;

    } catch (error) {
      console.error('Error getting supplier recommendations:', error);
      throw error;
    }
  }

  /**
   * Assess a specific supplier
   */
  async assessSupplier(
    supplier: any,
    criteria?: SupplierSearchCriteria
  ): Promise<SupplierAssessment> {
    try {
      // Calculate various scores
      const scores = {
        sustainability: this.calculateSustainabilityScore(supplier),
        reliability: this.calculateReliabilityScore(supplier),
        capacity: this.calculateCapacityScore(supplier),
        compliance: this.calculateComplianceScore(supplier),
        innovation: this.calculateInnovationScore(supplier),
        overall: 0
      };

      // Calculate overall score
      scores.overall = (
        scores.sustainability * 0.3 +
        scores.reliability * 0.25 +
        scores.capacity * 0.2 +
        scores.compliance * 0.15 +
        scores.innovation * 0.1
      );

      // Identify strengths and weaknesses
      const strengths = this.identifyStrengths(supplier, scores);
      const weaknesses = this.identifyWeaknesses(supplier, scores);

      // Get peer comparison if possible
      const peerComparison = await this.getPeerComparison(supplier);

      return {
        supplierId: supplier.id,
        scores,
        strengths,
        weaknesses,
        certifications: supplier.certifications || [],
        riskFactors: this.identifyRiskFactors(supplier),
        improvementAreas: this.identifyImprovementAreas(supplier, scores),
        peerComparison,
        lastAssessmentDate: new Date()
      };

    } catch (error) {
      console.error('Error assessing supplier:', error);
      throw error;
    }
  }

  /**
   * Find alternative suppliers for risk mitigation
   */
  async findAlternativeSuppliers(
    currentSupplierId: string,
    limit: number = 5
  ): Promise<Supplier[]> {
    try {
      // Get current supplier details
      const { data: currentSupplier } = await this.supabase
        .from('global_suppliers')
        .select('*')
        .eq('id', currentSupplierId)
        .single();

      if (!currentSupplier) throw new Error('Supplier not found');

      // Search for alternatives with similar capabilities
      const criteria: SupplierSearchCriteria = {
        products: currentSupplier.products,
        capabilities: currentSupplier.capabilities,
        minEsgScore: (currentSupplier.esg_score?.overall || 0) - 10 // Slightly lower threshold
      };

      const matches = await this.discoverSuppliers(criteria, {
        maxResults: limit + 1 // Include current to filter out
      });

      return matches
        .filter(m => m.supplier.id !== currentSupplierId)
        .slice(0, limit)
        .map(m => m.supplier);

    } catch (error) {
      console.error('Error finding alternative suppliers:', error);
      throw error;
    }
  }

  /**
   * Validate supplier credentials
   */
  async validateSupplier(supplierId: string): Promise<boolean> {
    try {
      // Check various validation sources
      const validations = await Promise.all([
        this.validateCertifications(supplierId),
        this.validateBusinessRegistration(supplierId),
        this.validateFinancialHealth(supplierId),
        this.validateESGClaims(supplierId)
      ]);

      const isValid = validations.every(v => v);

      // Update verification status
      if (isValid) {
        await this.supabase
          .from('global_suppliers')
          .update({ 
            verified: true,
            verified_at: new Date(),
            verification_details: {
              certifications: validations[0],
              registration: validations[1],
              financial: validations[2],
              esg: validations[3]
            }
          })
          .eq('id', supplierId);
      }

      return isValid;

    } catch (error) {
      console.error('Error validating supplier:', error);
      return false;
    }
  }

  // Private helper methods

  private calculateMatchScore(supplier: any, criteria: SupplierSearchCriteria): number {
    let score = 0;
    let factors = 0;

    // Product match
    if (criteria.products && supplier.products) {
      const productMatch = criteria.products.filter(p => 
        supplier.products.includes(p)
      ).length / criteria.products.length;
      score += productMatch * 30;
      factors++;
    }

    // Capability match
    if (criteria.capabilities && supplier.capabilities) {
      const capabilityMatch = criteria.capabilities.filter(c => 
        supplier.capabilities.includes(c)
      ).length / criteria.capabilities.length;
      score += capabilityMatch * 25;
      factors++;
    }

    // ESG score
    if (criteria.minEsgScore && supplier.esg_score?.overall) {
      const esgMatch = Math.min(supplier.esg_score.overall / criteria.minEsgScore, 1);
      score += esgMatch * 20;
      factors++;
    }

    // Certification match
    if (criteria.certifications && supplier.certifications) {
      const certMatch = criteria.certifications.filter(c => 
        supplier.certifications.includes(c)
      ).length / criteria.certifications.length;
      score += certMatch * 15;
      factors++;
    }

    // Size compatibility
    if (criteria.size && supplier.size === criteria.size) {
      score += 10;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  private generateRecommendations(
    supplier: any,
    assessment: SupplierAssessment,
    criteria: SupplierSearchCriteria
  ): string[] {
    const recommendations: string[] = [];

    // ESG recommendations
    if (assessment.scores.sustainability < 70) {
      recommendations.push('Request sustainability improvement plan before contracting');
    }

    // Capacity recommendations
    if (assessment.scores.capacity < 60) {
      recommendations.push('Consider phased onboarding to test capacity');
    }

    // Certification recommendations
    if (criteria.certifications) {
      const missing = criteria.certifications.filter(c => 
        !supplier.certifications?.includes(c)
      );
      if (missing.length > 0) {
        recommendations.push(`Require ${missing.join(', ')} certification within 6 months`);
      }
    }

    // Risk recommendations
    if (assessment.riskFactors.length > 2) {
      recommendations.push('Implement enhanced monitoring and backup supplier strategy');
    }

    return recommendations;
  }

  private sortResults(matches: SupplierMatch[], sortBy: string): SupplierMatch[] {
    switch (sortBy) {
      case 'esg_score':
        return matches.sort((a, b) => 
          (b.supplier.esgScore || 0) - (a.supplier.esgScore || 0)
        );
      case 'reliability':
        return matches.sort((a, b) => 
          (b.assessment.scores.reliability || 0) - (a.assessment.scores.reliability || 0)
        );
      case 'distance':
        return matches; // Would need location data
      default: // relevance
        return matches.sort((a, b) => b.matchScore - a.matchScore);
    }
  }

  private filterByLocation(
    matches: SupplierMatch[],
    location: any,
    radius: number
  ): SupplierMatch[] {
    // Simplified - would use proper geospatial queries
    return matches.filter(match => {
      if (!match.supplier.location) return false;
      
      const distance = this.calculateDistance(
        location,
        match.supplier.location
      );
      
      return distance <= radius;
    });
  }

  private calculateDistance(loc1: any, loc2: any): number {
    // Haversine formula for distance calculation
    if (!loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) return Infinity;
    
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  private mapToSupplier(row: any): Supplier {
    return {
      id: row.id,
      name: row.name,
      industry: row.industry,
      location: row.location,
      size: row.size,
      certifications: row.certifications || [],
      esgScore: row.esg_score?.overall,
      products: row.products || [],
      capabilities: row.capabilities || [],
      capacity: row.capacity,
      reliability: row.reliability,
      verified: row.verified,
      metadata: row.metadata || {}
    };
  }

  private getCompatibleSupplierSize(orgSize: string): string {
    // Map organization size to compatible supplier sizes
    const sizeMap: Record<string, string> = {
      'startup': 'small',
      'small': 'small',
      'medium': 'medium',
      'large': 'large',
      'enterprise': 'enterprise'
    };
    
    return sizeMap[orgSize] || 'medium';
  }

  private generateRecommendationReason(match: SupplierMatch, org: any): string {
    const reasons: string[] = [];
    
    if (match.matchScore > 80) {
      reasons.push('Excellent match for your requirements');
    }
    
    if (match.supplier.esgScore && match.supplier.esgScore > 80) {
      reasons.push('Outstanding sustainability performance');
    }
    
    if (match.assessment.scores.reliability > 85) {
      reasons.push('Proven track record of reliability');
    }
    
    if (match.supplier.location && org.location) {
      const distance = this.calculateDistance(match.supplier.location, org.location);
      if (distance < 100) {
        reasons.push('Local supplier reducing transportation emissions');
      }
    }
    
    return reasons.join('. ') || 'Meets your specified criteria';
  }

  private calculateBenefits(supplier: Supplier, org: any): string[] {
    const benefits: string[] = [];
    
    if (supplier.esgScore && supplier.esgScore > 70) {
      benefits.push(`${Math.round((supplier.esgScore - 50) * 2)}% improvement in supply chain sustainability`);
    }
    
    if (supplier.certifications.length > 3) {
      benefits.push('Reduces compliance risk with multiple certifications');
    }
    
    if (supplier.capacity?.scalability === 'high') {
      benefits.push('Can scale with your growth');
    }
    
    return benefits;
  }

  private identifyRisks(supplier: Supplier, org: any): string[] {
    const risks: string[] = [];
    
    if (!supplier.verified) {
      risks.push('Unverified supplier - due diligence required');
    }
    
    if (supplier.size === 'small' && org.size_category === 'enterprise') {
      risks.push('Capacity constraints for large orders');
    }
    
    if (!supplier.certifications.includes('ISO9001')) {
      risks.push('No quality management certification');
    }
    
    return risks;
  }

  private estimateIntegrationEffort(supplier: Supplier, org: any): 'low' | 'medium' | 'high' {
    let effort = 0;
    
    // Check system compatibility
    if (!supplier.metadata?.systems || !org.systems) {
      effort += 2;
    }
    
    // Check process alignment
    if (supplier.size !== this.getCompatibleSupplierSize(org.size_category)) {
      effort += 1;
    }
    
    // Check certification requirements
    if (supplier.certifications.length < 2) {
      effort += 1;
    }
    
    if (effort <= 1) return 'low';
    if (effort <= 3) return 'medium';
    return 'high';
  }

  private findAlternatives(
    supplier: Supplier,
    allMatches: SupplierMatch[]
  ): string[] {
    return allMatches
      .filter(m => 
        m.supplier.id !== supplier.id &&
        m.supplier.products.some(p => supplier.products.includes(p))
      )
      .slice(0, 3)
      .map(m => m.supplier.id);
  }

  // Score calculation methods

  private calculateSustainabilityScore(supplier: any): number {
    let score = 50; // Base score
    
    if (supplier.esg_score?.overall) {
      score = supplier.esg_score.overall;
    }
    
    // Bonus for certifications
    const sustainabilityCerts = ['ISO14001', 'B-Corp', 'EcoVadis'];
    const certCount = supplier.certifications?.filter((c: string) => 
      sustainabilityCerts.includes(c)
    ).length || 0;
    
    score += certCount * 5;
    
    return Math.min(score, 100);
  }

  private calculateReliabilityScore(supplier: any): number {
    if (supplier.reliability?.score) {
      return supplier.reliability.score;
    }
    
    // Calculate based on available data
    let score = 70; // Base score
    
    if (supplier.verified) score += 10;
    if (supplier.years_in_business > 5) score += 10;
    if (supplier.certifications?.includes('ISO9001')) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateCapacityScore(supplier: any): number {
    if (supplier.capacity?.score) {
      return supplier.capacity.score;
    }
    
    // Size-based estimation
    const sizeScores: Record<string, number> = {
      'small': 40,
      'medium': 60,
      'large': 80,
      'enterprise': 95
    };
    
    return sizeScores[supplier.size] || 50;
  }

  private calculateComplianceScore(supplier: any): number {
    let score = 60; // Base score
    
    // Certifications add to compliance
    const complianceCerts = ['ISO9001', 'ISO14001', 'ISO45001', 'SOC2'];
    const certCount = supplier.certifications?.filter((c: string) => 
      complianceCerts.includes(c)
    ).length || 0;
    
    score += certCount * 10;
    
    return Math.min(score, 100);
  }

  private calculateInnovationScore(supplier: any): number {
    let score = 50; // Base score
    
    // R&D investment
    if (supplier.metadata?.rd_investment_percent > 5) score += 20;
    
    // Patents or innovations
    if (supplier.metadata?.patents_count > 0) score += 15;
    
    // Sustainability innovations
    if (supplier.metadata?.sustainability_innovations) score += 15;
    
    return Math.min(score, 100);
  }

  // Validation methods

  private async validateCertifications(supplierId: string): Promise<boolean> {
    // Would integrate with certification bodies' APIs
    return true; // Simplified
  }

  private async validateBusinessRegistration(supplierId: string): Promise<boolean> {
    // Would check business registries
    return true; // Simplified
  }

  private async validateFinancialHealth(supplierId: string): Promise<boolean> {
    // Would check financial databases
    return true; // Simplified
  }

  private async validateESGClaims(supplierId: string): Promise<boolean> {
    // Would verify ESG claims through third parties
    return true; // Simplified
  }

  // Additional helper methods

  private identifyStrengths(supplier: any, scores: any): string[] {
    const strengths: string[] = [];
    
    if (scores.sustainability > 80) strengths.push('Excellent sustainability practices');
    if (scores.reliability > 85) strengths.push('Highly reliable partner');
    if (scores.capacity > 75) strengths.push('Strong capacity and scalability');
    if (scores.compliance > 80) strengths.push('Robust compliance framework');
    if (scores.innovation > 70) strengths.push('Innovation leader');
    
    return strengths;
  }

  private identifyWeaknesses(supplier: any, scores: any): string[] {
    const weaknesses: string[] = [];
    
    if (scores.sustainability < 60) weaknesses.push('Sustainability improvements needed');
    if (scores.reliability < 65) weaknesses.push('Reliability concerns');
    if (scores.capacity < 50) weaknesses.push('Limited capacity');
    if (scores.compliance < 60) weaknesses.push('Compliance gaps');
    if (scores.innovation < 40) weaknesses.push('Limited innovation');
    
    return weaknesses;
  }

  private identifyRiskFactors(supplier: any): string[] {
    const risks: string[] = [];
    
    if (!supplier.verified) risks.push('Unverified supplier');
    if (supplier.location?.risk_level === 'high') risks.push('High-risk location');
    if (supplier.financial_health === 'poor') risks.push('Financial instability');
    if (!supplier.certifications?.length) risks.push('No certifications');
    
    return risks;
  }

  private identifyImprovementAreas(supplier: any, scores: any): string[] {
    const improvements: string[] = [];
    
    // Find lowest scoring areas
    const scoreEntries = Object.entries(scores)
      .filter(([key]) => key !== 'overall')
      .sort(([,a], [,b]) => (a as number) - (b as number));
    
    const lowestTwo = scoreEntries.slice(0, 2);
    
    for (const [area, score] of lowestTwo) {
      if ((score as number) < 70) {
        improvements.push(`Improve ${area} (current: ${score})`);
      }
    }
    
    return improvements;
  }

  private async getPeerComparison(supplier: any): Promise<any> {
    // Would compare against industry peers
    return {
      industryAverage: 65,
      percentile: 75,
      topPerformer: false
    };
  }

  private getCached(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}