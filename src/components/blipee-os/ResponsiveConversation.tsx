'use client';

import { useEffect, useState } from 'react';
import { useBreakpoint } from '@/lib/hooks/useMediaQuery';
import { MobileConversationLayout } from './MobileConversationLayout';
import { ConversationInterface } from './ConversationInterface';

interface ResponsiveConversationProps {
  buildingContext?: any;
}

export function ResponsiveConversation({ buildingContext }: ResponsiveConversationProps) {
  const { isMobile } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Show a loading state that matches both mobile and desktop
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Mobile: Full-screen conversational experience
  if (isMobile) {
    return <MobileConversationLayout />;
  }

  // Desktop: Regular conversation interface (can be embedded in dashboards)
  return <ConversationInterface buildingContext={buildingContext} />;
}
