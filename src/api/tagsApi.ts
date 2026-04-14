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

  async create(name: string, boardId: string, color = '#6b7280', isShareable = false): Promise<Tag> {
    ensureSupabaseConfigured();

    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        board_id: boardId,
        name,
        color,
        is_shareable: isShareable,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapTag(data);
  },

  async update(tagId: string, updates: Pick<Tag, 'name' | 'color' | 'isShareable'>): Promise<Tag> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase
      .from('tags')
      .update({
        name: updates.name,
        color: updates.color,
        is_shareable: updates.isShareable,
      })
      .eq('id', tagId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapTag(data);
  },

  async remove(tagId: string): Promise<void> {
    ensureSupabaseConfigured();

    const { error } = await supabase.rpc('delete_tag_definition', {
      target_tag_id: tagId,
    });

    if (error) {
      throw error;
    }
  },
};
