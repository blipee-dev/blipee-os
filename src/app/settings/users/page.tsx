import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user's organizations and role
  const { data: userOrgs, error: orgsError } = await supabase
    .from('user_organizations')
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', user.id);

  if (orgsError) {
    console.error('Error fetching organizations:', orgsError);
  }

  const organizationIds = userOrgs?.map(uo => uo.organization_id) || [];

  // Fetch app users for user's organizations
  const { data: appUsers, error: usersError } = await supabase
    .from('app_users')
    .select(`
      *,
      organizations:organization_id (
        name,
        slug
      )
    `)
    .in('organization_id', organizationIds)
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error('Error fetching users:', usersError);
  }

  // Pass data to client component
  return (
    <UsersClient 
      initialUsers={appUsers || []}
      organizations={userOrgs?.map(uo => uo.organizations) || []}
      userRole={userOrgs?.[0]?.role || 'viewer'}
    />
  );
}