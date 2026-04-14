create table if not exists public.received_alert_webhooks (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  alert_id text,
  board_id uuid,
  note_id uuid,
  user_id uuid,
  request_headers jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists received_alert_webhooks_created_at_idx
  on public.received_alert_webhooks (created_at desc);

create index if not exists received_alert_webhooks_alert_id_idx
  on public.received_alert_webhooks (alert_id);

create index if not exists received_alert_webhooks_board_id_idx
  on public.received_alert_webhooks (board_id, created_at desc);

alter table public.received_alert_webhooks enable row level security;
