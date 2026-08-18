import { supabase } from '@/lib/supabase';
import type { Listing, ListingCategory, ListingCondition, ListingStatus } from '@/types';

import { unwrap, unwrapNullable } from './_shared';

// Includes email/created_at because getVerifiedBadge() and SellerCard need
// them (email for the student/staff domain check, created_at for "member
// since") — a prior version omitted these and crashed on listing-detail.
const SELLER_JOIN =
  '*, seller:profiles(id,email,full_name,avatar_url,role,is_verified,verification_status,business_name,created_at)';

export interface ListingFilters {
  category?: ListingCategory;
  condition?: ListingCondition;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  sellerId?: string;
  /** Defaults to 'active'. Pass an explicit status, or `null` for any status (owner/admin views). */
  status?: ListingStatus | null;
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  let q = supabase.from('listings').select(SELLER_JOIN);

  if (filters.status !== null) q = q.eq('status', filters.status ?? 'active');
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.condition) q = q.eq('condition', filters.condition);
  if (filters.minPrice !== undefined) q = q.gte('price', filters.minPrice);
  if (filters.maxPrice !== undefined) q = q.lte('price', filters.maxPrice);
  if (filters.sellerId) q = q.eq('seller_id', filters.sellerId);
  if (filters.query) {
    q = q.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
  }

  const res = await q.order('created_at', { ascending: false });
  return unwrap<Listing[]>(res as any);
}

export async function getListing(id: string): Promise<Listing | null> {
  const res = await supabase.from('listings').select(SELLER_JOIN).eq('id', id).single();
  return unwrapNullable<Listing>(res as any);
}

export async function getListingsBySeller(
  sellerId: string,
  opts: { status?: ListingStatus | null } = {},
): Promise<Listing[]> {
  return getListings({ sellerId, status: opts.status });
}

export async function searchListings(query: string): Promise<Listing[]> {
  return getListings({ query });
}

export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const res = await supabase.from('listings').select(SELLER_JOIN).in('id', ids);
  return unwrap<Listing[]>(res as any);
}

export async function createListing(input: {
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  images: string[];
}): Promise<Listing> {
  const res = await supabase
    .from('listings')
    .insert({ ...input, status: 'active' })
    .select(SELLER_JOIN)
    .single();
  return unwrap<Listing>(res as any);
}

export async function updateListing(
  id: string,
  updates: Partial<
    Pick<Listing, 'title' | 'description' | 'price' | 'category' | 'condition' | 'status' | 'images'>
  >,
): Promise<Listing> {
  const res = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id)
    .select(SELLER_JOIN)
    .single();
  return unwrap<Listing>(res as any);
}

/**
 * Hard-deletes a listing. Prefer `updateListing(id, { status: 'removed' })`
 * for admin moderation so listing/order history is preserved.
 */
export async function deleteListing(id: string): Promise<void> {
  const res = await supabase.from('listings').delete().eq('id', id);
  if (res.error) throw new Error(res.error.message);
}
