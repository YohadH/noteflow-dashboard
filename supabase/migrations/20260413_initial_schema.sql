create extension if not exists pgcrypto;

do $$
begin
  create type public.priority_enum as enum ('low', 'medium', 'high', 'urgent');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.note_status_enum as enum ('active', 'completed', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.alert_status_enum as enum ('active', 'scheduled', 'sent', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.alert_channel_enum as enum ('email', 'in-app', 'webhook');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.email_action_status_enum as enum ('draft', 'pending', 'sent', 'failed');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_alerts_enabled boolean not null default true,
  in_app_alerts_enabled boolean not null default true,
  push_reminders_enabled boolean not null default false,
  default_reminder_time time not null default '09:00:00',
  default_snooze_interval text not null default '1h',
  api_endpoint text,
  webhook_url text,
  n8n_connected boolean not null default false,
  email_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_user_name_unique
  on public.categories (user_id, lower(name));

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default '#6b7280',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tags_user_name_unique
  on public.tags (user_id, lower(name));

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  priority public.priority_enum not null default 'medium',
  status public.note_status_enum not null default 'active',
  tags text[] not null default '{}',
  category text,
  due_at timestamptz,
  reminder_at timestamptz,
  pinned boolean not null default false,
  has_alert boolean not null default false,
  has_email_action boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null unique references public.notes(id) on delete cascade,
  reminder_at timestamptz not null,
  completed boolean not null default false,
  completed_at timestamptz,
  snoozed_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null unique references public.notes(id) on delete cascade,
  type text not null default 'reminder',
  channel public.alert_channel_enum not null default 'in-app',
  scheduled_at timestamptz not null,
  status public.alert_status_enum not null default 'scheduled',
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null unique references public.notes(id) on delete cascade,
  recipient text not null,
  subject text not null,
  body_preview text not null,
  status public.email_action_status_enum not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index if not exists notes_user_status_idx on public.notes (user_id, status);
create index if not exists notes_user_priority_idx on public.notes (user_id, priority);
create index if not exists notes_user_due_idx on public.notes (user_id, due_at);
create index if not exists reminders_user_due_idx on public.reminders (user_id, reminder_at);
create index if not exists reminders_user_completed_idx on public.reminders (user_id, completed);
create index if not exists alerts_user_status_idx on public.alerts (user_id, status, scheduled_at);
create index if not exists email_actions_user_status_idx on public.email_actions (user_id, status, updated_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
begin
  derived_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, name, email)
  values (new.id, derived_name, new.email)
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.categories (user_id, name, position)
  values
    (new.id, 'פרויקטים', 1),
    (new.id, 'פגישות', 2),
    (new.id, 'מחקר', 3),
    (new.id, 'אישי', 4),
    (new.id, 'תפעול', 5)
  on conflict do nothing;

  insert into public.tags (user_id, name, color)
  values
    (new.id, 'עבודה', 'hsl(215, 60%, 50%)'),
    (new.id, 'אישי', 'hsl(280, 60%, 55%)'),
    (new.id, 'דחוף', 'hsl(0, 72%, 51%)'),
    (new.id, 'רעיונות', 'hsl(45, 93%, 47%)'),
    (new.id, 'מעקב', 'hsl(172, 66%, 40%)'),
    (new.id, 'פגישה', 'hsl(200, 60%, 50%)')
  on conflict do nothing;

  return new;
end;
$$;

create or replace function public.sync_note_dependents()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_schedule timestamptz;
  resolved_alert_status public.alert_status_enum;
  resolved_email text;
  reminder_changed boolean;
begin
  if tg_op = 'INSERT' then
    reminder_changed := true;
  else
    reminder_changed := old.reminder_at is distinct from new.reminder_at;
  end if;

  if new.reminder_at is null then
    delete from public.reminders where note_id = new.id;
  else
    insert into public.reminders (user_id, note_id, reminder_at)
    values (new.user_id, new.id, new.reminder_at)
    on conflict (note_id) do update
      set reminder_at = excluded.reminder_at,
          snoozed_until = case when reminder_changed then null else reminders.snoozed_until end,
          completed = case when reminder_changed then false else reminders.completed end,
          completed_at = case when reminder_changed then null else reminders.completed_at end,
          updated_at = now();
  end if;

  if new.has_alert then
    resolved_schedule := coalesce(new.reminder_at, new.due_at, now());
    resolved_alert_status := case when resolved_schedule <= now() then 'active' else 'scheduled' end;

    insert into public.alerts (user_id, note_id, type, channel, scheduled_at, status)
    values (
      new.user_id,
      new.id,
      case
        when new.due_at is not null then 'deadline'
        when new.reminder_at is not null then 'reminder'
        else 'note'
      end,
      'in-app',
      resolved_schedule,
      resolved_alert_status
    )
    on conflict (note_id) do update
      set type = excluded.type,
          channel = excluded.channel,
          scheduled_at = excluded.scheduled_at,
          status = excluded.status,
          updated_at = now();
  else
    delete from public.alerts where note_id = new.id;
  end if;

  if new.has_email_action then
    select email into resolved_email
    from public.profiles
    where id = new.user_id;

    insert into public.email_actions (user_id, note_id, recipient, subject, body_preview, scheduled_at)
    values (
      new.user_id,
      new.id,
      coalesce(resolved_email, ''),
      case when length(trim(new.title)) > 0 then new.title else 'NoteFlow note' end,
      left(new.content, 280),
      new.reminder_at
    )
    on conflict (note_id) do update
      set recipient = excluded.recipient,
          subject = excluded.subject,
          body_preview = excluded.body_preview,
          scheduled_at = excluded.scheduled_at,
          updated_at = now();
  else
    delete from public.email_actions where note_id = new.id;
  end if;

  return new;
end;
$$;

insert into public.profiles (id, name, email)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'name'), ''), split_part(u.email, '@', 1)),
  u.email
from auth.users u
on conflict (id) do update
  set name = excluded.name,
      email = excluded.email,
      updated_at = now();

insert into public.user_settings (user_id)
select p.id
from public.profiles p
on conflict (user_id) do nothing;

insert into public.categories (user_id, name, position)
select p.id, defaults.name, defaults.position
from public.profiles p
cross join (
  values
    ('פרויקטים', 1),
    ('פגישות', 2),
    ('מחקר', 3),
    ('אישי', 4),
    ('תפעול', 5)
) as defaults(name, position)
on conflict do nothing;

insert into public.tags (user_id, name, color)
select p.id, defaults.name, defaults.color
from public.profiles p
cross join (
  values
    ('עבודה', 'hsl(215, 60%, 50%)'),
    ('אישי', 'hsl(280, 60%, 55%)'),
    ('דחוף', 'hsl(0, 72%, 51%)'),
    ('רעיונות', 'hsl(45, 93%, 47%)'),
    ('מעקב', 'hsl(172, 66%, 40%)'),
    ('פגישה', 'hsl(200, 60%, 50%)')
) as defaults(name, color)
on conflict do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_user_settings_updated_at on public.user_settings;
create trigger handle_user_settings_updated_at
  before update on public.user_settings
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_categories_updated_at on public.categories;
create trigger handle_categories_updated_at
  before update on public.categories
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_tags_updated_at on public.tags;
create trigger handle_tags_updated_at
  before update on public.tags
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_notes_updated_at on public.notes;
create trigger handle_notes_updated_at
  before update on public.notes
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_reminders_updated_at on public.reminders;
create trigger handle_reminders_updated_at
  before update on public.reminders
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_alerts_updated_at on public.alerts;
create trigger handle_alerts_updated_at
  before update on public.alerts
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_email_actions_updated_at on public.email_actions;
create trigger handle_email_actions_updated_at
  before update on public.email_actions
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists sync_note_dependents_after_change on public.notes;
create trigger sync_note_dependents_after_change
  after insert or update on public.notes
  for each row execute procedure public.sync_note_dependents();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.notes enable row level security;
alter table public.reminders enable row level security;
alter table public.alerts enable row level security;
alter table public.email_actions enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can manage their own settings" on public.user_settings;
create policy "Users can manage their own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own categories" on public.categories;
create policy "Users can manage their own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own tags" on public.tags;
create policy "Users can manage their own tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own notes" on public.notes;
create policy "Users can manage their own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own reminders" on public.reminders;
create policy "Users can manage their own reminders"
  on public.reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own alerts" on public.alerts;
create policy "Users can manage their own alerts"
  on public.alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own email actions" on public.email_actions;
create policy "Users can manage their own email actions"
  on public.email_actions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
