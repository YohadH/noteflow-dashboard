import type { UserSettings } from '@/types';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  emailAlertsEnabled: true,
  inAppAlertsEnabled: true,
  pushRemindersEnabled: false,
  defaultReminderTime: '09:00:00',
  defaultSnoozeInterval: '1h',
  activeBoardId: undefined,
  apiEndpoint: '',
  webhookUrl: '',
  n8nConnected: false,
  emailProvider: '',
};
