import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

import { Avatar, Button, StarRating } from '@/components/ui';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { MOCK_USERS } from '@/data/mockData';

export default function RatePurchaseScreen() {
  const seller = MOCK_USERS[1]; // Thandi Nkosi
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    Alert.alert('Review Submitted', 'Thank you for your feedback!', [{ text: 'OK', onPress: () => router.back() }]);
  };

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

        <Button title="Submit Review" onPress={handleSubmit} fullWidth size="lg" disabled={rating === 0} />
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
