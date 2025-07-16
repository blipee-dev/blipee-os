'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export function useSession() {
  const { user, loading } = useAuth();
  
  return {
    user,
    loading,
  };
}