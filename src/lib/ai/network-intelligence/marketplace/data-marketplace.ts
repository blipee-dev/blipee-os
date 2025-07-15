/**
 * ESG Data Marketplace
 * Platform for sharing and discovering anonymized ESG data
 */

import { createBrowserClient } from '@/lib/supabase/client';
import { PrivacyLayer } from '../privacy/privacy-layer';

export interface DataListing {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: 'emissions' | 'energy' | 'water' | 'waste' | 'social' | 'governance' | 'supply_chain';
  dataType: 'time_series' | 'snapshot' | 'benchmark' | 'model';
  industry: string[];
  geography: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
  updateFrequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  quality: {
    score: number; // 0-100
    completeness: number; // percentage
    accuracy: number; // percentage
    verificationLevel: 'self_reported' | 'third_party' | 'certified';
  };
  pricing: {
    model: 'free' | 'subscription' | 'per_access' | 'contribution_based';
    price?: number;
    currency?: string;
  };
  access: {
    method: 'api' | 'download' | 'stream';
    format: string[]; // ['json', 'csv', 'parquet']
    sampleAvailable: boolean;
  };
  privacyGuarantees: {
    anonymized: boolean;
    aggregationLevel: string;
    minimumContributors: number;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataTransaction {
  id: string;
  listingId: string;
  consumerId: string;
  providerId: string;
  transactionType: 'purchase' | 'exchange' | 'contribution';
  credits: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  accessDetails?: {
    url: string;
    expiresAt: Date;
    format: string;
  };
}

export interface MarketplaceStats {
  totalListings: number;
  activeProviders: number;
  totalTransactions: number;
  dataQualityScore: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: DataTransaction[];
}

export class ESGDataMarketplace {
  private supabase;
  private privacyLayer: PrivacyLayer;

  constructor() {
    this.supabase = createBrowserClient();
    this.privacyLayer = new PrivacyLayer();
  }

  /**
   * List data on the marketplace
   */
  async createListing(listing: Omit<DataListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataListing> {
    console.log('📂 Creating data listing on marketplace...');

    try {
      // Validate privacy guarantees
      if (!listing.privacyGuarantees.anonymized) {
        throw new Error('Only anonymized data can be listed on the marketplace');
      }

      // Calculate quality score if not provided
      if (!listing.quality.score) {
        listing.quality.score = this.calculateQualityScore(listing.quality);
      }

      const { data, error } = await this.supabase
        .from('data_listings')
        .insert({
          ...listing,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      // Index for search
      await this.indexListing(data);

      return data;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Search and discover data listings
   */
  async searchListings(params: {
    category?: string;
    industry?: string;
    geography?: string;
    dataType?: string;
    minQuality?: number;
    maxPrice?: number;
    freeOnly?: boolean;
  }): Promise<DataListing[]> {
    console.log('🔍 Searching marketplace listings...');

    try {
      let query = this.supabase
        .from('data_listings')
        .select('*')
        .eq('active', true);

      // Apply filters
      if (params.category) {
        query = query.eq('category', params.category);
      }
      if (params.dataType) {
        query = query.eq('data_type', params.dataType);
      }
      if (params.industry) {
        query = query.contains('industry', [params.industry]);
      }
      if (params.geography) {
        query = query.contains('geography', [params.geography]);
      }
      if (params.minQuality) {
        query = query.gte('quality->score', params.minQuality);
      }
      if (params.freeOnly) {
        query = query.eq('pricing->model', 'free');
      }
      if (params.maxPrice !== undefined) {
        query = query.or(`pricing->model.eq.free,pricing->price.lte.${params.maxPrice}`);
      }

      const { data, error } = await query
        .order('quality->score', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error searching listings:', error);
      throw error;
    }
  }

  /**
   * Access data from a listing
   */
  async accessData(listingId: string, consumerId: string): Promise<DataTransaction> {
    console.log('🔓 Accessing marketplace data...');

    try {
      // Get listing details
      const { data: listing } = await this.supabase
        .from('data_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (!listing) {
        throw new Error('Listing not found');
      }

      // Check access permissions and credits
      const hasAccess = await this.checkAccess(consumerId, listing);
      if (!hasAccess) {
        throw new Error('Insufficient credits or permissions');
      }

      // Create transaction
      const transaction: Partial<DataTransaction> = {
        listingId,
        consumerId,
        providerId: listing.provider_id,
        transactionType: listing.pricing.model === 'free' ? 'contribution' : 'purchase',
        credits: listing.pricing.model === 'free' ? 0 : listing.pricing.price || 0,
        timestamp: new Date(),
        status: 'pending',
      };

      const { data: txData, error: txError } = await this.supabase
        .from('data_transactions')
        .insert(transaction)
        .select()
        .single();

      if (txError) throw txError;

      // Generate access URL
      const accessUrl = await this.generateAccessUrl(listing, txData.id);

      // Update transaction with access details
      const { data: finalTx } = await this.supabase
        .from('data_transactions')
        .update({
          status: 'completed',
          access_details: {
            url: accessUrl,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            format: listing.access.format[0],
          },
        })
        .eq('id', txData.id)
        .select()
        .single();

      // Deduct credits if needed
      if (listing.pricing.model !== 'free') {
        await this.deductCredits(consumerId, listing.pricing.price || 0);
      }

      return finalTx;
    } catch (error) {
      console.error('Error accessing data:', error);
      throw error;
    }
  }

  /**
   * Contribute data and earn credits
   */
  async contributeData(params: {
    providerId: string;
    data: any;
    metadata: {
      category: string;
      description: string;
      timeRange: { start: Date; end: Date };
    };
  }): Promise<{
    contributionId: string;
    creditsEarned: number;
    qualityScore: number;
  }> {
    console.log('📤 Contributing data to marketplace...');

    try {
      // Validate and anonymize data
      const validation = await this.validateContribution(params.data);
      if (!validation.valid) {
        throw new Error(`Invalid data: ${validation.issues.join(', ')}`);
      }

      // Apply privacy preservation
      const anonymizedData = await this.privacyLayer.applyKAnonymity(
        params.data,
        ['organization_id', 'location'] // quasi-identifiers
      );

      // Calculate quality score
      const qualityScore = this.assessDataQuality(anonymizedData.data);

      // Store contribution
      const { data: contribution, error } = await this.supabase
        .from('data_contributions')
        .insert({
          provider_id: params.providerId,
          category: params.metadata.category,
          description: params.metadata.description,
          data: anonymizedData.data,
          quality_score: qualityScore,
          privacy_applied: true,
          anonymization_metadata: anonymizedData.metadata,
          time_range: params.metadata.timeRange,
          created_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate and award credits
      const creditsEarned = this.calculateCredits(qualityScore, anonymizedData.data.length);
      await this.awardCredits(params.providerId, creditsEarned);

      return {
        contributionId: contribution.id,
        creditsEarned,
        qualityScore,
      };
    } catch (error) {
      console.error('Error contributing data:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    console.log('📊 Getting marketplace statistics...');

    try {
      // Get counts
      const [listings, providers, transactions] = await Promise.all([
        this.supabase.from('data_listings').select('*', { count: 'exact', head: true }),
        this.supabase.from('data_listings').select('provider_id', { count: 'exact' }),
        this.supabase.from('data_transactions').select('*', { count: 'exact', head: true }),
      ]);

      // Get category distribution
      const { data: categories } = await this.supabase
        .from('data_listings')
        .select('category')
        .eq('active', true);

      const categoryCount = categories?.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCount || {})
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent activity
      const { data: recentActivity } = await this.supabase
        .from('data_transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      // Calculate average quality score
      const { data: qualityData } = await this.supabase
        .from('data_listings')
        .select('quality')
        .eq('active', true);

      const avgQuality = qualityData?.reduce((sum, item) => sum + (item.quality?.score || 0), 0) / (qualityData?.length || 1);

      return {
        totalListings: listings.count || 0,
        activeProviders: new Set(providers.data?.map(p => p.provider_id)).size,
        totalTransactions: transactions.count || 0,
        dataQualityScore: Math.round(avgQuality),
        topCategories,
        recentActivity: recentActivity || [],
      };
    } catch (error) {
      console.error('Error getting marketplace stats:', error);
      throw error;
    }
  }

  /**
   * Create data exchange agreement
   */
  async createDataExchange(params: {
    providerId: string;
    consumerId: string;
    dataDescription: string;
    terms: {
      duration: number; // days
      dataTypes: string[];
      usageRestrictions: string[];
      reciprocal: boolean;
    };
  }): Promise<{
    agreementId: string;
    status: 'pending' | 'active';
    expiresAt: Date;
  }> {
    console.log('🤝 Creating data exchange agreement...');

    try {
      const { data, error } = await this.supabase
        .from('data_exchange_agreements')
        .insert({
          provider_id: params.providerId,
          consumer_id: params.consumerId,
          description: params.dataDescription,
          terms: params.terms,
          status: 'pending',
          created_at: new Date(),
          expires_at: new Date(Date.now() + params.terms.duration * 24 * 60 * 60 * 1000),
        })
        .select()
        .single();

      if (error) throw error;

      // Notify consumer for approval
      await this.notifyForApproval(params.consumerId, data.id);

      return {
        agreementId: data.id,
        status: data.status,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      console.error('Error creating data exchange:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateQualityScore(quality: any): number {
    const weights = {
      completeness: 0.3,
      accuracy: 0.3,
      verificationLevel: 0.4,
    };

    const verificationScore = {
      certified: 100,
      third_party: 80,
      self_reported: 50,
    }[quality.verificationLevel] || 50;

    return Math.round(
      quality.completeness * weights.completeness +
      quality.accuracy * weights.accuracy +
      verificationScore * weights.verificationLevel
    );
  }

  private async indexListing(listing: DataListing): Promise<void> {
    // In a real implementation, this would update a search index
    console.log(`Indexed listing: ${listing.id}`);
  }

  private async checkAccess(consumerId: string, listing: any): Promise<boolean> {
    if (listing.pricing.model === 'free') {
      return true;
    }

    // Check credits
    const { data: consumer } = await this.supabase
      .from('marketplace_accounts')
      .select('credits')
      .eq('organization_id', consumerId)
      .single();

    return consumer && consumer.credits >= (listing.pricing.price || 0);
  }

  private async generateAccessUrl(listing: any, transactionId: string): Promise<string> {
    // In production, this would generate a secure, time-limited access URL
    return `https://marketplace.blipee.com/access/${listing.id}?tx=${transactionId}`;
  }

  private async deductCredits(consumerId: string, amount: number): Promise<void> {
    await this.supabase.rpc('deduct_marketplace_credits', {
      p_consumer_id: consumerId,
      p_amount: amount,
    });
  }

  private async awardCredits(providerId: string, amount: number): Promise<void> {
    await this.supabase.rpc('award_marketplace_credits', {
      p_provider_id: providerId,
      p_amount: amount,
    });
  }

  private async validateContribution(data: any): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (!Array.isArray(data) || data.length === 0) {
      issues.push('Data must be a non-empty array');
    }

    if (data.length < this.privacyLayer['config'].suppressionThreshold) {
      issues.push('Insufficient data points for privacy preservation');
    }

    // Check for required fields
    const requiredFields = ['timestamp', 'value', 'metric_type'];
    const hasRequiredFields = data.every(item =>
      requiredFields.every(field => field in item)
    );

    if (!hasRequiredFields) {
      issues.push(`Missing required fields: ${requiredFields.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private assessDataQuality(data: any[]): number {
    let score = 100;

    // Check completeness
    const nullCount = data.reduce((count, item) => {
      return count + Object.values(item).filter(v => v == null).length;
    }, 0);
    const completeness = 1 - (nullCount / (data.length * Object.keys(data[0] || {}).length));
    score *= completeness;

    // Check time range coverage
    if (data.length > 0 && data[0].timestamp) {
      const timestamps = data.map(d => new Date(d.timestamp).getTime());
      const range = Math.max(...timestamps) - Math.min(...timestamps);
      const expectedRange = 365 * 24 * 60 * 60 * 1000; // 1 year
      const coverage = Math.min(range / expectedRange, 1);
      score *= coverage;
    }

    return Math.round(score);
  }

  private calculateCredits(qualityScore: number, dataPoints: number): number {
    const baseCredits = Math.log10(dataPoints + 1) * 10;
    const qualityMultiplier = qualityScore / 100;
    return Math.round(baseCredits * qualityMultiplier);
  }

  private async notifyForApproval(consumerId: string, agreementId: string): Promise<void> {
    // In production, this would send a notification
    console.log(`Notification sent to ${consumerId} for agreement ${agreementId}`);
  }
}