import type {
  Board,
  BoardInvitation,
  BoardMember,
  Category,
  Tag,
  UserSettings,
  Note,
  Reminder,
  Alert,
  EmailAction,
} from '@/types';
import type { Tables } from '@/lib/supabase/types';
import { DEFAULT_USER_SETTINGS } from '@/lib/defaults';

export function mapProfileToUser(profile: Tables<'profiles'>) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar_url || undefined,
    createdAt: profile.created_at,
  };
}

export function mapSettings(row?: Tables<'user_settings'> | null): UserSettings {
  if (!row) {
    return DEFAULT_USER_SETTINGS;
  }

  return {
    emailAlertsEnabled: row.email_alerts_enabled,
    inAppAlertsEnabled: row.in_app_alerts_enabled,
    pushRemindersEnabled: row.push_reminders_enabled,
    defaultReminderTime: row.default_reminder_time,
    defaultSnoozeInterval: row.default_snooze_interval,
    activeBoardId: row.active_board_id || undefined,
    apiEndpoint: row.api_endpoint || '',
    webhookUrl: row.webhook_url || '',
    n8nConnected: row.n8n_connected,
    emailProvider: row.email_provider || '',
  };
}

export function mapBoard(
  board: Tables<'boards'>,
  role: Board['role'],
): Board {
  return {
    id: board.id,
    name: board.name,
    ownerUserId: board.owner_user_id,
    isPersonal: board.is_personal,
    role,
    createdAt: board.created_at,
    updatedAt: board.updated_at,
  };
}

export function mapBoardMember(
  row: Pick<Tables<'board_members'>, 'board_id' | 'user_id' | 'role' | 'created_at'>,
  profile: Pick<Tables<'profiles'>, 'id' | 'name' | 'email'>,
  currentUserId: string,
): BoardMember {
  return {
    boardId: row.board_id,
    userId: row.user_id,
    name: profile.name,
    email: profile.email,
    role: row.role,
    joinedAt: row.created_at,
    isCurrentUser: currentUserId === row.user_id,
  };
}

export function mapBoardInvitation(row: Tables<'board_invitations'>): BoardInvitation {
  return {
    id: row.id,
    boardId: row.board_id,
    email: row.email,
    status: row.status,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
  };
}

export function mapCategory(row: Tables<'categories'>): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || undefined,
    color: row.color || undefined,
  };
}

export function mapTag(row: Tables<'tags'>): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

export function mapNote(row: Tables<'notes'>): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority,
    status: row.status,
    tags: row.tags || [],
    category: row.category || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dueDate: row.due_at || undefined,
    reminderAt: row.reminder_at || undefined,
    pinned: row.pinned,
    hasAlert: row.has_alert,
    hasEmailAction: row.has_email_action,
  };
}

export function mapReminder(
  row: Tables<'reminders'>,
  note?: Pick<Note, 'id' | 'title' | 'priority'> | null,
): Reminder {
  return {
    id: row.id,
    noteId: row.note_id,
    noteTitle: note?.title || 'Untitled note',
    reminderAt: row.snoozed_until || row.reminder_at,
    priority: note?.priority || 'medium',
    completed: row.completed,
    snoozedUntil: row.snoozed_until || undefined,
  };
}

export function mapAlert(
  row: Tables<'alerts'>,
  note?: Pick<Note, 'id' | 'title' | 'priority'> | null,
): Alert {
  return {
    id: row.id,
    noteId: row.note_id,
    noteTitle: note?.title || 'Untitled note',
    type: row.type,
    channel: row.channel,
    scheduledAt: row.scheduled_at,
    status: row.status,
    priority: note?.priority || 'medium',
  };
}

export function mapEmailAction(
  row: Tables<'email_actions'>,
  note?: Pick<Note, 'id' | 'title'> | null,
): EmailAction {
  return {
    id: row.id,
    noteId: row.note_id,
    noteTitle: note?.title || 'Untitled note',
    recipient: row.recipient,
    subject: row.subject,
    bodyPreview: row.body_preview,
    status: row.status,
    scheduledAt: row.scheduled_at || undefined,
    sentAt: row.sent_at || undefined,
  };
}
