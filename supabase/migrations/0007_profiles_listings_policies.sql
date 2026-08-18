-- PRE-FLIGHT CHECK — run this first and read the result before continuing:
--
--   select * from pg_policies where tablename in ('profiles','listings');
--
-- If any row shows permissive = 'RESTRICTIVE', STOP. The additive/OR'd
-- policy reasoning below only holds when every existing policy on these two
-- tables is PERMISSIVE (the Postgres default). A RESTRICTIVE policy needs
-- this admin bypass folded into it directly rather than added alongside it.

-- Fixes a real bug: profiles RLS currently only lets a user SELECT their own
-- row, but working code (chat-thread.tsx, messages.tsx) already queries
-- OTHER users' profiles (for avatar/name/badge display) and needs this to
-- actually return rows. This is intentionally full-row, not column-
-- restricted — see supabase/README.md "Call-out C" for why, and the
-- `public_profiles` view as a future tightening path if column-level
-- privacy is ever required.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Admin full access for vendor approval, moderation, and analytics queries.
-- Additive: cannot remove access granted by any existing PERMISSIVE policy.
create policy "profiles_admin_full_access"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "listings_admin_full_access"
  on public.listings for all
  using (public.is_admin())
  with check (public.is_admin());
