import type { Listing } from '@/types';

/**
 * Returns the whole-number % a listing's price has dropped by, or null if
 * there's no active drop to show. `previous_price` is maintained server-side
 * by a DB trigger (see supabase/migrations/0009_sync_live_schema.sql) —
 * it's only non-null while the current price is lower than the last price
 * it changed from, so this is safe to call unconditionally.
 */
export function getPriceDropPercent(listing: Pick<Listing, 'price' | 'previous_price'>): number | null {
  const { price, previous_price } = listing;
  if (!previous_price || previous_price <= price) return null;
  return Math.round((1 - price / previous_price) * 100);
}
