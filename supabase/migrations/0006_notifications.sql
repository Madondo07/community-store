-- Backing table for the existing `Notification` TS type / notifications.tsx
-- screen (not in the original punch list, but nothing else backs that screen).
--
-- NOTE: notifications_insert_any_authenticated is a deliberate trust gap for
-- this foundation phase — any signed-in user can insert a notification row
-- for ANY user_id (e.g. so a review triggers a notification for the seller
-- from the reviewer's client). A future pass should move notification
-- creation server-side (DB trigger / Edge Function) so clients can no longer
-- forge notifications for arbitrary users.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('order','message','review','system')),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  target_screen text,
  target_id text,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_insert_any_authenticated"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_admin_full_access"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());
