import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, Plus, X } from 'lucide-react-native';

import { Button, CategoryChip } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/mockData';
import type { ListingCondition } from '@/types';

export default function NewListingScreen() {
  const { state, dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('used');

  const handlePublish = () => {
    if (!title || !price || !category) {
      Alert.alert('Missing fields', 'Please fill in title, price, and category');
      return;
    }
    const newListing = {
      id: `l${Date.now()}`,
      seller_id: state.user?.id ?? 'u1',
      title,
      description,
      price: parseFloat(price) || 0,
      category: category as any,
      condition,
      status: 'active' as const,
      images: [`https://placehold.co/400x400/003C71/FFFFFF?text=${encodeURIComponent(title.slice(0, 12))}`],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seller: state.user ?? undefined,
      avg_rating: 0,
      review_count: 0,
    };
    dispatch({ type: 'ADD_LISTING', payload: newListing });
    Alert.alert('Published!', 'Your listing is now live', [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Listing</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close"><X size={24} color={Colors.textPrimary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          <View style={styles.photoMain}>
            <Camera size={32} color={Colors.textTertiary} />
            <Text style={styles.photoText}>Add Photos</Text>
          </View>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.photoSmall}>
              <Plus size={20} color={Colors.textTertiary} />
            </View>
          ))}
        </View>

        {/* Inputs */}
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What are you selling?" placeholderTextColor={Colors.textTertiary} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} placeholder="Describe your item..." placeholderTextColor={Colors.textTertiary} multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.label}>Price</Text>
        <View style={styles.priceRow}>
          <Text style={styles.pricePrefix}>R</Text>
          <TextInput style={[styles.input, styles.priceInput]} value={price} onChangeText={setPrice} placeholder="0" placeholderTextColor={Colors.textTertiary} keyboardType="numeric" />
        </View>

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
            <CategoryChip key={cat.key} label={cat.label} selected={category === cat.key} onPress={() => setCategory(cat.key)} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Condition</Text>
        <View style={styles.conditionRow}>
          {(['new', 'used'] as const).map((c) => (
            <Pressable key={c} style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]} onPress={() => setCondition(c)}>
              <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>{c === 'new' ? 'New' : 'Used'}</Text>
            </Pressable>
          ))}
        </View>

        <Button title="Publish Listing" onPress={handlePublish} fullWidth size="lg" style={{ marginTop: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  photoMain: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  photoText: { ...Typography.bodySmall, color: Colors.textTertiary },
  photoSmall: { flex: 1, minWidth: 80, aspectRatio: 1, backgroundColor: Colors.surface, borderRadius: Radii.md, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  label: { ...Typography.titleSm, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.lg, ...Typography.body, color: Colors.textPrimary },
  multiline: { height: 100, paddingTop: Spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  pricePrefix: { ...Typography.titleLg, color: Colors.navy, marginRight: Spacing.sm },
  priceInput: { flex: 1 },
  chipScroll: { marginBottom: Spacing.sm },
  conditionRow: { flexDirection: 'row', gap: Spacing.md },
  conditionBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderRadius: Radii.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  conditionBtnActive: { borderColor: Colors.navy, backgroundColor: Colors.overlayLight },
  conditionText: { ...Typography.titleSm, color: Colors.textSecondary },
  conditionTextActive: { color: Colors.navy },
});
