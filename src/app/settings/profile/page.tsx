import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/settings/profile');

  // Check permissions - all authenticated users can access their profile
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Even users without organizations can access their profile
  // This is a basic page that all users should be able to access

  // Fetch profile data
  let profileData = {
    name: "",
    email: user.email || "",
    phone: "",
    bio: "",
    department: "",
    title: "",
    location: "",
    avatar_url: "",
    role: isSuperAdmin ? "super_admin" : (role || "user")
  };

  try {
    // Try to fetch additional profile data from API (cookies are automatically included in server-side fetch)
    const profileResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/profile`,
      { cache: 'no-store' }
    );

    if (profileResponse.ok) {
      const data = await profileResponse.json();
      if (data.data) {
        profileData = {
          name: data.data.name || "",
          email: data.data.email || user.email || "",
          phone: data.data.phone || "",
          bio: data.data.bio || "",
          department: data.data.department || "",
          title: data.data.title || "",
          location: data.data.location || "",
          avatar_url: data.data.avatar_url || "",
          role: data.data.role || profileData.role
        };
      }
    }
  } catch (error) {
    console.error('Error fetching profile data:', error);
    // Continue with basic profile data if API call fails
  }

  return <ProfileClient initialProfile={profileData} />;
}
