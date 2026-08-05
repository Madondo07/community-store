import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Armchair, BookOpen, Package, Shirt, Smartphone, Wrench } from 'lucide-react-native';

import { ListingCard, SearchBar } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';

const BROWSE_CATEGORIES = [
  { key: 'textbooks', label: 'Textbooks', Icon: BookOpen },
  { key: 'electronics', label: 'Electronics', Icon: Smartphone },
  { key: 'furniture', label: 'Furniture', Icon: Armchair },
  { key: 'clothing', label: 'Clothing', Icon: Shirt },
  { key: 'services', label: 'Services', Icon: Wrench },
  { key: 'other', label: 'Other', Icon: Package },
];

export default function BrowseScreen() {
  const { state } = useApp();
  const { isDesktop, isTablet, contentMaxWidth, isWeb } = useResponsive();
  const [query, setQuery] = useState('');
  const recentListings = state.listings.filter((l) => l.status === 'active').slice(0, 6);

  const catColumns = isDesktop ? 6 : isTablet ? 3 : 2;
  const padding = isDesktop ? Spacing['2xl'] : Spacing.xl;

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: padding, maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as any }]}
      >
        <Text style={styles.title}>Browse</Text>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => router.push(`/search-results?query=${query}`)}
          placeholder="Search items, textbooks, services..."
        />

        {/* Categories */}
        <Text style={styles.sectionTitle}>Popular Categories</Text>
        <View style={styles.catGrid}>
          {BROWSE_CATEGORIES.map(({ key, label, Icon }) => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.catCard,
                { width: `${(100 / catColumns) - 2}%` as any },
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push(`/search-results?category=${key}`)}
              accessibilityLabel={label}
            >
              <View style={styles.catIconWrap}>
                <Icon size={28} color={Colors.blue} />
              </View>
              <Text style={styles.catLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Listings */}
        <Text style={styles.sectionTitle}>Recent Listings</Text>
        {isDesktop ? (
          <View style={styles.recentGrid}>
            {recentListings.map((item) => (
              <View key={item.id} style={styles.recentGridItem}>
                <ListingCard listing={item} onPress={() => router.push(`/listing-detail?id=${item.id}`)} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={recentListings}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
            renderItem={({ item }) => (
              <View style={styles.recentCard}>
                <ListingCard listing={item} onPress={() => router.push(`/listing-detail?id=${item.id}`)} />
              </View>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['4xl'] },
  title: { ...Typography.titleLg, color: Colors.navy, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.titleMd, color: Colors.textPrimary, marginTop: Spacing['2xl'], marginBottom: Spacing.md },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  catCard: {
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  catIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { ...Typography.titleSm, color: Colors.textPrimary, textAlign: 'center' },
  recentList: { gap: Spacing.md },
  recentCard: { width: 180 },
  recentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  recentGridItem: { width: '23%', minWidth: 180, flexGrow: 1 },
});
