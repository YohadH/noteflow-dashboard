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
  addCategory: (name: string, isShareable?: boolean) => Promise<Category>;
  updateCategory: (categoryId: string, updates: Pick<Category, 'name' | 'isShareable'>) => Promise<Category>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addTag: (name: string, color?: string, isShareable?: boolean) => Promise<Tag>;
  updateTag: (tagId: string, updates: Pick<Tag, 'name' | 'color' | 'isShareable'>) => Promise<Tag>;
  deleteTag: (tagId: string) => Promise<void>;
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

  addCategory: async (name, isShareable = false) => {
    const boardId = get().settings.activeBoardId;
    if (!boardId) {
      throw new Error('No active board is selected.');
    }

    const category = await categoriesApi.create(name, boardId, isShareable);
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  updateCategory: async (categoryId, updates) => {
    const category = await categoriesApi.update(categoryId, updates);
    set((state) => ({
      categories: state.categories.map((item) => (item.id === category.id ? category : item)),
    }));
    await get().loadUserData();
    return category;
  },

  deleteCategory: async (categoryId) => {
    await categoriesApi.remove(categoryId);
    await get().loadUserData();
  },

  addTag: async (name, color, isShareable = false) => {
    const boardId = get().settings.activeBoardId;
    if (!boardId) {
      throw new Error('No active board is selected.');
    }

    const tag = await tagsApi.create(name, boardId, color, isShareable);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  updateTag: async (tagId, updates) => {
    const tag = await tagsApi.update(tagId, updates);
    set((state) => ({
      tags: state.tags.map((item) => (item.id === tag.id ? tag : item)),
    }));
    await get().loadUserData();
    return tag;
  },

  deleteTag: async (tagId) => {
    await tagsApi.remove(tagId);
    await get().loadUserData();
  },

  updateSettings: async (settings) => {
    const selectedBoard = get().boards.find((board) => board.id === settings.activeBoardId);

    try {
      await settingsApi.update(settings);

      if (selectedBoard?.role === 'owner' && settings.activeBoardId) {
        await boardsApi.updateIntegration(settings.activeBoardId, {
          webhookUrl: settings.webhookUrl,
          n8nConnected: settings.n8nConnected,
        });
      }
    } catch (error) {
      try {
        await get().loadUserData();
      } catch {
        // If reloading also fails, keep the original error surface.
      }

      throw error;
    }

    await get().loadUserData();
    return get().settings;
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
