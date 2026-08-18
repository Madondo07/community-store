import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { CategoryChip, ListingCard, SearchBar } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { getListings } from '@/lib/api/listings';
import type { Listing } from '@/types';

export default function SearchResultsScreen() {
  const params = useLocalSearchParams<{ query?: string; category?: string }>();
  const [query, setQuery] = useState(params.query ?? '');
  const [selectedCategory, setSelectedCategory] = useState(params.category ?? '');
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    getListings()
      .then(setListings)
      .catch((err) => console.warn('Failed to load listings:', err));
  }, []);

  const results = useMemo(() => {
    return listings.filter((l) => {
      if (selectedCategory && l.category !== selectedCategory) return false;
      if (query) {
        const q = query.toLowerCase();
        return l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [listings, query, selectedCategory]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={24} color={Colors.textPrimary} /></Pressable>
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} onSubmit={() => {}} placeholder="Search..." />
        </View>
      </View>

      <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}</Text>

      {selectedCategory ? (
        <View style={styles.filterRow}>
          <CategoryChip label={selectedCategory} selected removable onPress={() => {}} onRemove={() => setSelectedCategory('')} />
        </View>
      ) : null}

      <FlatList
        data={results}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ListingCard listing={item} onPress={() => router.push(`/listing-detail?id=${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No results found</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  searchWrap: { flex: 1 },
  resultCount: { ...Typography.bodySmall, color: Colors.textSecondary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  gridContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['4xl'] },
  gridRow: { gap: Spacing.md, marginBottom: Spacing.md },
  gridItem: { flex: 1 },
  empty: { paddingTop: Spacing['4xl'], alignItems: 'center' },
  emptyText: { ...Typography.body, color: Colors.textTertiary },
});
