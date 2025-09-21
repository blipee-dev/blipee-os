// Permission templates for different page types

export const generateServerPageWithPermissions = (
  pagePath: string,
  clientComponentName: string,
  requiredRoles: string[],
  requiresOrganization: boolean = true
) => {
  const redirectPath = pagePath.replace('/app', '');

  return `import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import ${clientComponentName} from './${clientComponentName}';

export default async function Page() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=${redirectPath}');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganization(user.id);

  // Super admins always have access
  if (!isSuperAdmin) {
    ${requiresOrganization ? `// Check organization membership
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }` : ''}

    // Check role requirements
    const allowedRoles = ${JSON.stringify(requiredRoles)};
    if (!allowedRoles.includes(role || '')) {
      redirect('/unauthorized?reason=insufficient_permissions&required=${requiredRoles[0]}');
    }
  }

  return <${clientComponentName} />;
}`;
};

// Permission requirements for each page type
export const PAGE_PERMISSIONS = {
  // Sustainability pages
  'sustainability/data-comparison': ['owner', 'manager', 'member', 'viewer'],
  'sustainability/data-investigation': ['owner', 'manager', 'member'],
  'sustainability/data-migration': ['owner', 'manager'],

  // Settings pages
  'settings/billing': ['owner'],
  'settings/api-keys': ['owner'],
  'settings/webhooks': ['owner', 'manager'],
  'settings/integrations': ['owner', 'manager'],
  'settings/monitoring': ['owner', 'manager'],
  'settings/performance': ['owner', 'manager'],
  'settings/logs': ['owner', 'manager'],
  'settings/sso': ['owner'],
  'settings/notifications': ['owner', 'manager'],
  'settings/security': ['owner'],
  'settings/sustainability': ['owner', 'manager'],

  // Monitoring page
  'monitoring': ['owner', 'manager'],
} as const;