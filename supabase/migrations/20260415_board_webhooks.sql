alter table public.boards add column if not exists webhook_url text;
alter table public.boards add column if not exists n8n_connected boolean not null default false;

update public.boards b
set webhook_url = us.webhook_url,
    n8n_connected = coalesce(us.n8n_connected, false),
    updated_at = now()
from public.user_settings us
where us.user_id = b.owner_user_id
  and (
    (b.webhook_url is null and us.webhook_url is not null)
    or (b.n8n_connected = false and us.n8n_connected = true)
  );

drop policy if exists "Owners can update their boards" on public.boards;
create policy "Owners can update their boards"
  on public.boards for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
