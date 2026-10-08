import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Bell, PlusCircle, ShoppingBag } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChip, IconButton, ListingCard, SearchBar } from '@/components/ui';
import { Colors, FontFamily, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useAppTheme } from '@/context/ThemeContext';
import { CATEGORIES } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';
import { getListings } from '@/lib/api/listings';
import type { Listing } from '@/types';
import { canPostListings } from '@/utils/verification';

export default function HomeScreen() {
  const { state, cartItemCount } = useApp();
  const { unreadCount } = useNotifications();
  const { gridColumns, isDesktop, isWeb, contentMaxWidth, useSidebarNav } = useResponsive();
  const { colors } = useAppTheme();
  const styles = useMemoStyles(colors);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);

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
  ), [styles]);

  const ListHeader = useCallback(() => (
    <View>
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
        {/* Home's three actions: Sell, Cart, Notifications. (Messages is the
            tab; the theme toggle lives in Settings.) */}
        <View style={styles.headerActions}>
          <IconButton onPress={() => {
            if (!canPostListings(state.user)) {
              Alert.alert('Restricted', 'Your vendor account is pending verification.');
              return;
            }
            router.push('/new-listing');
          }} style={[styles.iconBtn, isDesktop && styles.iconBtnPill]} accessibilityLabel="Create listing">
            <PlusCircle size={Spacing.xl} color={colors.navy} />
            {isDesktop && <Text style={styles.iconBtnLabel}>Sell</Text>}
          </IconButton>
          <IconButton onPress={() => router.push('/cart')} style={styles.iconBtn} accessibilityLabel="Cart">
            <ShoppingBag size={Spacing.xl} color={colors.navy} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartItemCount}</Text></View>
            )}
          </IconButton>
          <IconButton onPress={() => router.push('/notifications')} style={styles.iconBtn} accessibilityLabel="Notifications">
            <Bell size={Spacing.xl} color={colors.navy} />
            {unreadCount > 0 && <View style={styles.dot} />}
          </IconButton>
        </View>
      </View>

      <View style={{ paddingHorizontal: px, marginBottom: Spacing.sm }}>
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          onSubmit={() => router.push(`/search-results?query=${searchValue}`)}
          placeholder="Search listings..."
        />
      </View>

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

      <Text style={[styles.sectionTitle, { paddingHorizontal: px }]}>
        {selectedCategory === 'all' ? 'All Listings' : CATEGORIES.find(c => c.key === selectedCategory)?.label ?? 'Listings'}
      </Text>
    </View>
  ), [px, useSidebarNav, isDesktop, searchValue, selectedCategory, state.user, cartItemCount, unreadCount, styles, colors]);

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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />
            ) : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}

function useMemoStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        container: { flex: 1 },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: Spacing.sm,
        },
        headerTitle: { ...Typography.titleMd, color: colors.navy, fontFamily: FontFamily.headingBold },
        brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
        brandLogo: { width: 24, height: 24 },
        headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
        iconBtn: { padding: Spacing.xs, position: 'relative' as const },
        cartBadge: {
          position: 'absolute', top: 0, right: -2,
          backgroundColor: colors.danger, borderRadius: Spacing.sm,
          minWidth: Spacing.lg, height: Spacing.lg, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
        },
        cartBadgeText: { color: Colors.textInverse, fontSize: 9, fontWeight: '700' },
        dot: { position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: Spacing.xs, backgroundColor: colors.danger },
        iconBtnPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.xs,
          backgroundColor: colors.overlayLight,
          borderRadius: Radii.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
        },
        iconBtnLabel: { ...Typography.bodySmall, color: colors.navy, fontWeight: '600' },
        chipRow: { paddingBottom: Spacing.md, gap: Spacing.sm },
        sectionTitle: { ...Typography.titleSm, color: colors.textPrimary, marginBottom: Spacing.sm },
        gridCell: { flex: 1, paddingHorizontal: Spacing.xs },
        empty: { paddingTop: Spacing['4xl'], alignItems: 'center' },
        emptyText: { ...Typography.body, color: colors.textTertiary },
      }),
    [colors]
  );
}