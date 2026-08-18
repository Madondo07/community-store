import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bookmark,
  CheckCircle,
  Newspaper,
  Pencil,
  PlusCircle,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';

import { Avatar, Button, StatusBadge, VerifiedBadge } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { deleteListing, getListingsBySeller, getListingsByIds } from '@/lib/api/listings';
import { getMyOrders } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase';
import { canPostListings } from '@/utils/verification';
import type { Listing, Order } from '@/types';

const TABS = ['Listings', 'Posts', 'Orders', 'Saved'] as const;

export default function ProfileScreen() {
  const { state, dispatch } = useApp();
  const { user } = state;
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Listings');
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistListings, setWishlistListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No early setState here for the !user case — the component itself
    // short-circuits to a "Sign In" view below when there's no user, so
    // `loading` is never consulted in that branch.
    if (!user) return;
    Promise.all([
      getListingsBySeller(user.id, { status: null }),
      getMyOrders(),
    ])
      .then(([listings, myOrders]) => {
        setUserListings(listings);
        setOrders(myOrders);
      })
      .catch((err) => console.warn('Failed to load profile data:', err))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    // getListingsByIds([]) resolves to [] itself, so no need to special-case
    // the empty-wishlist branch with a synchronous setState here.
    getListingsByIds(state.wishlist)
      .then(setWishlistListings)
      .catch((err) => console.warn('Failed to load saved listings:', err));
  }, [state.wishlist]);

  const handleDeleteListing = async (id: string) => {
    try {
      await deleteListing(id);
      setUserListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not delete listing.');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Button title="Sign In" onPress={() => router.replace('/(auth)')} />
        </View>
      </SafeAreaView>
    );
  }

  const padding = isDesktop ? Spacing['2xl'] : Spacing.xl;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Listings':
        return userListings.length > 0 ? (
          <View style={isDesktop ? styles.listingsGrid : undefined}>
            {userListings.map((listing) => (
              <View key={listing.id} style={[styles.listingRow, isDesktop && styles.listingRowDesktop]}>
                <Image source={{ uri: listing.images[0] }} style={styles.listingThumb} />
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>R{listing.price}</Text>
                </View>
                <View style={styles.listingActions}>
                  <Pressable hitSlop={8} accessibilityLabel="Edit"><Pencil size={18} color={Colors.textSecondary} /></Pressable>
                  <Pressable hitSlop={8} accessibilityLabel="Mark sold"><CheckCircle size={18} color={Colors.success} /></Pressable>
                  <Pressable hitSlop={8} onPress={() => handleDeleteListing(listing.id)} accessibilityLabel="Delete">
                    <Trash2 size={18} color={Colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTab}><Text style={styles.emptyTabText}>No listings yet</Text></View>
        );
      case 'Orders':
        return orders.length > 0 ? (
          <View style={isDesktop ? styles.ordersGrid : undefined}>
            {orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <StatusBadge status={order.status === 'confirmed' ? 'confirmed' : 'pending'} />
                </View>
                <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('en-ZA')}</Text>
                <Text style={styles.orderTotal}>R{order.total}</Text>
                {order.status === 'confirmed' && order.items[0]?.listing_id && (
                  <Button
                    title="Rate Purchase"
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push(`/rate-purchase?listingId=${order.items[0].listing_id}`)}
                    style={{ marginTop: Spacing.sm }}
                  />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTab}><Text style={styles.emptyTabText}>No orders yet</Text></View>
        );
      case 'Posts':
        return <View style={styles.emptyTab}><Newspaper size={48} color={Colors.textTertiary} /><Text style={styles.emptyTabText}>No posts yet</Text></View>;
      case 'Saved':
        return wishlistListings.length > 0 ? (
          <View style={isDesktop ? styles.listingsGrid : undefined}>
            {wishlistListings.map((listing) => (
              <View key={listing.id} style={[styles.listingRow, isDesktop && styles.listingRowDesktop]}>
                <Image source={{ uri: listing.images[0] }} style={styles.listingThumb} />
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>R{listing.price}</Text>
                </View>
                <Pressable hitSlop={8} onPress={() => dispatch({ type: 'TOGGLE_WISHLIST', payload: listing.id })} accessibilityLabel="Remove from wishlist">
                  <Trash2 size={18} color={Colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTab}><Bookmark size={48} color={Colors.textTertiary} /><Text style={styles.emptyTabText}>No saved items</Text><Text style={styles.emptyTabHint}>Tap the heart icon on any listing to save it</Text></View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.contentWrap, { maxWidth: contentMaxWidth, paddingHorizontal: padding }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable onPress={() => router.push('/settings')} accessibilityLabel="Settings">
              <Settings size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* User section — side-by-side on desktop */}
          <View style={[styles.userSection, isDesktop && styles.userSectionDesktop]}>
            <View style={[styles.userInfo, isDesktop && styles.userInfoDesktop]}>
              <Avatar uri={user.avatar_url} name={user.full_name} size="xl" />
              <View style={isDesktop ? { marginLeft: Spacing.xl } : undefined}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.userName}>{user.full_name}</Text>
                  <VerifiedBadge user={user} size={18} />
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
                </View>
              </View>
            </View>

            {/* Sell Button */}
            <Button
              title="Sell an Item"
              onPress={() => {
                if (!canPostListings(user)) {
                  Alert.alert('Restricted', 'Your vendor account is pending verification. You cannot post listings yet.');
                  return;
                }
                router.push('/new-listing');
              }}
              fullWidth={!isDesktop}
              size="lg"
              icon={<PlusCircle size={20} color={Colors.textInverse} />}
              style={isDesktop ? { minWidth: 200 } : undefined}
            />
          </View>

          {/* Admin Dashboard Link — only for admin users */}
          {user.role === 'admin' && (
            <Button
              title="Admin Dashboard"
              variant="secondary"
              onPress={() => router.push('/admin-dashboard')}
              fullWidth
              size="md"
              icon={<ShieldCheck size={18} color={Colors.navy} />}
            />
          )}

          {/* Tabs */}
          <View style={styles.tabRow}>
            {TABS.map((tab) => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {loading ? <ActivityIndicator size="large" color={Colors.navy} /> : renderTabContent()}
          </View>

          {/* Extra Actions */}
          <View style={[styles.extraActions, isDesktop && styles.extraActionsDesktop]}>
            {user.role === 'admin' && (
              <Button title="Admin Dashboard" variant="secondary" onPress={() => router.push('/admin-dashboard')} fullWidth={!isDesktop} />
            )}
            <Button
              title="Sign Out"
              variant="secondary"
              onPress={async () => { await supabase.auth.signOut(); dispatch({ type: 'SIGN_OUT' }); router.replace('/(auth)'); }}
              fullWidth={!isDesktop}
              style={{ borderColor: Colors.danger }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contentWrap: { alignSelf: 'center' as any, width: '100%' as any, paddingBottom: Spacing['4xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  userSection: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  userSectionDesktop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { alignItems: 'center' },
  userInfoDesktop: { flexDirection: 'row', alignItems: 'center' },
  userName: { ...Typography.titleLg, color: Colors.textPrimary, marginTop: Spacing.md },
  roleBadge: { backgroundColor: Colors.blue, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radii.full, marginTop: Spacing.sm, alignSelf: 'center' },
  roleBadgeText: { ...Typography.bodySmall, color: Colors.textInverse, fontWeight: '600' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.navy },
  tabText: { ...Typography.titleSm, color: Colors.textTertiary },
  tabTextActive: { color: Colors.navy },
  tabContent: { marginTop: Spacing.lg, minHeight: 120 },
  listingsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  listingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm },
  listingRowDesktop: { width: '48%', flexGrow: 1 },
  listingThumb: { width: 60, height: 60, borderRadius: Radii.sm, backgroundColor: Colors.surfaceAlt },
  listingInfo: { flex: 1, marginLeft: Spacing.md },
  listingTitle: { ...Typography.titleSm, color: Colors.textPrimary },
  listingPrice: { ...Typography.priceSm, color: Colors.navy, marginTop: 2 },
  listingActions: { flexDirection: 'row', gap: Spacing.md },
  ordersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  orderCard: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm, minWidth: 280, flexGrow: 1 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { ...Typography.titleSm, color: Colors.textPrimary },
  orderDate: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  orderTotal: { ...Typography.price, color: Colors.navy, marginTop: Spacing.sm },
  emptyTab: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyTabText: { ...Typography.body, color: Colors.textTertiary },
  emptyTabHint: { ...Typography.bodySmall, color: Colors.textTertiary, textAlign: 'center' },
  extraActions: { marginTop: Spacing['2xl'], paddingTop: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.md },
  extraActionsDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
});
