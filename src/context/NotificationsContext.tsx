/**
 * Swych — live notifications
 *
 * One Supabase Realtime subscription to the signed-in user's `notifications`
 * rows, shared by every screen that shows a badge or the notification list
 * (Profile header, Notifications screen, tab bar). New rows — e.g. the one
 * the `messages_notify_recipient` trigger creates when someone messages the
 * user — are pushed into state the moment they're inserted, no reload.
 *
 * Mobile note: when the app is backgrounded the OS suspends the realtime
 * socket, so anything that arrived in the meantime is missed by the
 * subscription. The AppState listener below refetches when the app returns to
 * the foreground to close that gap. (This is in-app only — OS push
 * notifications while the app is closed would need expo-notifications + a
 * push-token pipeline, which is a separate piece of work.)
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useApp } from '@/context/AppContext';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const uid = state.user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      setNotifications(await getMyNotifications());
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    // Signed out: nothing to subscribe to. The exposed list is masked below
    // (instead of resetting state here) so a previous user's notifications
    // can never show for the next one.
    if (!uid) return;

    // Initial load, independent of the socket (so the list still loads if
    // realtime can't connect). Deferred a microtask so it isn't a
    // synchronous setState-in-effect.
    Promise.resolve().then(refresh);

    const channel = supabase
      .channel(`notifications:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          const incoming = payload.new as Notification;
          setNotifications((prev) =>
            prev.some((n) => n.id === incoming.id) ? prev : [incoming, ...prev],
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
        },
      )
      .subscribe((status) => {
        // Anything inserted between the first fetch and the socket opening
        // would otherwise be missed, so reconcile once the channel is live.
        if (status === 'SUBSCRIBED') refresh();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`Notifications realtime ${status}`);
        }
      });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });

    return () => {
      appStateSub.remove();
      supabase.removeChannel(channel);
    };
  }, [uid, refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    if (!uid) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead(uid);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
      refresh();
    }
  }, [uid, refresh]);

  const value = useMemo<NotificationsContextValue>(() => {
    const visible = uid ? notifications.filter((n) => n.user_id === uid) : [];
    return {
      notifications: visible,
      unreadCount: visible.reduce((sum, n) => sum + (n.is_read ? 0 : 1), 0),
      loading: uid ? loading : false,
      refresh,
      markRead,
      markAllRead,
    };
  }, [uid, notifications, loading, refresh, markRead, markAllRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
