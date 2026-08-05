import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Shield,
  Trash2,
  User,
} from 'lucide-react-native';

import { AuthInput, Avatar, Button } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';

// ── Section Component ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sStyles.section}>
      <Text style={sStyles.sectionTitle}>{title}</Text>
      <View style={sStyles.sectionCard}>{children}</View>
    </View>
  );
}

// ── Row Component ──
function Row({
  icon,
  label,
  value,
  onPress,
  danger,
  rightElement,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: any) => [sStyles.row, pressed && { opacity: 0.7 }]}
      accessibilityLabel={label}
    >
      <View style={sStyles.rowLeft}>
        {icon}
        <Text style={[sStyles.rowLabel, danger && { color: Colors.danger }]}>{label}</Text>
      </View>
      {rightElement ?? (
        <View style={sStyles.rowRight}>
          {value ? <Text style={sStyles.rowValue}>{value}</Text> : null}
          {onPress ? <ChevronRight size={18} color={Colors.textTertiary} /> : null}
        </View>
      )}
    </Wrapper>
  );
}

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const { user } = state;
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();
  const padding = isDesktop ? Spacing['2xl'] : Spacing.lg;

  // ── Edit Profile state ──
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  // ── Change Password state ──
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // ── Notification Preferences ──
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [messages, setMessages] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [bulletinAlerts, setBulletinAlerts] = useState(true);

  const handleSaveProfile = () => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { full_name: fullName, email } });
    setEditingProfile(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleChangePassword = () => {
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setEditingPassword(false);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    Alert.alert('Success', 'Password updated successfully');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone. All your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'SIGN_OUT' });
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    dispatch({ type: 'SIGN_OUT' });
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.contentWrap, { maxWidth: contentMaxWidth, paddingHorizontal: padding }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Go back">
              <ArrowLeft size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* ── Profile Information ── */}
          <Section title="Profile Information">
            {!editingProfile ? (
              <>
                <View style={sStyles.profileHeader}>
                  <Avatar uri={user?.avatar_url} name={user?.full_name ?? ''} size="lg" />
                  <View style={sStyles.profileInfo}>
                    <Text style={sStyles.profileName}>{user?.full_name}</Text>
                    <Text style={sStyles.profileEmail}>{user?.email}</Text>
                    <View style={sStyles.profileRoleBadge}>
                      <Text style={sStyles.profileRoleText}>
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => setEditingProfile(true)}
                  style={sStyles.editBtn}
                >
                  <Text style={sStyles.editBtnText}>Edit Profile</Text>
                </Pressable>
              </>
            ) : (
              <View style={sStyles.formSection}>
                <AuthInput
                  icon={<User size={18} color={Colors.textTertiary} />}
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
                <AuthInput
                  icon={<Mail size={18} color={Colors.textTertiary} />}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  hint="Use your @cput.ac.za email"
                />
                <View style={sStyles.formActions}>
                  <Button title="Save Changes" onPress={handleSaveProfile} size="sm" />
                  <Button
                    title="Cancel"
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      setEditingProfile(false);
                      setFullName(user?.full_name ?? '');
                      setEmail(user?.email ?? '');
                    }}
                  />
                </View>
              </View>
            )}
          </Section>

          {/* ── Password ── */}
          <Section title="Password">
            {!editingPassword ? (
              <Row
                icon={<KeyRound size={20} color={Colors.textSecondary} />}
                label="Change Password"
                onPress={() => setEditingPassword(true)}
              />
            ) : (
              <View style={sStyles.formSection}>
                <AuthInput
                  icon={<Lock size={18} color={Colors.textTertiary} />}
                  placeholder="Current Password"
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry
                />
                <AuthInput
                  icon={<Lock size={18} color={Colors.textTertiary} />}
                  placeholder="New Password"
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry
                  hint="Minimum 8 characters"
                />
                <AuthInput
                  icon={<Lock size={18} color={Colors.textTertiary} />}
                  placeholder="Confirm New Password"
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry
                />
                <View style={sStyles.formActions}>
                  <Button title="Update Password" onPress={handleChangePassword} size="sm" />
                  <Button
                    title="Cancel"
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      setEditingPassword(false);
                      setCurrentPw('');
                      setNewPw('');
                      setConfirmPw('');
                    }}
                  />
                </View>
              </View>
            )}
          </Section>

          {/* ── Notification Preferences ── */}
          <Section title="Notification Preferences">
            <Row
              icon={<Bell size={20} color={Colors.textSecondary} />}
              label="Push Notifications"
              rightElement={
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: Colors.border, true: Colors.teal }}
                  thumbColor={Colors.surface}
                />
              }
            />
            <View style={sStyles.divider} />
            <Row
              icon={<Mail size={20} color={Colors.textSecondary} />}
              label="Email Notifications"
              rightElement={
                <Switch
                  value={emailNotif}
                  onValueChange={setEmailNotif}
                  trackColor={{ false: Colors.border, true: Colors.teal }}
                  thumbColor={Colors.surface}
                />
              }
            />
            <View style={sStyles.divider} />
            <Row
              icon={<Bell size={20} color={Colors.textSecondary} />}
              label="Order Updates"
              rightElement={
                <Switch
                  value={orderUpdates}
                  onValueChange={setOrderUpdates}
                  trackColor={{ false: Colors.border, true: Colors.teal }}
                  thumbColor={Colors.surface}
                />
              }
            />
            <View style={sStyles.divider} />
            <Row
              icon={<Bell size={20} color={Colors.textSecondary} />}
              label="New Messages"
              rightElement={
                <Switch
                  value={messages}
                  onValueChange={setMessages}
                  trackColor={{ false: Colors.border, true: Colors.teal }}
                  thumbColor={Colors.surface}
                />
              }
            />
            <View style={sStyles.divider} />
            <Row
              icon={<Bell size={20} color={Colors.textSecondary} />}
              label="Bulletin Board Alerts"
              rightElement={
                <Switch
                  value={bulletinAlerts}
                  onValueChange={setBulletinAlerts}
                  trackColor={{ false: Colors.border, true: Colors.teal }}
                  thumbColor={Colors.surface}
                />
              }
            />
            <View style={sStyles.divider} />
            <Row
              icon={<Bell size={20} color={Colors.textSecondary} />}
              label="Promotions & Deals"
              rightElement={
                <Switch
                  value={promotions}
                  onValueChange={setPromotions}
                  trackColor={{ false: Colors.border, true: Colors.teal }}
                  thumbColor={Colors.surface}
                />
              }
            />
          </Section>

          {/* ── Privacy & Security ── */}
          <Section title="Privacy & Security">
            <Row
              icon={<Shield size={20} color={Colors.textSecondary} />}
              label="Two-Factor Authentication"
              value="Off"
              onPress={() => Alert.alert('2FA', 'Two-factor authentication setup coming soon')}
            />
            <View style={sStyles.divider} />
            <Row
              icon={<Globe size={20} color={Colors.textSecondary} />}
              label="Profile Visibility"
              value="Public"
              onPress={() => Alert.alert('Visibility', 'Profile visibility settings coming soon')}
            />
          </Section>

          {/* ── Account Actions ── */}
          <Section title="Account">
            <Row
              icon={<LogOut size={20} color={Colors.textSecondary} />}
              label="Sign Out"
              onPress={handleSignOut}
            />
            <View style={sStyles.divider} />
            <Row
              icon={<Trash2 size={20} color={Colors.danger} />}
              label="Delete Account"
              onPress={handleDeleteAccount}
              danger
            />
          </Section>

          <View style={styles.versionWrap}>
            <Text style={styles.versionText}>Community Store v1.0.0</Text>
            <Text style={styles.versionText}>CPUT Campus Marketplace</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Screen-level styles ──
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  contentWrap: { alignSelf: 'center' as any, width: '100%' as any, paddingBottom: Spacing['4xl'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  versionWrap: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  versionText: { ...Typography.caption, color: Colors.textTertiary, textTransform: 'none' as const },
});

// ── Section/Row styles ──
const sStyles = StyleSheet.create({
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rowLabel: { ...Typography.body, color: Colors.textPrimary },
  rowValue: { ...Typography.bodySmall, color: Colors.textTertiary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.titleMd, color: Colors.textPrimary },
  profileEmail: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  profileRoleBadge: {
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  profileRoleText: { ...Typography.caption, color: Colors.navy, textTransform: 'none' as const, fontWeight: '600' },
  editBtn: {
    borderWidth: 1,
    borderColor: Colors.navy,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  editBtnText: { ...Typography.bodySmall, color: Colors.navy, fontWeight: '600' },
  formSection: { gap: Spacing.xs },
  formActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
});
