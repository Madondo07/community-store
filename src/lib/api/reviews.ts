import { supabase } from '@/lib/supabase';
import type { Review } from '@/types';

import { unwrap } from './_shared';

// email/vendor_status/created_at included so getVerifiedBadge()/
// SellerCard work if a badge is ever rendered for the reviewer.
// `reviews` has two FKs to `profiles` (reviewer_id, seller_id), so the
// embed must be disambiguated by FK constraint name — an unqualified
// `reviewer:profiles(...)` throws "more than one relationship was found"
// (same pattern already used in reports.ts's REPORT_JOIN).
const REVIEWER_JOIN = '*, reviewer:profiles!reviews_reviewer_id_fkey(id,email,full_name,avatar_url,role,is_verified,vendor_status,created_at)';

export async function getReviewsForSeller(sellerId: string): Promise<Review[]> {
  const res = await supabase
    .from('reviews')
    .select(REVIEWER_JOIN)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  return unwrap<Review[]>(res as any);
}

export async function getReviewsForListing(listingId: string): Promise<Review[]> {
  const res = await supabase
    .from('reviews')
    .select(REVIEWER_JOIN)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  return unwrap<Review[]>(res as any);
}

export async function getReviewStats(
  sellerId: string,
): Promise<{ avgRating: number; count: number }> {
  const res = await supabase.from('reviews').select('rating').eq('seller_id', sellerId);
  const rows = unwrap<{ rating: number }[]>(res as any);
  if (rows.length === 0) return { avgRating: 0, count: 0 };
  const avgRating = rows.reduce((sum, r) => sum + r.rating, 0) / rows.length;
  return { avgRating, count: rows.length };
}

export async function hasReviewed(reviewerId: string, listingId: string): Promise<boolean> {
  const res = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('reviewer_id', reviewerId)
    .eq('listing_id', listingId);
  if (res.error) throw new Error(res.error.message);
  return (res.count ?? 0) > 0;
}

export async function createReview(input: {
  reviewer_id: string;
  seller_id: string;
  listing_id: string;
  rating: number;
  comment: string | null;
}): Promise<Review> {
  const res = await supabase.from('reviews').insert(input).select(REVIEWER_JOIN).single();
  return unwrap<Review>(res as any);
}
