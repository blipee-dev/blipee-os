/**
 * Network Intelligence API
 * GET /api/network/intelligence - Get network insights and benchmarks
 * POST /api/network/intelligence/join - Join the network intelligence system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { networkIntelligence } from '@/lib/network/network-intelligence';
import { withEnhancedAuth } from '@/middleware/security';
import { withAPIVersioning } from '@/middleware/api-versioning';

async function getNetworkIntelligence(req: NextRequest, context: any) {
  try {
    const { user } = context;
    const { searchParams } = new URL(req.url);
    
    const insightType = searchParams.get('type') as 'benchmark' | 'trend' | 'best_practice' | 'alert' | 'opportunity' | null;
    const category = searchParams.get('category') as 'energy' | 'water' | 'waste' | 'emissions' | 'operations' | 'compliance' | null;
    const generateFresh = searchParams.get('generate') === 'true';

    const supabase = createClient();

    // Check if organization is part of the network
    const { data: networkMembership } = await supabase
      .from('network_nodes')
      .select('*')
      .eq('organization_id', user.organizationId)
      .eq('is_active', true)
      .single();

    if (!networkMembership) {
      return NextResponse.json({
        error: 'NOT_IN_NETWORK',
        message: 'Organization is not part of the network intelligence system',
        joinUrl: '/api/network/intelligence/join'
      }, { status: 403 });
    }

    console.log(`🌐 Fetching network intelligence for ${networkMembership.anonymous_id}`);

    // Get network insights
    let insights = [];
    if (generateFresh) {
      console.log('🔄 Generating fresh network insights...');
      insights = await networkIntelligence.discoverNetworkInsights(user.organizationId);
    } else {
      // Get cached insights from database
      let insightsQuery = supabase
        .from('network_insights')
        .select('*')
        .eq('organization_id', user.organizationId)
        .gte('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(50);

      if (insightType) {
        insightsQuery = insightsQuery.eq('type', insightType);
      }

      if (category) {
        insightsQuery = insightsQuery.eq('category', category);
      }

      const { data: cachedInsights } = await insightsQuery;
      insights = cachedInsights || [];
    }

    // Get network statistics
    const networkHealth = networkIntelligence.getNetworkHealth();
    const availableBenchmarks = networkIntelligence.getAvailableBenchmarks();
    const discoveredPatterns = networkIntelligence.getDiscoveredPatterns();

    // Get organization's profile for context
    const { data: orgProfile } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (
          name,
          industry,
          size_category,
          settings
        )
      `)
      .eq('organization_id', user.organizationId)
      .single();

    // Generate market intelligence
    const marketIntelligence = await networkIntelligence.generateMarketIntelligence(user.organizationId);

    // Get recent network alerts
    const { data: networkAlerts } = await supabase
      .from('network_alerts')
      .select('*')
      .contains('affected_segments->industries', [orgProfile?.organizations?.industry])
      .gte('detected_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('detected_at', { ascending: false })
      .limit(10);

    const response = {
      success: true,
      insights: insights.map(insight => ({
        ...insight,
        generated_at: insight.generated_at || insight.generatedAt,
        expires_at: insight.expires_at || insight.expiresAt
      })),
      network: {
        health: networkHealth,
        membership: {
          anonymousId: networkMembership.anonymous_id,
          joinedAt: networkMembership.joined_at,
          trustScore: networkMembership.trust_score,
          contributionScore: networkMembership.contribution_score
        },
        availableBenchmarks: availableBenchmarks.length,
        discoveredPatterns: discoveredPatterns.length
      },
      marketIntelligence,
      alerts: networkAlerts || [],
      patterns: discoveredPatterns.slice(0, 10), // Top 10 patterns
      metadata: {
        generatedAt: new Date().toISOString(),
        insightTypes: ['benchmark', 'trend', 'best_practice', 'alert', 'opportunity'],
        categories: ['energy', 'water', 'waste', 'emissions', 'operations', 'compliance'],
        networkSize: networkHealth.activeNodes
      }
    };

    // Store access log for analytics
    await supabase
      .from('network_access_logs')
      .insert({
        organization_id: user.organizationId,
        user_id: user.id,
        anonymous_id: networkMembership.anonymous_id,
        action: 'intelligence_accessed',
        insight_type: insightType,
        category: category,
        generated_fresh: generateFresh,
        insights_returned: insights.length,
        timestamp: new Date().toISOString()
      });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Network intelligence error:', error);
    return NextResponse.json(
      {
        error: 'NETWORK_INTELLIGENCE_ERROR',
        message: 'Failed to retrieve network intelligence',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function joinNetworkIntelligence(req: NextRequest, context: any) {
  try {
    const { user } = context;
    const body = await req.json();

    const {
      industry,
      sizeCategory,
      buildingTypes = [],
      geographicRegion,
      sustainabilityMaturity = 'intermediate',
      certifications = [],
      totalBuildings = 1,
      totalArea = 1000,
      yearEstablished,
      consentToDataSharing = false,
      privacyPreferences = {}
    } = body;

    // Validate required fields
    if (!industry || !sizeCategory || !geographicRegion) {
      return NextResponse.json(
        { 
          error: 'MISSING_REQUIRED_FIELDS', 
          message: 'Industry, size category, and geographic region are required' 
        },
        { status: 400 }
      );
    }

    // Validate consent
    if (!consentToDataSharing) {
      return NextResponse.json(
        { 
          error: 'CONSENT_REQUIRED', 
          message: 'Consent to anonymized data sharing is required to join the network' 
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if organization is already in the network
    const { data: existingMembership } = await supabase
      .from('network_nodes')
      .select('*')
      .eq('organization_id', user.organizationId)
      .single();

    if (existingMembership) {
      return NextResponse.json({
        success: false,
        message: 'Organization is already part of the network intelligence system',
        anonymousId: existingMembership.anonymous_id,
        membership: existingMembership
      });
    }

    console.log(`🌐 Joining network intelligence system: ${industry} / ${sizeCategory}`);

    // Create organization profile
    const organizationProfile = {
      industry,
      sizeCategory,
      buildingTypes,
      geographicRegion,
      sustainabilityMaturity,
      certifications,
      anonymizedMetrics: {
        totalBuildings,
        totalArea,
        yearEstablished: yearEstablished || new Date().getFullYear()
      }
    };

    // Join the network
    const anonymousId = await networkIntelligence.joinNetwork(user.organizationId, organizationProfile);

    // Store privacy preferences
    await supabase
      .from('network_privacy_preferences')
      .insert({
        organization_id: user.organizationId,
        anonymous_id: anonymousId,
        consent_to_data_sharing: consentToDataSharing,
        privacy_preferences: privacyPreferences,
        consented_at: new Date().toISOString(),
        consented_by: user.id
      });

    // Log joining event (with error handling for RLS policy)
    const { safeAuditLog } = await import('@/lib/utils/audit-helpers');
    await safeAuditLog({
      organization_id: user.organizationId,
      user_id: user.id,
      action: 'network_joined',
      resource_type: 'network_intelligence',
      resource_id: anonymousId,
      metadata: {
        industry,
        size_category: sizeCategory,
        geographic_region: geographicRegion
      }
    });

    // Get initial network insights
    console.log('🔍 Generating welcome insights...');
    const welcomeInsights = await networkIntelligence.discoverNetworkInsights(user.organizationId);
    
    // Store welcome insights
    if (welcomeInsights.length > 0) {
      const insightRecords = welcomeInsights.map(insight => ({
        id: insight.id,
        organization_id: user.organizationId,
        anonymous_id: anonymousId,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        insight: insight.insight,
        confidence: insight.confidence,
        network_size: insight.networkSize,
        applicability: insight.applicability,
        metrics: insight.metrics,
        anonymized_data: insight.anonymizedData,
        generated_at: insight.generatedAt.toISOString(),
        expires_at: insight.expiresAt.toISOString()
      }));

      await supabase
        .from('network_insights')
        .insert(insightRecords);
    }

    // Get network statistics
    const networkHealth = networkIntelligence.getNetworkHealth();

    return NextResponse.json({
      success: true,
      message: `Successfully joined the network intelligence system! You now have access to insights from ${networkHealth.activeNodes} organizations.`,
      membership: {
        anonymousId,
        joinedAt: new Date().toISOString(),
        trustScore: 50,
        contributionScore: 0
      },
      network: {
        health: networkHealth,
        welcomeInsights: welcomeInsights.length
      },
      insights: welcomeInsights,
      benefits: [
        'Anonymous benchmarking against similar organizations',
        'Industry trend analysis and early warnings',
        'Best practice recommendations from top performers',
        'Market intelligence and competitive positioning',
        'Collective pattern discovery for optimization opportunities'
      ],
      privacyGuarantees: [
        'Your organization identity is never shared',
        'All data is anonymized and aggregated',
        'You maintain full control over your data',
        'No individual organization data is exposed',
        'Privacy-preserving algorithms protect sensitive information'
      ]
    });

  } catch (error) {
    console.error('Network join error:', error);
    return NextResponse.json(
      {
        error: 'NETWORK_JOIN_ERROR',
        message: 'Failed to join network intelligence system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

const GET = withAPIVersioning(
  withEnhancedAuth(getNetworkIntelligence, {
    requireRole: ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst'],
    enableThreatDetection: false
  })
);

const POST = withAPIVersioning(
  withEnhancedAuth(joinNetworkIntelligence, {
    requireRole: ['account_owner', 'sustainability_manager'],
    enableThreatDetection: false
  })
);

export { GET, POST };