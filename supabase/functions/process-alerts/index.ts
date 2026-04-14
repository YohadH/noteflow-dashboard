import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const webhookAuthToken = Deno.env.get('ALERT_WEBHOOK_AUTH_TOKEN') || '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

type AlertRow = {
  id: string;
  user_id: string;
  board_id: string;
  note_id: string;
  channel: 'email' | 'in-app' | 'webhook';
  status: 'active' | 'scheduled' | 'sent' | 'failed';
  scheduled_at: string;
  type: string;
  notes: {
    id: string;
    title: string;
    content: string;
    priority: string;
  } | null;
};

type BoardRow = {
  id: string;
  name: string;
  webhook_url: string | null;
  n8n_connected: boolean;
};

type UserSettingsRow = {
  in_app_alerts_enabled: boolean;
};

type ProfileRow = {
  id: string;
  name: string;
  email: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function loadAlertContext(boardId: string, userId: string) {
  const [
    { data: boardData, error: boardError },
    { data: settingsData, error: settingsError },
    { data: profileData, error: profileError },
  ] = await Promise.all([
    supabase.from('boards').select('id, name, webhook_url, n8n_connected').eq('id', boardId).maybeSingle(),
    supabase
      .from('user_settings')
      .select('in_app_alerts_enabled')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('profiles').select('id, name, email').eq('id', userId).maybeSingle(),
  ]);

  if (boardError) {
    throw new Error(boardError.message);
  }

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    board: (boardData as BoardRow | null) || null,
    settings: (settingsData as UserSettingsRow | null) || null,
    profile: (profileData as ProfileRow | null) || null,
  };
}

async function deliverWebhook(
  alert: AlertRow,
  board: BoardRow | null,
  settings: UserSettingsRow | null,
  profile: ProfileRow | null,
) {
  const webhookUrl = board?.webhook_url?.trim();

  if (!webhookUrl) {
    return { deliveredExternally: false, channel: 'in-app' as const };
  }

  const headers = new Headers({
    'content-type': 'application/json',
    'x-noteflow-event': 'note.alert.triggered',
    'x-noteflow-alert-id': alert.id,
  });

  if (webhookAuthToken) {
    headers.set('authorization', `Bearer ${webhookAuthToken}`);
  }

  const payload = {
    event: 'note.alert.triggered',
    deliveredAt: new Date().toISOString(),
    alert: {
      id: alert.id,
      type: alert.type,
      status: alert.status,
      scheduledAt: alert.scheduled_at,
      noteId: alert.note_id,
      boardId: alert.board_id,
      userId: alert.user_id,
      originalChannel: alert.channel,
    },
    note: alert.notes
      ? {
          id: alert.notes.id,
          title: alert.notes.title,
          content: alert.notes.content,
          priority: alert.notes.priority,
        }
      : null,
    user: profile
      ? {
          id: profile.id,
          name: profile.name,
          email: profile.email,
        }
      : {
          id: alert.user_id,
        },
    board: board
      ? {
          id: board.id,
          name: board.name,
        }
      : {
          id: alert.board_id,
        },
    delivery: {
      webhookUrl,
      n8nConnected: board?.n8n_connected ?? false,
      inAppAlertsEnabled: settings?.in_app_alerts_enabled ?? true,
    },
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Webhook delivery failed with ${response.status}: ${responseText || response.statusText}`);
  }

  return { deliveredExternally: true, channel: 'webhook' as const };
}

Deno.serve(async () => {
  const now = new Date().toISOString();

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('id, user_id, board_id, note_id, channel, status, scheduled_at, type, notes:notes(id, title, content, priority)')
    .in('status', ['active', 'scheduled'])
    .lte('scheduled_at', now);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  let processed = 0;
  let failed = 0;

  for (const alert of (alerts as AlertRow[] | null) || []) {
    try {
      const { board, settings, profile } = await loadAlertContext(alert.board_id, alert.user_id);
      const deliveryResult = await deliverWebhook(alert, board, settings, profile);

      await supabase
        .from('alerts')
        .update({
          status: 'sent',
          channel: deliveryResult.channel,
          last_error: null,
        })
        .eq('id', alert.id);

      processed += 1;
    } catch (deliveryError) {
      await supabase
        .from('alerts')
        .update({
          status: 'failed',
          channel: 'webhook',
          last_error: deliveryError instanceof Error ? deliveryError.message : 'Alert delivery failed',
        })
        .eq('id', alert.id);

      failed += 1;
    }
  }

  return jsonResponse({ processed, failed });
});
