import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, MessageCircle, Package, Star } from 'lucide-react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { NotificationType } from '@/types';

const TYPE_ICONS: Record<NotificationType, typeof Package> = {
  order: Package,
  message: MessageCircle,
  review: Star,
  system: Bell,
};

export default function NotificationsScreen() {
  const { state, dispatch } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}>
          <Text style={styles.markAll}>Mark all read</Text>
        </Pressable>
      </View>

      <FlatList
        data={state.notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const Icon = TYPE_ICONS[item.type];
          return (
            <Pressable
              style={[styles.row, !item.is_read && styles.rowUnread]}
              onPress={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: item.id })}
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
