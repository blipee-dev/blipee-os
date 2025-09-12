import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionTracker } from '@/lib/session/tracker';

export async function POST(request: NextRequest) {
  try {
    // Verify the request has proper authentication
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user IDs from request body
    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid request: userIds must be an array' }, { status: 400 });
    }

    // Get real session statistics from the SessionTracker
    const averageTimes = await SessionTracker.getUsersAverageTimes(userIds);
    
    // Convert to the expected format
    const userStats = userIds.map((userId: string) => ({
      userId,
      avgDailyTimeSpent: averageTimes[userId] || 0
    }));

    return NextResponse.json({ userStats });
  } catch (error) {
    console.error('Error in session-stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}