'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Globe, MessageSquare, Archive, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationPreferencesProps {
  userId: string;
  organizationId: string;
  conversationId?: string; // If provided, shows conversation-specific preferences
  className?: string;
}

export function ConversationPreferences({
  userId,
  organizationId,
  conversationId,
  className
}: ConversationPreferencesProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Preference states
  const [language, setLanguage] = useState('en');
  const [responseTone, setResponseTone] = useState<'formal' | 'casual' | 'technical'>('casual');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(30);

  const supabase = createClient();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [userId, conversationId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);

      // Load language preference (global only)
      const { data: langPref } = await supabase
        .from('conversation_preferences')
        .select('preference_value')
        .eq('user_id', userId)
        .eq('preference_type', 'language')
        .is('conversation_id', null)
        .maybeSingle();

      if (langPref) {
        setLanguage(langPref.preference_value.language || 'en');
      }

      // Load response tone (conversation-specific or global)
      let tonePref;
      if (conversationId) {
        const { data } = await supabase
          .from('conversation_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_type', 'response_tone')
          .eq('conversation_id', conversationId)
          .maybeSingle();
        tonePref = data;
      }

      // Fallback to global if no conversation-specific preference
      if (!tonePref) {
        const { data } = await supabase
          .from('conversation_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_type', 'response_tone')
          .is('conversation_id', null)
          .maybeSingle();
        tonePref = data;
      }

      if (tonePref) {
        setResponseTone(tonePref.preference_value.tone || 'casual');
      }

      // Load notification settings (conversation-specific or global)
      let notifPref;
      if (conversationId) {
        const { data } = await supabase
          .from('conversation_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_type', 'notification_settings')
          .eq('conversation_id', conversationId)
          .maybeSingle();
        notifPref = data;
      }

      if (!notifPref) {
        const { data } = await supabase
          .from('conversation_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_type', 'notification_settings')
          .is('conversation_id', null)
          .maybeSingle();
        notifPref = data;
      }

      if (notifPref) {
        setNotificationsEnabled(notifPref.preference_value.enabled ?? true);
      }

      // Load auto-archive settings (conversation-specific or global)
      let archivePref;
      if (conversationId) {
        const { data } = await supabase
          .from('conversation_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_type', 'auto_archive')
          .eq('conversation_id', conversationId)
          .maybeSingle();
        archivePref = data;
      }

      if (!archivePref) {
        const { data } = await supabase
          .from('conversation_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_type', 'auto_archive')
          .is('conversation_id', null)
          .maybeSingle();
        archivePref = data;
      }

      if (archivePref) {
        setAutoArchiveEnabled(archivePref.preference_value.enabled ?? false);
        setAutoArchiveDays(archivePref.preference_value.days_after_inactivity ?? 30);
      }

    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);

      // Save language (global only)
      await supabase
        .from('conversation_preferences')
        .upsert({
          user_id: userId,
          organization_id: organizationId,
          conversation_id: null,
          preference_type: 'language',
          preference_value: { language },
          usage_count: 1,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'user_id,preference_type,conversation_id'
        });

      // Save response tone (conversation-specific if conversationId provided)
      await supabase
        .from('conversation_preferences')
        .upsert({
          user_id: userId,
          organization_id: organizationId,
          conversation_id: conversationId || null,
          preference_type: 'response_tone',
          preference_value: { tone: responseTone },
          usage_count: 1,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'user_id,preference_type,conversation_id'
        });

      // Save notification settings
      await supabase
        .from('conversation_preferences')
        .upsert({
          user_id: userId,
          organization_id: organizationId,
          conversation_id: conversationId || null,
          preference_type: 'notification_settings',
          preference_value: { enabled: notificationsEnabled },
          usage_count: 1,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'user_id,preference_type,conversation_id'
        });

      // Save auto-archive settings
      await supabase
        .from('conversation_preferences')
        .upsert({
          user_id: userId,
          organization_id: organizationId,
          conversation_id: conversationId || null,
          preference_type: 'auto_archive',
          preference_value: {
            enabled: autoArchiveEnabled,
            days_after_inactivity: autoArchiveDays
          },
          usage_count: 1,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'user_id,preference_type,conversation_id'
        });

      // Show success indicator
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-4", className)}>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {conversationId ? 'Conversation Preferences' : 'Global Preferences'}
        </h3>

        {/* Language */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Globe className="w-4 h-4" />
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        {/* Response Tone */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <MessageSquare className="w-4 h-4" />
            Response Tone
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['formal', 'casual', 'technical'] as const).map((tone) => (
              <button
                key={tone}
                onClick={() => setResponseTone(tone)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  responseTone === tone
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Bell className="w-4 h-4" />
            Notifications
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Enable notifications
            </span>
          </label>
        </div>

        {/* Auto-Archive */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Archive className="w-4 h-4" />
            Auto-Archive
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoArchiveEnabled}
              onChange={(e) => setAutoArchiveEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Auto-archive after inactivity
            </span>
          </label>
          {autoArchiveEnabled && (
            <div className="ml-7 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={autoArchiveDays}
                onChange={(e) => setAutoArchiveDays(parseInt(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={savePreferences}
        disabled={saving || saved}
        className={cn(
          "w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
          saved
            ? "bg-green-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        )}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="w-4 h-4" />
            Saved!
          </>
        ) : (
          'Save Preferences'
        )}
      </button>
    </div>
  );
}
