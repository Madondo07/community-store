import { supabase } from '@/lib/supabase';
import type { CartItem, DeliveryMethod, Order, OrderStatus, PaymentMethod } from '@/types';

import { unwrap, unwrapNullable } from './_shared';

const ITEMS_JOIN = '*, items:order_items(*)';

export async function getMyOrders(): Promise<Order[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!userData.user) return [];

  const res = await supabase
    .from('orders')
    .select(ITEMS_JOIN)
    .eq('buyer_id', userData.user.id)
    .order('created_at', { ascending: false });
  return unwrap<Order[]>(res as any);
}

export async function getOrder(id: string): Promise<Order | null> {
  const res = await supabase.from('orders').select(ITEMS_JOIN).eq('id', id).single();
  return unwrapNullable<Order>(res as any);
}

/**
 * Inserts the order row, then its line items. supabase-js has no client-side
 * transaction — on item-insert failure this best-effort deletes the order
 * row it just created before rethrowing. A Postgres RPC wrapping both
 * inserts in one transaction is the correct future fix if partial-failure
 * orders become a real problem.
 */
export async function createOrder(input: {
  buyer_id: string;
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
}): Promise<Order> {
  const orderRes = await supabase
    .from('orders')
    .insert({
      buyer_id: input.buyer_id,
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      total: input.total,
      delivery_method: input.deliveryMethod,
      payment_method: input.paymentMethod,
    })
    .select('*')
    .single();
  const order = unwrap<{ id: string }>(orderRes as any);

  const itemRows = input.items.map((item) => ({
    order_id: order.id,
    listing_id: item.listing.id,
    title: item.listing.title,
    price: item.listing.price,
    quantity: item.quantity,
    image: item.listing.images[0] ?? null,
  }));

  const itemsRes = await supabase.from('order_items').insert(itemRows);
  if (itemsRes.error) {
    await supabase.from('orders').delete().eq('id', order.id);
    throw new Error(itemsRes.error.message);
  }

  const created = await getOrder(order.id);
  if (!created) throw new Error('Order was created but could not be re-fetched.');
  return created;
}

/** Admin-only under current RLS. No buyer-side cancel flow yet — no screen calls for it. */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const res = await supabase.from('orders').update({ status }).eq('id', id);
  if (res.error) throw new Error(res.error.message);
}
