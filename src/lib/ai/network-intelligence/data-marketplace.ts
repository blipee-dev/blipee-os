import { createClient } from '@supabase/supabase-js';
import {
  DataListing,
  DataTransaction,
  MarketplaceAccount,
  DataQuality,
  PricingModel,
  AccessPermissions
} from './types';

interface MarketplaceOptions {
  sortBy?: 'relevance' | 'quality' | 'price' | 'recent';
  category?: string;
  minQuality?: number;
  maxPrice?: number;
}

export class ESGDataMarketplace {
  private supabase: ReturnType<typeof createClient>;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * List available data in the marketplace
   */
  async browseDataListings(
    filters?: {
      category?: string;
      industry?: string[];
      geography?: string[];
      dataType?: string;
      updateFrequency?: string;
    },
    options: MarketplaceOptions = {}
  ): Promise<DataListing[]> {
    const cacheKey = `listings-${JSON.stringify(filters)}-${JSON.stringify(options)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      let query = this.supabase
        .from('data_listings')
        .select('*')
        .eq('active', true);

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.industry && filters.industry.length > 0) {
        query = query.contains('industry', filters.industry);
      }

      if (filters?.geography && filters.geography.length > 0) {
        query = query.contains('geography', filters.geography);
      }

      if (filters?.dataType) {
        query = query.eq('data_type', filters.dataType);
      }

      if (filters?.updateFrequency) {
        query = query.eq('update_frequency', filters.updateFrequency);
      }

      if (options.minQuality) {
        query = query.gte('quality->score', options.minQuality);
      }

      const { data: listings, error } = await query;

      if (error) throw error;

      // Map and enrich listings
      const enrichedListings = await Promise.all(
        listings.map(async (listing) => {
          const provider = await this.getProviderInfo(listing.provider_id);
          return this.mapToDataListing(listing, provider);
        })
      );

      // Sort results
      const sortedListings = this.sortListings(enrichedListings, options.sortBy || 'relevance');

      this.setCached(cacheKey, sortedListings);
      return sortedListings;

    } catch (error) {
      console.error('Error browsing data listings:', error);
      throw error;
    }
  }

  /**
   * Create a new data listing
   */
  async createDataListing(
    providerId: string,
    listing: Omit<DataListing, 'id' | 'providerId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      // Validate data quality
      const quality = await this.assessDataQuality(listing);
      
      // Apply privacy preservation
      const privacyGuarantees = await this.applyPrivacyGuarantees(listing);

      const { data, error } = await this.supabase
        .from('data_listings')
        .insert({
          provider_id: providerId,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          data_type: listing.dataType,
          industry: listing.industry,
          geography: listing.geography,
          time_range: listing.timeRange,
          update_frequency: listing.updateFrequency,
          quality,
          pricing: listing.pricing,
          access: listing.access,
          privacy_guarantees: privacyGuarantees,
          metadata: listing.metadata,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Award credits for contribution
      await this.awardCredits(providerId, this.calculateContributionCredits(quality));

      return data.id;

    } catch (error) {
      console.error('Error creating data listing:', error);
      throw error;
    }
  }

  /**
   * Purchase access to data
   */
  async purchaseData(
    consumerId: string,
    listingId: string,
    accessType: 'one-time' | 'subscription' = 'one-time'
  ): Promise<DataTransaction> {
    try {
      // Get listing details
      const { data: listing } = await this.supabase
        .from('data_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (!listing) throw new Error('Listing not found');

      // Check consumer has enough credits
      const cost = this.calculateCost(listing, accessType);
      const hasCredits = await this.checkCredits(consumerId, cost);
      
      if (!hasCredits) {
        throw new Error('Insufficient credits');
      }

      // Create transaction
      const { data: transaction, error } = await this.supabase
        .from('data_transactions')
        .insert({
          listing_id: listingId,
          consumer_id: consumerId,
          provider_id: listing.provider_id,
          transaction_type: accessType,
          credits: cost,
          status: 'pending',
          access_details: {
            type: accessType,
            expiresAt: accessType === 'subscription' 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Process payment
      await this.processPayment(consumerId, listing.provider_id, cost);

      // Grant access
      await this.grantAccess(consumerId, listingId, transaction.id);

      // Update transaction status
      await this.supabase
        .from('data_transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      return this.mapToDataTransaction(transaction);

    } catch (error) {
      console.error('Error purchasing data:', error);
      throw error;
    }
  }

  /**
   * Contribute anonymized data
   */
  async contributeData(
    providerId: string,
    data: {
      category: string;
      description: string;
      data: any;
      timeRange?: { start: Date; end: Date };
    }
  ): Promise<{ contributionId: string; creditsEarned: number }> {
    try {
      // Apply privacy preservation
      const { PrivacyLayer } = await import('./privacy/privacy-layer');
      const privacyLayer = new PrivacyLayer();
      const anonymized = await privacyLayer.anonymizeDataset(data.data);

      // Assess quality
      const qualityScore = this.assessContributionQuality(anonymized.data);

      // Store contribution
      const { data: contribution, error } = await this.supabase
        .from('data_contributions')
        .insert({
          provider_id: providerId,
          category: data.category,
          description: data.description,
          data: anonymized.data,
          quality_score: qualityScore,
          privacy_applied: true,
          anonymization_metadata: anonymized.metadata,
          time_range: data.timeRange
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate and award credits
      const credits = Math.round(qualityScore * 10); // 10 credits per quality point
      await this.awardCredits(providerId, credits);

      return {
        contributionId: contribution.id,
        creditsEarned: credits
      };

    } catch (error) {
      console.error('Error contributing data:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<{
    totalListings: number;
    activeProviders: number;
    totalTransactions: number;
    averageQuality: number;
    topCategories: { category: string; count: number }[];
  }> {
    try {
      // Get listing stats
      const { data: listings } = await this.supabase
        .from('data_listings')
        .select('category, quality')
        .eq('active', true);

      // Get provider count
      const { count: providerCount } = await this.supabase
        .from('marketplace_accounts')
        .select('*', { count: 'exact', head: true });

      // Get transaction count
      const { count: transactionCount } = await this.supabase
        .from('data_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Calculate stats
      const categoryCount = new Map<string, number>();
      let totalQuality = 0;

      listings?.forEach(listing => {
        categoryCount.set(listing.category, (categoryCount.get(listing.category) || 0) + 1);
        totalQuality += listing.quality?.score || 0;
      });

      const topCategories = Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalListings: listings?.length || 0,
        activeProviders: providerCount || 0,
        totalTransactions: transactionCount || 0,
        averageQuality: listings?.length ? totalQuality / listings.length : 0,
        topCategories
      };

    } catch (error) {
      console.error('Error getting marketplace stats:', error);
      throw error;
    }
  }

  /**
   * Search for specific data
   */
  async searchData(
    query: string,
    filters?: any
  ): Promise<DataListing[]> {
    try {
      // Use full-text search on listings
      const { data: listings } = await this.supabase
        .from('data_listings')
        .select('*')
        .textSearch('title', query)
        .eq('active', true);

      // Apply additional filters
      let filtered = listings || [];
      
      if (filters?.category) {
        filtered = filtered.filter(l => l.category === filters.category);
      }

      if (filters?.minQuality) {
        filtered = filtered.filter(l => (l.quality?.score || 0) >= filters.minQuality);
      }

      // Rank by relevance
      const ranked = filtered.map(listing => ({
        ...listing,
        relevance: this.calculateRelevance(listing, query)
      })).sort((a, b) => b.relevance - a.relevance);

      return ranked.map(l => this.mapToDataListing(l));

    } catch (error) {
      console.error('Error searching data:', error);
      throw error;
    }
  }

  /**
   * Get account information
   */
  async getMarketplaceAccount(organizationId: string): Promise<MarketplaceAccount> {
    try {
      const { data: account } = await this.supabase
        .from('marketplace_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (!account) {
        // Create new account
        const { data: newAccount } = await this.supabase
          .from('marketplace_accounts')
          .insert({
            organization_id: organizationId,
            credits: 100, // Welcome bonus
            reputation_score: 5.0
          })
          .select()
          .single();

        return this.mapToMarketplaceAccount(newAccount);
      }

      return this.mapToMarketplaceAccount(account);

    } catch (error) {
      console.error('Error getting marketplace account:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getProviderInfo(providerId: string): Promise<any> {
    const { data: org } = await this.supabase
      .from('organizations')
      .select('name, industry')
      .eq('id', providerId)
      .single();

    return org;
  }

  private mapToDataListing(row: any, provider?: any): DataListing {
    return {
      id: row.id,
      providerId: row.provider_id,
      providerName: provider?.name,
      title: row.title,
      description: row.description,
      category: row.category,
      dataType: row.data_type,
      industry: row.industry || [],
      geography: row.geography || [],
      timeRange: row.time_range,
      updateFrequency: row.update_frequency,
      quality: row.quality,
      pricing: row.pricing,
      access: row.access,
      privacyGuarantees: row.privacy_guarantees,
      metadata: row.metadata || {},
      active: row.active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToDataTransaction(row: any): DataTransaction {
    return {
      id: row.id,
      listingId: row.listing_id,
      consumerId: row.consumer_id,
      providerId: row.provider_id,
      transactionType: row.transaction_type,
      credits: row.credits,
      timestamp: new Date(row.timestamp),
      status: row.status,
      accessDetails: row.access_details
    };
  }

  private mapToMarketplaceAccount(row: any): MarketplaceAccount {
    return {
      id: row.id,
      organizationId: row.organization_id,
      credits: row.credits,
      reputationScore: row.reputation_score,
      totalContributions: row.total_contributions || 0,
      totalPurchases: row.total_purchases || 0,
      joinedAt: new Date(row.created_at)
    };
  }

  private sortListings(listings: DataListing[], sortBy: string): DataListing[] {
    switch (sortBy) {
      case 'quality':
        return listings.sort((a, b) => (b.quality?.score || 0) - (a.quality?.score || 0));
      case 'price':
        return listings.sort((a, b) => {
          const priceA = a.pricing.model === 'credits' ? a.pricing.credits || 0 : 0;
          const priceB = b.pricing.model === 'credits' ? b.pricing.credits || 0 : 0;
          return priceA - priceB;
        });
      case 'recent':
        return listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      default: // relevance
        return listings; // Already sorted by relevance if from search
    }
  }

  private async assessDataQuality(listing: any): Promise<DataQuality> {
    // Assess various quality dimensions
    const completeness = this.assessCompleteness(listing);
    const accuracy = await this.assessAccuracy(listing);
    const consistency = this.assessConsistency(listing);
    const timeliness = this.assessTimeliness(listing);

    const score = (completeness + accuracy + consistency + timeliness) / 4;

    return {
      score,
      completeness,
      accuracy,
      consistency,
      timeliness,
      validation: {
        lastChecked: new Date(),
        issues: []
      }
    };
  }

  private assessCompleteness(listing: any): number {
    let score = 100;
    
    if (!listing.description) score -= 10;
    if (!listing.timeRange) score -= 10;
    if (!listing.industry || listing.industry.length === 0) score -= 10;
    if (!listing.geography || listing.geography.length === 0) score -= 10;
    
    return Math.max(score, 0);
  }

  private async assessAccuracy(listing: any): Promise<number> {
    // Would validate against known benchmarks
    return 85; // Simplified
  }

  private assessConsistency(listing: any): number {
    // Check for internal consistency
    return 90; // Simplified
  }

  private assessTimeliness(listing: any): number {
    if (!listing.updateFrequency) return 50;
    
    const frequencyScores: Record<string, number> = {
      'real-time': 100,
      'daily': 90,
      'weekly': 80,
      'monthly': 70,
      'quarterly': 60,
      'annually': 50
    };
    
    return frequencyScores[listing.updateFrequency] || 50;
  }

  private async applyPrivacyGuarantees(listing: any): Promise<any> {
    return {
      kAnonymity: listing.access?.minGroupSize || 5,
      differentialPrivacy: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      dataRetention: listing.access?.retentionDays || 90
    };
  }

  private calculateContributionCredits(quality: DataQuality): number {
    return Math.round(quality.score * 10);
  }

  private calculateCost(listing: any, accessType: string): number {
    if (listing.pricing.model === 'free') return 0;
    
    const baseCost = listing.pricing.credits || 100;
    
    if (accessType === 'subscription') {
      return baseCost * 10; // 10x for subscription
    }
    
    return baseCost;
  }

  private async checkCredits(organizationId: string, amount: number): Promise<boolean> {
    const { data: account } = await this.supabase
      .from('marketplace_accounts')
      .select('credits')
      .eq('organization_id', organizationId)
      .single();

    return account?.credits >= amount;
  }

  private async processPayment(consumerId: string, providerId: string, amount: number): Promise<void> {
    // Deduct from consumer
    await this.supabase.rpc('deduct_marketplace_credits', {
      p_consumer_id: consumerId,
      p_amount: amount
    });

    // Add to provider (minus platform fee)
    const providerAmount = Math.round(amount * 0.9); // 10% platform fee
    await this.supabase.rpc('award_marketplace_credits', {
      p_provider_id: providerId,
      p_amount: providerAmount
    });
  }

  private async grantAccess(consumerId: string, listingId: string, transactionId: string): Promise<void> {
    // Would implement actual data access granting
    console.log(`Granting access to ${consumerId} for listing ${listingId}`);
  }

  private async awardCredits(organizationId: string, amount: number): Promise<void> {
    await this.supabase.rpc('award_marketplace_credits', {
      p_provider_id: organizationId,
      p_amount: amount
    });
  }

  private assessContributionQuality(data: any): number {
    // Simplified quality assessment
    let score = 50;
    
    if (Object.keys(data).length > 10) score += 20;
    if (Array.isArray(data) && data.length > 100) score += 20;
    if (data.metadata) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateRelevance(listing: any, query: string): number {
    let relevance = 0;
    const queryLower = query.toLowerCase();
    
    if (listing.title.toLowerCase().includes(queryLower)) relevance += 50;
    if (listing.description?.toLowerCase().includes(queryLower)) relevance += 30;
    if (listing.category.toLowerCase().includes(queryLower)) relevance += 20;
    
    return relevance;
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