import type { UserSettings } from '@/types';
import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { mapSettings } from './mappers';
import { getRequiredUserId } from './session';

function toSettingsWritePayload(settings: UserSettings) {
  return {
    email_alerts_enabled: settings.emailAlertsEnabled,
    in_app_alerts_enabled: settings.inAppAlertsEnabled,
    push_reminders_enabled: settings.pushRemindersEnabled,
    default_reminder_time: settings.defaultReminderTime,
    default_snooze_interval: settings.defaultSnoozeInterval,
    active_board_id: settings.activeBoardId || null,
    api_endpoint: settings.apiEndpoint || null,
    email_provider: settings.emailProvider || null,
  };
}

export const settingsApi = {
  async get(): Promise<UserSettings> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase.from('user_settings').select('*').maybeSingle();

    if (error) {
      throw error;
    }

    return mapSettings(data);
  },

  async update(settings: UserSettings): Promise<UserSettings> {
    ensureSupabaseConfigured();

    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...toSettingsWritePayload(settings),
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapSettings(data);
  },
};
