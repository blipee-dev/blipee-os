import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/industry
 * Get the current user's organization industry settings
 */
export async function GET(request: NextRequest) {
  try {

    // Get current user
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

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get organization industry settings
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, industry, gri_sector_code, company_size_category, region')
      .eq('id', memberData.organization_id)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
    }

    // If no industry set, try to auto-detect
    if (!orgData.industry) {
      const { data: detection } = await supabaseAdmin
        .rpc('detect_organization_industry', {
          p_organization_id: memberData.organization_id
        });

      if (detection && detection.length > 0) {
        return NextResponse.json({
          organization_id: orgData.id,
          name: orgData.name,
          industry: detection[0].detected_industry,
          gri_sector_code: detection[0].detected_gri_code,
          company_size_category: orgData.company_size_category || '100-300',
          region: orgData.region || 'EU',
          auto_detected: true,
          confidence: detection[0].confidence,
          detection_reason: detection[0].reason
        });
      }
    }

    return NextResponse.json({
      organization_id: orgData.id,
      name: orgData.name,
      industry: orgData.industry || 'Services',
      gri_sector_code: orgData.gri_sector_code || 'GRI_11',
      company_size_category: orgData.company_size_category || '100-300',
      region: orgData.region || 'EU',
      auto_detected: false
    });
  } catch (error) {
    console.error('Error in organizations/industry API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/industry
 * Update the organization's industry classification
 *
 * Body:
 * {
 *   "industry": "Services" | "Manufacturing" | "Retail" | "Oil & Gas" | "Agriculture" | "Mining" | "Food & Beverage",
 *   "gri_sector_code": "GRI_11" (optional),
 *   "company_size_category": "100-300" (optional),
 *   "region": "EU" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { industry, gri_sector_code, company_size_category, region } = body;

    if (!industry) {
      return NextResponse.json({ error: 'Industry is required' }, { status: 400 });
    }


    // Get current user
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

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update organization industry
    const { data: result, error: updateError } = await supabaseAdmin
      .rpc('update_organization_industry', {
        p_organization_id: memberData.organization_id,
        p_industry: industry,
        p_gri_sector_code: gri_sector_code || null,
        p_company_size_category: company_size_category || null,
        p_region: region || null
      });

    if (updateError) {
      console.error('Error updating organization industry:', updateError);
      return NextResponse.json({ error: 'Failed to update organization industry' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Organization industry updated successfully',
      result
    });
  } catch (error) {
    console.error('Error in organizations/industry POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
