import { NextRequest, NextResponse } from 'next/server';
import { monthlyIntelligence } from '@/lib/ai/monthly-intelligence-coordinator';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Initialize monthly intelligence system
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Initialize monthly intelligence
    await monthlyIntelligence.initialize(memberData.organization_id);

    const status = await monthlyIntelligence.getMonthlyStatus();

    return NextResponse.json({
      success: true,
      message: '📅 Monthly Intelligence System activated',
      status
    });

  } catch (error) {
    console.error('Error initializing monthly intelligence:', error);
    return NextResponse.json(
      { error: 'Failed to initialize monthly intelligence' },
      { status: 500 }
    );
  }
}

// Get monthly intelligence status
export async function GET(request: NextRequest) {
  try {
    const status = await monthlyIntelligence.getMonthlyStatus();

    return NextResponse.json(status);

  } catch (error) {
    console.error('Error getting monthly status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

// Trigger manual data processing (for testing or manual uploads)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await monthlyIntelligence.triggerManualDataProcessing();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error triggering manual processing:', error);
    return NextResponse.json(
      { error: 'Failed to trigger processing' },
      { status: 500 }
    );
  }
}