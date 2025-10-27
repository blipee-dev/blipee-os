import { requireServerAuth } from '@/lib/auth/server-auth';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { createAdminClient } from '@/lib/supabase/server';
import { FloatingChat } from '@/components/chat/FloatingChat';

export default async function SustainabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability');

  // Get organization context
  const { organizationId } = await getUserOrganizationById(user.id);

  return (
    <>
      {children}

      {/* Floating AI Chat - appears on all /sustainability/* pages */}
      <FloatingChat
        organizationId={organizationId}
      />
    </>
  );
}
