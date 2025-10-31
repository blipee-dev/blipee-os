/**
 * Conversation Preferences Manager
 *
 * Manages user preferences for conversations (global or per-conversation).
 * Part of FASE 2 - Conversation Intelligence
 *
 * Features:
 * - Save/load user preferences
 * - Support for global and per-conversation preferences
 * - Confidence scoring for learned preferences
 * - Usage tracking (usage_count, last_used)
 * - Automatic preference learning from user behavior
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type PreferenceType =
  | 'notification_settings'
  | 'ui_theme'
  | 'language'
  | 'auto_archive'
  | 'response_tone'
  | 'response_length'
  | 'auto_translate'
  | 'typing_indicators'
  | 'read_receipts'
  | 'custom';

export interface ConversationPreference {
  id?: string;
  user_id: string;
  organization_id: string;
  conversation_id?: string; // null = global preference
  preference_type: PreferenceType;
  preference_value: Record<string, any>;
  confidence_score?: number;
  usage_count?: number;
  last_used?: string;
  created_at?: string;
  updated_at?: string;
}

export class ConversationPreferencesManager {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      // Use environment variables
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
  }

  /**
   * Get a specific preference
   * If conversationId is provided, gets conversation-specific preference
   * Otherwise gets global preference
   */
  async getPreference(
    userId: string,
    preferenceType: PreferenceType,
    conversationId?: string
  ): Promise<ConversationPreference | null> {
    try {
      let query = this.supabase
        .from('conversation_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('preference_type', preferenceType);

      if (conversationId) {
        // Get conversation-specific preference
        query = query.eq('conversation_id', conversationId);
      } else {
        // Get global preference (conversation_id is null)
        query = query.is('conversation_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching preference:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPreference:', error);
      return null;
    }
  }

  /**
   * Get all preferences for a user
   * Optionally filter by conversation_id
   */
  async getAllPreferences(
    userId: string,
    conversationId?: string
  ): Promise<ConversationPreference[]> {
    try {
      let query = this.supabase
        .from('conversation_preferences')
        .select('*')
        .eq('user_id', userId);

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching all preferences:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllPreferences:', error);
      return [];
    }
  }

  /**
   * Set or update a preference
   * Updates usage_count and last_used automatically
   */
  async setPreference(
    userId: string,
    organizationId: string,
    preferenceType: PreferenceType,
    preferenceValue: Record<string, any>,
    options?: {
      conversationId?: string;
      confidenceScore?: number;
    }
  ): Promise<ConversationPreference | null> {
    try {
      // Check if preference already exists
      const existingPreference = await this.getPreference(
        userId,
        preferenceType,
        options?.conversationId
      );

      if (existingPreference) {
        // Update existing preference
        const { data, error } = await this.supabase
          .from('conversation_preferences')
          .update({
            preference_value: preferenceValue,
            confidence_score: options?.confidenceScore ?? existingPreference.confidence_score,
            usage_count: (existingPreference.usage_count || 0) + 1,
            last_used: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPreference.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating preference:', error);
          return null;
        }

        return data;
      } else {
        // Create new preference
        const { data, error } = await this.supabase
          .from('conversation_preferences')
          .insert({
            user_id: userId,
            organization_id: organizationId,
            conversation_id: options?.conversationId || null,
            preference_type: preferenceType,
            preference_value: preferenceValue,
            confidence_score: options?.confidenceScore ?? 0.5,
            usage_count: 1,
            last_used: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating preference:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in setPreference:', error);
      return null;
    }
  }

  /**
   * Delete a specific preference
   */
  async deletePreference(
    userId: string,
    preferenceType: PreferenceType,
    conversationId?: string
  ): Promise<boolean> {
    try {
      let query = this.supabase
        .from('conversation_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('preference_type', preferenceType);

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else {
        query = query.is('conversation_id', null);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting preference:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePreference:', error);
      return false;
    }
  }

  /**
   * Delete all preferences for a user
   * Optionally filter by conversation_id
   */
  async deleteAllPreferences(
    userId: string,
    conversationId?: string
  ): Promise<number> {
    try {
      let query = this.supabase
        .from('conversation_preferences')
        .delete()
        .eq('user_id', userId);

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('Error deleting all preferences:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in deleteAllPreferences:', error);
      return 0;
    }
  }

  /**
   * Increment usage count for a preference
   */
  async recordUsage(
    userId: string,
    preferenceType: PreferenceType,
    conversationId?: string
  ): Promise<boolean> {
    try {
      const preference = await this.getPreference(userId, preferenceType, conversationId);

      if (!preference) {
        return false;
      }

      const { error } = await this.supabase
        .from('conversation_preferences')
        .update({
          usage_count: (preference.usage_count || 0) + 1,
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', preference.id);

      if (error) {
        console.error('Error recording usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in recordUsage:', error);
      return false;
    }
  }

  /**
   * Learn preference from user behavior
   * Increases confidence score based on consistent behavior
   */
  async learnPreference(
    userId: string,
    organizationId: string,
    preferenceType: PreferenceType,
    preferenceValue: Record<string, any>,
    conversationId?: string
  ): Promise<ConversationPreference | null> {
    try {
      const existingPreference = await this.getPreference(
        userId,
        preferenceType,
        conversationId
      );

      if (existingPreference) {
        // Check if the new value matches the existing preference
        const valueMatches = JSON.stringify(existingPreference.preference_value) ===
                             JSON.stringify(preferenceValue);

        // Increase confidence if values match, decrease if they don't
        const currentConfidence = existingPreference.confidence_score || 0.5;
        const confidenceDelta = valueMatches ? 0.1 : -0.15;
        const newConfidence = Math.max(0.0, Math.min(1.0, currentConfidence + confidenceDelta));

        return await this.setPreference(
          userId,
          organizationId,
          preferenceType,
          preferenceValue,
          {
            conversationId,
            confidenceScore: newConfidence
          }
        );
      } else {
        // Create new preference with initial confidence
        return await this.setPreference(
          userId,
          organizationId,
          preferenceType,
          preferenceValue,
          {
            conversationId,
            confidenceScore: 0.3 // Start with low confidence for learned preferences
          }
        );
      }
    } catch (error) {
      console.error('Error in learnPreference:', error);
      return null;
    }
  }

  /**
   * Get preferences summary for debugging
   */
  getPreferenceSummary(preference: ConversationPreference | null): string {
    if (!preference) return 'No preference';

    const parts: string[] = [
      `Type: ${preference.preference_type}`,
      `Confidence: ${(preference.confidence_score || 0.5).toFixed(2)}`,
      `Used: ${preference.usage_count || 0} times`,
    ];

    if (preference.conversation_id) {
      parts.push('Scope: Conversation-specific');
    } else {
      parts.push('Scope: Global');
    }

    return parts.join(', ');
  }

  /**
   * Helper methods for specific preference types
   */

  async getNotificationSettings(userId: string, conversationId?: string) {
    const preference = await this.getPreference(userId, 'notification_settings', conversationId);
    return preference?.preference_value as {
      enabled: boolean;
      sound_enabled?: boolean;
      desktop_notifications?: boolean;
      email_notifications?: boolean;
      notification_frequency?: 'all' | 'important' | 'none';
    } | null;
  }

  async setNotificationSettings(
    userId: string,
    organizationId: string,
    settings: {
      enabled: boolean;
      sound_enabled?: boolean;
      desktop_notifications?: boolean;
      email_notifications?: boolean;
      notification_frequency?: 'all' | 'important' | 'none';
    },
    conversationId?: string
  ) {
    return this.setPreference(
      userId,
      organizationId,
      'notification_settings',
      settings,
      { conversationId }
    );
  }

  async getLanguagePreference(userId: string) {
    const preference = await this.getPreference(userId, 'language');
    return preference?.preference_value?.language as string | null;
  }

  async setLanguagePreference(
    userId: string,
    organizationId: string,
    language: string
  ) {
    return this.setPreference(
      userId,
      organizationId,
      'language',
      { language }
    );
  }

  async getResponseTone(userId: string, conversationId?: string) {
    const preference = await this.getPreference(userId, 'response_tone', conversationId);
    return preference?.preference_value?.tone as 'formal' | 'casual' | 'technical' | null;
  }

  async setResponseTone(
    userId: string,
    organizationId: string,
    tone: 'formal' | 'casual' | 'technical',
    conversationId?: string
  ) {
    return this.setPreference(
      userId,
      organizationId,
      'response_tone',
      { tone },
      { conversationId }
    );
  }

  async getAutoArchive(userId: string, conversationId?: string) {
    const preference = await this.getPreference(userId, 'auto_archive', conversationId);
    return preference?.preference_value as {
      enabled: boolean;
      days_after_inactivity?: number;
    } | null;
  }

  async setAutoArchive(
    userId: string,
    organizationId: string,
    settings: {
      enabled: boolean;
      days_after_inactivity?: number;
    },
    conversationId?: string
  ) {
    return this.setPreference(
      userId,
      organizationId,
      'auto_archive',
      settings,
      { conversationId }
    );
  }
}

// Export singleton instance
export const preferencesManager = new ConversationPreferencesManager();
