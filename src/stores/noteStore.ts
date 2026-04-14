import { create } from 'zustand';
import type {
  Alert,
  Board,
  BoardInvitation,
  BoardMember,
  Category,
  EmailAction,
  Note,
  Reminder,
  Tag,
  UserSettings,
} from '@/types';
import { appApi, boardsApi, categoriesApi, notesApi, remindersApi, settingsApi, tagsApi } from '@/api';
import { DEFAULT_USER_SETTINGS } from '@/lib/defaults';
import { getErrorMessage } from '@/api/errors';

interface NoteStore {
  notes: Note[];
  reminders: Reminder[];
  alerts: Alert[];
  emailActions: EmailAction[];
  categories: Category[];
  tags: Tag[];
  boards: Board[];
  boardMembers: BoardMember[];
  boardInvitations: BoardInvitation[];
  settings: UserSettings;
  searchQuery: string;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  setSearchQuery: (q: string) => void;
  addNote: (note: Note) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  toggleReminderComplete: (id: string) => Promise<void>;
  snoozeReminder: (id: string, until: string) => Promise<void>;
  loadUserData: (_userId?: string) => Promise<void>;
  saveUserData: (_userId?: string) => Promise<void>;
  clearUserData: () => void;
  addCategory: (name: string) => Promise<Category>;
  addTag: (name: string, color?: string) => Promise<Tag>;
  updateSettings: (settings: UserSettings) => Promise<UserSettings>;
  connectBoardUser: (email: string) => Promise<void>;
  removeBoardUser: (userId: string) => Promise<void>;
  revokeBoardInvitation: (invitationId: string) => Promise<void>;
  switchBoard: (boardId: string) => Promise<void>;
}

const emptyState = {
  notes: [],
  reminders: [],
  alerts: [],
  emailActions: [],
  categories: [],
  tags: [],
  boards: [],
  boardMembers: [],
  boardInvitations: [],
  settings: DEFAULT_USER_SETTINGS,
};

export const useNoteStore = create<NoteStore>((set, get) => ({
  ...emptyState,
  searchQuery: '',
  isLoading: false,
  isHydrated: false,
  error: null,

  setSearchQuery: (q) => set({ searchQuery: q }),

  loadUserData: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await appApi.loadAll();
      set({
        ...data,
        isLoading: false,
        isHydrated: true,
        error: null,
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load your note data.');
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  saveUserData: async () => {
    // Data is persisted immediately through Supabase mutations.
  },

  clearUserData: () =>
    set({
      ...emptyState,
      error: null,
      isLoading: false,
      isHydrated: false,
    }),

  addNote: async (note) => {
    const boardId = get().settings.activeBoardId;
    if (!boardId) {
      throw new Error('No active board is selected.');
    }

    const created = await notesApi.create(note, boardId);
    await get().loadUserData();
    return created;
  },

  updateNote: async (id, updates) => {
    const boardId = get().settings.activeBoardId;
    if (!boardId) {
      throw new Error('No active board is selected.');
    }

    const updated = await notesApi.update(id, updates, boardId);
    await get().loadUserData();
    return updated;
  },

  deleteNote: async (id) => {
    const boardId = get().settings.activeBoardId;
    if (!boardId) {
      throw new Error('No active board is selected.');
    }

    await notesApi.delete(id, boardId);
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      reminders: state.reminders.filter((reminder) => reminder.noteId !== id),
      alerts: state.alerts.filter((alert) => alert.noteId !== id),
      emailActions: state.emailActions.filter((action) => action.noteId !== id),
    }));
  },

  toggleReminderComplete: async (id) => {
    await remindersApi.toggleComplete(id);
    await get().loadUserData();
  },

  snoozeReminder: async (id, until) => {
    await remindersApi.snooze(id, until);
    await get().loadUserData();
  },

  addCategory: async (name) => {
    const boardId = get().settings.activeBoardId;
    if (!boardId) {
      throw new Error('No active board is selected.');
    }

    const category = await categoriesApi.create(name, boardId);
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  addTag: async (name, color) => {
    const boardId = get().settings.activeBoardId;
    if (!boardId) {
      throw new Error('No active board is selected.');
    }

    const tag = await tagsApi.create(name, boardId, color);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  updateSettings: async (settings) => {
    const previousBoardId = get().settings.activeBoardId;
    const nextSettings = await settingsApi.update(settings);
    set({ settings: nextSettings });

    if (nextSettings.activeBoardId !== previousBoardId) {
      await get().loadUserData();
    }

    return nextSettings;
  },

  connectBoardUser: async (email) => {
    await boardsApi.connectUser(email, get().settings.activeBoardId);
    await get().loadUserData();
  },

  removeBoardUser: async (userId) => {
    await boardsApi.removeUser(userId, get().settings.activeBoardId);
    await get().loadUserData();
  },

  revokeBoardInvitation: async (invitationId) => {
    await boardsApi.revokeInvitation(invitationId);
    await get().loadUserData();
  },

  switchBoard: async (boardId) => {
    const currentSettings = get().settings;
    await settingsApi.update({
      ...currentSettings,
      activeBoardId: boardId,
    });
    await get().loadUserData();
  },
}));
