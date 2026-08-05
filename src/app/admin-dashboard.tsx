import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';

import { Button, StatCard, StatusBadge } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { MOCK_ADMIN_STATS, MOCK_FLAGGED_ITEMS } from '@/data/mockData';

export default function AdminDashboardScreen() {
  const { state } = useApp();

  if (state.user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}>
          <ShieldAlert size={64} color={Colors.danger} />
          <Text style={styles.deniedTitle}>Access Denied</Text>
          <Text style={styles.deniedBody}>This area is restricted to administrators.</Text>
          <Button title="Go Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Flagged" value={MOCK_ADMIN_STATS.flagged_listings} color={Colors.danger} />
          <StatCard label="Reported" value={MOCK_ADMIN_STATS.reported_users} color={Colors.warning} />
          <StatCard label="Listings" value={MOCK_ADMIN_STATS.active_listings} color={Colors.blue} />
          <StatCard label="Users" value={MOCK_ADMIN_STATS.active_users} color={Colors.success} />
        </View>

        {/* Flagged Items */}
        <Text style={styles.sectionTitle}>Flagged Listings</Text>
        {MOCK_FLAGGED_ITEMS.map((item) => (
          <View key={item.id} style={styles.flaggedCard}>
            <View style={styles.flaggedTop}>
              <Image source={{ uri: item.listing.images[0] }} style={styles.flaggedThumb} />
              <View style={styles.flaggedInfo}>
                <Text style={styles.flaggedTitle} numberOfLines={1}>{item.listing.title}</Text>
                <Text style={styles.flaggedReason}>{item.reason}</Text>
                <StatusBadge status={item.status === 'pending' ? 'pending' : 'flagged'} />
              </View>
            </View>
            <View style={styles.flaggedActions}>
              <Button title="Review" variant="secondary" size="sm" onPress={() => Alert.alert('Review', 'Reviewing...')} style={{ flex: 1 }} />
              <Button title="Approve" size="sm" onPress={() => Alert.alert('Approved', 'Listing approved')} style={{ flex: 1 }} />
              <Button title="Remove" variant="danger" size="sm" onPress={() => Alert.alert('Removed', 'Listing removed')} style={{ flex: 1 }} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  deniedTitle: { ...Typography.displayMd, color: Colors.danger },
  deniedBody: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  sectionTitle: { ...Typography.titleMd, color: Colors.textPrimary, marginBottom: Spacing.md },
  flaggedCard: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
  flaggedTop: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  flaggedThumb: { width: 70, height: 70, borderRadius: Radii.sm, backgroundColor: Colors.surfaceAlt },
  flaggedInfo: { flex: 1, gap: Spacing.xs },
  flaggedTitle: { ...Typography.titleSm, color: Colors.textPrimary },
  flaggedReason: { ...Typography.bodySmall, color: Colors.textSecondary },
  flaggedActions: { flexDirection: 'row', gap: Spacing.sm },
});
