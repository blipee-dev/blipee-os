import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { subDays,  format, startOfHour, subHours } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('invitation_status', 'accepted')
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '7d';
    const apiKeyId = url.searchParams.get('apiKey') || 'all';

    // Calculate date range
    let startDate: Date;
    let groupBy: 'hour' | 'day';
    
    switch (timeRange) {
      case '24h':
        startDate = subHours(new Date(), 24);
        groupBy = 'hour';
        break;
      case '7d':
        startDate = subDays(new Date(), 7);
        groupBy = 'day';
        break;
      case '30d':
        startDate = subDays(new Date(), 30);
        groupBy = 'day';
        break;
      default:
        startDate = subDays(new Date(), 7);
        groupBy = 'day';
    }

    // Build query for API usage
    let usageQuery = supabase
      .from('api_usage')
      .select('*')
      .eq('organization_id', member.organization_id)
      .gte('created_at', startDate.toISOString());

    if (apiKeyId !== 'all') {
      usageQuery = usageQuery.eq('api_key_id', apiKeyId);
    }

    const { data: usageData, _error: usageError } = await usageQuery;

    if (usageError) {
      throw usageError;
    }

    // Get active API keys count
    const { count: activeKeysCount } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', member.organization_id)
      .eq('status', 'active');

    // Get quota information
    const { data: quotaData } = await supabase
      .from('api_quotas')
      .select('*')
      .eq('organization_id', member.organization_id)
      .single();

    // Process usage data
    const totalRequests = usageData?.length || 0;
    const successfulRequests = usageData?.filter(u => u.status_code >= 200 && u.status_code < 300).length || 0;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = usageData?.length 
      ? usageData.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / usageData.length 
      : 0;

    // Group requests over time
    const requestsOverTime = generateTimeSeriesData(usageData || [], startDate, groupBy);

    // Response time distribution
    const responseTimeDistribution = [
      { range: '0-100ms', count: usageData?.filter(u => u.response_time_ms < 100).length || 0 },
      { range: '100-300ms', count: usageData?.filter(u => u.response_time_ms >= 100 && u.response_time_ms < 300).length || 0 },
      { range: '300-500ms', count: usageData?.filter(u => u.response_time_ms >= 300 && u.response_time_ms < 500).length || 0 },
      { range: '500-1000ms', count: usageData?.filter(u => u.response_time_ms >= 500 && u.response_time_ms < 1000).length || 0 },
      { range: '>1000ms', count: usageData?.filter(u => u.response_time_ms >= 1000).length || 0 },
    ];

    // Status code distribution
    const statusCodeMap = new Map<string, number>();
    usageData?.forEach(u => {
      const codeGroup = `${Math.floor(u.status_code / 100)}xx`;
      statusCodeMap.set(codeGroup, (statusCodeMap.get(codeGroup) || 0) + 1);
    });
    
    const statusCodeDistribution = Array.from(statusCodeMap.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => a.code.localeCompare(b.code));

    // Top endpoints
    const endpointMap = new Map<string, { count: number; totalTime: number }>();
    usageData?.forEach(u => {
      const key = `${u.method} ${u.endpoint}`;
      const existing = endpointMap.get(key) || { count: 0, totalTime: 0 };
      endpointMap.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + (u.response_time_ms || 0),
      });
    });

    const topEndpoints = Array.from(endpointMap.entries())
      .map(([key, data]) => {
        const [method, ...pathParts] = key.split(' ');
        return {
          method,
          path: pathParts.join(' '),
          count: data.count,
          avgResponseTime: data.totalTime / data.count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate current quota usage
    const currentHour = startOfHour(new Date());
    const { count: currentUsage } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', member.organization_id)
      .gte('created_at', currentHour.toISOString());

    const metrics = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      apiKeysActive: activeKeysCount || 0,
      quotaUsage: currentUsage || 0,
      quotaLimit: quotaData?.limit_value || 1000,
      topEndpoints,
      requestsOverTime,
      responseTimeDistribution,
      statusCodeDistribution,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to load usage metrics:', error);
    return NextResponse.json(
      { error: 'Failed to load usage metrics' },
      { status: 500 }
    );
  }
}

function generateTimeSeriesData(
  usageData: any[],
  startDate: Date,
  groupBy: 'hour' | 'day'
): Array<{ timestamp: string; requests: number; errors: number }> {
  const timeMap = new Map<string, { requests: number; errors: number }>();
  
  // Initialize time slots
  const now = new Date();
  let current = startDate;
  
  while (current <= now) {
    const key = groupBy === 'hour' 
      ? format(current, 'yyyy-MM-dd HH:00')
      : format(current, 'yyyy-MM-dd');
    
    timeMap.set(key, { requests: 0, errors: 0 });
    
    if (groupBy === 'hour') {
      current = new Date(current.getTime() + 3600000); // Add 1 hour
    } else {
      current = new Date(current.getTime() + 86400000); // Add 1 day
    }
  }
  
  // Count requests per time slot
  usageData.forEach(usage => {
    const date = new Date(usage.created_at);
    const key = groupBy === 'hour'
      ? format(date, 'yyyy-MM-dd HH:00')
      : format(date, 'yyyy-MM-dd');
    
    const slot = timeMap.get(key);
    if (slot) {
      slot.requests++;
      if (usage.status_code >= 400) {
        slot.errors++;
      }
    }
  });
  
  // Convert to array
  return Array.from(timeMap.entries())
    .map(([timestamp, data]) => ({
      timestamp,
      requests: data.requests,
      errors: data.errors,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}