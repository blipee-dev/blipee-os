import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import PublicSurveyPage from './PublicSurveyPage';

export default async function PublicSurveyRoute({ params }: { params: { surveyId: string } }) {
  const { surveyId } = params;

  // Fetch survey details (no auth required - public link)
  const { data: survey, error } = await supabaseAdmin
    .from('surveys')
    .select('*, organization:organizations(name)')
    .eq('id', surveyId)
    .single();

  if (error || !survey) {
    redirect('/404');
  }

  // Check if survey is active
  if (survey.status !== 'active') {
    redirect('/404');
  }

  // Check if survey has expired
  if (survey.end_date && new Date(survey.end_date) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Survey Closed
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This survey has ended and is no longer accepting responses.
          </p>
        </div>
      </div>
    );
  }

  return <PublicSurveyPage survey={survey} />;
}
