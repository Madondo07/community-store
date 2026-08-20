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
