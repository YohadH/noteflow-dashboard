export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type NoteStatus = 'active' | 'completed' | 'archived';
export type AlertStatus = 'active' | 'scheduled' | 'sent' | 'failed';
export type AlertChannel = 'email' | 'in-app' | 'webhook' | 'push';
export type EmailActionStatus = 'draft' | 'pending' | 'sent' | 'failed';
export type BoardRole = 'owner' | 'member';
export type BoardInvitationStatus = 'pending' | 'accepted' | 'revoked';

export interface Note {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  status: NoteStatus;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  reminderAt?: string;
  pinned: boolean;
  hasAlert: boolean;
  hasEmailAction: boolean;
  ownerUserId?: string;
  isShared?: boolean;
}

export interface Reminder {
  id: string;
  noteId: string;
  noteTitle: string;
  reminderAt: string;
  priority: Priority;
  completed: boolean;
  snoozedUntil?: string;
}

export interface Alert {
  id: string;
  noteId: string;
  noteTitle: string;
  type: string;
  channel: AlertChannel;
  scheduledAt: string;
  status: AlertStatus;
  priority: Priority;
}

export interface EmailAction {
  id: string;
  noteId: string;
  noteTitle: string;
  recipient: string;
  subject: string;
  bodyPreview: string;
  status: EmailActionStatus;
  scheduledAt?: string;
  sentAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  isShareable: boolean;
  ownerUserId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isShareable: boolean;
  ownerUserId?: string;
}

export interface Board {
  id: string;
  name: string;
  ownerUserId: string;
  isPersonal: boolean;
  role: BoardRole;
  webhookUrl?: string;
  n8nConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  boardId: string;
  userId: string;
  name: string;
  email: string;
  role: BoardRole;
  joinedAt: string;
  isCurrentUser: boolean;
}

export interface BoardInvitation {
  id: string;
  boardId: string;
  email: string;
  status: BoardInvitationStatus;
  invitedBy: string;
  createdAt: string;
}

export interface UserSettings {
  emailAlertsEnabled: boolean;
  inAppAlertsEnabled: boolean;
  pushRemindersEnabled: boolean;
  defaultReminderTime: string;
  defaultSnoozeInterval: string;
  activeBoardId?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  n8nConnected: boolean;
  emailProvider?: string;
}
