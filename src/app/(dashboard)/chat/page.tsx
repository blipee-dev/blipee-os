import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'AI Chat | Blipee',
  description: 'Intelligent sustainability assistant powered by AI'
};

export default async function ChatPage() {
  // Check authentication using session-based auth (same as sustainability page)
  const user = await requireServerAuth('/signin?redirect=/chat');

  // Use admin client for database queries
  const supabase = createAdminClient();

  // Get user's organizations
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name)')
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-muted-foreground">
            You need to be a member of an organization to use the AI chat.
          </p>
        </Card>
      </div>
    );
  }

  // Use first organization (in production, user should be able to select)
  const organizationId = memberships[0].organization_id;

  // Create or get existing conversation
  const { data: existingConversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  let conversationId: string;
  let initialMessages: any[] = [];

  if (existingConversations && existingConversations.length > 0) {
    conversationId = existingConversations[0].id;

    // Load conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50); // Load last 50 messages

    if (messages) {
      initialMessages = messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
        // Include tool calls if present
        ...(m.tool_calls && { toolInvocations: m.tool_calls }),
        // Include attachments if present
        ...(m.metadata?.attachments && { experimental_attachments: m.metadata.attachments })
      }));
    }
  } else {
    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        title: 'New Chat',
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000,
        status: 'active'
      })
      .select('id')
      .single();

    if (error || !newConversation) {
      console.error('Error creating conversation:', error);
      return (
        <div className="container mx-auto py-8">
          <Card className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground">
              Failed to create conversation. Please try again.
            </p>
          </Card>
        </div>
      );
    }

    conversationId = newConversation.id;
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Suspense fallback={<ChatSkeleton />}>
        <ChatInterface
          conversationId={conversationId}
          organizationId={organizationId}
          initialMessages={initialMessages}
          className="h-full"
        />
      </Suspense>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 space-y-4 max-w-4xl mx-auto w-full">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-4 max-w-4xl mx-auto w-full">
        <Skeleton className="h-[60px] w-full" />
      </div>
    </div>
  );
}
