do $$
begin
  create type public.board_role_enum as enum ('owner', 'member');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.board_invitation_status_enum as enum ('pending', 'accepted', 'revoked');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  is_personal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists boards_personal_owner_unique
  on public.boards (owner_user_id)
  where is_personal = true;

create table if not exists public.board_members (
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.board_role_enum not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create table if not exists public.board_invitations (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  email text not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status public.board_invitation_status_enum not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists board_invitations_board_email_unique
  on public.board_invitations (board_id, lower(email));

alter table public.user_settings add column if not exists active_board_id uuid references public.boards(id) on delete set null;
alter table public.categories add column if not exists board_id uuid references public.boards(id) on delete cascade;
alter table public.tags add column if not exists board_id uuid references public.boards(id) on delete cascade;
alter table public.notes add column if not exists board_id uuid references public.boards(id) on delete cascade;
alter table public.reminders add column if not exists board_id uuid references public.boards(id) on delete cascade;
alter table public.alerts add column if not exists board_id uuid references public.boards(id) on delete cascade;
alter table public.email_actions add column if not exists board_id uuid references public.boards(id) on delete cascade;

insert into public.boards (owner_user_id, name, is_personal)
select
  p.id,
  coalesce(nullif(trim(p.name), ''), split_part(p.email, '@', 1)) || ' personal board',
  true
from public.profiles p
where not exists (
  select 1
  from public.boards b
  where b.owner_user_id = p.id and b.is_personal = true
);

insert into public.board_members (board_id, user_id, role)
select b.id, b.owner_user_id, 'owner'
from public.boards b
where not exists (
  select 1
  from public.board_members bm
  where bm.board_id = b.id and bm.user_id = b.owner_user_id
);

update public.user_settings us
set active_board_id = b.id,
    updated_at = now()
from public.boards b
where b.owner_user_id = us.user_id
  and b.is_personal = true
  and us.active_board_id is null;

update public.categories c
set board_id = b.id
from public.boards b
where b.owner_user_id = c.user_id
  and b.is_personal = true
  and c.board_id is null;

update public.tags t
set board_id = b.id
from public.boards b
where b.owner_user_id = t.user_id
  and b.is_personal = true
  and t.board_id is null;

update public.notes n
set board_id = b.id
from public.boards b
where b.owner_user_id = n.user_id
  and b.is_personal = true
  and n.board_id is null;

update public.reminders r
set board_id = b.id
from public.boards b
where b.owner_user_id = r.user_id
  and b.is_personal = true
  and r.board_id is null;

update public.alerts a
set board_id = b.id
from public.boards b
where b.owner_user_id = a.user_id
  and b.is_personal = true
  and a.board_id is null;

update public.email_actions ea
set board_id = b.id
from public.boards b
where b.owner_user_id = ea.user_id
  and b.is_personal = true
  and ea.board_id is null;

alter table public.categories alter column board_id set not null;
alter table public.tags alter column board_id set not null;
alter table public.notes alter column board_id set not null;
alter table public.reminders alter column board_id set not null;
alter table public.alerts alter column board_id set not null;
alter table public.email_actions alter column board_id set not null;

drop index if exists public.categories_user_name_unique;
drop index if exists public.tags_user_name_unique;

create unique index if not exists categories_board_name_unique
  on public.categories (board_id, lower(name));

create unique index if not exists tags_board_name_unique
  on public.tags (board_id, lower(name));

create index if not exists board_members_user_idx on public.board_members (user_id, board_id);
create index if not exists notes_board_updated_idx on public.notes (board_id, updated_at desc);
create index if not exists reminders_board_due_idx on public.reminders (board_id, reminder_at);
create index if not exists alerts_board_status_idx on public.alerts (board_id, status, scheduled_at);
create index if not exists email_actions_board_status_idx on public.email_actions (board_id, status, updated_at desc);

create or replace function public.ensure_active_board_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.active_board_id is not null and not exists (
    select 1
    from public.board_members bm
    where bm.board_id = new.active_board_id
      and bm.user_id = new.user_id
  ) then
    raise exception 'active board must belong to the user';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
  personal_board_id uuid;
  invited_board_id uuid;
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

  insert into public.boards (owner_user_id, name, is_personal)
  select new.id, derived_name || ' personal board', true
  where not exists (
    select 1
    from public.boards b
    where b.owner_user_id = new.id and b.is_personal = true
  )
  returning id into personal_board_id;

  if personal_board_id is null then
    select id into personal_board_id
    from public.boards
    where owner_user_id = new.id and is_personal = true
    limit 1;
  end if;

  insert into public.board_members (board_id, user_id, role)
  values (personal_board_id, new.id, 'owner')
  on conflict do nothing;

  select bi.board_id into invited_board_id
  from public.board_invitations bi
  where lower(bi.email) = lower(new.email)
    and bi.status = 'pending'
  order by bi.created_at desc
  limit 1;

  insert into public.board_members (board_id, user_id, role)
  select bi.board_id, new.id, 'member'
  from public.board_invitations bi
  where lower(bi.email) = lower(new.email)
    and bi.status = 'pending'
  on conflict do nothing;

  update public.board_invitations
  set status = 'accepted',
      updated_at = now()
  where lower(email) = lower(new.email)
    and status = 'pending';

  insert into public.user_settings (user_id, active_board_id)
  values (new.id, coalesce(invited_board_id, personal_board_id))
  on conflict (user_id) do update
    set active_board_id = excluded.active_board_id,
        updated_at = now();

  insert into public.categories (user_id, board_id, name, position)
  values
    (new.id, personal_board_id, 'פרויקטים', 1),
    (new.id, personal_board_id, 'פגישות', 2),
    (new.id, personal_board_id, 'מחקר', 3),
    (new.id, personal_board_id, 'אישי', 4),
    (new.id, personal_board_id, 'תפעול', 5)
  on conflict do nothing;

  insert into public.tags (user_id, board_id, name, color)
  values
    (new.id, personal_board_id, 'עבודה', 'hsl(215, 60%, 50%)'),
    (new.id, personal_board_id, 'אישי', 'hsl(280, 60%, 55%)'),
    (new.id, personal_board_id, 'דחוף', 'hsl(0, 72%, 51%)'),
    (new.id, personal_board_id, 'רעיונות', 'hsl(45, 93%, 47%)'),
    (new.id, personal_board_id, 'מעקב', 'hsl(172, 66%, 40%)'),
    (new.id, personal_board_id, 'פגישה', 'hsl(200, 60%, 50%)')
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
    insert into public.reminders (user_id, board_id, note_id, reminder_at)
    values (new.user_id, new.board_id, new.id, new.reminder_at)
    on conflict (note_id) do update
      set user_id = excluded.user_id,
          board_id = excluded.board_id,
          reminder_at = excluded.reminder_at,
          snoozed_until = case when reminder_changed then null else reminders.snoozed_until end,
          completed = case when reminder_changed then false else reminders.completed end,
          completed_at = case when reminder_changed then null else reminders.completed_at end,
          updated_at = now();
  end if;

  if new.has_alert then
    resolved_schedule := coalesce(new.reminder_at, new.due_at, now());
    resolved_alert_status := case when resolved_schedule <= now() then 'active' else 'scheduled' end;

    insert into public.alerts (user_id, board_id, note_id, type, channel, scheduled_at, status)
    values (
      new.user_id,
      new.board_id,
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
      set user_id = excluded.user_id,
          board_id = excluded.board_id,
          type = excluded.type,
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

    insert into public.email_actions (user_id, board_id, note_id, recipient, subject, body_preview, scheduled_at)
    values (
      new.user_id,
      new.board_id,
      new.id,
      coalesce(resolved_email, ''),
      case when length(trim(new.title)) > 0 then new.title else 'NoteFlow note' end,
      left(new.content, 280),
      new.reminder_at
    )
    on conflict (note_id) do update
      set user_id = excluded.user_id,
          board_id = excluded.board_id,
          recipient = excluded.recipient,
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

create or replace function public.connect_user_to_board(target_email text, target_board_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  effective_board_id uuid;
  existing_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select coalesce(target_board_id, us.active_board_id)
  into effective_board_id
  from public.user_settings us
  where us.user_id = current_user_id;

  if effective_board_id is null then
    raise exception 'no active board found';
  end if;

  if not exists (
    select 1
    from public.board_members bm
    where bm.board_id = effective_board_id
      and bm.user_id = current_user_id
      and bm.role = 'owner'
  ) then
    raise exception 'only board owners can connect users';
  end if;

  select p.id
  into existing_user_id
  from public.profiles p
  where lower(p.email) = lower(target_email)
  limit 1;

  if existing_user_id is not null then
    insert into public.board_members (board_id, user_id, role)
    values (effective_board_id, existing_user_id, 'member')
    on conflict do nothing;

    update public.user_settings
    set active_board_id = effective_board_id,
        updated_at = now()
    where user_id = existing_user_id;

    delete from public.board_invitations
    where board_id = effective_board_id
      and lower(email) = lower(target_email);

    return jsonb_build_object('status', 'connected', 'email', lower(target_email));
  end if;

  insert into public.board_invitations (board_id, email, invited_by, status)
  values (effective_board_id, lower(target_email), current_user_id, 'pending')
  on conflict do nothing;

  return jsonb_build_object('status', 'invited', 'email', lower(target_email));
end;
$$;

create or replace function public.remove_user_from_board(target_user_id uuid, target_board_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  effective_board_id uuid;
  personal_board_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select coalesce(target_board_id, us.active_board_id)
  into effective_board_id
  from public.user_settings us
  where us.user_id = current_user_id;

  if not exists (
    select 1
    from public.board_members bm
    where bm.board_id = effective_board_id
      and bm.user_id = current_user_id
      and bm.role = 'owner'
  ) then
    raise exception 'only board owners can remove users';
  end if;

  if exists (
    select 1
    from public.board_members bm
    where bm.board_id = effective_board_id
      and bm.user_id = target_user_id
      and bm.role = 'owner'
  ) then
    raise exception 'cannot remove the board owner';
  end if;

  delete from public.board_members
  where board_id = effective_board_id
    and user_id = target_user_id;

  select id into personal_board_id
  from public.boards
  where owner_user_id = target_user_id
    and is_personal = true
  limit 1;

  update public.user_settings
  set active_board_id = personal_board_id,
      updated_at = now()
  where user_id = target_user_id
    and active_board_id = effective_board_id;

  return jsonb_build_object('status', 'removed', 'user_id', target_user_id);
end;
$$;

create or replace function public.revoke_board_invitation(invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  invitation_board_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select board_id into invitation_board_id
  from public.board_invitations
  where id = invitation_id;

  if invitation_board_id is null then
    raise exception 'invitation not found';
  end if;

  if not exists (
    select 1
    from public.board_members bm
    where bm.board_id = invitation_board_id
      and bm.user_id = current_user_id
      and bm.role = 'owner'
  ) then
    raise exception 'only board owners can revoke invitations';
  end if;

  delete from public.board_invitations
  where id = invitation_id;

  return jsonb_build_object('status', 'revoked', 'invitation_id', invitation_id);
end;
$$;

insert into public.user_settings (user_id, active_board_id)
select p.id, b.id
from public.profiles p
join public.boards b on b.owner_user_id = p.id and b.is_personal = true
where not exists (
  select 1
  from public.user_settings us
  where us.user_id = p.id
);

drop trigger if exists handle_boards_updated_at on public.boards;
create trigger handle_boards_updated_at
  before update on public.boards
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_board_members_updated_at on public.board_members;
create trigger handle_board_members_updated_at
  before update on public.board_members
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_board_invitations_updated_at on public.board_invitations;
create trigger handle_board_invitations_updated_at
  before update on public.board_invitations
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists ensure_user_settings_active_board_membership on public.user_settings;
create trigger ensure_user_settings_active_board_membership
  before insert or update on public.user_settings
  for each row execute procedure public.ensure_active_board_membership();

alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.board_invitations enable row level security;

drop policy if exists "Users can read their own boards" on public.boards;
create policy "Users can read their own boards"
  on public.boards for select
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = boards.id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read board members" on public.board_members;
create policy "Users can read board members"
  on public.board_members for select
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = board_members.board_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Owners can manage board members" on public.board_members;
create policy "Owners can manage board members"
  on public.board_members for all
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = board_members.board_id
        and bm.user_id = auth.uid()
        and bm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = board_members.board_id
        and bm.user_id = auth.uid()
        and bm.role = 'owner'
    )
  );

drop policy if exists "Users can read board invitations" on public.board_invitations;
create policy "Users can read board invitations"
  on public.board_invitations for select
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = board_invitations.board_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Owners can manage board invitations" on public.board_invitations;
create policy "Owners can manage board invitations"
  on public.board_invitations for all
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = board_invitations.board_id
        and bm.user_id = auth.uid()
        and bm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = board_invitations.board_id
        and bm.user_id = auth.uid()
        and bm.role = 'owner'
    )
  );

drop policy if exists "Users can manage their own categories" on public.categories;
create policy "Users can manage board categories"
  on public.categories for all
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = categories.board_id
        and bm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = categories.board_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage their own tags" on public.tags;
create policy "Users can manage board tags"
  on public.tags for all
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = tags.board_id
        and bm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = tags.board_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage their own notes" on public.notes;
create policy "Users can manage board notes"
  on public.notes for all
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = notes.board_id
        and bm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = notes.board_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage their own reminders" on public.reminders;
create policy "Users can manage board reminders"
  on public.reminders for all
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = reminders.board_id
        and bm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = reminders.board_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage their own alerts" on public.alerts;
create policy "Users can manage board alerts"
  on public.alerts for all
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = alerts.board_id
        and bm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = alerts.board_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage their own email actions" on public.email_actions;
create policy "Users can manage board email actions"
  on public.email_actions for all
  using (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = email_actions.board_id
        and bm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.board_members bm
      where bm.board_id = email_actions.board_id
        and bm.user_id = auth.uid()
    )
  );
