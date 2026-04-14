create or replace function public.is_board_member(target_board_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.board_members
    where board_id = target_board_id
      and user_id = target_user_id
  );
$$;

create or replace function public.is_board_owner(target_board_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.board_members
    where board_id = target_board_id
      and user_id = target_user_id
      and role = 'owner'
  );
$$;

drop policy if exists "Users can read their own boards" on public.boards;
create policy "Users can read their own boards"
  on public.boards for select
  using (public.is_board_member(id, auth.uid()));

drop policy if exists "Users can read board members" on public.board_members;
create policy "Users can read board members"
  on public.board_members for select
  using (public.is_board_member(board_id, auth.uid()));

drop policy if exists "Owners can manage board members" on public.board_members;
create policy "Owners can manage board members"
  on public.board_members for all
  using (public.is_board_owner(board_id, auth.uid()))
  with check (public.is_board_owner(board_id, auth.uid()));

drop policy if exists "Users can read board invitations" on public.board_invitations;
create policy "Users can read board invitations"
  on public.board_invitations for select
  using (public.is_board_member(board_id, auth.uid()));

drop policy if exists "Owners can manage board invitations" on public.board_invitations;
create policy "Owners can manage board invitations"
  on public.board_invitations for all
  using (public.is_board_owner(board_id, auth.uid()))
  with check (public.is_board_owner(board_id, auth.uid()));

drop policy if exists "Users can manage board categories" on public.categories;
create policy "Users can manage board categories"
  on public.categories for all
  using (public.is_board_member(board_id, auth.uid()))
  with check (public.is_board_member(board_id, auth.uid()));

drop policy if exists "Users can manage board tags" on public.tags;
create policy "Users can manage board tags"
  on public.tags for all
  using (public.is_board_member(board_id, auth.uid()))
  with check (public.is_board_member(board_id, auth.uid()));

drop policy if exists "Users can manage board notes" on public.notes;
create policy "Users can manage board notes"
  on public.notes for all
  using (public.is_board_member(board_id, auth.uid()))
  with check (public.is_board_member(board_id, auth.uid()));

drop policy if exists "Users can manage board reminders" on public.reminders;
create policy "Users can manage board reminders"
  on public.reminders for all
  using (public.is_board_member(board_id, auth.uid()))
  with check (public.is_board_member(board_id, auth.uid()));

drop policy if exists "Users can manage board alerts" on public.alerts;
create policy "Users can manage board alerts"
  on public.alerts for all
  using (public.is_board_member(board_id, auth.uid()))
  with check (public.is_board_member(board_id, auth.uid()));

drop policy if exists "Users can manage board email actions" on public.email_actions;
create policy "Users can manage board email actions"
  on public.email_actions for all
  using (public.is_board_member(board_id, auth.uid()))
  with check (public.is_board_member(board_id, auth.uid()));
