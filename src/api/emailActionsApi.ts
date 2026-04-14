import type { EmailAction, EmailActionStatus } from '@/types';
import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { mapEmailAction } from './mappers';

type EmailActionQueryRow = {
  id: string;
  board_id: string;
  note_id: string;
  recipient: string;
  subject: string;
  body_preview: string;
  status: EmailAction['status'];
  scheduled_at: string | null;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  notes?: {
    id: string;
    title: string;
  } | null;
};

export const emailActionsApi = {
  async list(boardId: string, status?: EmailActionStatus): Promise<EmailAction[]> {
    ensureSupabaseConfigured();

    let query = supabase
      .from('email_actions')
      .select(
        'id, board_id, note_id, recipient, subject, body_preview, status, scheduled_at, sent_at, last_error, created_at, updated_at, notes:notes!inner(id, title)',
      )
      .eq('board_id', boardId)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return ((data as EmailActionQueryRow[] | null) || []).map((row) =>
      mapEmailAction(
        {
          id: row.id,
          user_id: '',
          board_id: row.board_id,
          note_id: row.note_id,
          recipient: row.recipient,
          subject: row.subject,
          body_preview: row.body_preview,
          status: row.status,
          scheduled_at: row.scheduled_at,
          sent_at: row.sent_at,
          last_error: row.last_error,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        row.notes
          ? {
              id: row.notes.id,
              title: row.notes.title,
            }
          : null,
      ),
    );
  },

  async updateStatus(emailActionId: string, status: EmailActionStatus): Promise<void> {
    ensureSupabaseConfigured();

    const { error } = await supabase
      .from('email_actions')
      .update({
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
      .eq('id', emailActionId);

    if (error) {
      throw error;
    }
  },
};
