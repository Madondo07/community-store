import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Megaphone, MessageCircle, Package, Star } from 'lucide-react-native';

import { IconButton } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useNotifications } from '@/context/NotificationsContext';
import type { Notification, NotificationType } from '@/types';

const TYPE_ICONS: Record<NotificationType, typeof Package> = {
  order: Package,
  message: MessageCircle,
  review: Star,
  system: Bell,
  bulletin: Megaphone,
};

export default function NotificationsScreen() {
  // Live list: NotificationsProvider keeps a Realtime subscription open, so
  // a notification created while this screen is showing appears at the top
  // immediately.
  const { notifications, loading, markRead, markAllRead } = useNotifications();

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handlePress = (item: Notification) => {
    if (!item.is_read) markRead(item.id);
    // A sale notice opens the seller's Sales tab (order_items_notify_seller
    // trigger sets target_screen = 'sales').
    if (item.target_screen === 'sales') router.push('/(tabs)/profile?tab=Sales');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={24} color={Colors.textPrimary} /></IconButton>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={handleMarkAllRead}>
          <Text style={styles.markAll}>Mark all read</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.empty}><ActivityIndicator size="large" color={Colors.navy} /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const Icon = TYPE_ICONS[item.type];
            return (
              <Pressable
                style={[styles.row, !item.is_read && styles.rowUnread]}
                onPress={() => handlePress(item)}
              >
                {!item.is_read && <View style={styles.unreadDot} />}
                <View style={styles.iconWrap}><Icon size={20} color={Colors.blue} /></View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.rowTime}>{new Date(item.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={<View style={styles.empty}><Bell size={48} color={Colors.textTertiary} /><Text style={styles.emptyText}>No notifications</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  markAll: { ...Typography.bodySmall, color: Colors.blue, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.surface },
  rowUnread: { backgroundColor: Colors.overlayLight },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.blue, marginTop: 6, marginRight: Spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rowContent: { flex: 1 },
  rowTitle: { ...Typography.titleSm, color: Colors.textPrimary },
  rowBody: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  rowTime: { ...Typography.bodySmall, color: Colors.textTertiary, marginTop: Spacing.xs },
  sep: { height: 1, backgroundColor: Colors.divider },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['5xl'], gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textTertiary },
});
