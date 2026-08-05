import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Square, SquareCheck, Truck } from 'lucide-react-native';

import { Button } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { DeliveryMethod, PaymentMethod } from '@/types';

export default function CheckoutScreen() {
  const { state, dispatch, cartItemCount, cartTotal } = useApp();
  const [delivery, setDelivery] = useState<DeliveryMethod>('campus_pickup');
  const [payment, setPayment] = useState<PaymentMethod>('payfast');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const deliveryFee = delivery === 'vendor_delivery' ? 50 : 0;
  const total = cartTotal + deliveryFee;

  const handleConfirm = () => {
    const order = {
      id: `ORD-${Date.now()}`,
      buyer_id: state.user?.id ?? 'u1',
      items: state.cart.map((ci) => ({
        listing_id: ci.listing.id, title: ci.listing.title, price: ci.listing.price,
        quantity: ci.quantity, image: ci.listing.images[0],
      })),
      subtotal: cartTotal, delivery_fee: deliveryFee, total,
      delivery_method: delivery, payment_method: payment,
      status: 'confirmed' as const,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ORDER', payload: order });
    router.replace(`/order-confirmed?orderId=${order.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <Text style={styles.cardBody}>{cartItemCount} item{cartItemCount !== 1 ? 's' : ''} — R{cartTotal}</Text>
        </View>

        {/* Delivery */}
        <Text style={styles.sectionTitle}>Delivery Method</Text>
        <Pressable style={[styles.optionCard, delivery === 'campus_pickup' && styles.optionActive]} onPress={() => setDelivery('campus_pickup')}>
          <MapPin size={24} color={delivery === 'campus_pickup' ? Colors.navy : Colors.textTertiary} />
          <View style={styles.optionInfo}><Text style={styles.optionLabel}>Campus Pickup</Text><Text style={styles.optionMeta}>Free — collect at campus</Text></View>
          <Text style={styles.optionPrice}>R0</Text>
        </Pressable>
        <Pressable style={[styles.optionCard, delivery === 'vendor_delivery' && styles.optionActive]} onPress={() => setDelivery('vendor_delivery')}>
          <Truck size={24} color={delivery === 'vendor_delivery' ? Colors.navy : Colors.textTertiary} />
          <View style={styles.optionInfo}><Text style={styles.optionLabel}>Vendor Delivery</Text><Text style={styles.optionMeta}>Delivered to your address</Text></View>
          <Text style={styles.optionPrice}>R50</Text>
        </Pressable>

        {/* Payment */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <Pressable style={[styles.optionCard, payment === 'payfast' && styles.optionActive]} onPress={() => setPayment('payfast')}>
          <View style={styles.optionInfo}><Text style={styles.optionLabel}>PayFast</Text><Text style={styles.optionMeta}>Card, EFT, or Instant EFT</Text></View>
        </Pressable>
        <Pressable style={[styles.optionCard, payment === 'snapchat' && styles.optionActive]} onPress={() => setPayment('snapchat')}>
          <View style={styles.optionInfo}><Text style={styles.optionLabel}>SnapScan</Text><Text style={styles.optionMeta}>Scan to pay</Text></View>
        </Pressable>

        {/* Terms */}
        <Pressable style={styles.checkRow} onPress={() => setTermsAccepted(!termsAccepted)} accessibilityRole="checkbox" accessibilityState={{ checked: termsAccepted }}>
          {termsAccepted ? <SquareCheck size={22} color={Colors.navy} /> : <Square size={22} color={Colors.textTertiary} />}
          <Text style={styles.checkText}>I agree to the Terms of Service and Privacy Policy</Text>
        </Pressable>

        <Button
          title={`Confirm Payment — R${total}`}
          onPress={handleConfirm}
          disabled={!termsAccepted}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.lg, ...Shadows.sm, marginBottom: Spacing.xl },
  cardTitle: { ...Typography.titleSm, color: Colors.textPrimary },
  cardBody: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  sectionTitle: { ...Typography.titleMd, color: Colors.textPrimary, marginBottom: Spacing.md },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.lg, borderWidth: 1.5, borderColor: Colors.border, marginBottom: Spacing.md, gap: Spacing.md },
  optionActive: { borderColor: Colors.navy, backgroundColor: Colors.overlayLight },
  optionInfo: { flex: 1 },
  optionLabel: { ...Typography.titleSm, color: Colors.textPrimary },
  optionMeta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  optionPrice: { ...Typography.titleSm, color: Colors.navy },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xl },
  checkText: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
});
