import type { Note, NoteStatus, Priority } from '@/types';
import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import type { Inserts, Updates } from '@/lib/supabase/types';
import { mapNote } from './mappers';
import { getRequiredUserId } from './session';

export interface NoteFilters {
  status?: NoteStatus;
  priority?: Priority;
  search?: string;
}

function toNoteWritePayload(note: Partial<Note>): Updates<'notes'> {
  return {
    title: note.title ?? '',
    content: note.content ?? '',
    priority: note.priority ?? 'medium',
    status: note.status ?? 'active',
    tags: note.tags ?? [],
    category: note.category || null,
    due_at: note.dueDate || null,
    reminder_at: note.reminderAt || null,
    pinned: note.pinned ?? false,
    has_alert: note.hasAlert ?? false,
    has_email_action: note.hasEmailAction ?? false,
  };
}

export const notesApi = {
  async list(boardId: string, filters?: NoteFilters): Promise<Note[]> {
    ensureSupabaseConfigured();

    let query = supabase.from('notes').select('*').eq('board_id', boardId).order('updated_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.search) {
      const sanitized = filters.search.replace(/,/g, ' ');
      query = query.or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(mapNote);
  },

  async create(note: Note, boardId: string): Promise<Note> {
    ensureSupabaseConfigured();

    const userId = await getRequiredUserId();
    const payload: Inserts<'notes'> = {
      id: note.id,
      user_id: userId,
      board_id: boardId,
      ...toNoteWritePayload(note),
    };

    const { data, error } = await supabase.from('notes').insert(payload).select('*').single();

    if (error) {
      throw error;
    }

    return mapNote(data);
  },

  async update(noteId: string, updates: Partial<Note>, boardId: string): Promise<Note> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase
      .from('notes')
      .update(toNoteWritePayload(updates))
      .eq('id', noteId)
      .eq('board_id', boardId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapNote(data);
  },

  async delete(noteId: string, boardId: string) {
    ensureSupabaseConfigured();

    const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('board_id', boardId);

    if (error) {
      throw error;
    }
  },
};
