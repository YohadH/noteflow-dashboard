import type { Reminder } from '@/types';
import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { mapReminder } from './mappers';

type ReminderQueryRow = {
  id: string;
  board_id: string;
  note_id: string;
  reminder_at: string;
  completed: boolean;
  completed_at: string | null;
  snoozed_until: string | null;
  created_at: string;
  updated_at: string;
  notes?: {
    id: string;
    title: string;
    priority: Reminder['priority'];
  } | null;
};

export const remindersApi = {
  async list(boardId: string): Promise<Reminder[]> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase
      .from('reminders')
      .select(
        'id, board_id, note_id, reminder_at, completed, completed_at, snoozed_until, created_at, updated_at, notes:notes!inner(id, title, priority)',
      )
      .eq('board_id', boardId)
      .order('reminder_at', { ascending: true });

    if (error) {
      throw error;
    }

    return ((data as unknown as ReminderQueryRow[] | null) || []).map((row) =>
      mapReminder(
        {
          id: row.id,
          user_id: '',
          board_id: row.board_id,
          note_id: row.note_id,
          reminder_at: row.reminder_at,
          completed: row.completed,
          completed_at: row.completed_at,
          snoozed_until: row.snoozed_until,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        row.notes
          ? {
              id: row.notes.id,
              title: row.notes.title,
              priority: row.notes.priority,
            }
          : null,
      ),
    );
  },

  async toggleComplete(reminderId: string): Promise<void> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase.from('reminders').select('completed').eq('id', reminderId).single();

    if (error) {
      throw error;
    }

    const nextCompleted = !data.completed;
    const { error: updateError } = await supabase
      .from('reminders')
      .update({
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
      })
      .eq('id', reminderId);

    if (updateError) {
      throw updateError;
    }
  },

  async snooze(reminderId: string, until: string): Promise<void> {
    ensureSupabaseConfigured();

    const { error } = await supabase
      .from('reminders')
      .update({
        snoozed_until: until,
        completed: false,
        completed_at: null,
      })
      .eq('id', reminderId);

    if (error) {
      throw error;
    }
  },
};
