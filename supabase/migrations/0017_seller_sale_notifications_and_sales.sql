-- Sellers could neither see nor be told about a purchase.
--
-- Why they weren't notified: checkout.tsx tried to insert the seller's
-- notification from the BUYER's client. createNotification() inserted with
-- `.select()`, and returning the new row makes RLS also evaluate the SELECT
-- policy (notifications_select_own = "user_id = auth.uid()"), which fails for
-- a row addressed to someone else. The insert was rejected and the error was
-- swallowed by the fire-and-forget caller. (createNotification no longer
-- asks for the row back, which also repairs the review -> seller notice.)
--
-- Fix 1 — notify the seller from the database, per purchased item, so it
-- doesn't depend on the buyer's client at all. It goes through the normal
-- notifications insert, so the recipient's "Order Updates" preference
-- (migration 0016) still applies, and Realtime delivers it live.
--
-- Fix 2 — sellers had no way to see sales: orders / order_items RLS only
-- exposes a buyer's own rows. Rather than loosening those policies, expose
-- exactly what a seller needs through a SECURITY DEFINER function scoped to
-- auth.uid() — the sold item snapshot, the order status/delivery method and
-- the buyer's NAME only (no email, no other items from the buyer's order).

-- ─── 1. Notify the seller ───────────────────────────────────────────────────

create or replace function public.notify_seller_on_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_buyer_id uuid;
  v_buyer_name text;
begin
  if new.listing_id is null then
    return new;
  end if;

  select seller_id into v_seller_id from public.listings where id = new.listing_id;
  select buyer_id into v_buyer_id from public.orders where id = new.order_id;

  if v_seller_id is null or v_seller_id = v_buyer_id then
    return new;
  end if;

  select full_name into v_buyer_name from public.profiles where id = v_buyer_id;

  insert into public.notifications (user_id, type, title, body, target_screen, target_id)
  values (
    v_seller_id,
    'order',
    'New sale!',
    coalesce(v_buyer_name, 'A buyer') || ' bought "' || new.title || '".',
    'sales',
    new.order_id::text
  );

  return new;
end;
$$;

revoke all on function public.notify_seller_on_sale() from public;

drop trigger if exists order_items_notify_seller on public.order_items;
create trigger order_items_notify_seller
  after insert on public.order_items
  for each row
  execute function public.notify_seller_on_sale();

-- ─── 2. Let a seller list their own sales ───────────────────────────────────

create or replace function public.my_sales()
returns table (
  item_id uuid,
  order_id uuid,
  listing_id uuid,
  title text,
  price numeric,
  quantity integer,
  image text,
  sold_at timestamptz,
  order_status text,
  delivery_method text,
  buyer_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    oi.id,
    oi.order_id,
    oi.listing_id,
    oi.title,
    oi.price,
    oi.quantity,
    oi.image,
    oi.created_at,
    o.status,
    o.delivery_method,
    p.full_name
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.listings l on l.id = oi.listing_id
  left join public.profiles p on p.id = o.buyer_id
  where l.seller_id = auth.uid()
  order by oi.created_at desc;
$$;

revoke all on function public.my_sales() from public;
grant execute on function public.my_sales() to authenticated;

notify pgrst, 'reload schema';
