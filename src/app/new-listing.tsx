import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Plus, X } from 'lucide-react-native';

import { Button, CategoryChip } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/mockData';
import { createListing, updateListing } from '@/lib/api/listings';
import { uploadListingImage } from '@/lib/api/storage';
import type { ListingCategory, ListingCondition } from '@/types';

const MAX_PHOTOS = 4;

export default function NewListingScreen() {
  const { state } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('used');
  const [photos, setPhotos] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit reached', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add listing photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const handlePublish = async () => {
    if (!title || !price || !category) {
      Alert.alert('Missing fields', 'Please fill in title, price, and category');
      return;
    }
    if (!state.user) {
      Alert.alert('Sign in required', 'Please sign in to publish a listing.');
      return;
    }
    setPublishing(true);
    try {
      const placeholderImage = `https://placehold.co/400x400/003C71/FFFFFF?text=${encodeURIComponent(title.slice(0, 12))}`;

      const listing = await createListing({
        seller_id: state.user.id,
        title,
        description,
        price: parseFloat(price) || 0,
        category: category as ListingCategory,
        condition,
        images: photos.length === 0 ? [placeholderImage] : [],
      });

      if (photos.length > 0) {
        const uploadedUrls = await Promise.all(
          photos.map((uri) => uploadListingImage(uri, state.user!.id, listing.id)),
        );
        await updateListing(listing.id, { images: uploadedUrls });
      }

      Alert.alert('Published!', 'Your listing is now live', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not publish listing.');
    } finally {
      setPublishing(false);
    }
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
          {photos[0] ? (
            <Pressable style={styles.photoMainFilled} onPress={() => handleRemovePhoto(photos[0])} accessibilityLabel="Remove photo">
              <Image source={{ uri: photos[0] }} style={styles.photoMainImage} />
              <View style={styles.photoRemoveBadge}><X size={14} color={Colors.textInverse} /></View>
            </Pressable>
          ) : (
            <Pressable style={styles.photoMain} onPress={handleAddPhoto}>
              <Camera size={32} color={Colors.textTertiary} />
              <Text style={styles.photoText}>Add Photos</Text>
            </Pressable>
          )}
          {[1, 2, 3].map((i) => {
            const uri = photos[i];
            return uri ? (
              <Pressable key={i} style={styles.photoSmallFilled} onPress={() => handleRemovePhoto(uri)} accessibilityLabel="Remove photo">
                <Image source={{ uri }} style={styles.photoSmallImage} />
                <View style={styles.photoRemoveBadge}><X size={12} color={Colors.textInverse} /></View>
              </Pressable>
            ) : (
              <Pressable key={i} style={styles.photoSmall} onPress={handleAddPhoto} accessibilityLabel="Add photo">
                <Plus size={20} color={Colors.textTertiary} />
              </Pressable>
            );
          })}
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

        <Button title="Publish Listing" onPress={handlePublish} loading={publishing} disabled={publishing} fullWidth size="lg" style={{ marginTop: Spacing.xl }} />
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
  photoMainFilled: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radii.lg, overflow: 'hidden', position: 'relative' },
  photoMainImage: { width: '100%', height: '100%' },
  photoText: { ...Typography.bodySmall, color: Colors.textTertiary },
  photoSmall: { flex: 1, minWidth: 80, aspectRatio: 1, backgroundColor: Colors.surface, borderRadius: Radii.md, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoSmallFilled: { flex: 1, minWidth: 80, aspectRatio: 1, borderRadius: Radii.md, overflow: 'hidden', position: 'relative' },
  photoSmallImage: { width: '100%', height: '100%' },
  photoRemoveBadge: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
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
