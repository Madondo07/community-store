import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BadgeCheck } from 'lucide-react-native';
import { GiftedChat, Bubble, InputToolbar, Composer, Send } from 'react-native-gifted-chat';
import type { IMessage } from 'react-native-gifted-chat';

import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { createNotification } from '@/lib/api/notifications';
import { supabase } from '@/lib/supabase';
import { getVerifiedBadge } from '@/utils/verification';
import type { UserProfile } from '@/types';

// ─── Component ──────────────────────────────────────────────────────────────

export default function ChatThreadScreen() {
  const { state } = useApp();
  const { contentMaxWidth, isWeb } = useResponsive();
  const params = useLocalSearchParams<{
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
    listingId: string;
  }>();

  const conversationId = params.conversationId;
  const otherUserName = params.otherUserName ?? 'User';
  const listingId = params.listingId || null;

  const user = state.user;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
  const [linkedListing, setLinkedListing] = useState<{ title: string; price: number } | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const uid = user?.id ?? '';

  // ── Fetch other user profile ─────────────────────────────────────────────

  useEffect(() => {
    if (!params.otherUserId) return;

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.otherUserId)
        .single();

      if (data) {
        setOtherProfile(data as UserProfile);
      }
    })();
  }, [params.otherUserId]);

  // ── Fetch linked listing ─────────────────────────────────────────────────

  useEffect(() => {
    if (!listingId) return;

    (async () => {
      const { data } = await supabase
        .from('listings')
        .select('title, price')
        .eq('id', listingId)
        .single();

      if (data) setLinkedListing(data);
    })();
  }, [listingId]);

  // ── Map DB rows to GiftedChat format ─────────────────────────────────────

  const mapMessages = useCallback(
    (rows: { id: string; sender_id: string; content: string; created_at: string }[]): IMessage[] =>
      rows.map((m) => ({
        _id: m.id,
        text: m.content,
        createdAt: new Date(m.created_at),
        user: {
          _id: m.sender_id,
          name: m.sender_id === uid ? (user?.full_name ?? 'Me') : otherUserName,
        },
      })),
    [uid, user?.full_name, otherUserName],
  );

  // ── Fetch messages + subscribe to realtime ───────────────────────────────

  useEffect(() => {
    if (!conversationId || !uid) return;

    // Fetch existing messages
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at, read_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Messages fetch error:', error.message);
      }

      if (data) {
        const mapped = mapMessages(data);
        setMessages(mapped);
      }
      setLoading(false);

      // Mark unread messages from the other participant as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', uid)
        .is('read_at', null);
    })();

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          const mapped = mapMessages([newMsg]);
          setMessages((prev) => GiftedChat.append(prev, mapped));

          // Auto-mark as read if it's from the other user
          if (newMsg.sender_id !== uid) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [conversationId, uid, mapMessages]);

  // ── Send ─────────────────────────────────────────────────────────────────

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!conversationId || !uid) return;

      const text = newMessages[0]?.text;
      if (!text) return;

      // Optimistic append
      setMessages((prev) => GiftedChat.append(prev, newMessages));

      // Insert into Supabase
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: uid,
        content: text,
      });

      if (error) {
        console.warn('Send message error:', error.message);
        return;
      }

      // Update conversation last_message
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_content: text,
        })
        .eq('id', conversationId);

      if (params.otherUserId) {
        createNotification({
          user_id: params.otherUserId,
          type: 'message',
          title: `New message from ${user?.full_name ?? 'a user'}`,
          body: text,
          target_screen: 'chat-thread',
          target_id: conversationId,
        }).catch((err) => console.warn('Failed to create message notification:', err));
      }
    },
    [conversationId, uid, params.otherUserId, user?.full_name]
  );

  // ── Badge for other user ─────────────────────────────────────────────────

  const otherBadge = otherProfile ? getVerifiedBadge(otherProfile) : null;

  // ── Custom bubble colors ─────────────────────────────────────────────────

  const renderBubble = useCallback(
    (props: any) => (
      <Bubble
        {...props}
        wrapperStyle={{
          left: { backgroundColor: Colors.surfaceAlt },
          right: { backgroundColor: Colors.navy },
        }}
        textStyle={{
          left: { color: Colors.textPrimary },
          right: { color: Colors.textInverse },
        }}
        timeTextStyle={{
          left: { color: Colors.textTertiary },
          right: { color: 'rgba(255,255,255,0.6)' },
        }}
      />
    ),
    []
  );

  const renderInputToolbar = useCallback(
    (props: any) => (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    ),
    []
  );

  const renderComposer = useCallback(
    (props: any) => (
      <Composer
        {...props}
        textInputStyle={styles.composerInput}
        placeholderTextColor={Colors.textTertiary}
        placeholder="Type a message..."
      />
    ),
    []
  );

  const renderSend = useCallback(
    (props: any) => (
      <Send {...props} containerStyle={styles.sendBtn}>
        <Text style={styles.sendText}>Send</Text>
      </Send>
    ),
    []
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.container, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as any }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
            <ArrowLeft size={Spacing['2xl']} color={Colors.navy} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>{otherUserName}</Text>
              {otherBadge && (
                <BadgeCheck size={Spacing.lg} color={otherBadge.color} />
              )}
            </View>
            {otherBadge && (
              <Text style={[styles.headerBadgeLabel, { color: otherBadge.color }]}>
                {otherBadge.label}
              </Text>
            )}
          </View>
        </View>

        {/* Linked listing card */}
        {linkedListing && (
          <Pressable
            style={styles.listingCard}
            onPress={() => listingId && router.push(`/listing-detail?id=${listingId}`)}
          >
            <View style={styles.listingCardContent}>
              <Text style={styles.listingCardTitle} numberOfLines={1}>{linkedListing.title}</Text>
              <Text style={styles.listingCardPrice}>R{linkedListing.price.toLocaleString()}</Text>
            </View>
            <Text style={styles.listingCardArrow}>View</Text>
          </Pressable>
        )}

        {/* Chat */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.navy} />
          </View>
        ) : (
          <GiftedChat
            messages={messages}
            onSend={(msgs) => onSend(msgs)}
            user={{ _id: uid, name: user?.full_name ?? 'Me' }}
            renderBubble={renderBubble}
            renderInputToolbar={renderInputToolbar}
            renderComposer={renderComposer}
            renderSend={renderSend}
            isSendButtonAlwaysVisible
            renderLoading={() => <ActivityIndicator size="large" color={Colors.navy} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.md,
  },
  headerCenter: { flex: 1 },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerName: {
    ...Typography.titleMd,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  headerBadgeLabel: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginTop: 1,
  },

  // Linked listing card
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  listingCardContent: { flex: 1, gap: 2 },
  listingCardTitle: {
    ...Typography.titleSm,
    color: Colors.textPrimary,
  },
  listingCardPrice: {
    ...Typography.priceSm,
    color: Colors.navy,
  },
  listingCardArrow: {
    ...Typography.bodySmall,
    color: Colors.blue,
    fontWeight: '600',
    marginLeft: Spacing.md,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Input
  inputToolbar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  composerInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    marginRight: Spacing.sm,
  },
  sendBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.navy,
    borderRadius: Radii.lg,
    marginBottom: Platform.OS === 'ios' ? 0 : Spacing.xs,
  },
  sendText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontWeight: '600',
  },
});
