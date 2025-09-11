import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface LanguageSettings {
  displayLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
  units: string;
  contentLanguage: string;
  autoTranslate: boolean;
  autoDetectBrowser: boolean;
  rtlSupport: boolean;
  reportingStandard: string;
  exportLanguage: string;
  fallbackLanguage: string;
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

    // Fetch language settings from app_users table
    const { data: userSettings, error: fetchError } = await supabase
      .from('app_users')
      .select('language_settings')
      .eq('auth_user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching language settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch language settings' },
        { status: 500 }
      );
    }

    // Default settings if none exist
    const defaultSettings: LanguageSettings = {
      displayLanguage: "en",
      timezone: "auto",
      dateFormat: "mm/dd/yyyy",
      timeFormat: "12h",
      numberFormat: "1,234.56",
      currency: "USD",
      units: "imperial",
      contentLanguage: "en",
      autoTranslate: false,
      autoDetectBrowser: true,
      rtlSupport: false,
      reportingStandard: "GRI",
      exportLanguage: "en",
      fallbackLanguage: "en"
    };

    const settings = userSettings?.language_settings || defaultSettings;

    return NextResponse.json({ 
      success: true,
      data: settings 
    });
  } catch (error) {
    console.error('Language settings fetch error:', error);
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
    const settings = body as LanguageSettings;

    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // Update existing profile with language settings
      const { data, error } = await supabase
        .from('app_users')
        .update({
          language_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user.id)
        .select('language_settings')
        .single();

      if (error) {
        console.error('Error updating language settings:', error);
        return NextResponse.json(
          { error: 'Failed to update language settings' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new profile with language settings
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          language_settings: settings,
        })
        .select('language_settings')
        .single();

      if (error) {
        console.error('Error creating language settings:', error);
        return NextResponse.json(
          { error: 'Failed to create language settings' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ 
      success: true,
      data: result.language_settings,
      message: 'Language settings updated successfully'
    });
  } catch (error) {
    console.error('Language settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}