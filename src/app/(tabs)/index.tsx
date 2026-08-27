import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Bell, MessageCircle, PlusCircle, ShoppingBag } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChip, ListingCard, SearchBar } from '@/components/ui';
import { Colors, FontFamily, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';
import { getListings } from '@/lib/api/listings';
import { getUnreadNotificationCount } from '@/lib/api/notifications';
import type { Listing } from '@/types';
import { canPostListings } from '@/utils/verification';

export default function HomeScreen() {
  const { state, cartItemCount } = useApp();
  const { gridColumns, isDesktop, isWeb, contentMaxWidth, useSidebarNav } = useResponsive();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userId = state.user?.id;

  const loadListings = useCallback(async () => {
    try {
      const data = await getListings({ excludeSellerId: userId });
      setListings(data);
    } catch (err) {
      console.warn('Failed to load listings:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    const uid = state.user?.id;
    (uid ? getUnreadNotificationCount(uid) : Promise.resolve(0))
      .then(setUnreadCount)
      .catch((err) => console.warn('Failed to load unread count:', err));
  }, [state.user]);

  const gridData = useMemo(() => {
    return listings.filter(
      (l) => selectedCategory === 'all' || l.category === selectedCategory
    );
  }, [listings, selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  }, [loadListings]);

  const px = isDesktop ? Spacing['2xl'] : Spacing.lg;

  const renderItem = useCallback(({ item }: { item: Listing }) => (
    <View style={styles.gridCell}>
      <ListingCard
        listing={item}
        onPress={() => router.push(`/listing-detail?id=${item.id}`)}
      />
    </View>
  ), []);

  const ListHeader = useCallback(() => (
    <View>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: px }]}>
        {useSidebarNav ? (
          <Text style={styles.headerTitle}>Marketplace</Text>
        ) : (
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/images/Swych_Icon_Only_Transparent.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Swych</Text>
          </View>
        )}
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
              {unreadCount > 0 && <View style={styles.dot} />}
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
            {unreadCount > 0 && <View style={styles.dot} />}
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
  ), [px, useSidebarNav, isDesktop, searchValue, selectedCategory, state.user, cartItemCount, unreadCount]);

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
  headerTitle: { ...Typography.titleMd, color: Colors.navy, fontFamily: FontFamily.headingBold },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  brandLogo: { width: 24, height: 24 },
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
