import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, MessageCircle, PlusCircle, ShoppingBag } from 'lucide-react-native';

import { CategoryChip, ListingCard, SearchBar } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';
import { canPostListings } from '@/utils/verification';
import type { Listing } from '@/types';

// Vendor seller IDs — their listings get the "Sponsored" badge
const VENDOR_IDS = new Set(['u4']);

interface GridItem extends Listing {
  _sponsored: boolean;
}

export default function HomeScreen() {
  const { state, cartItemCount, unreadNotificationCount } = useApp();
  const { gridColumns, isDesktop, isWeb, contentMaxWidth, useSidebarNav } = useResponsive();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Build grid data: sponsored items sorted to front, all same card
  const gridData = useMemo(() => {
    const active = state.listings.filter(
      (l) => l.status === 'active' && (selectedCategory === 'all' || l.category === selectedCategory)
    );

    const sponsored: GridItem[] = [];
    const regular: GridItem[] = [];

    for (const l of active) {
      if (VENDOR_IDS.has(l.seller_id) || l.seller?.role === 'vendor') {
        sponsored.push({ ...l, _sponsored: true });
      } else {
        regular.push({ ...l, _sponsored: false });
      }
    }

    // Sponsored first, then regular
    return [...sponsored, ...regular];
  }, [state.listings, selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const px = isDesktop ? Spacing['2xl'] : Spacing.lg;

  const renderItem = useCallback(({ item }: { item: GridItem }) => (
    <View style={styles.gridCell}>
      <ListingCard
        listing={item}
        sponsored={item._sponsored}
        onPress={() => router.push(`/listing-detail?id=${item.id}`)}
      />
    </View>
  ), []);

  const ListHeader = useCallback(() => (
    <View>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: px }]}>
        <Text style={styles.headerTitle}>{useSidebarNav ? 'Marketplace' : 'Community Store'}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => {
            if (!canPostListings(state.user)) {
              Alert.alert('Restricted', 'Your vendor account is pending verification.');
              return;
            }
            router.push('/new-listing');
          }} style={[styles.iconBtn, isDesktop && styles.iconBtnPill]} accessibilityLabel="Create listing">
            <PlusCircle size={Spacing.xl} color={Colors.navy} />
            {isDesktop && <Text style={styles.iconBtnLabel}>Sell</Text>}
          </Pressable>
          {!useSidebarNav && (
            <Pressable onPress={() => {
              if (!canPostListings(state.user)) {
                Alert.alert('Restricted', 'Your vendor account is pending verification.');
                return;
              }
              router.push('/(tabs)/messages');
            }} style={styles.iconBtn} accessibilityLabel="Messages">
              <MessageCircle size={Spacing.xl} color={Colors.navy} />
              {unreadNotificationCount > 0 && <View style={styles.dot} />}
            </Pressable>
          )}
          <Pressable onPress={() => router.push('/cart')} style={styles.iconBtn} accessibilityLabel="Cart">
            <ShoppingBag size={Spacing.xl} color={Colors.navy} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartItemCount}</Text></View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} style={styles.iconBtn} accessibilityLabel="Notifications">
            <Bell size={Spacing.xl} color={Colors.navy} />
            {unreadNotificationCount > 0 && <View style={styles.dot} />}
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: px, marginBottom: Spacing.sm }}>
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          onSubmit={() => router.push(`/search-results?query=${searchValue}`)}
          placeholder="Search listings..."
        />
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipRow, { paddingHorizontal: px }]}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.key}
            label={cat.label}
            selected={selectedCategory === cat.key}
            onPress={() => setSelectedCategory(cat.key)}
          />
        ))}
      </ScrollView>

      {/* Section title */}
      <Text style={[styles.sectionTitle, { paddingHorizontal: px }]}>
        {selectedCategory === 'all' ? 'All Listings' : CATEGORIES.find(c => c.key === selectedCategory)?.label ?? 'Listings'}
      </Text>
    </View>
  ), [px, useSidebarNav, isDesktop, searchValue, selectedCategory, state.user, cartItemCount, unreadNotificationCount]);

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.container, { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as any }]}>
        <FlashList
          data={gridData}
          numColumns={gridColumns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No listings in this category</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing['3xl'], paddingHorizontal: px }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.navy} />
            ) : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  headerTitle: { ...Typography.titleMd, color: Colors.navy },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: Spacing.xs, position: 'relative' as const },
  iconBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.overlayLight,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  iconBtnLabel: { ...Typography.bodySmall, color: Colors.navy, fontWeight: '600' },
  cartBadge: {
    position: 'absolute', top: 0, right: -2,
    backgroundColor: Colors.danger, borderRadius: Spacing.sm,
    minWidth: Spacing.lg, height: Spacing.lg, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: Colors.textInverse, fontSize: 9, fontWeight: '700' },
  dot: { position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: Spacing.xs, backgroundColor: Colors.danger },

  chipRow: { paddingBottom: Spacing.md, gap: Spacing.sm },
  sectionTitle: {
    ...Typography.titleSm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Grid
  gridCell: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  empty: { paddingTop: Spacing['4xl'], alignItems: 'center' },
  emptyText: { ...Typography.body, color: Colors.textTertiary },
});
