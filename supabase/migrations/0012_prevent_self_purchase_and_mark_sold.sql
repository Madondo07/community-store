-- Fixes two real bugs found in testing:
--
-- 1. A user could buy their own listing. Nothing enforced buyer != seller
--    anywhere — not in the app (Add to Cart had no ownership check) and
--    not in the DB (orders_insert_own / order_items_insert_own only check
--    that the buyer is inserting as themself, not who they're buying
--    from). Enforced here at the DB level (not just client-side — a
--    client-side-only check is trivially bypassed) via a BEFORE INSERT
--    trigger on order_items that rejects the insert if the order's
--    buyer_id matches the listing's seller_id.
--
-- 2. Purchased listings were never marked 'sold' — createOrder() in
--    src/lib/api/orders.ts only ever inserted the order + order_items
--    rows, nothing updates listings.status. Even if it tried to, the
--    buyer has no UPDATE grant on listings (only
--    "Sellers can update their own listings" / admin exist) — RLS would
--    silently no-op it. Fixed with an AFTER INSERT trigger, SECURITY
--    DEFINER so it can flip the listing's status regardless of who's
--    buying it.
--
-- Both trigger on order_items (not orders) because that's the row that
-- actually names a specific listing; one order can contain items from
-- multiple sellers, so this is evaluated per purchased item, not once per
-- order.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Reject an order_items insert where buyer == seller
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.prevent_self_purchase()
returns trigger
language plpgsql
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
begin
  if new.listing_id is null then
    return new;
  end if;

  select buyer_id into v_buyer_id from public.orders where id = new.order_id;
  select seller_id into v_seller_id from public.listings where id = new.listing_id;

  if v_buyer_id is not null and v_seller_id is not null and v_buyer_id = v_seller_id then
    raise exception 'You cannot purchase your own listing';
  end if;

  return new;
end;
$$;

drop trigger if exists order_items_prevent_self_purchase on public.order_items;
create trigger order_items_prevent_self_purchase
  before insert on public.order_items
  for each row
  execute function public.prevent_self_purchase();

-- ═══════════════════════════════════════════════════════════════════
-- 2. Mark the purchased listing 'sold' — security definer because the
--    buyer (whose session actually runs this insert) has no UPDATE grant
--    on listings; only its seller or an admin does.
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.mark_listing_sold_on_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.listing_id is not null then
    update public.listings
    set status = 'sold'
    where id = new.listing_id and status = 'active';
  end if;
  return new;
end;
$$;

revoke all on function public.mark_listing_sold_on_purchase() from public;

drop trigger if exists order_items_mark_listing_sold on public.order_items;
create trigger order_items_mark_listing_sold
  after insert on public.order_items
  for each row
  execute function public.mark_listing_sold_on_purchase();

notify pgrst, 'reload schema';
