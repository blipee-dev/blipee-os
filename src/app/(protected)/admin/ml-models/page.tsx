import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import MLModelsClient from './MLModelsClient';

export default async function MLPerformanceDashboardPage() {
  // Check authentication
  const user = await requireServerAuth('/signin?redirect=/admin/ml-models');

  // Only super admins can access ML performance dashboard
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  if (!isSuperAdmin) {
    redirect('/unauthorized?reason=admin_only');
  }

  return <MLModelsClient />;
}
