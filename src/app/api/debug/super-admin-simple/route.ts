import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Check super admin table directly without any authentication
    const { data: superAdmins, error } = await supabaseAdmin
      .from('super_admins')
      .select('*')
      .limit(10);

    if (error) {
      return NextResponse.json({
        error: 'Failed to query super_admins table',
        details: error
      }, { status: 500 });
    }

    // Get pedro@blipee.com user from auth
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    const pedroUser = users.users?.find(u => u.email === 'pedro@blipee.com');

    return NextResponse.json({
      success: true,
      superAdmins,
      pedroUser: pedroUser ? {
        id: pedroUser.id,
        email: pedroUser.email,
        created_at: pedroUser.created_at
      } : null,
      debug: {
        total_users: users.users?.length || 0,
        total_super_admins: superAdmins?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Debug super admin simple error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}