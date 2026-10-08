import { router, useFocusEffect } from 'expo-router';
import { Bell, Briefcase, Building2, Calendar, MapPin, Megaphone, Pencil, PlusCircle, Search, Trash2, Wrench } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, CategoryChip } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { BULLETIN_CATEGORIES } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';
import { deleteBulletinPost, getBulletinPosts } from '@/lib/api/bulletin';
import { formatRelativeTime } from '@/lib/formatTime';
import type { BulletinPost } from '@/types';

// Posts past this length get truncated to PREVIEW_LINES with a "Read more"
// toggle instead of always showing in full — keeps the board scannable.
const PREVIEW_LINES = 3;
const PREVIEW_CHAR_LIMIT = 160;

const TYPE_ICONS: Record<string, typeof Calendar> = {
  newsflash: Bell,
  cts: Building2,
  management: Briefcase,
  events: Calendar,
  services: Wrench,
  lost_and_found: Search,
};

// The board's timer reads the admin-set post date/time, not created_at —
// see the composer and supabase/README.md ("0014_bulletin_important_and_management").
// Falls back to created_at only for posts from before that field was always set.
const effectiveTimestamp = (post: BulletinPost) => post.date ?? post.created_at;

export default function BulletinBoardTab() {
  const { state } = useApp();
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();
  const [selectedCat, setSelectedCat] = useState('all');
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const padding = isDesktop ? Spacing['2xl'] : Spacing.lg;
  const isAdmin = state.user?.role === 'admin';

  // Refetches on focus (not just mount) so a post just made in the admin
  // composer shows up immediately on returning to this tab.
  useFocusEffect(
    useCallback(() => {
      getBulletinPosts()
        .then(setPosts)
        .catch((err) => console.warn('Failed to load bulletin posts:', err))
        .finally(() => setLoading(false));
    }, []),
  );

  // Forces a re-render periodically so "1m ago" / "1 hour ago" stay accurate
  // while the board is left open, without re-fetching anything. Ticking
  // every 60s (instead of, say, 15s) meant the label could sit stale for
  // up to just under 2 minutes between refreshes — which reads as a
  // skipped minute (e.g. "2m ago" jumping straight to "4m ago"). Each
  // render still computes the true elapsed time fresh, so a shorter,
  // cheap interval is enough to fix it — no need to align to real minute
  // boundaries.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleEdit = (post: BulletinPost) => {
    router.push({ pathname: '/bulletin-composer', params: { postId: post.id } });
  };

  const handleDelete = (post: BulletinPost) => {
    Alert.alert('Delete this post?', `"${post.title}" will be removed for everyone. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBulletinPost(post.id);
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Could not delete post.');
          }
        },
      },
    ]);
  };

  // Sorted (not just filtered) by the admin-set post date/time, newest
  // first — an edited/backdated post needs to re-slot into the timeline,
  // not stay pinned where it was originally inserted.
  const filtered = (selectedCat === 'all' ? posts : posts.filter((p) => p.category === selectedCat))
    .slice()
    .sort((a, b) => new Date(effectiveTimestamp(b)).getTime() - new Date(effectiveTimestamp(a)).getTime());

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.contentWrap, { maxWidth: contentMaxWidth }]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <View>
            <Text style={styles.headerTitle}>Bulletin Board</Text>
            <Text style={styles.headerSub}>CPUT Newsflash</Text>
          </View>
          {isAdmin ? (
            <Button
              title="Post"
              size="sm"
              icon={<PlusCircle size={18} color={Colors.textInverse} />}
              onPress={() => router.push('/bulletin-composer')}
            />
          ) : (
            <Megaphone size={22} color={Colors.teal} />
          )}
        </View>

      {/* Categories */}
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={{ flexGrow: 0 }}
  contentContainerStyle={[styles.chipRow, { paddingHorizontal: padding }]}
>
  {BULLETIN_CATEGORIES.map((cat) => (
    <CategoryChip key={cat.key} label={cat.label} selected={selectedCat === cat.key} onPress={() => setSelectedCat(cat.key)} />
  ))}
</ScrollView>

        {/* Posts */}
        {loading ? (
          <View style={styles.empty}><ActivityIndicator size="large" color={Colors.navy} /></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingHorizontal: padding }]}
            numColumns={isDesktop ? 2 : 1}
            key={isDesktop ? 'grid' : 'list'}
            columnWrapperStyle={isDesktop ? styles.gridRow : undefined}
            renderItem={({ item }) => {
              const Icon = TYPE_ICONS[item.category] ?? Megaphone;
              const isExpanded = expandedIds.has(item.id);
              const isLong = item.body.length > PREVIEW_CHAR_LIMIT;
              return (
                <View style={[styles.postCard, isDesktop && styles.postCardDesktop, item.is_important && styles.postCardImportant]}>
                  <View style={styles.postHeader}>
                    <View style={styles.iconWrap}><Icon size={18} color={Colors.blue} /></View>
                    <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
                    {isAdmin && (
                      <View style={styles.adminActions}>
                        <Pressable onPress={() => handleEdit(item)} hitSlop={8} accessibilityLabel="Edit post" style={styles.adminActionBtn}>
                          <Pencil size={16} color={Colors.textSecondary} />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(item)} hitSlop={8} accessibilityLabel="Delete post" style={styles.adminActionBtn}>
                          <Trash2 size={16} color={Colors.danger} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                  <Pressable disabled={!isLong} onPress={() => toggleExpanded(item.id)} style={styles.bodyWrap}>
                    <Text style={styles.postBody} numberOfLines={isExpanded ? undefined : PREVIEW_LINES}>
                      {item.body}
                    </Text>
                    {isLong && (
                      <Text style={styles.readMore}>{isExpanded ? 'Show less' : 'Read more'}</Text>
                    )}
                  </Pressable>
                  <View style={styles.postMeta}>
                    {item.location && (
                      <View style={styles.metaItem}>
                        <MapPin size={12} color={Colors.textTertiary} />
                        <Text style={styles.metaText}>{item.location}</Text>
                      </View>
                    )}
                    <Text style={styles.metaText}>{formatRelativeTime(effectiveTimestamp(item))}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Megaphone size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No posts in this category</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  contentWrap: { flex: 1, alignSelf: 'center' as any, width: '100%' as any },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  headerSub: { ...Typography.caption, color: Colors.teal, textTransform: 'none' as const, marginTop: 2 },
chipRow: { paddingBottom: Spacing.md, gap: Spacing.sm, flexDirection: 'row' },
  list: { paddingBottom: Spacing['4xl'] },
  gridRow: { gap: Spacing.md },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  postCardDesktop: { flex: 1 },
  postCardImportant: { borderColor: Colors.danger, borderWidth: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  adminActions: { flexDirection: 'row', gap: Spacing.xs },
  adminActionBtn: { padding: Spacing.xs },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.overlayLight, alignItems: 'center', justifyContent: 'center' },
  postTitle: { ...Typography.titleSm, color: Colors.textPrimary, flex: 1, fontSize: 14, fontWeight: '700' },
  bodyWrap: { marginBottom: Spacing.sm },
  postBody: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  readMore: { ...Typography.bodySmall, color: Colors.blue, fontWeight: '600', marginTop: 4 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaText: { ...Typography.caption, color: Colors.textTertiary, fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: Spacing['4xl'], gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textTertiary },
});
