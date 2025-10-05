import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/profile');
  }

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
    // Try to fetch additional profile data from API
    const profileResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/profile`,
      {
        headers: {
          'Cookie': `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      }
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
