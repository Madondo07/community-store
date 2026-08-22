-- GENERATED FILE — do not hand-edit. This is migrations/0000 through 0008
-- concatenated in order for a one-shot paste into the Supabase SQL Editor.
-- The individual files in supabase/migrations/ are the source of truth;
-- regenerate this after changing any of them. Safe to delete once applied.

-- ═══════════════════════════════════════════════════════════════════
-- 0000_baseline_schema.sql
-- ═══════════════════════════════════════════════════════════════════
-- Baseline schema: profiles, listings, conversations, messages.
--
-- Originally these were assumed pre-existing (built directly in an earlier
-- Supabase project's dashboard, never captured in git). This migration
-- exists because the project got recreated from scratch and none of this
-- existed — everything in 0001+ is additive on top of this baseline.

-- ─── profiles ────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('student','faculty','vendor','resident','admin')),
  avatar_url text,
  is_verified boolean not null default false,
  verification_status text check (verification_status in ('pending','approved','rejected')),
  business_name text,
  registration_number text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─── listings ────────────────────────────────────────────────────────────

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(10,2) not null,
  category text not null check (category in ('textbooks','electronics','furniture','clothing','services','other')),
  condition text not null check (condition in ('new','used')),
  status text not null default 'active' check (status in ('active','sold','flagged','removed')),
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_seller_id_idx on public.listings(seller_id);
create index listings_status_idx on public.listings(status);

alter table public.listings enable row level security;

create policy "listings_select_active_or_own"
  on public.listings for select
  using (status = 'active' or seller_id = auth.uid());

create policy "listings_insert_own"
  on public.listings for insert
  to authenticated
  with check (seller_id = auth.uid());

create policy "listings_update_own"
  on public.listings for update
  to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "listings_delete_own"
  on public.listings for delete
  to authenticated
  using (seller_id = auth.uid());

-- ─── conversations ───────────────────────────────────────────────────────

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references public.profiles(id) on delete cascade,
  participant_two uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  last_message_at timestamptz,
  last_message_content text,
  created_at timestamptz not null default now()
);

create index conversations_participant_one_idx on public.conversations(participant_one);
create index conversations_participant_two_idx on public.conversations(participant_two);

alter table public.conversations enable row level security;

create policy "conversations_select_participant"
  on public.conversations for select
  to authenticated
  using (participant_one = auth.uid() or participant_two = auth.uid());

create policy "conversations_insert_participant"
  on public.conversations for insert
  to authenticated
  with check (participant_one = auth.uid() or participant_two = auth.uid());

create policy "conversations_update_participant"
  on public.conversations for update
  to authenticated
  using (participant_one = auth.uid() or participant_two = auth.uid())
  with check (participant_one = auth.uid() or participant_two = auth.uid());

-- ─── messages ────────────────────────────────────────────────────────────

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_conversation_id_idx on public.messages(conversation_id);

alter table public.messages enable row level security;

create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
  ));

create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

create policy "messages_update_participant"
  on public.messages for update
  to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
  ))
  with check (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
  ));

-- Realtime: chat-thread.tsx subscribes to postgres_changes on messages.
alter publication supabase_realtime add table public.messages;

-- ─── handle_new_user trigger ─────────────────────────────────────────────
-- Creates a profiles row whenever someone signs up via Supabase Auth.
-- Students/faculty are auto-verified; vendors start pending admin approval.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');

  insert into public.profiles (id, email, full_name, role, is_verified, verification_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    v_role,
    v_role in ('student', 'faculty'),
    case when v_role = 'vendor' then 'pending' else null end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: profiles for any auth.users created before this trigger existed
-- (e.g. accounts signed up while testing, before migrations were applied).
insert into public.profiles (id, email, full_name, role, is_verified, verification_status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', 'User'),
  coalesce(u.raw_user_meta_data->>'role', 'student'),
  coalesce(u.raw_user_meta_data->>'role', 'student') in ('student', 'faculty'),
  case when coalesce(u.raw_user_meta_data->>'role', 'student') = 'vendor' then 'pending' else null end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- 0001_helper_functions.sql
-- ═══════════════════════════════════════════════════════════════════
-- Helper functions used by RLS policies across later migrations.

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
-- 0002_reviews.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0003_orders.sql
-- ═══════════════════════════════════════════════════════════════════
-- Orders + order line items. Matches the existing `Order`/`OrderItem` TS types
-- in src/types/index.ts. order_items columns are intentionally denormalized
-- snapshots (title/price/image) so order history survives listing edits/deletes.

create table public.orders (
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

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  title text not null,
  price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  image text,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid());

create policy "orders_insert_own"
  on public.orders for insert
  to authenticated
  with check (buyer_id = auth.uid());

create policy "orders_admin_full_access"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_items_select_own"
  on public.order_items for select
  to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.buyer_id = auth.uid()
  ));

create policy "order_items_insert_own"
  on public.order_items for insert
  to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.buyer_id = auth.uid()
  ));

create policy "order_items_admin_full_access"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════
-- 0004_bulletin_posts.sql
-- ═══════════════════════════════════════════════════════════════════
-- Community bulletin board posts. Matches the existing `BulletinPost` TS type
-- in src/types/index.ts.

create table public.bulletin_posts (
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

create policy "bulletin_posts_select_public"
  on public.bulletin_posts for select
  using (true);

create policy "bulletin_posts_insert_own"
  on public.bulletin_posts for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "bulletin_posts_update_own"
  on public.bulletin_posts for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "bulletin_posts_delete_own"
  on public.bulletin_posts for delete
  to authenticated
  using (author_id = auth.uid());

create policy "bulletin_posts_admin_full_access"
  on public.bulletin_posts for all
  using (public.is_admin())
  with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════
-- 0005_reports.sql
-- ═══════════════════════════════════════════════════════════════════
-- Real reports table, replacing the mock-only `FlaggedItem` TS type. Can
-- target a listing, a user, or both (at least one is required).

create table public.reports (
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

create index reports_status_idx on public.reports(status);

alter table public.reports enable row level security;

create policy "reports_select_own_or_admin"
  on public.reports for select
  to authenticated
  using (reported_by = auth.uid() or public.is_admin());

create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (reported_by = auth.uid());

create policy "reports_admin_update"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "reports_admin_delete"
  on public.reports for delete
  to authenticated
  using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════
-- 0006_notifications.sql
-- ═══════════════════════════════════════════════════════════════════
-- Backing table for the existing `Notification` TS type / notifications.tsx
-- screen (not in the original punch list, but nothing else backs that screen).
--
-- NOTE: notifications_insert_any_authenticated is a deliberate trust gap for
-- this foundation phase — any signed-in user can insert a notification row
-- for ANY user_id (e.g. so a review triggers a notification for the seller
-- from the reviewer's client). A future pass should move notification
-- creation server-side (DB trigger / Edge Function) so clients can no longer
-- forge notifications for arbitrary users.

create table public.notifications (
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

create index notifications_user_id_idx on public.notifications(user_id);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_insert_any_authenticated"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_admin_full_access"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════
-- 0007_profiles_listings_policies.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0008_storage_buckets.sql
-- ═══════════════════════════════════════════════════════════════════
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



-- ═══════════════════════════════════════════════════════════════════
-- 0009_sync_live_schema.sql
-- ═══════════════════════════════════════════════════════════════════


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
