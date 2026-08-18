-- Reviews left by a buyer on a seller/listing after a purchase.
-- Matches the existing `Review` TS type in src/types/index.ts.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint reviews_no_self_review check (reviewer_id <> seller_id),
  constraint reviews_one_per_listing unique (reviewer_id, listing_id)
);

alter table public.reviews enable row level security;

create policy "reviews_select_public"
  on public.reviews for select
  using (true);

create policy "reviews_insert_own"
  on public.reviews for insert
  to authenticated
  with check (reviewer_id = auth.uid());

create policy "reviews_update_own"
  on public.reviews for update
  to authenticated
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

create policy "reviews_delete_own"
  on public.reviews for delete
  to authenticated
  using (reviewer_id = auth.uid());

create policy "reviews_admin_full_access"
  on public.reviews for all
  using (public.is_admin())
  with check (public.is_admin());
