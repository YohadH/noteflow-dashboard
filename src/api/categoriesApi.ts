import type { Category } from '@/types';
import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { mapCategory } from './mappers';
import { getRequiredUserId } from './session';

export const categoriesApi = {
  async list(boardId: string): Promise<Category[]> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapCategory);
  },

  async create(name: string, boardId: string): Promise<Category> {
    ensureSupabaseConfigured();

    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        board_id: boardId,
        name,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapCategory(data);
  },
};
