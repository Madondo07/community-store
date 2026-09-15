-- Bulletin board follow-ups:
--
--   1. bulletin_posts.is_important — lets an admin flag a post as highly
--      important; the board renders these with a red border. No RLS change
--      needed — "bulletin_posts_admin_full_access" (0004) already covers
--      admin insert/update/delete, and select is public.
--   2. Bulletin categories: 5 → 6, adding 'management'.
--
-- `date` already exists on this table (0004) and was previously an
-- optional "original source date" the admin could log by hand. It's now
-- always set by the composer's calendar/time picker (defaulting to now)
-- and is what the app's "posted X ago" timer reads — not created_at —
-- so an edited/backdated post shows its real-world time. No schema change
-- needed for that part, just app-level behavior.

alter table public.bulletin_posts add column if not exists is_important boolean not null default false;

alter table public.bulletin_posts drop constraint if exists bulletin_posts_category_check;
alter table public.bulletin_posts add constraint bulletin_posts_category_check
  check (category in ('newsflash', 'cts', 'management', 'events', 'services', 'lost_and_found'));

notify pgrst, 'reload schema';
