import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import TargetsClient from './TargetsClient';

export default async function TargetsPage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/targets');

  // Check if user is super admin
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  if (!isSuperAdmin) {
    redirect('/sustainability?error=admin_only');
  }

  return <TargetsClient />;
}