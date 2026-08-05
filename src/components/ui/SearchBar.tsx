import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  onFilter?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search listings...',
  onFilter,
  autoFocus = false,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Search size={20} color={Colors.textTertiary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        accessibilityLabel="Search"
      />
      {onFilter && (
        <Pressable
          onPress={onFilter}
          style={styles.filterBtn}
          accessibilityLabel="Filter results"
        >
          <SlidersHorizontal size={20} color={Colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    height: 44,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: Spacing.xs,
  },
});
