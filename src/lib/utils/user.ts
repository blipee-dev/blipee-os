import type { UserProfile } from '@/types/auth';

export function getUserInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].substring(0, 2).toUpperCase();
    }
  }
  
  if (email) {
    const emailParts = email.split('@')[0];
    return emailParts.substring(0, 2).toUpperCase();
  }
  
  return 'U';
}

export function getUserDisplayName(user: UserProfile | any): string {
  // Check for full_name first
  if (user?.full_name) {
    return user.full_name;
  }
  // Try to combine first and last name (for backwards compatibility)
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  // Use first name only if available
  if (user?.first_name) {
    return user.first_name;
  }
  // Fall back to email username
  if (user?.email) {
    return user.email.split('@')[0];
  }
  return 'User';
}