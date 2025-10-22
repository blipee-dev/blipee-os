import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Submit a survey response
 * POST /api/surveys/submit
 *
 * Body:
 * {
 *   survey_id?: string,           // Optional - if responding to a specific survey instance
 *   template_id: string,           // Survey template being used
 *   organization_id: string,
 *   site_id?: string,
 *   answers: { [questionId]: value },
 *   metadata?: any,                // Additional context
 *   respondent_email?: string,     // For anonymous surveys
 *   respondent_name?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      survey_id,
      template_id,
      organization_id,
      site_id,
      answers,
      metadata,
      respondent_email,
      respondent_name
    } = body;

    // Validation
    if (!template_id || !organization_id || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: template_id, organization_id, answers' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional - surveys can be anonymous)
    const user = await getAPIUser(request);
    // Insert survey response
    const { data: response, error: insertError } = await supabaseAdmin
      .from('survey_responses')
      .insert({
        survey_id,
        template_id,
        organization_id,
        site_id,
        respondent_id: user?.id || null,
        respondent_email: respondent_email || user?.email,
        respondent_name: respondent_name || user?.user_metadata?.full_name,
        answers,
        metadata,
        processed: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting survey response:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit survey response', details: insertError.message },
        { status: 500 }
      );
    }

    // Trigger processing in the background (don't wait for it)
    fetch(`${request.nextUrl.origin}/api/surveys/process/${response.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error('Error triggering response processing:', error);
      // Don't fail the request if background processing fails
    });

    return NextResponse.json({
      success: true,
      response_id: response.id,
      message: 'Survey response submitted successfully'
    });
  } catch (error) {
    console.error('Error in survey submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
