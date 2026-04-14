alter table public.categories add column if not exists is_shareable boolean not null default false;
alter table public.tags add column if not exists is_shareable boolean not null default false;

update public.notes
set category = null,
    tags = '{}'::text[],
    updated_at = now()
where category is not null
   or coalesce(array_length(tags, 1), 0) > 0;

delete from public.categories;
delete from public.tags;

create or replace function public.is_note_shared(
  target_board_id uuid,
  target_category text default null,
  target_tags text[] default array[]::text[]
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1
      from public.categories category_row
      where category_row.board_id = target_board_id
        and category_row.is_shareable = true
        and nullif(trim(target_category), '') is not null
        and lower(category_row.name) = lower(trim(target_category))
    )
    or exists (
      select 1
      from public.tags tag_row
      join unnest(coalesce(target_tags, array[]::text[])) as selected_tag(name)
        on lower(selected_tag.name) = lower(tag_row.name)
      where tag_row.board_id = target_board_id
        and tag_row.is_shareable = true
    );
$$;

create or replace function public.can_access_note(
  target_board_id uuid,
  target_note_owner uuid,
  target_category text default null,
  target_tags text[] default array[]::text[],
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_board_member(target_board_id, target_user_id)
    and (
      target_note_owner = target_user_id
      or public.is_note_shared(target_board_id, target_category, target_tags)
    );
$$;

create or replace function public.can_access_note_by_id(
  target_note_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select public.can_access_note(note_row.board_id, note_row.user_id, note_row.category, note_row.tags, target_user_id)
      from public.notes note_row
      where note_row.id = target_note_id
      limit 1
    ),
    false
  );
$$;

create or replace function public.delete_category_definition(target_category_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  category_row public.categories%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select *
  into category_row
  from public.categories
  where id = target_category_id;

  if not found then
    raise exception 'category not found';
  end if;

  if category_row.user_id <> current_user_id and not public.is_board_owner(category_row.board_id, current_user_id) then
    raise exception 'only the category owner or board owner can delete this category';
  end if;

  update public.notes
  set category = null,
      updated_at = now()
  where board_id = category_row.board_id
    and lower(coalesce(category, '')) = lower(category_row.name);

  delete from public.categories
  where id = target_category_id;

  return jsonb_build_object('status', 'deleted', 'category_id', target_category_id);
end;
$$;

create or replace function public.delete_tag_definition(target_tag_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  tag_row public.tags%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select *
  into tag_row
  from public.tags
  where id = target_tag_id;

  if not found then
    raise exception 'tag not found';
  end if;

  if tag_row.user_id <> current_user_id and not public.is_board_owner(tag_row.board_id, current_user_id) then
    raise exception 'only the tag owner or board owner can delete this tag';
  end if;

  update public.notes
  set tags = array_remove(tags, tag_row.name),
      updated_at = now()
  where board_id = tag_row.board_id
    and tag_row.name = any(tags);

  delete from public.tags
  where id = target_tag_id;

  return jsonb_build_object('status', 'deleted', 'tag_id', target_tag_id);
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
    from public.boards board_row
    where board_row.owner_user_id = new.id and board_row.is_personal = true
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

  select invitation.board_id into invited_board_id
  from public.board_invitations invitation
  where lower(invitation.email) = lower(new.email)
    and invitation.status = 'pending'
  order by invitation.created_at desc
  limit 1;

  insert into public.board_members (board_id, user_id, role)
  select invitation.board_id, new.id, 'member'
  from public.board_invitations invitation
  where lower(invitation.email) = lower(new.email)
    and invitation.status = 'pending'
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

  return new;
end;
$$;

drop policy if exists "Users can manage board categories" on public.categories;
drop policy if exists "Users can manage board tags" on public.tags;
drop policy if exists "Users can manage board notes" on public.notes;
drop policy if exists "Users can manage board reminders" on public.reminders;
drop policy if exists "Users can manage board alerts" on public.alerts;
drop policy if exists "Users can manage board email actions" on public.email_actions;

drop policy if exists "Users can read visible board categories" on public.categories;
create policy "Users can read visible board categories"
  on public.categories for select
  using (
    public.is_board_member(board_id, auth.uid())
    and (
      public.is_board_owner(board_id, auth.uid())
      or user_id = auth.uid()
      or is_shareable = true
    )
  );

drop policy if exists "Users can create board categories" on public.categories;
create policy "Users can create board categories"
  on public.categories for insert
  with check (
    public.is_board_member(board_id, auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "Users can update editable board categories" on public.categories;
create policy "Users can update editable board categories"
  on public.categories for update
  using (
    public.is_board_member(board_id, auth.uid())
    and (
      user_id = auth.uid()
      or public.is_board_owner(board_id, auth.uid())
    )
  )
  with check (
    public.is_board_member(board_id, auth.uid())
    and (
      user_id = auth.uid()
      or public.is_board_owner(board_id, auth.uid())
    )
  );

drop policy if exists "Users can delete editable board categories" on public.categories;
create policy "Users can delete editable board categories"
  on public.categories for delete
  using (
    public.is_board_member(board_id, auth.uid())
    and (
      user_id = auth.uid()
      or public.is_board_owner(board_id, auth.uid())
    )
  );

drop policy if exists "Users can read visible board tags" on public.tags;
create policy "Users can read visible board tags"
  on public.tags for select
  using (
    public.is_board_member(board_id, auth.uid())
    and (
      public.is_board_owner(board_id, auth.uid())
      or user_id = auth.uid()
      or is_shareable = true
    )
  );

drop policy if exists "Users can create board tags" on public.tags;
create policy "Users can create board tags"
  on public.tags for insert
  with check (
    public.is_board_member(board_id, auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "Users can update editable board tags" on public.tags;
create policy "Users can update editable board tags"
  on public.tags for update
  using (
    public.is_board_member(board_id, auth.uid())
    and (
      user_id = auth.uid()
      or public.is_board_owner(board_id, auth.uid())
    )
  )
  with check (
    public.is_board_member(board_id, auth.uid())
    and (
      user_id = auth.uid()
      or public.is_board_owner(board_id, auth.uid())
    )
  );

drop policy if exists "Users can delete editable board tags" on public.tags;
create policy "Users can delete editable board tags"
  on public.tags for delete
  using (
    public.is_board_member(board_id, auth.uid())
    and (
      user_id = auth.uid()
      or public.is_board_owner(board_id, auth.uid())
    )
  );

drop policy if exists "Users can read accessible notes" on public.notes;
create policy "Users can read accessible notes"
  on public.notes for select
  using (public.can_access_note(board_id, user_id, category, tags, auth.uid()));

drop policy if exists "Users can create their own board notes" on public.notes;
create policy "Users can create their own board notes"
  on public.notes for insert
  with check (
    public.is_board_member(board_id, auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "Users can update accessible notes" on public.notes;
create policy "Users can update accessible notes"
  on public.notes for update
  using (public.can_access_note(board_id, user_id, category, tags, auth.uid()))
  with check (
    public.is_board_member(board_id, auth.uid())
    and (
      user_id = auth.uid()
      or public.is_note_shared(board_id, category, tags)
    )
  );

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
  on public.notes for delete
  using (user_id = auth.uid());

drop policy if exists "Users can read accessible reminders" on public.reminders;
create policy "Users can read accessible reminders"
  on public.reminders for select
  using (public.can_access_note_by_id(note_id, auth.uid()));

drop policy if exists "Users can update accessible reminders" on public.reminders;
create policy "Users can update accessible reminders"
  on public.reminders for update
  using (public.can_access_note_by_id(note_id, auth.uid()))
  with check (public.can_access_note_by_id(note_id, auth.uid()));

drop policy if exists "Users can read accessible alerts" on public.alerts;
create policy "Users can read accessible alerts"
  on public.alerts for select
  using (public.can_access_note_by_id(note_id, auth.uid()));

drop policy if exists "Users can update accessible alerts" on public.alerts;
create policy "Users can update accessible alerts"
  on public.alerts for update
  using (public.can_access_note_by_id(note_id, auth.uid()))
  with check (public.can_access_note_by_id(note_id, auth.uid()));

drop policy if exists "Users can read accessible email actions" on public.email_actions;
create policy "Users can read accessible email actions"
  on public.email_actions for select
  using (public.can_access_note_by_id(note_id, auth.uid()));

drop policy if exists "Users can update accessible email actions" on public.email_actions;
create policy "Users can update accessible email actions"
  on public.email_actions for update
  using (public.can_access_note_by_id(note_id, auth.uid()))
  with check (public.can_access_note_by_id(note_id, auth.uid()));
