import type { Tag } from '@/types';
import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { mapTag } from './mappers';
import { getRequiredUserId } from './session';

export const tagsApi = {
  async list(boardId: string): Promise<Tag[]> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapTag);
  },

  async create(name: string, boardId: string, color = '#6b7280'): Promise<Tag> {
    ensureSupabaseConfigured();

    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        board_id: boardId,
        name,
        color,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapTag(data);
  },
};
