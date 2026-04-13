import { create } from 'zustand';

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
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  loadUsers: () => void;
}

const USERS_KEY = 'app_users';
const PASSWORDS_KEY = 'app_passwords';
const CURRENT_USER_KEY = 'app_current_user';

// Seed a default test user
(function seedTestUser() {
  const users: LocalUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  if (!users.find(u => u.email === 'test@gmail.com')) {
    const id = crypto.randomUUID();
    const testUser: LocalUser = { id, name: 'Test User', email: 'test@gmail.com', createdAt: new Date().toISOString() };
    users.push(testUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    passwords[id] = '123';
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  }
})();

function getStoredUsers(): LocalUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch { return []; }
}

function getStoredPasswords(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
  } catch { return {}; }
}

function getCurrentUserId(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: (() => {
    const id = getCurrentUserId();
    if (!id) return null;
    const users = getStoredUsers();
    return users.find(u => u.id === id) || null;
  })(),
  users: getStoredUsers(),

  login: (email, password) => {
    const users = getStoredUsers();
    const passwords = getStoredPasswords();
    const user = users.find(u => u.email === email);
    if (!user || passwords[user.id] !== password) return false;
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    set({ currentUser: user });
    return true;
  },

  signup: (name, email, password) => {
    const users = getStoredUsers();
    if (users.find(u => u.email === email)) return false;
    const newUser: LocalUser = {
      id: crypto.randomUUID(),
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    const updatedUsers = [...users, newUser];
    const passwords = getStoredPasswords();
    passwords[newUser.id] = password;
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    localStorage.setItem(CURRENT_USER_KEY, newUser.id);
    set({ currentUser: newUser, users: updatedUsers });
    return true;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    set({ currentUser: null });
  },

  loadUsers: () => {
    set({ users: getStoredUsers() });
  },
}));
