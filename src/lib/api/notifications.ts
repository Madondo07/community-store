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

/** Clears the unread message notifications for one chat — used while that chat is open. */
export async function markConversationNotificationsRead(userId: string, conversationId: string): Promise<void> {
  const res = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('type', 'message')
    .eq('target_id', conversationId)
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
}): Promise<void> {
  // Deliberately NO `.select()` on the insert. Asking Postgres to RETURN the
  // new row makes RLS also check the SELECT policy, and notifications_select_own
  // only lets you read rows where user_id = YOUR id — so inserting a
  // notification for ANOTHER user (a buyer notifying a seller, a reviewer
  // notifying the reviewed seller) failed with "new row violates row-level
  // security policy" even though the INSERT policy allows it. Those errors
  // were swallowed by the fire-and-forget callers, so the other user simply
  // never got anything. Nothing uses the returned row.
  const res = await supabase.from('notifications').insert(input);
  if (res.error) throw new Error(res.error.message);
}
