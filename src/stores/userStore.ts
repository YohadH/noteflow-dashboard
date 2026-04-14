import { create } from 'zustand';
import { authApi } from '@/api';
import { getErrorMessage } from '@/api/errors';

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

interface UserStore {
  currentUser: LocalUser | null;
  users: LocalUser[];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUsers: () => Promise<void>;
}

let authSubscription:
  | {
      unsubscribe: () => void;
    }
  | undefined;

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: null,
  users: [],
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const currentUser = await authApi.getCurrentUser();

      set({
        currentUser,
        users: currentUser ? [currentUser] : [],
        isInitialized: true,
        isLoading: false,
        error: null,
      });

      if (!authSubscription) {
        const subscription = authApi.onAuthStateChange(async () => {
          try {
            const nextUser = await authApi.getCurrentUser();
            set({
              currentUser: nextUser,
              users: nextUser ? [nextUser] : [],
              isInitialized: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              currentUser: null,
              users: [],
              isInitialized: true,
              isLoading: false,
              error: getErrorMessage(error, 'Failed to refresh your session.'),
            });
          }
        });

        authSubscription = subscription.data.subscription;
      }
    } catch (error) {
      set({
        currentUser: null,
        users: [],
        isInitialized: true,
        isLoading: false,
        error: getErrorMessage(error, 'Failed to initialize authentication.'),
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const currentUser = await authApi.signIn(email, password);
      set({
        currentUser,
        users: currentUser ? [currentUser] : [],
        isInitialized: true,
        isLoading: false,
        error: null,
      });
      return Boolean(currentUser);
    } catch (error) {
      set({
        currentUser: null,
        users: [],
        isInitialized: true,
        isLoading: false,
        error: getErrorMessage(error, 'Failed to sign in.'),
      });
      return false;
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });

    try {
      const currentUser = await authApi.signUp(name, email, password);
      set({
        currentUser,
        users: currentUser ? [currentUser] : [],
        isInitialized: true,
        isLoading: false,
        error: null,
      });
      return Boolean(currentUser);
    } catch (error) {
      set({
        currentUser: null,
        users: [],
        isInitialized: true,
        isLoading: false,
        error: getErrorMessage(error, 'Failed to create your account.'),
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await authApi.signOut();
      set({
        currentUser: null,
        users: [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to sign out.'),
      });
      throw error;
    }
  },

  loadUsers: async () => {
    const currentUser = get().currentUser;
    set({ users: currentUser ? [currentUser] : [] });
  },
}));
