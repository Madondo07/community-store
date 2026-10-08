import { supabase } from '@/lib/supabase';

/**
 * Per-user switches for the notification types a user can turn off. Backed
 * by `notification_preferences` (migration 0016). The actual filtering
 * happens in the database (BEFORE INSERT trigger on `notifications`), so
 * turning a switch off here stops the notification from being created at
 * all — this file only reads and writes the switches.
 */
export interface NotificationPreferences {
  messages: boolean;
  orders: boolean;
  bulletin: boolean;
}

export type NotificationPreferenceKey = keyof NotificationPreferences;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  messages: true,
  orders: true,
  bulletin: true,
};

/** Returns the user's saved switches; no row yet means everything is on. */
export async function getMyNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const res = await supabase
    .from('notification_preferences')
    .select('messages, orders, bulletin')
    .eq('user_id', userId)
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data ?? DEFAULT_NOTIFICATION_PREFERENCES;
}

export async function setNotificationPreference(
  userId: string,
  key: NotificationPreferenceKey,
  value: boolean,
): Promise<void> {
  const res = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (res.error) throw new Error(res.error.message);
}
