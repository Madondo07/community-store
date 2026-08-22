import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, FileText, LogOut, Phone, ShieldAlert, ShieldCheck, Store } from 'lucide-react-native';

import { Avatar, Button, ListingImage, StatCard, StatusBadge } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { createNotification } from '@/lib/api/notifications';
import { approveVendor, getPendingVendors, rejectVendor, setUserSuspended } from '@/lib/api/profiles';
import { getAdminStats, getReports, updateReportStatus } from '@/lib/api/reports';
import { getVerificationDocSignedUrl } from '@/lib/api/storage';
import { supabase } from '@/lib/supabase';
import type { AdminStats, Report, UserProfile } from '@/types';

export default function AdminDashboardScreen() {
  const { state, dispatch } = useApp();
  const { isDesktop } = useResponsive();
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

  // A report can target a listing, a user, or both — the user to act on
  // for Warn/Suspend is whoever was reported, falling back to the
  // listing's seller for a listing-only report.
  const resolveTargetUserId = (report: Report): string | null =>
    report.reported_user_id ?? report.listing?.seller_id ?? null;

  const handleDismiss = async (report: Report) => {
    setActingOn(report.id);
    try {
      await updateReportStatus(report.id, 'reviewed');
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not dismiss report.');
    } finally {
      setActingOn(null);
    }
  };

  const handleRemoveContent = async (report: Report) => {
    setActingOn(report.id);
    try {
      // updateReportStatus already flips the listing's own status to
      // 'removed' when the report targets a listing (soft delete — the
      // row stays for record-keeping, Browse/Home just stop showing it).
      await updateReportStatus(report.id, 'removed');
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not remove content.');
    } finally {
      setActingOn(null);
    }
  };

  const handleWarn = async (report: Report) => {
    const targetId = resolveTargetUserId(report);
    if (!targetId) {
      Alert.alert('Error', 'No user to warn on this report.');
      return;
    }
    setActingOn(report.id);
    try {
      await createNotification({
        user_id: targetId,
        type: 'system',
        title: 'Warning from Community Store',
        body: `You've received a warning regarding a report: "${report.reason}"`,
      });
      await updateReportStatus(report.id, 'reviewed');
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not warn user.');
    } finally {
      setActingOn(null);
    }
  };

  const handleSuspend = (report: Report) => {
    const targetId = resolveTargetUserId(report);
    if (!targetId) {
      Alert.alert('Error', 'No user to suspend on this report.');
      return;
    }
    Alert.alert(
      'Suspend this user?',
      'They will be blocked from creating new listings. Existing listings and messages are unaffected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            setActingOn(report.id);
            try {
              await setUserSuspended(targetId, true);
              await createNotification({
                user_id: targetId,
                type: 'system',
                title: 'Account suspended',
                body: `Your account has been suspended following a report: "${report.reason}"`,
              });
              await updateReportStatus(report.id, 'reviewed');
              setReports((prev) => prev.filter((r) => r.id !== report.id));
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Could not suspend user.');
            } finally {
              setActingOn(null);
            }
          },
        },
      ],
    );
  };

  const handleViewDocument = async (path: string) => {
    try {
      const url = await getVerificationDocSignedUrl(path);
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not open document.');
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SIGN_OUT' });
    router.replace('/(auth)');
  };

  const pendingActionCount = pendingVendors.length + reports.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar uri={state.user.avatar_url} name={state.user.full_name} size="sm" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Signed in as {state.user.full_name}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/(tabs)')} style={styles.visitStoreBtn} accessibilityLabel="Visit store">
            <Store size={16} color={Colors.navy} />
            {isDesktop && <Text style={styles.visitStoreText}>Visit Store</Text>}
          </Pressable>
          <Pressable onPress={handleSignOut} style={styles.iconBtn} accessibilityLabel="Sign out">
            <LogOut size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
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

          {pendingActionCount === 0 && (
            <View style={styles.allClear}>
              <ShieldCheck size={32} color={Colors.success} />
              <Text style={styles.allClearText}>All caught up — nothing needs your attention right now.</Text>
            </View>
          )}

          {/* Pending Vendors */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Vendor Approvals</Text>
            {pendingVendors.length > 0 && (
              <View style={styles.countPill}><Text style={styles.countPillText}>{pendingVendors.length}</Text></View>
            )}
          </View>
          {pendingVendors.length === 0 && (
            <View style={styles.emptySection}>
              <CheckCircle2 size={18} color={Colors.textTertiary} />
              <Text style={styles.emptySectionText}>No pending vendor applications</Text>
            </View>
          )}
          {pendingVendors.map((vendor) => (
            <View key={vendor.id} style={styles.flaggedCard}>
              <View style={styles.flaggedTop}>
                <Avatar uri={vendor.avatar_url} name={vendor.full_name} size="md" />
                <View style={styles.flaggedInfo}>
                  <Text style={styles.flaggedTitle} numberOfLines={1}>{vendor.business_name ?? vendor.full_name}</Text>
                  <Text style={styles.flaggedReason}>{vendor.email}</Text>
                  {vendor.mobile_number && (
                    <View style={styles.inlineRow}>
                      <Phone size={12} color={Colors.textTertiary} />
                      <Text style={styles.flaggedReason}>{vendor.mobile_number}</Text>
                    </View>
                  )}
                  {vendor.registration_number && (
                    <Text style={styles.flaggedReason}>Reg. {vendor.registration_number}</Text>
                  )}
                  {vendor.verification_document_path && (
                    <Pressable
                      style={styles.inlineRow}
                      onPress={() => handleViewDocument(vendor.verification_document_path!)}
                    >
                      <FileText size={12} color={Colors.blue} />
                      <Text style={styles.docLink}>View submitted document</Text>
                    </Pressable>
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

          {/* Reports Queue — covers both reported listings and reported
              users; only the specific reported content is shown, not the
              reported user's other listings or message history. */}
          <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
            <Text style={styles.sectionTitle}>Reports Queue</Text>
            {reports.length > 0 && (
              <View style={styles.countPill}><Text style={styles.countPillText}>{reports.length}</Text></View>
            )}
          </View>
          {reports.length === 0 && (
            <View style={styles.emptySection}>
              <CheckCircle2 size={18} color={Colors.textTertiary} />
              <Text style={styles.emptySectionText}>No pending reports</Text>
            </View>
          )}
          {reports.map((item) => {
            const targetUser = item.reported_user;
            return (
              <View key={item.id} style={styles.flaggedCard}>
                <View style={styles.flaggedTop}>
                  {item.listing ? (
                    <ListingImage uri={item.listing.images[0]} style={styles.flaggedThumb} iconSize={20} />
                  ) : (
                    <Avatar uri={targetUser?.avatar_url} name={targetUser?.full_name ?? 'User'} size="md" />
                  )}
                  <View style={styles.flaggedInfo}>
                    <Text style={styles.flaggedTitle} numberOfLines={1}>
                      {item.listing?.title ?? targetUser?.full_name ?? 'Reported user'}
                    </Text>
                    <Text style={styles.flaggedReason}>Reason: {item.reason}</Text>
                    {item.reporter && (
                      <Text style={styles.flaggedReason}>Reported by {item.reporter.full_name}</Text>
                    )}
                    <StatusBadge status="pending" />
                  </View>
                </View>
                <View style={styles.flaggedActions}>
                  <Button
                    title="Dismiss"
                    variant="secondary"
                    size="sm"
                    disabled={actingOn === item.id}
                    onPress={() => handleDismiss(item)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Warn"
                    size="sm"
                    disabled={actingOn === item.id}
                    onPress={() => handleWarn(item)}
                    style={{ flex: 1 }}
                  />
                  {item.listing && (
                    <Button
                      title="Remove"
                      variant="danger"
                      size="sm"
                      disabled={actingOn === item.id}
                      onPress={() => handleRemoveContent(item)}
                      style={{ flex: 1 }}
                    />
                  )}
                  <Button
                    title="Suspend"
                    variant="danger"
                    size="sm"
                    disabled={actingOn === item.id}
                    onPress={() => handleSuspend(item)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            );
          })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexShrink: 1 },
  headerText: { flexShrink: 1 },
  headerTitle: { ...Typography.titleMd, color: Colors.navy },
  headerSubtitle: { ...Typography.bodySmall, color: Colors.textTertiary, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  visitStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  visitStoreText: { ...Typography.bodySmall, color: Colors.navy, fontWeight: '600' },
  iconBtn: { padding: Spacing.xs },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  allClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.successLight,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  allClearText: { ...Typography.bodySmall, color: Colors.success, flex: 1, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  countPill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: Colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: { ...Typography.caption, color: Colors.navy, fontWeight: '700' },
  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptySectionText: { ...Typography.bodySmall, color: Colors.textTertiary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  sectionTitle: { ...Typography.titleMd, color: Colors.textPrimary, marginBottom: Spacing.md },
  flaggedCard: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
  flaggedTop: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  flaggedThumb: { width: 70, height: 70, borderRadius: Radii.sm, backgroundColor: Colors.surfaceAlt },
  flaggedInfo: { flex: 1, gap: Spacing.xs },
  flaggedTitle: { ...Typography.titleSm, color: Colors.textPrimary },
  flaggedReason: { ...Typography.bodySmall, color: Colors.textSecondary },
  flaggedActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docLink: { ...Typography.bodySmall, color: Colors.blue, fontWeight: '600' },
});
