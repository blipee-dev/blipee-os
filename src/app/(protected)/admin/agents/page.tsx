import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import AgentsClient from './AgentsClient';

export default async function AgentActivityDashboardPage() {
  // Check authentication
  const user = await requireServerAuth('/signin?redirect=/admin/agents');

  // Only super admins can access agent dashboard
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  if (!isSuperAdmin) {
    redirect('/unauthorized?reason=admin_only');
  }

  return <AgentsClient />;
}
