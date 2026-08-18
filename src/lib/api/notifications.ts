import { supabase } from '@/lib/supabase';
import type { Notification, NotificationType } from '@/types';

import { unwrap } from './_shared';

export async function getMyNotifications(): Promise<Notification[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!userData.user) return [];

  const res = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });
  return unwrap<Notification[]>(res as any);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const res = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (res.error) throw new Error(res.error.message);
  return res.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (res.error) throw new Error(res.error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const res = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (res.error) throw new Error(res.error.message);
}

export async function createNotification(input: {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  target_screen?: string;
  target_id?: string;
}): Promise<Notification> {
  const res = await supabase.from('notifications').insert(input).select('*').single();
  return unwrap<Notification>(res as any);
}
