import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentGradient: string;
  fontSize: 'small' | 'medium' | 'large';
  interfaceDensity: 'compact' | 'comfortable' | 'spacious';
  reduceMotion: boolean;
  highContrast: boolean;
  autoCollapseSidebar: boolean;
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

    // Fetch appearance settings from app_users table
    const { data: userSettings, error: fetchError } = await supabase
      .from('app_users')
      .select('appearance_settings')
      .eq('auth_user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching appearance settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch appearance settings' },
        { status: 500 }
      );
    }

    // Default settings if none exist
    const defaultSettings: AppearanceSettings = {
      theme: "system",
      accentGradient: "from-purple-500 to-pink-500",
      fontSize: "medium",
      interfaceDensity: "comfortable",
      reduceMotion: false,
      highContrast: false,
      autoCollapseSidebar: true
    };

    let settings = userSettings?.appearance_settings || defaultSettings;
    
    // Migrate old accentColor to accentGradient if needed
    if (settings && 'accentColor' in settings && !('accentGradient' in settings)) {
      // Map old hex colors or IDs to gradients
      const colorMigration: Record<string, string> = {
        '#8b5cf6': 'from-purple-500 to-pink-500',
        'purple': 'from-purple-500 to-pink-500',
        '#3b82f6': 'from-blue-500 to-cyan-500',
        'blue': 'from-blue-500 to-cyan-500',
        '#10b981': 'from-green-500 to-emerald-500',
        'green': 'from-green-500 to-emerald-500',
        '#f59e0b': 'from-orange-500 to-red-500',
        'orange': 'from-orange-500 to-red-500',
        '#ec4899': 'from-pink-500 to-rose-500',
        'pink': 'from-pink-500 to-rose-500',
        '#6366f1': 'from-indigo-500 to-purple-500',
        'indigo': 'from-indigo-500 to-purple-500'
      };
      
      const oldColor = (settings as any).accentColor;
      settings = {
        ...settings,
        accentGradient: colorMigration[oldColor] || 'from-purple-500 to-pink-500'
      };
      delete (settings as any).accentColor;
    }

    return NextResponse.json({ 
      success: true,
      data: settings 
    });
  } catch (error) {
    console.error('Appearance settings fetch error:', error);
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
    const settings = body as AppearanceSettings;

    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // Update existing profile with appearance settings
      const { data, error } = await supabase
        .from('app_users')
        .update({
          appearance_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user.id)
        .select('appearance_settings')
        .single();

      if (error) {
        console.error('Error updating appearance settings:', error);
        return NextResponse.json(
          { error: 'Failed to update appearance settings' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new profile with appearance settings
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          appearance_settings: settings,
        })
        .select('appearance_settings')
        .single();

      if (error) {
        console.error('Error creating appearance settings:', error);
        return NextResponse.json(
          { error: 'Failed to create appearance settings' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ 
      success: true,
      data: result.appearance_settings,
      message: 'Appearance settings updated successfully'
    });
  } catch (error) {
    console.error('Appearance settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}