import React from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';

import { Avatar } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { MOCK_CONVERSATIONS } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';

export default function MessagesScreen() {
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();

  if (MOCK_CONVERSATIONS.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
        <View style={[styles.headerWrap, { maxWidth: contentMaxWidth }]}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.empty}>
          <MessageCircle size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyBody}>Start a conversation by messaging a seller</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.contentWrap, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as any }]}>
        <Text style={[styles.title, { paddingHorizontal: isDesktop ? Spacing['2xl'] : Spacing.xl }]}>Messages</Text>
        <FlatList
          data={MOCK_CONVERSATIONS}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={isDesktop ? styles.listDesktop : undefined}
          renderItem={({ item }) => {
            const time = new Date(item.last_message_at ?? '').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  isDesktop && styles.rowDesktop,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => Alert.alert('Chat', `Chat with ${item.other_user?.full_name} coming soon`)}
              >
                <Avatar uri={item.other_user?.avatar_url} name={item.other_user?.full_name ?? ''} size={isDesktop ? 'lg' : 'md'} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowName}>{item.other_user?.full_name}</Text>
                  {item.listing && <Text style={styles.rowListing} numberOfLines={1}>{item.listing.title}</Text>}
                  <Text style={styles.rowMsg} numberOfLines={1}>{item.last_message}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowTime}>{time}</Text>
                  {item.unread_count > 0 && <View style={styles.unreadDot} />}
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  contentWrap: { flex: 1 },
  headerWrap: { alignSelf: 'center' as any, width: '100%' as any },
  title: { ...Typography.titleLg, color: Colors.navy, padding: Spacing.xl, paddingBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.surface },
  rowDesktop: { marginHorizontal: Spacing['2xl'], borderRadius: Radii.md, marginBottom: Spacing.xs, ...Shadows.sm },
  rowContent: { flex: 1, marginLeft: Spacing.md },
  rowName: { ...Typography.titleSm, color: Colors.textPrimary },
  rowListing: { ...Typography.bodySmall, color: Colors.textTertiary, marginTop: 1 },
  rowMsg: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: Spacing.sm },
  rowTime: { ...Typography.caption, color: Colors.textTertiary, textTransform: 'none' as const },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.blue },
  sep: { height: 1, backgroundColor: Colors.divider, marginLeft: 80 },
  listDesktop: { paddingTop: Spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyTitle: { ...Typography.titleMd, color: Colors.textPrimary },
  emptyBody: { ...Typography.body, color: Colors.textSecondary },
});
