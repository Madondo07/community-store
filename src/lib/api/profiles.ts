import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

import { unwrap, unwrapNullable } from './_shared';

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const res = await supabase.from('profiles').select('*').eq('id', userId).single();
  return unwrapNullable<UserProfile>(res);
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!userData.user) return null;
  return getProfile(userData.user.id);
}

export async function getProfilesByIds(userIds: string[]): Promise<UserProfile[]> {
  if (userIds.length === 0) return [];
  const res = await supabase.from('profiles').select('*').in('id', userIds);
  return unwrap<UserProfile[]>(res);
}

export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>,
): Promise<UserProfile> {
  const res = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();
  return unwrap<UserProfile>(res);
}

export async function getPendingVendors(): Promise<UserProfile[]> {
  const res = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'vendor')
    .eq('vendor_status', 'pending')
    .order('created_at', { ascending: true });
  return unwrap<UserProfile[]>(res);
}

export async function approveVendor(userId: string): Promise<void> {
  const res = await supabase
    .from('profiles')
    .update({ vendor_status: 'verified', is_verified: true })
    .eq('id', userId);
  if (res.error) throw new Error(res.error.message);
}

export async function rejectVendor(userId: string): Promise<void> {
  const res = await supabase
    .from('profiles')
    .update({ vendor_status: 'rejected' })
    .eq('id', userId);
  if (res.error) throw new Error(res.error.message);
}
