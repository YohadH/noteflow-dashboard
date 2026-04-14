import type { Alert, AlertStatus } from '@/types';
import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { mapAlert } from './mappers';

type AlertQueryRow = {
  id: string;
  board_id: string;
  note_id: string;
  type: string;
  channel: Alert['channel'];
  scheduled_at: string;
  status: Alert['status'];
  last_error: string | null;
  created_at: string;
  updated_at: string;
  notes?: {
    id: string;
    title: string;
    priority: Alert['priority'];
  } | null;
};

export const alertsApi = {
  async list(boardId: string, status?: AlertStatus): Promise<Alert[]> {
    ensureSupabaseConfigured();

    let query = supabase
      .from('alerts')
      .select(
        'id, board_id, note_id, type, channel, scheduled_at, status, last_error, created_at, updated_at, notes:notes!inner(id, title, priority)',
      )
      .eq('board_id', boardId)
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return ((data as AlertQueryRow[] | null) || []).map((row) =>
      mapAlert(
        {
          id: row.id,
          user_id: '',
          board_id: row.board_id,
          note_id: row.note_id,
          type: row.type,
          channel: row.channel,
          scheduled_at: row.scheduled_at,
          status: row.status,
          last_error: row.last_error,
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

  async updateStatus(alertId: string, status: AlertStatus): Promise<void> {
    ensureSupabaseConfigured();

    const { error } = await supabase.from('alerts').update({ status }).eq('id', alertId);

    if (error) {
      throw error;
    }
  },
};
