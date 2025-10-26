import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get AI-discovered insights from pattern analysis
 * These are issues and patterns found in conversation data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data: insights, error } = await supabase
      .from('ai_pattern_insights')
      .select('*')
      .order('severity_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching insights:', error);
      return NextResponse.json(
        { error: 'Failed to fetch insights', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      insights: insights || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in insights API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
