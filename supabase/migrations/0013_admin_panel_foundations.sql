-- Foundational DB changes for the admin panel spec'd in the "Admin Panel —
-- Planning Summary" doc. Admin visibility stays broad for this phase (full
-- read/write on profiles/listings via is_admin()) rather than being
-- narrowed to report-triggered-only — that's an explicit, deliberate
-- deferral, not an oversight; see supabase/README.md for the reasoning.
-- This migration covers everything that phase doesn't depend on:
--
--   1. Bulletin posting locked to admin-only at the DB level (was
--      previously postable by any authenticated user — a real gap against
--      "every other role gets read-only access, enforced at the database
--      level, not just hidden in the UI").
--   2. Bulletin categories expanded from 3 to the spec'd 5
--      (newsflash/cts/events/services/lost_and_found).
--   3. profiles.verification_document_path — the vendor-verification
--      upload flow (src/app/(auth)/vendor-verification.tsx) already
--      uploads to the 'verification-docs' bucket and had nowhere to
--      persist the resulting path, so admin could never actually open
--      what a vendor submitted. This column is that missing piece.
--      (profiles.mobile_number already exists live — nothing to add there.)
--   4. profiles.is_suspended + enforcement on creating new listings.
--      A suspended user is blocked from posting new listings — existing
--      sessions simply get a clear RLS rejection on their next attempt.
--      Deliberately NOT wired into sign-in/reading — this is a
--      lightweight first pass, not full account-lockout. Messages aren't
--      covered here: the live `messages_insert_own`-equivalent policy's
--      real name/exact qual isn't confirmed (the listings INSERT policy
--      turned out to be named "Verified users can create listings" with
--      extra vendor-verification logic baked in, not the plain
--      "listings_insert_own" the migration files describe — messages
--      likely drifted the same way). Blindly recreating a same-named
--      policy that doesn't exist live would just add a second, more
--      permissive OR'd policy alongside whatever's actually there — see
--      supabase/README.md for the preflight query to run first.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Bulletin posting → admin-only
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "bulletin_posts_insert_own" on public.bulletin_posts;
drop policy if exists "bulletin_posts_update_own" on public.bulletin_posts;
drop policy if exists "bulletin_posts_delete_own" on public.bulletin_posts;
-- "bulletin_posts_admin_full_access" (0004) already covers insert/update/
-- delete for admins, and "bulletin_posts_select_public" (0004) already
-- covers read for everyone — nothing else to add.

-- ═══════════════════════════════════════════════════════════════════
-- 2. Bulletin categories: 3 → 5
-- ═══════════════════════════════════════════════════════════════════

alter table public.bulletin_posts drop constraint if exists bulletin_posts_category_check;
alter table public.bulletin_posts add constraint bulletin_posts_category_check
  check (category in ('newsflash', 'cts', 'events', 'services', 'lost_and_found'));

-- ═══════════════════════════════════════════════════════════════════
-- 3. Vendor verification document path
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists verification_document_path text;

-- ═══════════════════════════════════════════════════════════════════
-- 4. Suspension: flag + enforcement on new listings/messages
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists is_suspended boolean not null default false;

create or replace function public.is_suspended()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_suspended from public.profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_suspended() from public;
grant execute on function public.is_suspended() to authenticated;

-- This is the CONFIRMED live listings INSERT policy (from the
-- pg_policies check run earlier in this project) — not the
-- "listings_insert_own" name the migration files use. Reusing its exact
-- name/qual and only adding the suspension clause, so this replaces it
-- in place rather than adding a second, more permissive OR'd policy that
-- would let a suspended (or unverified-vendor) user slip through anyway.
drop policy if exists "Verified users can create listings" on public.listings;
create policy "Verified users can create listings"
  on public.listings for insert
  to authenticated
  with check (
    (auth.uid() = seller_id)
    and not public.is_suspended()
    and (exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role <> 'vendor'::user_role or profiles.vendor_status = 'verified'::vendor_status)
    ))
  );

-- Messages suspension guard intentionally NOT included here — see the
-- comment at the top of this file. Run this first to get the real name:
--   select policyname, cmd, with_check from pg_policies
--   where tablename = 'messages' and cmd = 'INSERT';
-- then hand me the result and I'll add a matching migration for it.

notify pgrst, 'reload schema';
