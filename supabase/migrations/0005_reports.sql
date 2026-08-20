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
