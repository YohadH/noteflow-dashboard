import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { mapProfileToUser } from './mappers';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileToUser(data) : null;
}

function getEmailRedirectTo() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}/auth`;
}

export const authApi = {
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    ensureSupabaseConfigured();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      return null;
    }

    return fetchProfile(session.user.id);
  },

  async signIn(email: string, password: string): Promise<AuthenticatedUser | null> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    if (!data.user) {
      return null;
    }

    return fetchProfile(data.user.id);
  },

  async signUp(name: string, email: string, password: string): Promise<AuthenticatedUser | null> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: getEmailRedirectTo(),
      },
    });

    if (error) {
      throw error;
    }

    if (data.session?.user) {
      return fetchProfile(data.session.user.id);
    }

    const signInResult = await supabase.auth.signInWithPassword({ email, password });

    if (signInResult.error) {
      throw signInResult.error;
    }

    if (!signInResult.data.user) {
      return null;
    }

    return fetchProfile(signInResult.data.user.id);
  },

  async signOut() {
    ensureSupabaseConfigured();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  },

  onAuthStateChange(callback: () => void) {
    return supabase.auth.onAuthStateChange(() => callback());
  },
};
