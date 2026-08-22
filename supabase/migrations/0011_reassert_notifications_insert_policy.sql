-- Fixes: "new row violates row-level security policy for table
-- notifications" when chat-thread.tsx creates a message notification for
-- the OTHER participant (createNotification inserts with user_id = the
-- recipient, not auth.uid()).
--
-- The intended policy for this (notifications_insert_any_authenticated —
-- any signed-in user may insert a notification row for any user_id, so a
-- message/review can notify the other party — see 0009/0006 for the
-- documented trust-gap trade-off) should already exist from 0009. If
-- you're hitting this error, either 0009 wasn't fully applied, or it ran
-- before this exact policy existed. Re-run just this piece — safe either
-- way, drop-then-create.

alter table public.notifications enable row level security;

drop policy if exists "notifications_insert_any_authenticated" on public.notifications;
create policy "notifications_insert_any_authenticated"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() is not null);

notify pgrst, 'reload schema';
