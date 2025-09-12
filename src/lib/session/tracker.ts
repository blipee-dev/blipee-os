import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

interface SessionData {
  userId: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionTracker {
  private static activeSessionIds: Map<string, string> = new Map();

  /**
   * Start a new session for a user
   */
  static async startSession(data: SessionData): Promise<string | null> {
    try {
      const supabase = await createServerSupabaseClient();
      
      // Check if user already has an active session
      const existingSessionId = this.activeSessionIds.get(data.userId);
      if (existingSessionId) {
        // Update the existing session's last activity
        return existingSessionId;
      }

      // Create a new session record
      const { data: session, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: data.userId,
          organization_id: data.organizationId,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          session_start: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting session:', error);
        return null;
      }

      // Store the session ID for this user
      this.activeSessionIds.set(data.userId, session.id);
      return session.id;
    } catch (error) {
      console.error('Error in startSession:', error);
      return null;
    }
  }

  /**
   * End an active session
   */
  static async endSession(userId: string): Promise<void> {
    try {
      const sessionId = this.activeSessionIds.get(userId);
      if (!sessionId) return;

      const supabase = await createServerSupabaseClient();
      
      // Update the session with end time
      const { error } = await supabase
        .from('user_sessions')
        .update({
          session_end: new Date().toISOString()
        })
        .eq('id', sessionId)
        .is('session_end', null); // Only update if not already ended

      if (error) {
        console.error('Error ending session:', error);
      }

      // Remove from active sessions
      this.activeSessionIds.delete(userId);
    } catch (error) {
      console.error('Error in endSession:', error);
    }
  }

  /**
   * Get user's average daily time spent (in minutes)
   */
  static async getUserAverageTime(userId: string): Promise<number> {
    try {
      const supabase = await createServerSupabaseClient();
      
      // Get all completed sessions for the user
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('session_start, session_end, duration_minutes')
        .eq('user_id', userId)
        .not('duration_minutes', 'is', null);

      if (error || !sessions || sessions.length === 0) {
        return 0;
      }

      // Calculate total minutes and unique days
      let totalMinutes = 0;
      const uniqueDays = new Set<string>();

      sessions.forEach(session => {
        totalMinutes += session.duration_minutes || 0;
        const date = new Date(session.session_start).toDateString();
        uniqueDays.add(date);
      });

      // Calculate average
      const daysActive = uniqueDays.size || 1;
      return Math.round(totalMinutes / daysActive);
    } catch (error) {
      console.error('Error getting user average time:', error);
      return 0;
    }
  }

  /**
   * Get multiple users' average times at once
   */
  static async getUsersAverageTimes(userIds: string[]): Promise<Record<string, number>> {
    try {
      const supabase = await createServerSupabaseClient();
      
      // Get all sessions for the specified users
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('user_id, session_start, duration_minutes')
        .in('user_id', userIds)
        .not('duration_minutes', 'is', null);

      if (error || !sessions) {
        console.error('Error fetching sessions:', error);
        return {};
      }

      // Group sessions by user and calculate averages
      const userStats: Record<string, { totalMinutes: number; days: Set<string> }> = {};

      sessions.forEach(session => {
        if (!userStats[session.user_id]) {
          userStats[session.user_id] = {
            totalMinutes: 0,
            days: new Set()
          };
        }

        userStats[session.user_id].totalMinutes += session.duration_minutes || 0;
        const date = new Date(session.session_start).toDateString();
        userStats[session.user_id].days.add(date);
      });

      // Calculate averages
      const averages: Record<string, number> = {};
      
      // Include all requested users, even if they have no sessions
      userIds.forEach(userId => {
        if (userStats[userId]) {
          const daysActive = userStats[userId].days.size || 1;
          averages[userId] = Math.round(userStats[userId].totalMinutes / daysActive);
        } else {
          averages[userId] = 0;
        }
      });

      return averages;
    } catch (error) {
      console.error('Error getting users average times:', error);
      return {};
    }
  }

  /**
   * Update session activity (called periodically while user is active)
   */
  static async updateSessionActivity(userId: string): Promise<void> {
    try {
      const sessionId = this.activeSessionIds.get(userId);
      if (!sessionId) return;

      const supabase = await createServerSupabaseClient();
      
      // Update the session's updated_at timestamp
      const { error } = await supabase
        .from('user_sessions')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session activity:', error);
      }
    } catch (error) {
      console.error('Error in updateSessionActivity:', error);
    }
  }
}