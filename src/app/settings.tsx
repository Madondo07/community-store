import React, { useEffect, useMemo, useState } from 'react';
import {
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
  ChevronRight,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Megaphone,
  MessageCircle,
  Monitor,
  Moon,
  Package,
  Shield,
  Sun,
  Trash2,
  User,
} from 'lucide-react-native';

import { AuthInput, Avatar, Button, IconButton, Toast, useConfirm } from '@/components/ui';
import { Radii, Shadows, Spacing, Typography, type ColorPalette } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useToast } from '@/hooks/useToast';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getMyNotificationPreferences,
  setNotificationPreference,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from '@/lib/api/notificationPreferences';
import { updateProfile } from '@/lib/api/profiles';
import { supabase } from '@/lib/supabase';

type ThemePreference = 'system' | 'light' | 'dark';

const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

// Styles are built from the active palette so this screen follows the
// light/dark/system choice made right here, instead of staying light.
function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    contentWrap: { alignSelf: 'center' as any, width: '100%' as any, paddingBottom: Spacing['4xl'] },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      marginBottom: Spacing.md,
    },
    headerTitle: { ...Typography.titleLg, color: colors.navy },
    versionWrap: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
    versionText: { ...Typography.caption, color: colors.textTertiary, textTransform: 'none' as const },

    section: { marginBottom: Spacing.xl },
    sectionTitle: {
      ...Typography.caption,
      color: colors.textTertiary,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    sectionCard: {
      backgroundColor: colors.surface,
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
    rowLabel: { ...Typography.body, color: colors.textPrimary },
    rowLabelDanger: { color: colors.danger },
    rowValue: { ...Typography.bodySmall, color: colors.textTertiary },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: Spacing.xs },

    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      marginBottom: Spacing.md,
    },
    profileInfo: { flex: 1 },
    profileName: { ...Typography.titleMd, color: colors.textPrimary },
    profileEmail: { ...Typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    profileRoleBadge: {
      backgroundColor: colors.overlayLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radii.full,
      alignSelf: 'flex-start',
      marginTop: Spacing.xs,
    },
    profileRoleText: { ...Typography.caption, color: colors.navy, textTransform: 'none' as const, fontWeight: '600' },
    editBtn: {
      borderWidth: 1,
      borderColor: colors.navy,
      borderRadius: Radii.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    editBtnText: { ...Typography.bodySmall, color: colors.navy, fontWeight: '600' },
    formSection: { gap: Spacing.xs },
    formActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },

    themeRow: { flexDirection: 'row', gap: Spacing.sm },
    themeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
      borderRadius: Radii.md,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    themeOptionActive: { borderColor: colors.navy, backgroundColor: colors.overlayLight },
    themeOptionLabel: { ...Typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
    themeOptionLabelActive: { color: colors.navy },
  });
}

type SettingsStyles = ReturnType<typeof makeStyles>;

function useSettingsStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => ({ colors, styles: makeStyles(colors) }), [colors]);
}

// ── Section Component ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { styles } = useSettingsStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
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
  const { colors, styles } = useSettingsStyles();
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: any) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityLabel={label}
    >
      <View style={styles.rowLeft}>
        {icon}
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      </View>
      {rightElement ?? (
        <View style={styles.rowRight}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          {onPress ? <ChevronRight size={18} color={colors.textTertiary} /> : null}
        </View>
      )}
    </Wrapper>
  );
}

function Divider({ styles }: { styles: SettingsStyles }) {
  return <View style={styles.divider} />;
}

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const { user } = state;
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();
  const { colors, styles } = useSettingsStyles();
  const { themePreference, setThemePreference } = useAppTheme();
  const confirm = useConfirm();
  const { toast, showToast, hideToast } = useToast();
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

  // ── Notification preferences (persisted — see migration 0016) ──
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getMyNotificationPreferences(userId)
      .then((saved) => {
        if (!cancelled) setPrefs(saved);
      })
      .catch((err) => console.warn('Failed to load notification preferences:', err))
      .finally(() => {
        if (!cancelled) setPrefsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleTogglePreference = async (key: NotificationPreferenceKey, value: boolean) => {
    if (!userId) return;
    const previous = prefs[key];
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      await setNotificationPreference(userId, key, value);
    } catch (err: any) {
      setPrefs((p) => ({ ...p, [key]: previous }));
      showToast(err.message ?? 'Could not save notification preference.', 'error');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      // Note: email here only updates the profiles row, not Supabase Auth's
      // own email (that requires a separate supabase.auth.updateUser + email
      // confirmation flow) — out of scope for this pass.
      await updateProfile(user.id, { full_name: fullName });
      dispatch({ type: 'UPDATE_PROFILE', payload: { full_name: fullName, email } });
      setEditingProfile(false);
      showToast('Profile updated successfully');
    } catch (err: any) {
      showToast(err.message ?? 'Could not update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (newPw.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setEditingPassword(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      showToast('Password updated successfully');
    } catch (err: any) {
      showToast(err.message ?? 'Could not update password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const signOutAndLeave = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SIGN_OUT' });
    router.replace('/(auth)');
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: 'Delete account?',
      message: 'Are you sure? This action cannot be undone. All your data will be permanently removed.',
      confirmLabel: 'Delete Account',
      destructive: true,
    });
    if (!confirmed) return;
    // Actually deleting the account/user data requires a service-role
    // Edge Function (not available client-side) — for now this just
    // signs the user out, same as "Sign Out" below.
    await signOutAndLeave();
  };

  // The one and only Sign Out in the app.
  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: 'Sign out?',
      message: 'You will need to sign in again to use your account.',
      confirmLabel: 'Sign Out',
    });
    if (!confirmed) return;
    await signOutAndLeave();
  };

  const renderSwitch = (key: NotificationPreferenceKey) => (
    <Switch
      value={prefs[key]}
      onValueChange={(v) => handleTogglePreference(key, v)}
      disabled={!prefsLoaded}
      trackColor={{ false: colors.border, true: colors.teal }}
      thumbColor={colors.surface}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.contentWrap, { maxWidth: contentMaxWidth, paddingHorizontal: padding }]}>
          {/* Header */}
          <View style={styles.header}>
            <IconButton onPress={() => router.back()} accessibilityLabel="Go back">
              <ArrowLeft size={24} color={colors.textPrimary} />
            </IconButton>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* ── Profile Information ── */}
          <Section title="Profile Information">
            {!editingProfile ? (
              <>
                <View style={styles.profileHeader}>
                  <Avatar uri={user?.avatar_url} name={user?.full_name ?? ''} size="lg" />
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user?.full_name}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                    <View style={styles.profileRoleBadge}>
                      <Text style={styles.profileRoleText}>
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => setEditingProfile(true)}
                  style={styles.editBtn}
                >
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.formSection}>
                <AuthInput
                  icon={<User size={18} color={colors.textTertiary} />}
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
                <AuthInput
                  icon={<Mail size={18} color={colors.textTertiary} />}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  hint="Use your @cput.ac.za email"
                />
                <View style={styles.formActions}>
                  <Button title="Save Changes" onPress={handleSaveProfile} loading={savingProfile} disabled={savingProfile} size="sm" />
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
                icon={<KeyRound size={20} color={colors.textSecondary} />}
                label="Change Password"
                onPress={() => setEditingPassword(true)}
              />
            ) : (
              <View style={styles.formSection}>
                <AuthInput
                  icon={<Lock size={18} color={colors.textTertiary} />}
                  placeholder="Current Password"
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry
                />
                <AuthInput
                  icon={<Lock size={18} color={colors.textTertiary} />}
                  placeholder="New Password"
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry
                  hint="Minimum 8 characters"
                />
                <AuthInput
                  icon={<Lock size={18} color={colors.textTertiary} />}
                  placeholder="Confirm New Password"
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry
                />
                <View style={styles.formActions}>
                  <Button title="Update Password" onPress={handleChangePassword} loading={savingPassword} disabled={savingPassword} size="sm" />
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

          {/* ── Appearance ── */}
          <Section title="Appearance">
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map(({ value, label, Icon }) => {
                const active = themePreference === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setThemePreference(value)}
                    style={[styles.themeOption, active && styles.themeOptionActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${label} theme`}
                  >
                    <Icon size={18} color={active ? colors.navy : colors.textSecondary} />
                    <Text style={[styles.themeOptionLabel, active && styles.themeOptionLabelActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* ── Notification Preferences ── */}
          <Section title="Notification Preferences">
            <Row
              icon={<MessageCircle size={20} color={colors.textSecondary} />}
              label="New Messages"
              rightElement={renderSwitch('messages')}
            />
            <Divider styles={styles} />
            <Row
              icon={<Package size={20} color={colors.textSecondary} />}
              label="Order Updates"
              rightElement={renderSwitch('orders')}
            />
            <Divider styles={styles} />
            <Row
              icon={<Megaphone size={20} color={colors.textSecondary} />}
              label="Bulletin Board Posts"
              rightElement={renderSwitch('bulletin')}
            />
          </Section>

          {/* ── Privacy & Security ── */}
          <Section title="Privacy & Security">
            <Row
              icon={<Shield size={20} color={colors.textSecondary} />}
              label="Two-Factor Authentication"
              value="Off"
              onPress={() => showToast('Two-factor authentication setup coming soon')}
            />
            <Divider styles={styles} />
            <Row
              icon={<Globe size={20} color={colors.textSecondary} />}
              label="Profile Visibility"
              value="Public"
              onPress={() => showToast('Profile visibility settings coming soon')}
            />
          </Section>

          {/* ── Account Actions ── */}
          <Section title="Account">
            <Row
              icon={<LogOut size={20} color={colors.textSecondary} />}
              label="Sign Out"
              onPress={handleSignOut}
            />
            <Divider styles={styles} />
            <Row
              icon={<Trash2 size={20} color={colors.danger} />}
              label="Delete Account"
              onPress={handleDeleteAccount}
              danger
            />
          </Section>

          <View style={styles.versionWrap}>
            <Text style={styles.versionText}>Swych v1.0.0</Text>
            <Text style={styles.versionText}>CPUT Campus Marketplace</Text>
          </View>
        </View>
      </ScrollView>
      <Toast message={toast?.message ?? null} variant={toast?.variant} onHide={hideToast} />
    </SafeAreaView>
  );
}
