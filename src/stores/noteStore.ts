import { create } from 'zustand';
import { Note, Reminder, Alert, EmailAction } from '@/types';
import { notes as mockNotes, reminders as mockReminders, alerts as mockAlerts, emailActions as mockEmailActions } from '@/data/mockData';

interface NoteStore {
  notes: Note[];
  reminders: Reminder[];
  alerts: Alert[];
  emailActions: EmailAction[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleReminderComplete: (id: string) => void;
  snoozeReminder: (id: string, until: string) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: mockNotes,
  reminders: mockReminders,
  alerts: mockAlerts,
  emailActions: mockEmailActions,
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
  updateNote: (id, updates) => set((s) => ({
    notes: s.notes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n),
  })),
  deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  toggleReminderComplete: (id) => set((s) => ({
    reminders: s.reminders.map((r) => r.id === id ? { ...r, completed: !r.completed } : r),
  })),
  snoozeReminder: (id, until) => set((s) => ({
    reminders: s.reminders.map((r) => r.id === id ? { ...r, snoozedUntil: until } : r),
  })),
}));
