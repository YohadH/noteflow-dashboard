import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const webhookAuthToken = Deno.env.get('ALERT_WEBHOOK_AUTH_TOKEN') || '';
const vapidSubject = Deno.env.get('WEB_PUSH_VAPID_SUBJECT') || '';
const vapidPublicKey = Deno.env.get('WEB_PUSH_VAPID_PUBLIC_KEY') || '';
const vapidPrivateKey = Deno.env.get('WEB_PUSH_VAPID_PRIVATE_KEY') || '';

type AlertRow = {
  id: string;
  user_id: string;
  board_id: string;
  note_id: string;
  channel: 'email' | 'in-app' | 'webhook' | 'push';
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

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
};

type DeliveryResult = {
  attempted: boolean;
  delivered: boolean;
  channel: 'in-app' | 'webhook' | 'push';
  message?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function getSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

async function loadAlertContext(supabase: ReturnType<typeof getSupabaseClient>, boardId: string, userId: string) {
  const [
    { data: boardData, error: boardError },
    { data: settingsData, error: settingsError },
    { data: profileData, error: profileError },
  ] = await Promise.all([
    supabase.from('boards').select('id, name, webhook_url, n8n_connected').eq('id', boardId).maybeSingle(),
    supabase.from('user_settings').select('in_app_alerts_enabled').eq('user_id', userId).maybeSingle(),
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

async function loadPushRecipients(supabase: ReturnType<typeof getSupabaseClient>, boardId: string) {
  const { data: boardMembers, error: boardMembersError } = await supabase
    .from('board_members')
    .select('user_id')
    .eq('board_id', boardId);

  if (boardMembersError) {
    throw new Error(boardMembersError.message);
  }

  const userIds = [...new Set((boardMembers || []).map((member) => member.user_id))];
  if (!userIds.length) {
    return [] as PushSubscriptionRow[];
  }

  const [{ data: enabledUsers, error: enabledUsersError }, { data: subscriptions, error: subscriptionsError }] =
    await Promise.all([
      supabase.from('user_settings').select('user_id').in('user_id', userIds).eq('push_reminders_enabled', true),
      supabase.from('push_subscriptions').select('id, user_id, endpoint, subscription').in('user_id', userIds),
    ]);

  if (enabledUsersError) {
    throw new Error(enabledUsersError.message);
  }

  if (subscriptionsError) {
    throw new Error(subscriptionsError.message);
  }

  const enabledUserIds = new Set((enabledUsers || []).map((row) => row.user_id));

  return ((subscriptions || []) as PushSubscriptionRow[]).filter(
    (subscription) => enabledUserIds.has(subscription.user_id) && Boolean(subscription.subscription),
  );
}

async function handleInvalidSubscription(
  supabase: ReturnType<typeof getSupabaseClient>,
  subscriptionId: string,
  endpoint: string,
) {
  await supabase.from('push_subscriptions').delete().eq('id', subscriptionId).eq('endpoint', endpoint);
}

async function updateSubscriptionError(
  supabase: ReturnType<typeof getSupabaseClient>,
  subscriptionId: string,
  message: string,
) {
  await supabase
    .from('push_subscriptions')
    .update({
      last_error: message,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);
}

async function markSubscriptionUsed(supabase: ReturnType<typeof getSupabaseClient>, subscriptionId: string) {
  await supabase
    .from('push_subscriptions')
    .update({
      last_error: null,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);
}

async function deliverPushNotifications(
  supabase: ReturnType<typeof getSupabaseClient>,
  alert: AlertRow,
  board: BoardRow | null,
  profile: ProfileRow | null,
): Promise<DeliveryResult> {
  const recipients = await loadPushRecipients(supabase, alert.board_id);

  if (!recipients.length) {
    return { attempted: false, delivered: false, channel: 'push' };
  }

  if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    throw new Error('Web Push VAPID secrets are not configured.');
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title: `תזכורת: ${alert.notes?.title || 'פתק חדש'}`,
    body: alert.notes?.content?.trim()
      ? alert.notes.content.slice(0, 140)
      : 'יש לך תזכורת חדשה ב-NoteFlow.',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: `alert-${alert.id}`,
    data: {
      url: '/alerts',
      alertId: alert.id,
      noteId: alert.note_id,
      boardId: alert.board_id,
    },
    meta: {
      boardName: board?.name || 'NoteFlow',
      createdBy: profile?.name || profile?.email || 'NoteFlow',
    },
  });

  let deliveredCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      await webpush.sendNotification(recipient.subscription, payload, {
        TTL: 60,
        urgency: 'high',
      });

      deliveredCount += 1;
      await markSubscriptionUsed(supabase, recipient.id);
    } catch (error) {
      const statusCode =
        typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number'
          ? error.statusCode
          : undefined;
      const message = error instanceof Error ? error.message : 'Push delivery failed';

      if (statusCode === 404 || statusCode === 410) {
        await handleInvalidSubscription(supabase, recipient.id, recipient.endpoint);
      } else {
        await updateSubscriptionError(supabase, recipient.id, message);
      }

      errors.push(message);
    }
  }

  if (deliveredCount > 0) {
    return { attempted: true, delivered: true, channel: 'push' };
  }

  if (errors.length) {
    throw new Error(errors[0]);
  }

  return { attempted: true, delivered: false, channel: 'push', message: 'No push delivery succeeded.' };
}

async function deliverWebhook(
  alert: AlertRow,
  board: BoardRow | null,
  settings: UserSettingsRow | null,
  profile: ProfileRow | null,
): Promise<DeliveryResult> {
  const webhookUrl = board?.webhook_url?.trim();

  if (!webhookUrl) {
    return { attempted: false, delivered: false, channel: 'webhook' };
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

  return { attempted: true, delivered: true, channel: 'webhook' };
}

Deno.serve(async () => {
  try {
    const supabase = getSupabaseClient();
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
        const { board, settings, profile } = await loadAlertContext(supabase, alert.board_id, alert.user_id);
        const pushResult = await deliverPushNotifications(supabase, alert, board, profile);
        const webhookResult =
          pushResult.delivered || pushResult.attempted
            ? pushResult.delivered
              ? pushResult
              : await deliverWebhook(alert, board, settings, profile)
            : await deliverWebhook(alert, board, settings, profile);

        const finalChannel =
          pushResult.delivered
            ? 'push'
            : webhookResult.delivered
              ? webhookResult.channel
              : 'in-app';

        if ((pushResult.attempted || webhookResult.attempted) && !pushResult.delivered && !webhookResult.delivered) {
          throw new Error(pushResult.message || webhookResult.message || 'Alert delivery failed');
        }

        await supabase
          .from('alerts')
          .update({
            status: 'sent',
            channel: finalChannel,
            last_error: null,
          })
          .eq('id', alert.id);

        processed += 1;
      } catch (error) {
        console.error('alert delivery failed', {
          alertId: alert.id,
          message: error instanceof Error ? error.message : 'Unknown alert delivery error',
        });

        await supabase
          .from('alerts')
          .update({
            status: 'failed',
            channel: 'push',
            last_error: error instanceof Error ? error.message : 'Alert delivery failed',
          })
          .eq('id', alert.id);

        failed += 1;
      }
    }

    return jsonResponse({ processed, failed });
  } catch (error) {
    console.error('process-alerts fatal error', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unexpected process-alerts failure',
      },
      500,
    );
  }
});
