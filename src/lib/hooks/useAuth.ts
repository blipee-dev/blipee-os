import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

/**
 * useAuth hook - Uses session-based authentication
 * Gets user data from /api/auth/user endpoint which validates session cookie
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from session-based auth endpoint
    fetch('/api/auth/user', {
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success && data.data?.user) {
          setUser(data.data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { user, loading };
}