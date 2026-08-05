import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

import { Button, StatusBadge } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function OrderConfirmedScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <CheckCircle size={80} color={Colors.success} fill={Colors.successLight} />
        <Text style={styles.title}>Order Confirmed!</Text>
        {orderId && <Text style={styles.orderId}>Order {orderId}</Text>}
        <StatusBadge status="confirmed" />
        <Text style={styles.body}>Thank you for your purchase. You'll receive a notification with pickup or delivery details.</Text>
        <View style={styles.actions}>
          <Button title="View Orders" onPress={() => router.replace('/(tabs)/profile')} fullWidth />
          <Button title="Continue Shopping" variant="secondary" onPress={() => router.replace('/(tabs)')} fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.lg },
  title: { ...Typography.displayMd, color: Colors.navy, textAlign: 'center' },
  orderId: { ...Typography.body, color: Colors.textSecondary },
  body: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  actions: { width: '100%', gap: Spacing.md, marginTop: Spacing.xl },
});
