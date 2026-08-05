import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';

import { Button } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';

export default function CartScreen() {
  const { state, dispatch, cartItemCount, cartTotal } = useApp();
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();
  const padding = isDesktop ? Spacing['2xl'] : Spacing.xl;

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.contentWrap, { maxWidth: contentMaxWidth }]}>
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={24} color={Colors.textPrimary} /></Pressable>
          <Text style={styles.headerTitle}>Cart ({cartItemCount})</Text>
          <View style={{ width: 24 }} />
        </View>

        {state.cart.length === 0 ? (
          <View style={styles.empty}>
            <ShoppingCart size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Button title="Browse Listings" variant="secondary" onPress={() => router.replace('/(tabs)')} />
          </View>
        ) : (
          <View style={styles.flex}>
            <View style={isDesktop ? styles.itemsDesktop : undefined}>
              {state.cart.map((item) => (
                <View key={item.id} style={[styles.itemRow, { marginHorizontal: padding }]}>
                  <Image source={{ uri: item.listing.images[0] }} style={[styles.thumb, isDesktop && styles.thumbDesktop]} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.listing.title}</Text>
                    <Text style={styles.itemPrice}>R{item.listing.price}</Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => dispatch({ type: 'UPDATE_CART_QTY', payload: { id: item.id, quantity: item.quantity - 1 } })} style={styles.stepBtn}>
                      <Minus size={16} color={Colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <Pressable onPress={() => dispatch({ type: 'UPDATE_CART_QTY', payload: { id: item.id, quantity: item.quantity + 1 } })} style={styles.stepBtn}>
                      <Plus size={16} color={Colors.textPrimary} />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.id })} hitSlop={8} accessibilityLabel="Remove">
                    <Trash2 size={18} color={Colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={[styles.summary, { paddingHorizontal: padding }, isDesktop && styles.summaryDesktop]}>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>R{cartTotal}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery Fee</Text><Text style={styles.summaryValue}>R0</Text></View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>R{cartTotal}</Text></View>
              <Button title="Proceed to Checkout" onPress={() => router.push('/checkout')} fullWidth={!isDesktop} size="lg" style={{ marginTop: Spacing.lg, ...(isDesktop ? { minWidth: 280 } : {}) }} />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  contentWrap: { flex: 1, alignSelf: 'center' as any, width: '100%' as any },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xl },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  emptyTitle: { ...Typography.titleMd, color: Colors.textPrimary },
  itemsDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.lg, marginBottom: Spacing.sm, borderRadius: Radii.md, ...Shadows.sm },
  thumb: { width: 60, height: 60, borderRadius: Radii.sm, backgroundColor: Colors.surfaceAlt },
  thumbDesktop: { width: 80, height: 80 },
  itemInfo: { flex: 1, marginLeft: Spacing.md },
  itemTitle: { ...Typography.titleSm, color: Colors.textPrimary },
  itemPrice: { ...Typography.priceSm, color: Colors.navy, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginRight: Spacing.md },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  qty: { ...Typography.titleSm, color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },
  summary: { paddingVertical: Spacing.xl, marginTop: 'auto' as any },
  summaryDesktop: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing['2xl'], marginTop: Spacing.xl, ...Shadows.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { ...Typography.body, color: Colors.textSecondary },
  summaryValue: { ...Typography.body, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  totalLabel: { ...Typography.titleMd, color: Colors.textPrimary },
  totalValue: { ...Typography.price, color: Colors.navy },
});
