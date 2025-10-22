import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

/**
 * Export survey results as Excel
 * GET /api/surveys/export/[surveyId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const { surveyId } = params;

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);

    // Fetch survey and verify access
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .eq('organization_id', orgInfo.organizationId)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Fetch all responses
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false });

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // Convert to CSV format (simplified Excel-compatible format)
    const csvData = convertToCSV(responses || []);

    // Return as downloadable file
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="survey-${surveyId}-results.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertToCSV(responses: any[]): string {
  if (responses.length === 0) {
    return 'No responses yet';
  }

  // Get all unique question IDs from all responses
  const allQuestionIds = new Set<string>();
  responses.forEach(response => {
    const answers = response.answers || {};
    Object.keys(answers).forEach(questionId => allQuestionIds.add(questionId));
  });

  // Create CSV header
  const headers = [
    'Response ID',
    'Submitted At',
    'Respondent Email',
    'Respondent Name',
    ...Array.from(allQuestionIds)
  ];

  // Create CSV rows
  const rows = responses.map(response => {
    const answers = response.answers || {};
    return [
      response.id,
      response.submitted_at,
      response.respondent_email || '',
      response.respondent_name || '',
      ...Array.from(allQuestionIds).map(qId => {
        const value = answers[qId];
        if (Array.isArray(value)) {
          return value.join('; ');
        }
        return value || '';
      })
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
