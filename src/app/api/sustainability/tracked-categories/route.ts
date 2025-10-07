import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    // Query metrics_data to find all categories with actual data
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
      .gte('period_start', `${year}-01-01`)
      .lt('period_start', `${year + 1}-01-01`);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics data' }, { status: 500 });
    }

    // Aggregate data by category
    const categoryMap = new Map<string, {
      category: string;
      subcategories: Set<string>;
      scope: string;
      ghgProtocolCategory: string | null;
      totalEmissions: number;
      metricCount: number;
      metrics: Set<string>;
    }>();

    metricsData?.forEach(record => {
      const catalog = record.metrics_catalog;
      const category = catalog?.category || 'Other';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          subcategories: new Set(),
          scope: catalog?.scope || 'scope_3',
          ghgProtocolCategory: catalog?.ghg_protocol_category || null,
          totalEmissions: 0,
          metricCount: 0,
          metrics: new Set()
        });
      }

      const categoryData = categoryMap.get(category)!;

      if (catalog?.subcategory) {
        categoryData.subcategories.add(catalog.subcategory);
      }

      categoryData.totalEmissions += record.co2e_emissions || 0;
      categoryData.metricCount++;
      categoryData.metrics.add(catalog?.name || 'Unknown');
    });

    // Convert to array and sort by emissions
    const categories = Array.from(categoryMap.values())
      .map(cat => ({
        category: cat.category,
        subcategories: Array.from(cat.subcategories),
        scope: cat.scope,
        ghgProtocolCategory: cat.ghgProtocolCategory,
        totalEmissions: cat.totalEmissions / 1000, // Convert to tCO2e
        metricCount: cat.metricCount,
        metrics: Array.from(cat.metrics)
      }))
      .sort((a, b) => b.totalEmissions - a.totalEmissions);

    // Group by scope
    const byScope = {
      scope_1: categories.filter(c => c.scope === 'scope_1'),
      scope_2: categories.filter(c => c.scope === 'scope_2'),
      scope_3: categories.filter(c => c.scope === 'scope_3')
    };

    // Calculate totals
    const totals = {
      scope_1: byScope.scope_1.reduce((sum, c) => sum + c.totalEmissions, 0),
      scope_2: byScope.scope_2.reduce((sum, c) => sum + c.totalEmissions, 0),
      scope_3: byScope.scope_3.reduce((sum, c) => sum + c.totalEmissions, 0),
      total: categories.reduce((sum, c) => sum + c.totalEmissions, 0)
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
