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
