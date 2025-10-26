import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import AIPromptsClient from './AIPromptsClient';

export default async function Page() {
  // Check authentication
  const user = await requireServerAuth('/signin?redirect=/settings/ai-prompts');

  // Check if super admin
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  if (!isSuperAdmin) {
    redirect('/unauthorized?reason=super_admin_required');
  }

  return <AIPromptsClient />;
}
