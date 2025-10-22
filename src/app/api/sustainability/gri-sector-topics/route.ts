import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Get GRI sector-specific material topics for an organization
 * Returns dashboard types to generate based on industry
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError) {
      console.error('Error fetching organization membership:', memberError);
      return NextResponse.json({ error: 'Organization membership not found', details: memberError.message }, { status: 404 });
    }

    if (!memberData?.organization_id) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 404 });
    }

    // Get organization's GRI sector
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('gri_sector_id, name, industry')
      .eq('id', memberData.organization_id)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      console.error('Organization ID:', memberData.organization_id);
      // If column doesn't exist yet, return generic dashboards
      if (orgError.code === '42703') {
        console.warn('gri_sector_id column does not exist yet');
        return NextResponse.json({
          has_sector: false,
          sector: null,
          message: 'GRI sector feature not yet enabled. Using generic GRI 300 series.',
          material_topics: [],
          recommended_dashboards: [
            { type: 'ghg_emissions', name: 'GHG Emissions', gri: 'GRI 305' },
            { type: 'energy', name: 'Energy', gri: 'GRI 302' },
            { type: 'water_management', name: 'Water & Effluents', gri: 'GRI 303' },
            { type: 'waste_management', name: 'Waste', gri: 'GRI 306' }
          ]
        });
      }
      return NextResponse.json({ error: 'Failed to fetch organization', details: orgError.message }, { status: 500 });
    }

    // If no GRI sector set, return generic topics
    if (!orgData.gri_sector_id) {
      return NextResponse.json({
        has_sector: false,
        sector: null,
        message: 'No GRI sector standard assigned. Using generic GRI 300 series.',
        material_topics: [],
        recommended_dashboards: [
          { type: 'ghg_emissions', name: 'GHG Emissions', gri: 'GRI 305' },
          { type: 'energy', name: 'Energy', gri: 'GRI 302' },
          { type: 'water_management', name: 'Water & Effluents', gri: 'GRI 303' },
          { type: 'waste_management', name: 'Waste', gri: 'GRI 306' }
        ]
      });
    }

    // Get GRI sector details
    const { data: sectorData, error: sectorError } = await supabaseAdmin
      .from('gri_sectors')
      .select('*')
      .eq('id', orgData.gri_sector_id)
      .single();

    if (sectorError) {
      console.error('Error fetching GRI sector:', sectorError);
      return NextResponse.json({ error: 'Failed to fetch sector data' }, { status: 500 });
    }

    // Get material topics for this sector
    const { data: topicsData, error: topicsError } = await supabaseAdmin
      .from('gri_sector_material_topics')
      .select('*')
      .eq('gri_sector_id', orgData.gri_sector_id)
      .order('is_critical', { ascending: false })
      .order('topic_code');

    if (topicsError) {
      console.error('Error fetching material topics:', topicsError);
      return NextResponse.json({ error: 'Failed to fetch material topics' }, { status: 500 });
    }

    // Group topics by category
    const topicsByCategory = {
      environmental: topicsData?.filter(t => t.topic_category === 'environmental') || [],
      social: topicsData?.filter(t => t.topic_category === 'social') || [],
      governance: topicsData?.filter(t => t.topic_category === 'governance') || []
    };

    // Extract unique dashboard types needed
    const dashboardTypes = new Set<string>();
    topicsData?.forEach(topic => {
      if (topic.dashboard_type) {
        dashboardTypes.add(topic.dashboard_type);
      }
    });

    // Map dashboard types to dashboard metadata
    const dashboardMapping: Record<string, { name: string; priority: number; gri?: string }> = {
      'ghg_emissions': { name: 'GHG Emissions', priority: 1, gri: 'GRI 305' },
      'climate_resilience': { name: 'Climate Resilience', priority: 2 },
      'air_quality': { name: 'Air Quality', priority: 3 },
      'water_management': { name: 'Water & Effluents', priority: 4, gri: 'GRI 303' },
      'biodiversity': { name: 'Biodiversity', priority: 5, gri: 'GRI 304' },
      'waste_management': { name: 'Waste & Circular Economy', priority: 6, gri: 'GRI 306' },
      'tailings_management': { name: 'Tailings Management', priority: 1 }, // Critical for mining
      'mine_closure': { name: 'Mine Closure & Rehabilitation', priority: 7 },
      'decommissioning': { name: 'Decommissioning', priority: 7 },
      'asset_integrity': { name: 'Asset Integrity & Safety', priority: 3 },
      'soil_health': { name: 'Soil Health', priority: 4 },
      'land_conversion': { name: 'Land Use & Conversion', priority: 5 },
      'pesticides_use': { name: 'Pesticides Management', priority: 6 },
      'antibiotics_use': { name: 'Antibiotics Use', priority: 6 },
      'food_waste': { name: 'Food Loss & Waste', priority: 7 },
      'artisanal_mining': { name: 'Artisanal Mining', priority: 8 }
    };

    const recommended_dashboards = Array.from(dashboardTypes)
      .map(type => ({
        type,
        name: dashboardMapping[type]?.name || type,
        priority: dashboardMapping[type]?.priority || 99,
        gri: dashboardMapping[type]?.gri
      }))
      .sort((a, b) => a.priority - b.priority);

    return NextResponse.json({
      has_sector: true,
      sector: {
        code: sectorData.code,
        name: sectorData.name,
        published_year: sectorData.published_year,
        description: sectorData.description
      },
      organization: {
        name: orgData.name,
        industry: orgData.industry
      },
      material_topics: topicsData,
      topics_by_category: topicsByCategory,
      critical_topics: topicsData?.filter(t => t.is_critical) || [],
      recommended_dashboards,
      summary: {
        total_topics: topicsData?.length || 0,
        critical_topics: topicsData?.filter(t => t.is_critical).length || 0,
        environmental_topics: topicsByCategory.environmental.length,
        social_topics: topicsByCategory.social.length,
        governance_topics: topicsByCategory.governance.length,
        dashboards_to_generate: dashboardTypes.size
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
