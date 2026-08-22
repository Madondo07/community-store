-- Lets a seller's public profile show their sold listings too (builds buyer
-- trust — "this seller has a real transaction history"), not just active
-- ones. This needs a DB change, not just a client-side query change:
-- `listings`' own SELECT policy currently only allows
--   status = 'active' OR seller_id = auth.uid()
-- so a *sold* listing is invisible to anyone except its own seller,
-- regardless of what the client asks for. Broadening it to include 'sold'
-- is what actually exposes those rows; flagged/removed listings stay
-- hidden from everyone but the owner/admin, unchanged.
--
-- Safe to re-run: drops and recreates the one named policy.

drop policy if exists "Active listings are viewable by all authenticated users" on public.listings;
create policy "Active listings are viewable by all authenticated users"
  on public.listings for select
  using (status in ('active', 'sold') or auth.uid() = seller_id);

notify pgrst, 'reload schema';
