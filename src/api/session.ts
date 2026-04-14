import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';

export async function getRequiredUserId() {
  ensureSupabaseConfigured();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('You must be signed in to continue.');
  }

  return user.id;
}
