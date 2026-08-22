import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Lock, MessageCircle } from 'lucide-react-native';

import { Avatar } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { supabase } from '@/lib/supabase';
import { getVerifiedBadge } from '@/utils/verification';
import type { UserProfile } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ConversationRow {
  id: string;
  participant_one: string;
  participant_two: string;
  listing_id: string | null;
  last_message_at: string | null;
  last_message_content: string | null;
  // Joined
  other_user: Pick<UserProfile, 'id' | 'full_name' | 'avatar_url' | 'email' | 'role' | 'is_verified' | 'vendor_status'> | null;
  listing_title: string | null;
  unread_count: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const { state } = useApp();
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();

  const user = state.user;
  const isPendingVendor = user?.role === 'vendor' && user?.vendor_status !== 'verified';

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch conversations ──────────────────────────────────────────────────

  useEffect(() => {
    // Declared inside the effect (React's recommended data-fetching
    // pattern) rather than as an outer useCallback, so the effect body
    // isn't a bare call to a function defined elsewhere.
    async function fetchConversations() {
      // No setLoading(false) here — when there's no user or the vendor is
      // pending, the component renders the "locked"/sign-in branch below
      // instead of ever consulting `loading`.
      if (!user || isPendingVendor) return;

      try {
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user?.id ?? user.id;

        // Fetch conversations where user is a participant
        const { data: convos, error } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_one.eq.${uid},participant_two.eq.${uid}`)
          .order('last_message_at', { ascending: false });

        if (error) {
          console.warn('Conversations fetch error:', error.message);
          setLoading(false);
          return;
        }

        if (!convos || convos.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Build enriched rows
        const rows: ConversationRow[] = [];

        for (const c of convos) {
          const otherId = c.participant_one === uid ? c.participant_two : c.participant_one;

          // Fetch other user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email, role, is_verified, vendor_status')
            .eq('id', otherId)
            .single();

          // Fetch listing title if linked
          let listingTitle: string | null = null;
          if (c.listing_id) {
            const { data: listing } = await supabase
              .from('listings')
              .select('title')
              .eq('id', c.listing_id)
              .single();
            listingTitle = listing?.title ?? null;
          }

          // Count unread messages (sent by the other participant, unread by me)
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .eq('sender_id', otherId)
            .is('read_at', null);

          rows.push({
            id: c.id,
            participant_one: c.participant_one,
            participant_two: c.participant_two,
            listing_id: c.listing_id,
            last_message_at: c.last_message_at,
            last_message_content: c.last_message_content,
            other_user: profile ?? null,
            listing_title: listingTitle,
            unread_count: count ?? 0,
          });
        }

        setConversations(rows);
      } catch (err) {
        console.warn('Conversations fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, [user, isPendingVendor]);

  // ── Pending vendor gate ──────────────────────────────────────────────────

  if (isPendingVendor) {
    return (
      <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
        <View style={[styles.headerWrap, { maxWidth: contentMaxWidth }]}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.empty}>
          <Lock size={Spacing['4xl']} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Messaging locked</Text>
          <Text style={styles.emptyBody}>
            Your vendor account is pending verification. Messaging will be available once your account is approved.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
        <View style={[styles.headerWrap, { maxWidth: contentMaxWidth }]}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────

  if (conversations.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
        <View style={[styles.headerWrap, { maxWidth: contentMaxWidth }]}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.empty}>
          <MessageCircle size={Spacing['4xl']} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyBody}>Start a conversation by messaging a seller</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.contentWrap, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as any }]}>
        <Text style={[styles.title, { paddingHorizontal: isDesktop ? Spacing['2xl'] : Spacing.xl }]}>Messages</Text>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={isDesktop ? styles.listDesktop : undefined}
          renderItem={({ item }) => {
            const badge = item.other_user
              ? getVerifiedBadge({
                  ...item.other_user,
                  created_at: '',
                } as UserProfile)
              : null;

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  isDesktop && styles.rowDesktop,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/chat-thread',
                    params: {
                      conversationId: item.id,
                      otherUserId: item.other_user?.id ?? '',
                      otherUserName: item.other_user?.full_name ?? 'User',
                      listingId: item.listing_id ?? '',
                    },
                  })
                }
              >
                <Avatar
                  uri={item.other_user?.avatar_url ?? null}
                  name={item.other_user?.full_name ?? ''}
                  size={isDesktop ? 'lg' : 'md'}
                />
                <View style={styles.rowContent}>
                  <View style={styles.nameRow}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.other_user?.full_name ?? 'Unknown'}
                    </Text>
                    {badge && (
                      <View style={[styles.badgePill, { backgroundColor: badge.color + '18' }]}>
                        <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    )}
                  </View>
                  {item.listing_title && (
                    <Text style={styles.rowListing} numberOfLines={1}>{item.listing_title}</Text>
                  )}
                  <Text style={styles.rowMsg} numberOfLines={1}>
                    {item.last_message_content ?? 'No messages yet'}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowTime}>{relativeTime(item.last_message_at)}</Text>
                  {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread_count > 9 ? '9+' : item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  contentWrap: { flex: 1 },
  headerWrap: { alignSelf: 'center' as const, width: '100%' as any },
  title: {
    ...Typography.titleLg,
    color: Colors.navy,
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  rowDesktop: {
    marginHorizontal: Spacing['2xl'],
    borderRadius: Radii.md,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  rowContent: { flex: 1, marginLeft: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowName: {
    ...Typography.titleSm,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  badgePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: Radii.full,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  rowListing: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  rowMsg: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowRight: { alignItems: 'flex-end', gap: Spacing.sm },
  rowTime: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'none' as const,
  },
  unreadBadge: {
    minWidth: Spacing.xl,
    height: Spacing.xl,
    borderRadius: Spacing.md,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  unreadText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
  sep: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.xl + Spacing['4xl'],
  },
  listDesktop: { paddingTop: Spacing.sm },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
  },
  emptyTitle: { ...Typography.titleMd, color: Colors.textPrimary },
  emptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
});
