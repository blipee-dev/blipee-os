import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface NotificationSettings {
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  types: {
    systemAlerts: boolean;
    performance: boolean;
    security: boolean;
    teamUpdates: boolean;
    reports: boolean;
    mentions: boolean;
  };
  frequency: {
    realTime: 'instant' | 'hourly' | 'daily' | 'weekly';
    digest: 'daily' | 'weekly' | 'monthly' | 'never';
    reports: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
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

    // Fetch notification settings from app_users table
    const { data: userSettings, error: fetchError } = await supabase
      .from('app_users')
      .select('notification_settings')
      .eq('auth_user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching notification settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch notification settings' },
        { status: 500 }
      );
    }

    // Default settings if none exist
    const defaultSettings: NotificationSettings = {
      channels: {
        email: true,
        push: true,
        sms: false,
        inApp: true,
      },
      types: {
        systemAlerts: true,
        performance: true,
        security: true,
        teamUpdates: true,
        reports: false,
        mentions: true,
      },
      frequency: {
        realTime: 'instant',
        digest: 'daily',
        reports: 'weekly',
      },
    };

    const settings = userSettings?.notification_settings || defaultSettings;

    return NextResponse.json({ 
      success: true,
      data: settings 
    });
  } catch (error) {
    console.error('Notification settings fetch error:', error);
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
    const settings = body as NotificationSettings;

    // Validate the settings structure
    if (!settings.channels || !settings.types || !settings.frequency) {
      return NextResponse.json(
        { error: 'Invalid notification settings format' },
        { status: 400 }
      );
    }

    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // Update existing profile with notification settings
      const { data, error } = await supabase
        .from('app_users')
        .update({
          notification_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user.id)
        .select('notification_settings')
        .single();

      if (error) {
        console.error('Error updating notification settings:', error);
        return NextResponse.json(
          { error: 'Failed to update notification settings' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new profile with notification settings
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          notification_settings: settings,
        })
        .select('notification_settings')
        .single();

      if (error) {
        console.error('Error creating profile with notification settings:', error);
        return NextResponse.json(
          { error: 'Failed to create notification settings' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ 
      success: true,
      data: result.notification_settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Notification settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}