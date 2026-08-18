import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';

import { Avatar, Button, StarRating } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getListing } from '@/lib/api/listings';
import { createNotification } from '@/lib/api/notifications';
import { createReview } from '@/lib/api/reviews';
import type { Listing } from '@/types';

export default function RatePurchaseScreen() {
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const { state } = useApp();
  const [listing, setListing] = useState<Listing | null>(null);
  // Starts false (not loading) when there's no listingId to fetch at all.
  const [loading, setLoading] = useState(!!listingId);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    getListing(listingId)
      .then(setListing)
      .catch((err) => console.warn('Failed to load listing:', err))
      .finally(() => setLoading(false));
  }, [listingId]);

  const seller = listing?.seller;

  const handleSubmit = async () => {
    if (!state.user || !listing || !seller) return;
    setSubmitting(true);
    try {
      await createReview({
        reviewer_id: state.user.id,
        seller_id: seller.id,
        listing_id: listing.id,
        rating,
        comment: review.trim() || null,
      });

      createNotification({
        user_id: seller.id,
        type: 'review',
        title: 'New review on your listing',
        body: `${state.user.full_name} left a ${rating}-star review on "${listing.title}".`,
        target_screen: 'seller-profile',
        target_id: seller.id,
      }).catch((err) => console.warn('Failed to create review notification:', err));

      Alert.alert('Review Submitted', 'Thank you for your feedback!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={Colors.navy} /></View>
      </SafeAreaView>
    );
  }

  if (!listing || !seller) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, { justifyContent: 'center' }]}><Text>Purchase not found</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rate Your Purchase</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close"><X size={24} color={Colors.textPrimary} /></Pressable>
      </View>

      <View style={styles.content}>
        <Avatar uri={seller.avatar_url} name={seller.full_name} size="lg" />
        <Text style={styles.sellerName}>{seller.full_name}</Text>
        <Text style={styles.subtitle}>How was your experience?</Text>

        <StarRating rating={rating} size="lg" interactive onRate={setRating} />

        <TextInput
          style={styles.reviewInput}
          placeholder="Share your experience (optional)..."
          placeholderTextColor={Colors.textTertiary}
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Button title="Submit Review" onPress={handleSubmit} loading={submitting} fullWidth size="lg" disabled={rating === 0 || submitting} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl },
  headerTitle: { ...Typography.titleLg, color: Colors.navy },
  content: { flex: 1, alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing['4xl'], gap: Spacing.lg },
  sellerName: { ...Typography.titleLg, color: Colors.textPrimary },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  reviewInput: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
    ...Typography.body, color: Colors.textPrimary, height: 120, marginTop: Spacing.md,
  },
});
