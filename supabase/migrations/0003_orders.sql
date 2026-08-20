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
