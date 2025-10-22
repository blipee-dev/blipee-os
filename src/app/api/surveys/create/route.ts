import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

/**
 * Create a new survey instance
 * POST /api/surveys/create
 *
 * Body:
 * {
 *   template_id: string,
 *   title: string,
 *   description?: string,
 *   site_id?: string,
 *   start_date?: string,
 *   end_date?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { template_id, title, description, site_id, start_date, end_date } = body;

    // Validation
    if (!template_id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: template_id, title' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);

    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Create survey
    const { data: survey, error: insertError } = await supabaseAdmin
      .from('surveys')
      .insert({
        template_id,
        organization_id: orgInfo.organizationId,
        site_id: site_id || null,
        title,
        description: description || null,
        status: 'active',
        start_date: start_date || new Date().toISOString(),
        end_date: end_date || null,
        target_audience: 'all_employees'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating survey:', insertError);
      return NextResponse.json(
        { error: 'Failed to create survey', details: insertError.message },
        { status: 500 }
      );
    }

    // Generate shareable link
    const surveyLink = `${request.nextUrl.origin}/s/${survey.id}`;

    return NextResponse.json({
      success: true,
      survey,
      link: surveyLink
    });
  } catch (error) {
    console.error('Error in survey creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
