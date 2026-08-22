-- Syncs the live database (which had drifted from migrations 0000-0008,
-- built/evolved by hand in the Dashboard) up to what the app code actually
-- needs, WITHOUT renaming or dropping anything that already exists live.
--
-- Live `profiles` already had its own naming for vendor approval
-- (`vendor_status` enum: pending/verified/rejected) instead of what
-- 0000/0007 assumed (`verification_status` text: pending/approved/rejected).
-- Decision: keep the live naming, the app repo was updated to match it
-- instead (src/types/index.ts, src/lib/api/profiles.ts, etc. now read/write
-- `vendor_status` / 'verified'). Same for `role`: live only has
-- student/vendor/admin (no faculty/resident) — the sign-up screen was
-- trimmed to match rather than adding those enum values.
--
-- Every statement below is written to be safe to run even if part of it
-- was already applied (if-not-exists / drop-then-create for policies), so
-- it's safe to paste as one block.
--
-- Run this in the Dashboard SQL Editor, then reload PostgREST's schema
-- cache (see bottom of this file) so /rest/v1 picks up the new
-- tables/columns immediately instead of after next deploy.

-- ═══════════════════════════════════════════════════════════════════
-- profiles: add the one genuinely-missing column
-- ═══════════════════════════════════════════════════════════════════
-- Purely additive — no existing column touched, no data at risk. This is
-- what was causing "column profiles_1.avatar_url does not exist" on any
-- listings/reviews/bulletin query that embeds the seller/author profile.

alter table public.profiles add column if not exists avatar_url text;

-- ═══════════════════════════════════════════════════════════════════
-- listings: price-drop tracking. `previous_price` is maintained by a
-- trigger, never set directly by the client (src/lib/api/listings.ts's
-- updateListing() doesn't accept it as an input field) — it only reflects
-- an actual price decrease, and clears itself if the price rises again, so
-- the app can show a "X% off" badge purely by checking
-- previous_price > price.
-- ═══════════════════════════════════════════════════════════════════

alter table public.listings add column if not exists previous_price numeric(10,2);

create or replace function public.track_listing_price_drop()
returns trigger
language plpgsql
as $$
begin
  if new.price < old.price then
    new.previous_price := old.price;
  elsif new.price > old.price then
    new.previous_price := null;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_track_price_drop on public.listings;
create trigger listings_track_price_drop
  before update on public.listings
  for each row
  when (new.price is distinct from old.price)
  execute function public.track_listing_price_drop();

-- ═══════════════════════════════════════════════════════════════════
-- is_admin() helper — used by every admin RLS policy below.
-- create or replace is always safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- profiles: two policies that are genuinely absent live, not just a
-- naming mismatch. Live `profiles` currently only has "view own row" /
-- "update own row" / "insert own row" — no policy lets anyone see another
-- user's profile, and no admin bypass exists on this table at all (only
-- `listings` has one, "Admins can update any listing"). Concretely, right
-- now:
--   - every seller/reviewer/chat-partner profile embed (listings.ts,
--     messages.tsx, reviews.ts, bulletin.ts) silently returns null/empty
--     for anyone other than the viewer themself — RLS strips those rows.
--   - getPendingVendors() (SELECT on other users) returns nothing for an
--     admin, and approveVendor()/rejectVendor() (UPDATE on another
--     user's row) silently update zero rows — the vendor-approval admin
--     flow does not work at all today.
-- Full-row visibility (not column-restricted) mirrors the same trade-off
-- `0007_profiles_listings_policies.sql` documents for the same reason:
-- existing working code already selects other users' full profile rows.
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "Authenticated users can view all profiles" on public.profiles;
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Admins can view and update any profile" on public.profiles;
create policy "Admins can view and update any profile"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- reviews — entirely missing live. Matches src/types/index.ts `Review`.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.reviews (
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

drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews for select
  using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert
  to authenticated
  with check (reviewer_id = auth.uid());

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  to authenticated
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete
  to authenticated
  using (reviewer_id = auth.uid());

drop policy if exists "reviews_admin_full_access" on public.reviews;
create policy "reviews_admin_full_access"
  on public.reviews for all
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- orders + order_items — entirely missing live (this is what made
-- checkout / GET /rest/v1/orders 404).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  delivery_method text not null check (delivery_method in ('campus_pickup','vendor_delivery')),
  payment_method text not null check (payment_method in ('payfast','snapchat')),
  status text not null default 'confirmed' check (status in ('confirmed','pending','processing','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  title text not null,
  price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  image text,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  to authenticated
  with check (buyer_id = auth.uid());

drop policy if exists "orders_admin_full_access" on public.orders;
create policy "orders_admin_full_access"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
  on public.order_items for select
  to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.buyer_id = auth.uid()
  ));

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
  on public.order_items for insert
  to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.buyer_id = auth.uid()
  ));

drop policy if exists "order_items_admin_full_access" on public.order_items;
create policy "order_items_admin_full_access"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- bulletin_posts — entirely missing live.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.bulletin_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('events','services','lost_and_found')),
  title text not null,
  body text not null,
  location text,
  date timestamptz,
  created_at timestamptz not null default now()
);

alter table public.bulletin_posts enable row level security;

drop policy if exists "bulletin_posts_select_public" on public.bulletin_posts;
create policy "bulletin_posts_select_public"
  on public.bulletin_posts for select
  using (true);

drop policy if exists "bulletin_posts_insert_own" on public.bulletin_posts;
create policy "bulletin_posts_insert_own"
  on public.bulletin_posts for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "bulletin_posts_update_own" on public.bulletin_posts;
create policy "bulletin_posts_update_own"
  on public.bulletin_posts for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "bulletin_posts_delete_own" on public.bulletin_posts;
create policy "bulletin_posts_delete_own"
  on public.bulletin_posts for delete
  to authenticated
  using (author_id = auth.uid());

drop policy if exists "bulletin_posts_admin_full_access" on public.bulletin_posts;
create policy "bulletin_posts_admin_full_access"
  on public.bulletin_posts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- reports — entirely missing live.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reported_listing_id uuid references public.listings(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','reviewed','approved','removed')),
  created_at timestamptz not null default now(),
  constraint reports_has_target check (
    reported_listing_id is not null or reported_user_id is not null
  )
);

create index if not exists reports_status_idx on public.reports(status);

alter table public.reports enable row level security;

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
  on public.reports for select
  to authenticated
  using (reported_by = auth.uid() or public.is_admin());

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (reported_by = auth.uid());

drop policy if exists "reports_admin_update" on public.reports;
create policy "reports_admin_update"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reports_admin_delete" on public.reports;
create policy "reports_admin_delete"
  on public.reports for delete
  to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- notifications — entirely missing live (this is what made
-- GET/HEAD /rest/v1/notifications 404).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.notifications (
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

create index if not exists notifications_user_id_idx on public.notifications(user_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

-- Deliberate trust gap for this phase: any signed-in user can insert a
-- notification row for ANY user_id (e.g. a review triggers a notification
-- for the seller from the reviewer's client). Move server-side later.
drop policy if exists "notifications_insert_any_authenticated" on public.notifications;
create policy "notifications_insert_any_authenticated"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_admin_full_access" on public.notifications;
create policy "notifications_admin_full_access"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- storage buckets — listing images (public) + verification docs (private).
-- insert ... on conflict do nothing is already idempotent; policies use
-- drop-then-create in case these were partially created by hand already.
-- ═══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

drop policy if exists "listing_images_public_read" on storage.objects;
create policy "listing_images_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

drop policy if exists "listing_images_owner_insert" on storage.objects;
create policy "listing_images_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing_images_owner_update" on storage.objects;
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

drop policy if exists "listing_images_owner_delete" on storage.objects;
create policy "listing_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing_images_admin_delete" on storage.objects;
create policy "listing_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-images' and public.is_admin());

drop policy if exists "verification_docs_owner_read" on storage.objects;
create policy "verification_docs_owner_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verification_docs_admin_read" on storage.objects;
create policy "verification_docs_admin_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'verification-docs' and public.is_admin());

drop policy if exists "verification_docs_owner_insert" on storage.objects;
create policy "verification_docs_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verification_docs_owner_delete" on storage.objects;
create policy "verification_docs_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════════
-- Tell PostgREST to reload its schema cache so /rest/v1 sees the new
-- tables/columns immediately instead of waiting ~a few minutes.
-- ═══════════════════════════════════════════════════════════════════

notify pgrst, 'reload schema';
