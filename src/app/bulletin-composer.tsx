import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react-native';

import { Button, CategoryChip, DateTimeField, IconButton, Toast } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { BULLETIN_CATEGORIES } from '@/data/mockData';
import { useToast } from '@/hooks/useToast';
import { createBulletinPost, deleteBulletinPost, getBulletinPost, updateBulletinPost } from '@/lib/api/bulletin';
import type { BulletinCategory } from '@/types';

const CATEGORY_OPTIONS = BULLETIN_CATEGORIES.filter((c) => c.key !== 'all');

// This screen is only ever reached via router.push (from the bulletin
// board's "Post" button, the admin dashboard shortcut, or a card's Edit
// action), never as a landing page — but on web, a page refresh while
// sitting on this route wipes that history, so plain router.back() then
// throws "The action 'GO_BACK' was not handled by any navigator." This
// falls back to the tabs root (the same fallback already used by
// cart.tsx/order-confirmed.tsx/vendor-verification.tsx) instead of crashing.
const goBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
};

/**
 * Admin-only. Deliberately manual entry, not AI-scraped from source emails
 * — an auto-posting pipeline was discussed and rejected specifically to
 * avoid a malformed/misdirected email going live unsupervised. The
 * accepted trade-off is some lag between CPUT sending a newsflash and it
 * appearing here.
 *
 * Also doubles as the edit screen: `?postId=<id>` loads that post instead
 * of starting a blank draft, and Publish becomes Save Changes.
 * Post/content validation (making sure what's shared is accurate) is
 * intentionally deferred — see supabase/README.md.
 */
export default function BulletinComposerScreen() {
  const { state } = useApp();
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const isEditMode = !!postId;

  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const [category, setCategory] = useState<BulletinCategory | ''>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [important, setImportant] = useState(false);
  // The post's date/time — drives the board's "posted X ago" timer, not
  // created_at. Defaults to now; admins can move it to log a backdated or
  // future-sourced announcement. Always set (unlike the old free-text
  // "original source date" field it replaces).
  const [postDate, setPostDate] = useState(() => new Date());
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Inline feedback instead of Alert.alert — react-native-web's Alert is a
  // no-op stub (confirmed in node_modules/react-native-web/src/exports/Alert:
  // `static alert() {}`), so on web it was silently swallowing every
  // validation message, submit error, and success confirmation, making the
  // form look like it "just hangs" with no indication of what happened.
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (!postId) return;
    getBulletinPost(postId)
      .then((post) => {
        if (!post) {
          setLoadError('This post no longer exists.');
          return;
        }
        setCategory(post.category);
        setTitle(post.title);
        setBody(post.body);
        setLocation(post.location ?? '');
        setImportant(!!post.is_important);
        setPostDate(post.date ? new Date(post.date) : new Date(post.created_at));
      })
      .catch((err) => setLoadError(err.message ?? 'Could not load post.'))
      .finally(() => setLoadingPost(false));
  }, [postId]);

  if (state.user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}>
          <ShieldAlert size={64} color={Colors.danger} />
          <Text style={styles.deniedTitle}>Access Denied</Text>
          <Text style={styles.deniedBody}>Posting to the bulletin board is admin-only.</Text>
          <Button title="Go Back" variant="secondary" onPress={goBack} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}>
          <ShieldAlert size={64} color={Colors.danger} />
          <Text style={styles.deniedTitle}>Couldn&apos;t load post</Text>
          <Text style={styles.deniedBody}>{loadError}</Text>
          <Button title="Go Back" variant="secondary" onPress={goBack} />
        </View>
      </SafeAreaView>
    );
  }

  const handleDateChange = (d: Date) => {
    const next = new Date(postDate);
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    setPostDate(next);
  };

  const handleTimeChange = (t: Date) => {
    const next = new Date(postDate);
    next.setHours(t.getHours(), t.getMinutes(), 0, 0);
    setPostDate(next);
  };

  const handlePublish = async () => {
    const missing: string[] = [];
    if (!category) missing.push('Department');
    if (!title.trim()) missing.push('Title');
    if (!body.trim()) missing.push('Body');
    if (missing.length > 0 || !category) {
      setFormError(`Missing: ${missing.join(', ')}.`);
      return;
    }
    setFormError(null);

    setPublishing(true);
    try {
      if (isEditMode) {
        await updateBulletinPost(postId!, {
          category,
          title: title.trim(),
          body: body.trim(),
          location: location.trim() || null,
          date: postDate.toISOString(),
          is_important: important,
        });
      } else {
        await createBulletinPost({
          author_id: state.user!.id,
          category,
          title: title.trim(),
          body: body.trim(),
          location: location.trim() || undefined,
          date: postDate.toISOString(),
          is_important: important,
        });
      }
      showToast(isEditMode ? 'Changes saved.' : 'Post published!');
      // Give the toast a moment to actually be seen before the screen closes.
      setTimeout(goBack, 900);
    } catch (err: any) {
      setFormError(err.message ?? 'Could not save post. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete this post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteBulletinPost(postId!);
            goBack();
          } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Could not delete post.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loadingPost) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}><ActivityIndicator size="large" color={Colors.navy} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Bulletin Post' : 'New Bulletin Post'}</Text>
        <IconButton onPress={goBack} accessibilityLabel="Close"><X size={24} color={Colors.textPrimary} /></IconButton>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {formError && (
          <View style={styles.errorBanner}>
            <AlertTriangle size={16} color={Colors.danger} />
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

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
        <TextInput style={[styles.input, styles.multiline]} value={body} onChangeText={setBody} placeholder="Post content..." placeholderTextColor={Colors.textTertiary} multiline numberOfLines={8} textAlignVertical="top" />

        <Text style={styles.label}>Location (optional)</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Bellville Campus, Library" placeholderTextColor={Colors.textTertiary} />

        <Pressable
          style={[styles.importantRow, important && styles.importantRowActive]}
          onPress={() => setImportant((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: important }}
        >
          <View style={[styles.checkbox, important && styles.checkboxChecked]}>
            {important && <AlertTriangle size={14} color={Colors.textInverse} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.importantLabel}>Mark as highly important</Text>
            <Text style={styles.hint}>Shown on the board with a red border to stand out.</Text>
          </View>
        </Pressable>

        <Text style={styles.label}>Post Date & Time</Text>
        <Text style={styles.hint}>
          Drives the &ldquo;posted X ago&rdquo; timer on the board — not when this form is submitted.
          Defaults to now; change it to log an announcement for a different date/time.
        </Text>
        <View style={styles.dateTimeRow}>
          <View style={{ flex: 1 }}>
            <DateTimeField label="Date" value={postDate} mode="date" onChange={handleDateChange} maximumDate={new Date()} />
          </View>
          <View style={{ flex: 1 }}>
            <DateTimeField label="Time" value={postDate} mode="time" onChange={handleTimeChange} />
          </View>
        </View>

        <Button
          title={isEditMode ? 'Save Changes' : 'Publish Post'}
          onPress={handlePublish}
          loading={publishing}
          disabled={publishing || deleting}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.xl }}
        />

        {isEditMode && (
          <Button
            title="Delete Post"
            variant="danger"
            onPress={handleDelete}
            loading={deleting}
            disabled={publishing || deleting}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
        )}
      </ScrollView>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onHide={hideToast} />
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: { ...Typography.bodySmall, color: Colors.danger, flex: 1, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dateTimeRow: { flexDirection: 'row', gap: Spacing.md },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.lg, ...Typography.body, color: Colors.textPrimary },
  multiline: { height: 180, paddingTop: Spacing.lg },
  importantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.lg },
  importantRowActive: { borderColor: Colors.danger, borderWidth: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  importantLabel: { ...Typography.titleSm, color: Colors.textPrimary },
});
