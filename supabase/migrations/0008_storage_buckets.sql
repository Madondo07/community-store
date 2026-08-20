-- Storage buckets for listing images (public) and vendor verification docs
-- (private). Path convention encodes the owner as the first path segment so
-- storage.foldername(name)[1] can be checked against auth.uid() in RLS.

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

-- storage.objects RLS is already enabled by default on every Supabase
-- project, and its owner is an internal Supabase role — the SQL Editor's
-- connection can't ALTER it directly (permission denied), so there's
-- nothing to do here; just declaring the policies below is sufficient.

-- ── listing-images: public read, owner-scoped write ──
-- Path convention: {user_id}/{listing_id}/{filename}

create policy "listing_images_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "listing_images_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing_images_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-images' and public.is_admin());

-- ── verification-docs: private, owner + admin read only ──
-- Path convention: {user_id}/{filename}

create policy "verification_docs_owner_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "verification_docs_admin_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'verification-docs' and public.is_admin());

create policy "verification_docs_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "verification_docs_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
