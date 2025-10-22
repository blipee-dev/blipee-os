import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface NotificationSettings {
  channels: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
  types: {
    systemUpdates: boolean;
    securityAlerts: boolean;
    teamActivity: boolean;
    sustainabilityReports: boolean;
    complianceAlerts: boolean;
    achievements: boolean;
  };
  frequency: {
    reports: "realtime" | "daily" | "weekly" | "monthly" | "never";
    alerts: "realtime" | "daily" | "weekly" | "monthly" | "never";
    updates: "realtime" | "daily" | "weekly" | "monthly" | "never";
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    weekendsOff: boolean;
  };
  emailPreferences: {
    marketing: boolean;
    productUpdates: boolean;
    newsletter: boolean;
    tips: boolean;
  };
}

export async function GET() {
  try {
    
    // Get the authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch notification settings from app_users table using admin client to avoid RLS issues
    const { data: userSettings, error: fetchError } = await supabaseAdmin
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
        inApp: true,
        push: false,
      },
      types: {
        systemUpdates: true,
        securityAlerts: true,
        teamActivity: true,
        sustainabilityReports: true,
        complianceAlerts: true,
        achievements: true,
      },
      frequency: {
        reports: "weekly",
        alerts: "realtime",
        updates: "daily",
      },
      quietHours: {
        enabled: false,
        startTime: "22:00",
        endTime: "08:00",
        weekendsOff: false,
      },
      emailPreferences: {
        marketing: false,
        productUpdates: true,
        newsletter: false,
        tips: true,
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
    
    // Get the authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const settings = body as NotificationSettings;

    // Validate the settings structure
    if (!settings.channels || !settings.types || !settings.frequency || !settings.quietHours || !settings.emailPreferences) {
      return NextResponse.json(
        { error: 'Invalid notification settings format' },
        { status: 400 }
      );
    }

    // Check if user profile exists using admin client to avoid RLS issues
    const { data: existingProfile } = await supabaseAdmin
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // Update existing profile with notification settings using admin client
      const { data, error } = await supabaseAdmin
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
      // Create new profile with notification settings using admin client
      // Note: This will need organization_id from user's context
      const { data, error } = await supabaseAdmin
        .from('app_users')
        .insert({
          auth_user_id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          notification_settings: settings,
          role: 'viewer', // Default role
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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