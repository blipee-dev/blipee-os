import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  loginAlerts: boolean;
  backupCodes: string[];
  trustedDevices: string[];
}

interface SecurityEvent {
  id: string;
  type: "login" | "logout" | "password_change" | "2fa_enabled" | "2fa_disabled" | "suspicious_activity";
  description: string;
  timestamp: string;
  location: string;
  device?: string;
  ip?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch security settings from app_users table using admin client to avoid RLS issues
    const { data: userSettings, error: fetchError } = await supabaseAdmin
      .from('app_users')
      .select('security_settings, security_events')
      .eq('auth_user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching security settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch security settings' },
        { status: 500 }
      );
    }

    // Default security settings
    const defaultSettings: SecuritySettings = {
      twoFactorEnabled: false,
      emailNotifications: true,
      loginAlerts: true,
      backupCodes: [],
      trustedDevices: [],
    };

    const settings = userSettings?.security_settings || defaultSettings;
    const events = userSettings?.security_events || [];

    return NextResponse.json({ 
      success: true,
      data: {
        settings,
        events
      }
    });
  } catch (error) {
    console.error('Security settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { settings, event } = body;

    // Check if user profile exists using admin client to avoid RLS issues
    const { data: existingProfile } = await supabaseAdmin
      .from('app_users')
      .select('id, security_events')
      .eq('auth_user_id', user.id)
      .single();

    let result;
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Update security settings if provided
    if (settings) {
      updateData.security_settings = settings;
    }

    // Add new security event if provided
    if (event) {
      const existingEvents = existingProfile?.security_events || [];
      const newEvent = {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      updateData.security_events = [...existingEvents, newEvent].slice(-50); // Keep last 50 events
    }

    if (existingProfile) {
      // Update existing profile using admin client
      const { data, error } = await supabaseAdmin
        .from('app_users')
        .update(updateData)
        .eq('auth_user_id', user.id)
        .select('security_settings, security_events')
        .single();

      if (error) {
        console.error('Error updating security settings:', error);
        return NextResponse.json(
          { error: 'Failed to update security settings' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new profile with security settings using admin client
      const { data, error } = await supabaseAdmin
        .from('app_users')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'viewer', // Default role
          status: 'active',
          ...updateData,
        })
        .select('security_settings, security_events')
        .single();

      if (error) {
        console.error('Error creating security settings:', error);
        return NextResponse.json(
          { error: 'Failed to create security settings' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ 
      success: true,
      data: {
        settings: result.security_settings,
        events: result.security_events
      },
      message: 'Security settings updated successfully'
    });
  } catch (error) {
    console.error('Security settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Change password endpoint
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new passwords are required' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Log the password change event using admin client
    const { data: profile } = await supabaseAdmin
      .from('app_users')
      .select('security_events')
      .eq('auth_user_id', user.id)
      .single();

    const existingEvents = profile?.security_events || [];
    const newEvent = {
      id: crypto.randomUUID(),
      type: 'password_change',
      description: 'Password changed successfully',
      timestamp: new Date().toISOString(),
      location: 'Unknown',
      ip: request.headers.get('x-forwarded-for') || 'Unknown',
    };

    await supabaseAdmin
      .from('app_users')
      .update({
        security_events: [...existingEvents, newEvent].slice(-50),
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', user.id);

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}