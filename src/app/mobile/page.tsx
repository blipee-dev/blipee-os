'use client';

/**
 * Mobile PWA Experience
 *
 * Full-screen chat-only interface for mobile users
 * iOS-inspired design with hamburger menu
 * Light mode first, clean and minimal
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { MobileChatInterface } from '@/components/chat/MobileChatInterface';

export default function MobilePage() {
  const { user, organization, loading } = useAuth();
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string>(crypto.randomUUID());

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin?redirect=/mobile');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !organization) {
    return null;
  }

  return (
    <MobileChatInterface
      conversationId={conversationId}
      organizationId={organization.id}
      onNewChat={() => setConversationId(crypto.randomUUID())}
    />
  );
}
