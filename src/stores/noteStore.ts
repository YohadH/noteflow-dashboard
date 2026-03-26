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
  loadUserData: (userId: string) => void;
  saveUserData: (userId: string) => void;
}

function getUserDataKey(userId: string) {
  return `app_data_${userId}`;
}

function loadFromStorage(userId: string) {
  try {
    const raw = localStorage.getItem(getUserDataKey(userId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(userId: string, data: { notes: Note[]; reminders: Reminder[]; alerts: Alert[]; emailActions: EmailAction[] }) {
  localStorage.setItem(getUserDataKey(userId), JSON.stringify(data));
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  reminders: [],
  alerts: [],
  emailActions: [],
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
  loadUserData: (userId) => {
    const stored = loadFromStorage(userId);
    if (stored) {
      set({
        notes: stored.notes || [],
        reminders: stored.reminders || [],
        alerts: stored.alerts || [],
        emailActions: stored.emailActions || [],
      });
    } else {
      // First time user gets mock data as starter
      set({
        notes: mockNotes,
        reminders: mockReminders,
        alerts: mockAlerts,
        emailActions: mockEmailActions,
      });
      saveToStorage(userId, {
        notes: mockNotes,
        reminders: mockReminders,
        alerts: mockAlerts,
        emailActions: mockEmailActions,
      });
    }
  },
  saveUserData: (userId) => {
    const { notes, reminders, alerts, emailActions } = get();
    saveToStorage(userId, { notes, reminders, alerts, emailActions });
  },
}));
