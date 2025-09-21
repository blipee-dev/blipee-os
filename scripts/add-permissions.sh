#!/bin/bash

# Script to add permission checks to all pages

# Function to create server component wrapper
create_server_wrapper() {
  local dir=$1
  local client_name=$2
  local redirect_path=$3
  local allowed_roles=$4
  local require_org=${5:-true}

  cat > "$dir/page.server.tsx" << EOF
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import ${client_name} from './${client_name}';

export default async function Page() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=${redirect_path}');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganization(user.id);

  // Super admins always have access
  if (!isSuperAdmin) {
EOF

  if [ "$require_org" = "true" ]; then
    cat >> "$dir/page.server.tsx" << EOF
    // Check organization membership
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }
EOF
  fi

  cat >> "$dir/page.server.tsx" << EOF

    // Check role requirements
    const allowedRoles = ${allowed_roles};
    if (!allowedRoles.includes(role || '')) {
      redirect('/unauthorized?reason=insufficient_permissions');
    }
  }

  return <${client_name} />;
}
EOF

  # Rename files
  if [ -f "$dir/page.tsx" ]; then
    mv "$dir/page.tsx" "$dir/${client_name}.tsx"
    mv "$dir/page.server.tsx" "$dir/page.tsx"
    echo "✅ Added permissions to $dir"
  else
    rm "$dir/page.server.tsx"
    echo "⚠️  Skipped $dir (no page.tsx found)"
  fi
}

# Sustainability pages
create_server_wrapper "src/app/sustainability/data-investigation" "DataInvestigationClient" "/sustainability/data-investigation" "['owner', 'manager', 'member']"
create_server_wrapper "src/app/sustainability/data-migration" "DataMigrationClient" "/sustainability/data-migration" "['owner', 'manager']"

# Settings pages - Critical (owner only)
create_server_wrapper "src/app/settings/billing" "BillingClient" "/settings/billing" "['owner']"
create_server_wrapper "src/app/settings/api-keys" "ApiKeysClient" "/settings/api-keys" "['owner']"
create_server_wrapper "src/app/settings/sso" "SSOClient" "/settings/sso" "['owner']"
create_server_wrapper "src/app/settings/security" "SecurityClient" "/settings/security" "['owner']"

# Settings pages - Management (owner and manager)
create_server_wrapper "src/app/settings/webhooks" "WebhooksClient" "/settings/webhooks" "['owner', 'manager']"
create_server_wrapper "src/app/settings/integrations" "IntegrationsClient" "/settings/integrations" "['owner', 'manager']"
create_server_wrapper "src/app/settings/monitoring" "MonitoringClient" "/settings/monitoring" "['owner', 'manager']"
create_server_wrapper "src/app/settings/performance" "PerformanceClient" "/settings/performance" "['owner', 'manager']"
create_server_wrapper "src/app/settings/logs" "LogsClient" "/settings/logs" "['owner', 'manager']"
create_server_wrapper "src/app/settings/notifications" "NotificationsClient" "/settings/notifications" "['owner', 'manager']"
create_server_wrapper "src/app/settings/sustainability" "SustainabilitySettingsClient" "/settings/sustainability" "['owner', 'manager']"

# Monitoring page
create_server_wrapper "src/app/(protected)/monitoring" "MonitoringClient" "/monitoring" "['owner', 'manager']"

echo "
✨ Permission checks added to all pages!

Next steps:
1. Test each page to ensure they load correctly
2. Update any import statements in the client components
3. Handle unauthorized page (create /app/unauthorized/page.tsx)
"