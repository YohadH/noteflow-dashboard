export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type NoteStatus = 'active' | 'completed' | 'archived';
export type AlertStatus = 'active' | 'scheduled' | 'sent' | 'failed';
export type AlertChannel = 'email' | 'in-app' | 'webhook';
export type EmailActionStatus = 'draft' | 'pending' | 'sent' | 'failed';

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
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}
