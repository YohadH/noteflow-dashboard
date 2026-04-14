import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const expectedWebhookToken = Deno.env.get('ALERT_WEBHOOK_AUTH_TOKEN') || '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-noteflow-event, x-noteflow-alert-id',
  'content-type': 'application/json',
};

type AlertWebhookPayload = {
  event?: string;
  alert?: {
    id?: string;
    noteId?: string;
    boardId?: string;
    userId?: string;
  } | null;
  [key: string]: unknown;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
}

function sanitizeHeaders(request: Request) {
  return {
    'content-type': request.headers.get('content-type'),
    'user-agent': request.headers.get('user-agent'),
    'x-noteflow-event': request.headers.get('x-noteflow-event'),
    'x-noteflow-alert-id': request.headers.get('x-noteflow-alert-id'),
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase service credentials are not configured.' }, 500);
  }

  if (expectedWebhookToken) {
    const providedToken = getBearerToken(request);
    if (!providedToken || providedToken !== expectedWebhookToken) {
      return jsonResponse({ error: 'Unauthorized webhook request' }, 401);
    }
  }

  let payload: AlertWebhookPayload;

  try {
    payload = (await request.json()) as AlertWebhookPayload;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const event = request.headers.get('x-noteflow-event') || payload.event || 'unknown';
  const alertId = request.headers.get('x-noteflow-alert-id') || payload.alert?.id || null;
  const noteId = payload.alert?.noteId || null;
  const boardId = payload.alert?.boardId || null;
  const userId = payload.alert?.userId || null;

  const { data, error } = await supabase
    .from('received_alert_webhooks')
    .insert({
      event,
      alert_id: alertId,
      note_id: noteId,
      board_id: boardId,
      user_id: userId,
      request_headers: sanitizeHeaders(request),
      payload,
    })
    .select('id, created_at')
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    ok: true,
    receivedId: data.id,
    receivedAt: data.created_at,
    event,
    alertId,
  });
});
