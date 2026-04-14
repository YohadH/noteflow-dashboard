do $$
begin
  alter type public.alert_channel_enum add value 'push';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  last_error text
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id, updated_at desc);

drop trigger if exists handle_push_subscriptions_updated_at on public.push_subscriptions;
create trigger handle_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute procedure public.set_current_timestamp_updated_at();

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can manage their own push subscriptions" on public.push_subscriptions;
create policy "Users can manage their own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
