-- Real-time message notifications + per-user notification preferences.
--
-- 1. notification_preferences — one row per user, one boolean per
--    preference-controlled notification type (messages / orders / bulletin).
--    A missing row means "everything on", so existing users need no backfill.
-- 2. notify_on_new_message() — AFTER INSERT trigger on messages that creates
--    the recipient's notification row server-side. Replaces the client-side
--    createNotification() call chat-thread.tsx used to make after sending
--    (which silently failed whenever the sender's client died mid-send, and
--    could never respect the recipient's preferences).
-- 3. apply_notification_preferences() — BEFORE INSERT trigger on
--    notifications that drops the row when the recipient has switched that
--    type off. Doing it here (not in each caller) means every insert path —
--    the message trigger, the bulletin trigger, client-side order/review
--    notifications — honours preferences, and a client can't skip the check.
--    'review' and 'system' (warnings, suspension notices, vendor decisions)
--    are never suppressible.
-- 4. notifications joins the supabase_realtime publication so the app can
--    subscribe to new rows for the signed-in user (same mechanism messages
--    already uses). Existing RLS (notifications_select_own) still scopes what
--    each client receives.

-- ─── 1. Preferences table ───────────────────────────────────────────────────

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  messages boolean not null default true,
  orders boolean not null default true,
  bulletin boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── 2. Preference gate on notifications ────────────────────────────────────

create or replace function public.apply_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
begin
  v_enabled := case new.type
    when 'message'  then (select messages from public.notification_preferences where user_id = new.user_id)
    when 'order'    then (select orders   from public.notification_preferences where user_id = new.user_id)
    when 'bulletin' then (select bulletin from public.notification_preferences where user_id = new.user_id)
    else true
  end;

  -- No preferences row yet => default on.
  if coalesce(v_enabled, true) = false then
    return null; -- silently skip this insert
  end if;
  return new;
end;
$$;

revoke all on function public.apply_notification_preferences() from public;

drop trigger if exists notifications_apply_preferences on public.notifications;
create trigger notifications_apply_preferences
  before insert on public.notifications
  for each row
  execute function public.apply_notification_preferences();

-- ─── 3. Notify the recipient when a message is sent ─────────────────────────

create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_sender_name text;
begin
  select case when participant_one = new.sender_id then participant_two else participant_one end
    into v_recipient
    from public.conversations
    where id = new.conversation_id;

  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  select full_name into v_sender_name from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, type, title, body, target_screen, target_id)
  values (
    v_recipient,
    'message',
    'New message from ' || coalesce(v_sender_name, 'a user'),
    left(new.content, 140),
    'chat-thread',
    new.conversation_id::text
  );

  return new;
end;
$$;

revoke all on function public.notify_on_new_message() from public;

drop trigger if exists messages_notify_recipient on public.messages;
create trigger messages_notify_recipient
  after insert on public.messages
  for each row
  execute function public.notify_on_new_message();

-- ─── 4. Realtime ────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

notify pgrst, 'reload schema';
