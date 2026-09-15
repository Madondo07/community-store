-- Notifies every student when a new bulletin post goes live. Only on
-- INSERT, not UPDATE — an admin fixing a typo in an existing post
-- shouldn't re-notify everyone who already saw it.
--
-- Done as a DB trigger (security definer), not a client-side loop over
-- every student's id from the composer:
--   1. `notifications_insert_any_authenticated` (0006) already lets any
--      authenticated user insert a notification row for ANY user_id —
--      that trust gap exists for one-off cases like a review notifying
--      its seller, not for fanning out one insert per student from a
--      single admin action. A trigger avoids exercising it for this at all.
--   2. It can't be forgotten from a future second place that also creates
--      bulletin posts, unlike a call the composer would have to remember.
--   3. One SQL statement server-side beats N client round-trips.

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('order', 'message', 'review', 'system', 'bulletin'));

create or replace function public.notify_students_on_bulletin_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, target_screen, target_id)
  select id, 'bulletin', new.title, new.body, 'bulletin-board', new.id::text
  from public.profiles
  where role = 'student';
  return new;
end;
$$;

revoke all on function public.notify_students_on_bulletin_post() from public;

drop trigger if exists bulletin_posts_notify_students on public.bulletin_posts;
create trigger bulletin_posts_notify_students
  after insert on public.bulletin_posts
  for each row
  execute function public.notify_students_on_bulletin_post();

notify pgrst, 'reload schema';
