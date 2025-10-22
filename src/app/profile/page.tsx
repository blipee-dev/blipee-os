import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/profile');

  // For profile pages, all authenticated users can access their own profile
  // No additional role restrictions needed - users can view/edit their own profile
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  return <ProfileClient />;
}