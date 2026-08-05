import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, MessageCircle, PlusCircle, ShoppingBag } from 'lucide-react-native';

import { CategoryChip, ListingCard, SearchBar } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';
import { canPostListings } from '@/utils/verification';

export default function HomeScreen() {
  const { state, cartItemCount, unreadNotificationCount } = useApp();
  const { gridColumns, isDesktop, isWeb, contentMaxWidth, useSidebarNav } = useResponsive();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredListings = useMemo(
    () =>
      state.listings.filter(
        (l) => l.status === 'active' && (selectedCategory === 'all' || l.category === selectedCategory)
      ),
    [state.listings, selectedCategory]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const px = isDesktop ? Spacing['2xl'] : Spacing.lg;

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.contentWrap, { maxWidth: contentMaxWidth, alignSelf: 'center' as any, width: '100%' as any }]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: px }]}>
          <Text style={styles.headerTitle}>{useSidebarNav ? 'Marketplace' : 'Community Store'}</Text>
          <View style={styles.headerActions}>
            {/* Sell */}
            <Pressable onPress={() => {
              if (!canPostListings(state.user)) {
                Alert.alert('Restricted', 'Your vendor account is pending verification. You cannot post listings yet.');
                return;
              }
              router.push('/new-listing');
            }} style={[styles.iconBtn, isDesktop && styles.iconBtnPill]} accessibilityLabel="Create listing">
              <PlusCircle size={20} color={Colors.navy} />
              {isDesktop && <Text style={styles.iconBtnLabel}>Sell</Text>}
            </Pressable>
            {/* Messages — mobile only (sidebar has it on web) */}
            {!useSidebarNav && (
              <Pressable onPress={() => {
                if (!canPostListings(state.user)) {
                  Alert.alert('Restricted', 'Your vendor account is pending verification. You cannot send messages yet.');
                  return;
                }
                router.push('/(tabs)/messages');
              }} style={styles.iconBtn} accessibilityLabel="Messages">
                <MessageCircle size={20} color={Colors.navy} />
                {unreadNotificationCount > 0 && <View style={styles.badge} />}
              </Pressable>
            )}
            {/* Cart */}
            <Pressable onPress={() => router.push('/cart')} style={styles.iconBtn} accessibilityLabel="Cart">
              <ShoppingBag size={20} color={Colors.navy} />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </Pressable>
            {/* Notifications */}
            <Pressable onPress={() => router.push('/notifications')} style={styles.iconBtn} accessibilityLabel="Notifications">
              <Bell size={20} color={Colors.navy} />
              {unreadNotificationCount > 0 && <View style={styles.badge} />}
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { paddingHorizontal: px }]}>
          <SearchBar
            value={searchValue}
            onChangeText={setSearchValue}
            onSubmit={() => router.push(`/search-results?query=${searchValue}`)}
            placeholder="Search listings..."
          />
        </View>

        {/* Categories */}
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

        {/* Listings Grid */}
        <FlatList
          data={filteredListings}
          key={`grid-${gridColumns}`}
          numColumns={gridColumns}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={[styles.gridRow, { paddingHorizontal: px }]}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.navy} />
            ) : undefined
          }
          renderItem={({ item }) => (
            <View style={[styles.gridItem, { maxWidth: `${100 / gridColumns}%` as any }]}>
              <ListingCard
                listing={item}
                onPress={() => router.push(`/listing-detail?id=${item.id}`)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No listings in this category</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  contentWrap: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  headerTitle: { ...Typography.titleMd, color: Colors.navy },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: Spacing.xs, position: 'relative' },
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
    backgroundColor: Colors.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: Colors.textInverse, fontSize: 9, fontWeight: '700' },
  badge: { position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.danger },
  searchWrap: { marginBottom: Spacing.sm },
  chipRow: { paddingBottom: Spacing.sm, gap: Spacing.xs },
  gridContent: { paddingBottom: Spacing['3xl'] },
  gridRow: { gap: Spacing.sm, marginBottom: Spacing.sm },
  gridItem: { flex: 1 },
  empty: { paddingTop: Spacing['4xl'], alignItems: 'center' },
  emptyText: { ...Typography.body, color: Colors.textTertiary },
});
