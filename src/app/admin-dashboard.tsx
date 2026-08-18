import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';

import { Avatar, Button, StatCard, StatusBadge } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { createNotification } from '@/lib/api/notifications';
import { approveVendor, getPendingVendors, rejectVendor } from '@/lib/api/profiles';
import { getAdminStats, getReports, updateReportStatus } from '@/lib/api/reports';
import type { AdminStats, Report, ReportStatus, UserProfile } from '@/types';

export default function AdminDashboardScreen() {
  const { state } = useApp();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingVendors, setPendingVendors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([getAdminStats(), getReports({ status: 'pending' }), getPendingVendors()])
      .then(([s, r, v]) => {
        setStats(s);
        setReports(r);
        setPendingVendors(v);
      })
      .catch((err) => console.warn('Failed to load admin dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (state.user?.role === 'admin') load();
  }, [state.user, load]);

  const handleAction = async (reportId: string, status: ReportStatus) => {
    setActingOn(reportId);
    try {
      await updateReportStatus(reportId, status);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not update report.');
    } finally {
      setActingOn(null);
    }
  };

  const handleVendorDecision = async (vendor: UserProfile, approve: boolean) => {
    setActingOn(vendor.id);
    try {
      if (approve) {
        await approveVendor(vendor.id);
        await createNotification({
          user_id: vendor.id,
          type: 'system',
          title: 'Vendor account approved',
          body: 'Your business has been verified. You can now list items and message buyers.',
        });
      } else {
        await rejectVendor(vendor.id);
        await createNotification({
          user_id: vendor.id,
          type: 'system',
          title: 'Vendor verification rejected',
          body: 'Your vendor verification could not be approved. Contact support for details.',
        });
      }
      setPendingVendors((prev) => prev.filter((v) => v.id !== vendor.id));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not update vendor status.');
    } finally {
      setActingOn(null);
    }
  };

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

  // Listing-flagging reports only — the dashboard's flagged queue is
  // listing-focused; user reports would need a separate section.
  const flaggedListingReports = reports.filter((r) => r.reported_listing_id && r.listing);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.denied}><ActivityIndicator size="large" color={Colors.navy} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard label="Flagged" value={stats?.flagged_listings ?? 0} color={Colors.danger} />
            <StatCard label="Reported" value={stats?.reported_users ?? 0} color={Colors.warning} />
            <StatCard label="Listings" value={stats?.active_listings ?? 0} color={Colors.blue} />
            <StatCard label="Users" value={stats?.active_users ?? 0} color={Colors.success} />
          </View>

          {/* Pending Vendors */}
          <Text style={styles.sectionTitle}>Pending Vendor Approvals</Text>
          {pendingVendors.length === 0 && (
            <Text style={styles.flaggedReason}>No pending vendor applications</Text>
          )}
          {pendingVendors.map((vendor) => (
            <View key={vendor.id} style={styles.flaggedCard}>
              <View style={styles.flaggedTop}>
                <Avatar uri={vendor.avatar_url} name={vendor.full_name} size="md" />
                <View style={styles.flaggedInfo}>
                  <Text style={styles.flaggedTitle} numberOfLines={1}>{vendor.business_name ?? vendor.full_name}</Text>
                  <Text style={styles.flaggedReason}>{vendor.email}</Text>
                  {vendor.registration_number && (
                    <Text style={styles.flaggedReason}>Reg. {vendor.registration_number}</Text>
                  )}
                  <StatusBadge status="pending" />
                </View>
              </View>
              <View style={styles.flaggedActions}>
                <Button
                  title="Approve"
                  size="sm"
                  disabled={actingOn === vendor.id}
                  onPress={() => handleVendorDecision(vendor, true)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Reject"
                  variant="danger"
                  size="sm"
                  disabled={actingOn === vendor.id}
                  onPress={() => handleVendorDecision(vendor, false)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ))}

          {/* Flagged Items */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Flagged Listings</Text>
          {flaggedListingReports.length === 0 && (
            <Text style={styles.flaggedReason}>No pending reports</Text>
          )}
          {flaggedListingReports.map((item) => (
            <View key={item.id} style={styles.flaggedCard}>
              <View style={styles.flaggedTop}>
                <Image source={{ uri: item.listing!.images[0] }} style={styles.flaggedThumb} />
                <View style={styles.flaggedInfo}>
                  <Text style={styles.flaggedTitle} numberOfLines={1}>{item.listing!.title}</Text>
                  <Text style={styles.flaggedReason}>{item.reason}</Text>
                  <StatusBadge status={item.status === 'pending' ? 'pending' : 'flagged'} />
                </View>
              </View>
              <View style={styles.flaggedActions}>
                <Button
                  title="Review"
                  variant="secondary"
                  size="sm"
                  disabled={actingOn === item.id}
                  onPress={() => handleAction(item.id, 'reviewed')}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Approve"
                  size="sm"
                  disabled={actingOn === item.id}
                  onPress={() => handleAction(item.id, 'approved')}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Remove"
                  variant="danger"
                  size="sm"
                  disabled={actingOn === item.id}
                  onPress={() => handleAction(item.id, 'removed')}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
