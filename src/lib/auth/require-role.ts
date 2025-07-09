import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export function requireRole(user: User | null, allowedRoles: string[]) {
  if (!user) {
    redirect('/signin');
  }

  // Check user role from metadata
  const userRole = user?.user_metadata?.role;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect('/dashboard');
  }
}