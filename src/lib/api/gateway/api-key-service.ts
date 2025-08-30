import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';
import { getAuditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import crypto from 'crypto';
import {
  APIKey,
  APIKeyCreate,
  APIKeyWithSecret,
  APIKeyStatus,
  APIVersion,
  APIUsage,
  APIUsageHourly,
  APIQuota,
} from '@/types/api-gateway';

export class APIKeyService {
  private auditService = getAuditService();

  private async getSupabase() {
    if (typeof window === 'undefined') {
      return await createServerSupabaseClient();
    }
    return createClient();
  }

  /**
   * Generate a new API key
   */
  private generateAPIKey(prefix: string = 'blp'): string {
    const environment = process.env['NODE_ENV'] === 'production' ? 'live' : 'test';
    const randomBytes = crypto.randomBytes(32);
    const randomKey = randomBytes.toString('base64')
      .replace(/\+/g, '')
      .replace(/\//g, '')
      .replace(/=/g, '');
    
    return `${prefix}_${environment}_${randomKey}`;
  }

  /**
   * Hash an API key for secure storage
   */
  private hashAPIKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Extract key parts for storage
   */
  private extractKeyParts(key: string) {
    const parts = key.split('_');
    const prefix = parts.slice(0, 2).join('_'); // e.g., "blp_live"
    const lastFour = key.slice(-4);
    return { prefix, lastFour };
  }

  /**
   * Create a new API key
   */
  async createAPIKey(
    organizationId: string,
    data: APIKeyCreate,
    userId: string
  ): Promise<APIKeyWithSecret> {
    const supabase = await this.getSupabase();
    
    try {
      // Generate the API key
      const apiKey = this.generateAPIKey();
      const keyHash = this.hashAPIKey(apiKey);
      const { prefix, lastFour } = this.extractKeyParts(apiKey);

      // Insert the API key record
      const { data: keyData, error } = await supabase
        .from('api_keys')
        .insert({
          organization_id: organizationId,
          name: data.name,
          description: data.description,
          key_hash: keyHash,
          key_prefix: prefix,
          last_four: lastFour,
          version: data.version || APIVersion.V1,
          allowed_origins: data.allowed_origins,
          allowed_ips: data.allowed_ips,
          scopes: data.scopes || ['read:organizations', 'read:buildings'],
          rate_limit_override: data.rate_limit_override,
          expires_at: data.expires_at,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default quotas
      await this.createDefaultQuotas(keyData.id);

      // Audit log
      await this.auditService.log({
        type: AuditEventType.API_KEY_CREATED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'user', id: userId },
        target: {
          type: 'api_key',
          id: keyData.id,
          name: keyData.name,
        },
        context: { organizationId },
        metadata: {
          version: keyData.version,
          scopes: keyData.scopes,
        },
        result: 'success',
      });

      // Return the key with the actual key value (only time it's shown)
      return {
        ...keyData,
        key: apiKey,
      };
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw error;
    }
  }

  /**
   * Create default quotas for an API key
   */
  private async createDefaultQuotas(apiKeyId: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    const defaultQuotas = [
      {
        api_key_id: apiKeyId,
        quota_type: 'requests',
        limit_value: 10000, // 10k requests per hour
        period: 'hour',
        reset_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      },
      {
        api_key_id: apiKeyId,
        quota_type: 'requests',
        limit_value: 100000, // 100k requests per day
        period: 'day',
        reset_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      },
      {
        api_key_id: apiKeyId,
        quota_type: 'bandwidth',
        limit_value: 1073741824, // 1GB per month
        period: 'month',
        reset_at: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      },
    ];

    const { error } = await supabase
      .from('api_quotas')
      .insert(defaultQuotas);

    if (error) {
      console.error('Failed to create default quotas:', error);
    }
  }

  /**
   * List API keys for an organization
   */
  async listAPIKeys(organizationId: string): Promise<APIKey[]> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  }

  /**
   * Get a specific API key
   */
  async getAPIKey(id: string): Promise<APIKey | null> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  }

  /**
   * Validate an API key
   */
  async validateAPIKey(key: string): Promise<APIKey | null> {
    const supabase = await this.getSupabase();
    const keyHash = this.hashAPIKey(key);
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('status', APIKeyStatus.ACTIVE)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Check if key is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('api_keys')
        .update({ status: APIKeyStatus.EXPIRED })
        .eq('id', data.id);
      
      return null;
    }
    
    return data;
  }

  /**
   * Revoke an API key
   */
  async revokeAPIKey(
    id: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('api_keys')
      .update({
        status: APIKeyStatus.REVOKED,
        revoked_at: new Date().toISOString(),
        revoked_by: userId,
        revoked_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await this.auditService.log({
      type: AuditEventType.API_KEY_REVOKED,
      severity: AuditEventSeverity.WARNING,
      actor: { type: 'user', id: userId },
      target: {
        type: 'api_key',
        id: data.id,
        name: data.name,
      },
      context: { organizationId: data.organization_id },
      metadata: { reason },
      result: 'success',
    });
  }

  /**
   * Update API key settings
   */
  async updateAPIKey(
    id: string,
    updates: Partial<APIKey>
  ): Promise<APIKey> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('api_keys')
      .update({
        name: updates.name,
        description: updates.description,
        allowed_origins: updates.allowed_origins,
        allowed_ips: updates.allowed_ips,
        scopes: updates.scopes,
        rate_limit_override: updates.rate_limit_override,
        expires_at: updates.expires_at,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  }

  /**
   * Track API usage
   */
  async trackUsage(
    apiKeyId: string,
    usage: {
      endpoint: string;
      method: string;
      version: string;
      statusCode: number;
      responseTimeMs: number;
      requestSize?: number;
      responseSize?: number;
      ipAddress?: string;
      userAgent?: string;
      origin?: string;
    }
  ): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase.rpc('track_api_usage', {
      p_api_key_id: apiKeyId,
      p_endpoint: usage.endpoint,
      p_method: usage.method,
      p_version: usage.version,
      p_status_code: usage.statusCode,
      p_response_time_ms: usage.responseTimeMs,
      p_request_size: usage.requestSize,
      p_response_size: usage.responseSize,
      p_ip_address: usage.ipAddress,
      p_user_agent: usage.userAgent,
      p_origin: usage.origin,
    });

    if (error) {
      console.error('Failed to track API usage:', error);
    }
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(
    apiKeyId: string,
    timeRange: {
      start: Date;
      end: Date;
    }
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    statusCodes: Record<string, number>;
  }> {
    const supabase = await this.getSupabase();
    
    // Get hourly aggregates
    const { data: hourlyData, error } = await supabase
      .from('api_usage_hourly')
      .select('*')
      .eq('api_key_id', apiKeyId)
      .gte('hour', timeRange.start.toISOString())
      .lte('hour', timeRange.end.toISOString());

    if (error) throw error;

    if (!hourlyData || hourlyData.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        topEndpoints: [],
        statusCodes: {},
      };
    }

    // Aggregate the data
    const stats = hourlyData.reduce(
      (acc, hour) => {
        acc.total += hour.total_requests;
        acc.successful += hour.successful_requests;
        acc.failed += hour.failed_requests;
        acc.totalResponseTime += hour.avg_response_time_ms * hour.total_requests;
        
        // Merge top endpoints
        hour.top_endpoints?.forEach((endpoint: any) => {
          const existing = acc.endpoints.find((e: any) => e.endpoint === endpoint.endpoint);
          if (existing) {
            existing.count += endpoint.count;
          } else {
            acc.endpoints.push({ ...endpoint });
          }
        });
        
        // Merge status codes
        Object.entries(hour.status_codes || {}).forEach(([code, count]) => {
          acc.statusCodes[code] = (acc.statusCodes[code] || 0) + (count as number);
        });
        
        return acc;
      },
      {
        total: 0,
        successful: 0,
        failed: 0,
        totalResponseTime: 0,
        endpoints: [] as Array<{ endpoint: string; count: number }>,
        statusCodes: {} as Record<string, number>,
      }
    );

    return {
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      avgResponseTime: stats.total > 0 ? stats.totalResponseTime / stats.total : 0,
      topEndpoints: stats.endpoints
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10),
      statusCodes: stats.statusCodes,
    };
  }

  /**
   * Check and update quotas
   */
  async checkQuota(
    apiKeyId: string,
    quotaType: 'requests' | 'bandwidth' | 'compute',
    usage: number = 1
  ): Promise<{
    allowed: boolean;
    limit: number;
    current: number;
    remaining: number;
    resetAt: Date;
  }> {
    const supabase = await this.getSupabase();
    
    // Get current quota
    const { data: quota, error } = await supabase
      .from('api_quotas')
      .select('*')
      .eq('api_key_id', apiKeyId)
      .eq('quota_type', quotaType)
      .eq('period', 'hour') // Check hourly limit first
      .single();

    if (error || !quota) {
      // No quota set, allow by default
      return {
        allowed: true,
        limit: Infinity,
        current: 0,
        remaining: Infinity,
        resetAt: new Date(),
      };
    }

    // Check if quota needs reset
    const resetAt = new Date(quota.reset_at);
    if (resetAt < new Date()) {
      // Reset quota
      const newResetAt = new Date(Date.now() + 3600000); // 1 hour from now
      await supabase
        .from('api_quotas')
        .update({
          current_usage: usage,
          reset_at: newResetAt.toISOString(),
        })
        .eq('id', quota.id);
      
      return {
        allowed: true,
        limit: quota.limit_value,
        current: usage,
        remaining: quota.limit_value - usage,
        resetAt: newResetAt,
      };
    }

    // Check if within quota
    const newUsage = quota.current_usage + usage;
    const allowed = newUsage <= quota.limit_value;

    if (allowed) {
      // Update usage
      await supabase
        .from('api_quotas')
        .update({ current_usage: newUsage })
        .eq('id', quota.id);
    }

    return {
      allowed,
      limit: quota.limit_value,
      current: newUsage,
      remaining: Math.max(0, quota.limit_value - newUsage),
      resetAt,
    };
  }
}

// Export singleton instance
export const apiKeyService = new APIKeyService();