import type { Category, Tag, UserSettings } from '@/types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'פרויקטים' },
  { name: 'פגישות' },
  { name: 'מחקר' },
  { name: 'אישי' },
  { name: 'תפעול' },
];

export const DEFAULT_TAGS: Omit<Tag, 'id'>[] = [
  { name: 'עבודה', color: 'hsl(215, 60%, 50%)' },
  { name: 'אישי', color: 'hsl(280, 60%, 55%)' },
  { name: 'דחוף', color: 'hsl(0, 72%, 51%)' },
  { name: 'רעיונות', color: 'hsl(45, 93%, 47%)' },
  { name: 'מעקב', color: 'hsl(172, 66%, 40%)' },
  { name: 'פגישה', color: 'hsl(200, 60%, 50%)' },
];

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
