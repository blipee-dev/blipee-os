import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCategoryBreakdown } from '@/lib/sustainability/baseline-calculator';

export const dynamic = 'force-dynamic';

/**
 * Get all metric categories that an organization/site is actively tracking
 * Returns categories grouped by scope with metadata
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());


    // Use calculator to get category breakdown with consistent rounding
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const categoryBreakdown = await getCategoryBreakdown(organizationId, startDate, endDate);

    // Query metrics_data to get additional metadata (subcategories, metric names, etc.)
    let query = supabaseAdmin
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog!inner(
          id,
          code,
          name,
          category,
          subcategory,
          scope,
          unit,
          ghg_protocol_category
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate)
      .lt('period_start', `${year + 1}-01-01`);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics data' }, { status: 500 });
    }

    // Build metadata map for each category
    const categoryMetadataMap = new Map<string, {
      subcategories: Set<string>;
      scope: string;
      ghgProtocolCategory: string | null;
      metricCount: number;
      metrics: Set<string>;
    }>();

    metricsData?.forEach(record => {
      const catalog = record.metrics_catalog;
      const category = catalog?.category || 'Other';

      if (!categoryMetadataMap.has(category)) {
        categoryMetadataMap.set(category, {
          subcategories: new Set(),
          scope: catalog?.scope || 'scope_3',
          ghgProtocolCategory: catalog?.ghg_protocol_category || null,
          metricCount: 0,
          metrics: new Set()
        });
      }

      const metadata = categoryMetadataMap.get(category)!;

      if (catalog?.subcategory) {
        metadata.subcategories.add(catalog.subcategory);
      }

      metadata.metricCount++;
      metadata.metrics.add(catalog?.name || 'Unknown');
    });

    // Merge calculator results with metadata
    const categories = categoryBreakdown.map(cat => {
      const metadata = categoryMetadataMap.get(cat.category);
      return {
        category: cat.category,
        subcategories: metadata ? Array.from(metadata.subcategories) : [],
        scope: cat.scope_1 > 0 ? 'scope_1' : cat.scope_2 > 0 ? 'scope_2' : 'scope_3',
        ghgProtocolCategory: metadata?.ghgProtocolCategory || null,
        totalEmissions: cat.total, // Already in tCO2e from calculator
        metricCount: metadata?.metricCount || 0,
        metrics: metadata ? Array.from(metadata.metrics) : []
      };
    });

    // Group by scope
    const byScope = {
      scope_1: categories.filter(c => c.scope === 'scope_1'),
      scope_2: categories.filter(c => c.scope === 'scope_2'),
      scope_3: categories.filter(c => c.scope === 'scope_3')
    };

    // Calculate totals using rounded values from calculator
    const totals = {
      scope_1: Math.round(byScope.scope_1.reduce((sum, c) => sum + c.totalEmissions, 0) * 10) / 10,
      scope_2: Math.round(byScope.scope_2.reduce((sum, c) => sum + c.totalEmissions, 0) * 10) / 10,
      scope_3: Math.round(byScope.scope_3.reduce((sum, c) => sum + c.totalEmissions, 0) * 10) / 10,
      total: Math.round(categories.reduce((sum, c) => sum + c.totalEmissions, 0) * 10) / 10
    };

    return NextResponse.json({
      categories,
      byScope,
      totals,
      summary: {
        totalCategories: categories.length,
        scope1Count: byScope.scope_1.length,
        scope2Count: byScope.scope_2.length,
        scope3Count: byScope.scope_3.length,
        year,
        siteId: siteId || null
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
