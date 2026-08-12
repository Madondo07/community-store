import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryChip, ListingCard, SearchBar } from "@/components/ui";
import { Colors, Radii, Spacing, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { CATEGORIES } from "@/data/mockData";
import { useResponsive } from "@/hooks/useResponsive";
import type { Listing, ListingCondition } from "@/types";

interface ActiveFilters {
  category: string;
  condition: ListingCondition | null;
  priceRange: { min: number; max: number } | null;
}

const PRICE_RANGES = [
  { label: "R0–200", min: 0, max: 200 },
  { label: "R200–500", min: 200, max: 500 },
  { label: "R500–1000", min: 500, max: 1000 },
  { label: "R1000+", min: 1000, max: Infinity },
];

export default function BrowseScreen() {
  const { state } = useApp();
  const { isDesktop, isWeb, contentMaxWidth, gridColumns } = useResponsive();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ActiveFilters>({
    category: "all",
    condition: null,
    priceRange: null,
  });

  const px = isDesktop ? Spacing["2xl"] : Spacing.lg;

  const filteredListings = useMemo(() => {
    let results = state.listings.filter((l) => l.status === "active");
    if (filters.category !== "all")
      results = results.filter((l) => l.category === filters.category);
    if (filters.condition)
      results = results.filter((l) => l.condition === filters.condition);
    if (filters.priceRange)
      results = results.filter(
        (l) =>
          l.price >= filters.priceRange!.min &&
          l.price <= filters.priceRange!.max,
      );
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q),
      );
    }
    return results;
  }, [state.listings, filters, query]);

  // Removable active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (filters.condition) {
      chips.push({
        key: "condition",
        label: filters.condition === "new" ? "New" : "Used",
        onRemove: () => setFilters((f) => ({ ...f, condition: null })),
      });
    }
    if (filters.priceRange) {
      const range = PRICE_RANGES.find(
        (r) =>
          r.min === filters.priceRange!.min &&
          r.max === filters.priceRange!.max,
      );
      chips.push({
        key: "price",
        label:
          range?.label ??
          `R${filters.priceRange.min}–${filters.priceRange.max}`,
        onRemove: () => setFilters((f) => ({ ...f, priceRange: null })),
      });
    }
    return chips;
  }, [filters]);

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <View style={styles.gridCell}>
        <ListingCard
          listing={item}
          onPress={() => router.push(`/listing-detail?id=${item.id}`)}
        />
      </View>
    ),
    [],
  );

  const ListHeader = useCallback(
    () => (
      <View>
        {/* Header */}
        <View style={[styles.headerRow, { paddingHorizontal: px }]}>
          <Text style={styles.title}>Browse</Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: px, marginBottom: Spacing.sm }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={() => {}}
            placeholder="Search items, textbooks, services..."
          />
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipRow, { paddingHorizontal: px }]}
        >
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.key}
              label={cat.label}
              selected={filters.category === cat.key}
              onPress={() => setFilters((f) => ({ ...f, category: cat.key }))}
            />
          ))}
        </ScrollView>

        {/* Quick Filters — condition + price */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.quickRow, { paddingHorizontal: px }]}
        >
          <Pressable
            onPress={() =>
              setFilters((f) => ({
                ...f,
                condition: f.condition === "new" ? null : "new",
              }))
            }
            style={[
              styles.quickChip,
              filters.condition === "new" && styles.quickChipActive,
            ]}
          >
            <Text
              style={[
                styles.quickChipText,
                filters.condition === "new" && styles.quickChipTextActive,
              ]}
            >
              New
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              setFilters((f) => ({
                ...f,
                condition: f.condition === "used" ? null : "used",
              }))
            }
            style={[
              styles.quickChip,
              filters.condition === "used" && styles.quickChipActive,
            ]}
          >
            <Text
              style={[
                styles.quickChipText,
                filters.condition === "used" && styles.quickChipTextActive,
              ]}
            >
              Used
            </Text>
          </Pressable>
          <View style={styles.chipDivider} />
          {PRICE_RANGES.map((range) => {
            const isActive =
              filters.priceRange?.min === range.min &&
              filters.priceRange?.max === range.max;
            return (
              <Pressable
                key={range.label}
                onPress={() =>
                  setFilters((f) => ({
                    ...f,
                    priceRange: isActive
                      ? null
                      : { min: range.min, max: range.max },
                  }))
                }
                style={[styles.quickChip, isActive && styles.quickChipActive]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    isActive && styles.quickChipTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Active Filter Pills (removable with X) */}
        {activeFilterChips.length > 0 && (
          <View style={[styles.activeFilters, { paddingHorizontal: px }]}>
            {activeFilterChips.map((chip) => (
              <Pressable
                key={chip.key}
                onPress={chip.onRemove}
                style={styles.activeChip}
              >
                <Text style={styles.activeChipText}>{chip.label}</Text>
                <X size={Spacing.md} color={Colors.navy} />
              </Pressable>
            ))}
            <Pressable
              onPress={() =>
                setFilters({
                  category: "all",
                  condition: null,
                  priceRange: null,
                })
              }
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>Clear all</Text>
            </Pressable>
          </View>
        )}
      </View>
    ),
    [px, query, filters, filteredListings.length, activeFilterChips],
  );

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ["top"]}>
      <View
        style={[
          styles.container,
          {
            maxWidth: contentMaxWidth,
            alignSelf: "center" as const,
            width: "100%" as any,
          },
        ]}
      >
        <FlashList
          data={filteredListings}
          numColumns={gridColumns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search terms
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Spacing["3xl"],
            paddingHorizontal: px,
          }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  title: { ...Typography.titleLg, color: Colors.navy },

  chipRow: { paddingBottom: Spacing.sm, gap: Spacing.sm },

  // Quick filters
  quickRow: {
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    alignItems: "center",
  },
  quickChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  quickChipActive: {
    backgroundColor: Colors.overlayLight,
    borderColor: Colors.navy,
  },
  quickChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  quickChipTextActive: {
    color: Colors.navy,
    fontWeight: "600",
  },
  chipDivider: {
    width: 1,
    height: Spacing.xl,
    backgroundColor: Colors.border,
  },

  // Active removable filters
  activeFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    alignItems: "center",
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.overlayLight,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.navy,
  },
  activeChipText: {
    ...Typography.bodySmall,
    color: Colors.navy,
    fontWeight: "600",
  },
  clearBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  clearBtnText: {
    ...Typography.bodySmall,
    color: Colors.danger,
    fontWeight: "500",
  },

  // Grid
  gridCell: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  empty: { paddingTop: Spacing["4xl"], alignItems: "center", gap: Spacing.sm },
  emptyTitle: { ...Typography.titleMd, color: Colors.textPrimary },
  emptyText: { ...Typography.body, color: Colors.textTertiary },
});
