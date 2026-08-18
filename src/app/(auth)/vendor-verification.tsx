import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Building2, FileText, Hash, Square, SquareCheck, Upload, X } from 'lucide-react-native';

import { AuthInput, Button, StatusBadge } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { updateProfile } from '@/lib/api/profiles';
import { uploadVerificationDoc } from '@/lib/api/storage';

export default function VendorVerificationScreen() {
  const { state, dispatch } = useApp();
  const [businessName, setBusinessName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [document, setDocument] = useState<{ uri: string; name: string; mimeType: string | null } | null>(null);

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setDocument({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null });
    }
  };

  const handleSubmit = async () => {
    if (!state.user) {
      Alert.alert('Sign in required', 'Please sign in to submit verification.');
      return;
    }
    setSubmitting(true);
    try {
      if (document) {
        await uploadVerificationDoc(document.uri, state.user.id, 'business-registration');
      }
      await updateProfile(state.user.id, {
        business_name: businessName,
        registration_number: regNumber,
        verification_status: 'pending',
      });
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: { business_name: businessName, registration_number: regNumber, verification_status: 'pending' },
      });
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not submit verification.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pendingContainer}>
          <StatusBadge status="pending" />
          <Text style={styles.pendingTitle}>Verification Submitted</Text>
          <Text style={styles.pendingBody}>
            Your business documents are under review. This typically takes 24-48 hours. You&apos;ll receive a notification once your account is verified.
          </Text>
          <Button
            title="Continue to App"
            variant="secondary"
            onPress={() => router.replace('/(tabs)')}
            fullWidth
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Verify Your Business</Text>
        <Text style={styles.subtitle}>
          Vendor accounts require business verification before you can start selling. This helps keep our campus community safe.
        </Text>

        <AuthInput
          icon={<Building2 size={20} color={Colors.textTertiary} />}
          placeholder="Business Name"
          value={businessName}
          onChangeText={setBusinessName}
          autoCapitalize="words"
        />
        <AuthInput
          icon={<Hash size={20} color={Colors.textTertiary} />}
          placeholder="Registration Number"
          value={regNumber}
          onChangeText={setRegNumber}
        />

        {/* Upload Zone */}
        {document ? (
          <Pressable style={styles.uploadZoneFilled} onPress={handlePickDocument}>
            {document.mimeType?.startsWith('image/') ? (
              <Image source={{ uri: document.uri }} style={styles.uploadThumb} />
            ) : (
              <FileText size={28} color={Colors.navy} />
            )}
            <Text style={styles.uploadFileName} numberOfLines={1}>{document.name}</Text>
            <Pressable onPress={() => setDocument(null)} hitSlop={8} accessibilityLabel="Remove document">
              <X size={18} color={Colors.textTertiary} />
            </Pressable>
          </Pressable>
        ) : (
          <Pressable style={styles.uploadZone} onPress={handlePickDocument}>
            <Upload size={32} color={Colors.textTertiary} />
            <Text style={styles.uploadTitle}>Upload business documents</Text>
            <Text style={styles.uploadHint}>PNG, JPG, or PDF — max 5MB</Text>
          </Pressable>
        )}

        {/* Checkbox */}
        <Pressable
          style={styles.checkRow}
          onPress={() => setConfirmed(!confirmed)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
        >
          {confirmed ? (
            <SquareCheck size={22} color={Colors.navy} />
          ) : (
            <Square size={22} color={Colors.textTertiary} />
          )}
          <Text style={styles.checkText}>I confirm that the information provided is accurate</Text>
        </Pressable>

        <Button
          title="Submit for Review"
          onPress={handleSubmit}
          disabled={!confirmed || submitting}
          loading={submitting}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing['2xl'], paddingTop: Spacing['4xl'] },
  title: { ...Typography.displayMd, color: Colors.navy, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing['3xl'], lineHeight: 22 },
  uploadZone: {
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radii.lg, padding: Spacing['3xl'],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, backgroundColor: Colors.surface,
  },
  uploadZoneFilled: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.navy, borderRadius: Radii.lg,
    padding: Spacing.lg, marginBottom: Spacing.xl, backgroundColor: Colors.overlayLight,
  },
  uploadThumb: { width: 40, height: 40, borderRadius: Radii.sm },
  uploadFileName: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
  uploadTitle: { ...Typography.titleSm, color: Colors.textPrimary, marginTop: Spacing.md },
  uploadHint: { ...Typography.bodySmall, color: Colors.textTertiary, marginTop: Spacing.xs },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  checkText: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  pendingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  pendingTitle: { ...Typography.displayMd, color: Colors.navy, marginTop: Spacing.xl, textAlign: 'center' },
  pendingBody: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginVertical: Spacing.xl, lineHeight: 22 },
});
