import { NextRequest, NextResponse } from 'next/server';
import { gdprService } from '@/lib/compliance/service';
import { requireAuth } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { data, error } = await supabaseAdmin
      .from('privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default settings if none exist
    const settings = data || {
      user_id: user.id,
      data_processing: {
        allowAnalytics: false,
        allowMarketing: false,
        allowDataSharing: false,
        allowProfiling: false,
      },
      communication: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingEmails: false,
      },
      visibility: {
        profileVisibility: 'organization',
        activityVisibility: 'team',
      },
    };

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error && _error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get privacy settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const settings = await gdprService.updatePrivacySettings(user.id, body);

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error && _error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}