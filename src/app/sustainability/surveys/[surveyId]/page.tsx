import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import SurveyDetailPage from './SurveyDetailPage';

export default async function SurveyDetailRoute({ params }: { params: { surveyId: string } }) {
  const { surveyId } = params;

  // Get authenticated user
  const user = await requireServerAuth('/signin?redirect=/sustainability/surveys/' + surveyId);

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
    redirect('/sustainability/surveys/manage');
  }

  // Fetch responses
  const { data: responses } = await supabaseAdmin
    .from('survey_responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('submitted_at', { ascending: false });

  return <SurveyDetailPage survey={survey} responses={responses || []} />;
}
