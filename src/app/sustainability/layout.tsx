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

  // Get or create conversation for floating chat
  const supabase = createAdminClient();

  const { data: existingConversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  let conversationId: string;

  if (existingConversations && existingConversations.length > 0) {
    conversationId = existingConversations[0].id;
  } else {
    // Create new conversation
    const { data: newConversation } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        title: 'Sustainability Chat',
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000,
        status: 'active'
      })
      .select('id')
      .single();

    conversationId = newConversation?.id || '';
  }

  return (
    <>
      {children}

      {/* Floating AI Chat - appears on all /sustainability/* pages */}
      {conversationId && (
        <FloatingChat
          conversationId={conversationId}
          organizationId={organizationId}
        />
      )}
    </>
  );
}
