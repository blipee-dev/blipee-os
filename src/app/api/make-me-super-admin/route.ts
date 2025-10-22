import { NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';

export async function POST() {
  
  try {
    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if super_admins table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('super_admins')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      return NextResponse.json(
        { 
          error: 'Super admin system not initialized',
          hint: 'Please run the migration: 20250909_add_super_admin_system.sql'
        },
        { status: 500 }
      );
    }
    
    // Check if already a super admin
    const { data: existing } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (existing) {
      return NextResponse.json({ 
        message: 'You are already a super admin',
        user_id: user.id 
      });
    }
    
    // Make the current user a super admin
    const { error: insertError } = await supabase
      .from('super_admins')
      .insert({ 
        user_id: user.id,
        created_by: user.id 
      });
    
    if (insertError) {
      // If it's a unique constraint violation, user is already super admin
      if (insertError.code === '23505') {
        return NextResponse.json({ 
          message: 'You are already a super admin',
          user_id: user.id 
        });
      }
      
      console.error('Error making user super admin:', insertError);
      return NextResponse.json(
        { error: `Failed to grant super admin: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'You are now a super admin! You have full access to all organizations.',
      user_id: user.id 
    });
    
  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}