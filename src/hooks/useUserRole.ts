import { useEffect, useState } from 'react';

interface UserRole {
  role: string;
  isSuperAdmin: boolean;
  organizationId: string | null;
  authUserId: string;
}

/**
 * Hook to get the current user's role and superadmin status
 */
export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/user-role', {
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserRole(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return {
    userRole,
    loading,
    isSuperAdmin: userRole?.isSuperAdmin || false
  };
}
