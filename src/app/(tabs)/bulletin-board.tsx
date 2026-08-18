import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Megaphone, Search, Wrench } from 'lucide-react-native';

import { CategoryChip } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { BULLETIN_CATEGORIES } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';
import { getBulletinPosts } from '@/lib/api/bulletin';
import type { BulletinPost } from '@/types';

const TYPE_ICONS: Record<string, typeof Calendar> = {
  events: Calendar,
  services: Wrench,
  lost_and_found: Search,
};

export default function BulletinBoardTab() {
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();
  const [selectedCat, setSelectedCat] = useState('all');
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const padding = isDesktop ? Spacing['2xl'] : Spacing.lg;

  useEffect(() => {
    getBulletinPosts()
      .then(setPosts)
      .catch((err) => console.warn('Failed to load bulletin posts:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedCat === 'all'
    ? posts
    : posts.filter((p) => p.category === selectedCat);

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.contentWrap, { maxWidth: contentMaxWidth }]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <View>
            <Text style={styles.headerTitle}>Bulletin Board</Text>
            <Text style={styles.headerSub}>CPUT Newsflash</Text>
          </View>
          <Megaphone size={22} color={Colors.teal} />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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
              return (
                <View style={[styles.postCard, isDesktop && styles.postCardDesktop]}>
                  <View style={styles.postHeader}>
                    <View style={styles.iconWrap}><Icon size={18} color={Colors.blue} /></View>
                    <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
                  </View>
                  <Text style={styles.postBody} numberOfLines={2}>{item.body}</Text>
                  <View style={styles.postMeta}>
                    {item.location && (
                      <View style={styles.metaItem}>
                        <MapPin size={12} color={Colors.textTertiary} />
                        <Text style={styles.metaText}>{item.location}</Text>
                      </View>
                    )}
                    <Text style={styles.metaText}>{new Date(item.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</Text>
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
  chipRow: { paddingBottom: Spacing.md, gap: Spacing.sm },
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
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.overlayLight, alignItems: 'center', justifyContent: 'center' },
  postTitle: { ...Typography.titleSm, color: Colors.textPrimary, flex: 1, fontSize: 14 },
  postBody: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaText: { ...Typography.caption, color: Colors.textTertiary, fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: Spacing['4xl'], gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textTertiary },
});
