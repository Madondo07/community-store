import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ShieldAlert, X } from 'lucide-react-native';

import { Button, CategoryChip } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { BULLETIN_CATEGORIES } from '@/data/mockData';
import { createBulletinPost } from '@/lib/api/bulletin';
import type { BulletinCategory } from '@/types';

const CATEGORY_OPTIONS = BULLETIN_CATEGORIES.filter((c) => c.key !== 'all');

/**
 * Admin-only. Deliberately manual entry, not AI-scraped from source emails
 * — an auto-posting pipeline was discussed and rejected specifically to
 * avoid a malformed/misdirected email going live unsupervised. The
 * accepted trade-off is some lag between CPUT sending a newsflash and it
 * appearing here.
 */
export default function BulletinComposerScreen() {
  const { state } = useApp();
  const [category, setCategory] = useState<BulletinCategory | ''>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  // Manually entered — represents the ORIGINAL source (e.g. the CPUT
  // newsflash email) date/time, not the moment this form is submitted.
  const [sourceDate, setSourceDate] = useState('');
  const [sourceTime, setSourceTime] = useState('');
  const [publishing, setPublishing] = useState(false);

  if (state.user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}>
          <ShieldAlert size={64} color={Colors.danger} />
          <Text style={styles.deniedTitle}>Access Denied</Text>
          <Text style={styles.deniedBody}>Posting to the bulletin board is admin-only.</Text>
          <Button title="Go Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handlePublish = async () => {
    if (!title.trim() || !body.trim() || !category) {
      Alert.alert('Missing fields', 'Please fill in title, body, and category.');
      return;
    }

    // Both date and time are optional, but if either is given they must
    // combine into something parseable — better to catch a typo here than
    // silently drop the source date.
    let isoDate: string | undefined;
    if (sourceDate.trim()) {
      const parsed = new Date(`${sourceDate.trim()}T${sourceTime.trim() || '00:00'}`);
      if (isNaN(parsed.getTime())) {
        Alert.alert('Invalid date', 'Use YYYY-MM-DD for the date and HH:MM (24h) for the time.');
        return;
      }
      isoDate = parsed.toISOString();
    }

    setPublishing(true);
    try {
      await createBulletinPost({
        author_id: state.user!.id,
        category,
        title: title.trim(),
        body: body.trim(),
        location: location.trim() || undefined,
        date: isoDate,
      });
      Alert.alert('Published', 'The bulletin post is now live.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not publish post.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Bulletin Post</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close"><X size={24} color={Colors.textPrimary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Department</Text>
        <View style={styles.chipRow}>
          {CATEGORY_OPTIONS.map((cat) => (
            <CategoryChip
              key={cat.key}
              label={cat.label}
              selected={category === cat.key}
              onPress={() => setCategory(cat.key as BulletinCategory)}
            />
          ))}
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Post title" placeholderTextColor={Colors.textTertiary} />

        <Text style={styles.label}>Body</Text>
        <TextInput style={[styles.input, styles.multiline]} value={body} onChangeText={setBody} placeholder="Post content..." placeholderTextColor={Colors.textTertiary} multiline numberOfLines={5} textAlignVertical="top" />

        <Text style={styles.label}>Location (optional)</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Bellville Campus, Library" placeholderTextColor={Colors.textTertiary} />

        <Text style={styles.label}>Original Source Date (optional)</Text>
        <Text style={styles.hint}>When the source email/notice was sent — not when you're posting this.</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            value={sourceDate}
            onChangeText={setSourceDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textTertiary}
          />
          <TextInput
            style={[styles.input, styles.timeInput]}
            value={sourceTime}
            onChangeText={setSourceTime}
            placeholder="HH:MM"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <Button
          title="Publish Post"
          onPress={handlePublish}
          loading={publishing}
          disabled={publishing}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  deniedTitle: { ...Typography.displayMd, color: Colors.danger },
  deniedBody: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  label: { ...Typography.titleSm, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  hint: { ...Typography.bodySmall, color: Colors.textTertiary, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.lg, ...Typography.body, color: Colors.textPrimary },
  multiline: { height: 120, paddingTop: Spacing.lg },
  dateRow: { flexDirection: 'row', gap: Spacing.md },
  dateInput: { flex: 2 },
  timeInput: { flex: 1 },
});
