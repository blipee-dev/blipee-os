import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import SurveysPage from './SurveysPage';

export default async function SurveysRoute() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/surveys');

  const { organizationId } = await getUserOrganizationById(user.id);

  if (!organizationId) {
    redirect('/unauthorized?reason=no_organization');
  }

  return <SurveysPage />;
}
