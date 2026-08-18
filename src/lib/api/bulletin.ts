import { supabase } from '@/lib/supabase';
import type { BulletinCategory, BulletinPost } from '@/types';

import { unwrap, unwrapNullable } from './_shared';

// email/verification_status/created_at included so getVerifiedBadge()/
// SellerCard work if a badge is ever rendered for the author.
const AUTHOR_JOIN = '*, author:profiles(id,email,full_name,avatar_url,role,is_verified,verification_status,created_at)';

export async function getBulletinPosts(category?: BulletinCategory): Promise<BulletinPost[]> {
  let q = supabase.from('bulletin_posts').select(AUTHOR_JOIN);
  if (category) q = q.eq('category', category);
  const res = await q.order('created_at', { ascending: false });
  return unwrap<BulletinPost[]>(res as any);
}

export async function getBulletinPost(id: string): Promise<BulletinPost | null> {
  const res = await supabase.from('bulletin_posts').select(AUTHOR_JOIN).eq('id', id).single();
  return unwrapNullable<BulletinPost>(res as any);
}

export async function createBulletinPost(input: {
  author_id: string;
  category: BulletinCategory;
  title: string;
  body: string;
  location?: string;
  date?: string;
}): Promise<BulletinPost> {
  const res = await supabase.from('bulletin_posts').insert(input).select(AUTHOR_JOIN).single();
  return unwrap<BulletinPost>(res as any);
}

export async function deleteBulletinPost(id: string): Promise<void> {
  const res = await supabase.from('bulletin_posts').delete().eq('id', id);
  if (res.error) throw new Error(res.error.message);
}
