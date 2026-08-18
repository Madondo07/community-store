import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { X } from 'lucide-react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

export default function CategoryChip({
  label,
  selected = false,
  onPress,
  removable = false,
  onRemove,
}: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {removable && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeBtn}
          accessibilityLabel={`Remove ${label} filter`}
        >
          <X size={14} color={selected ? Colors.textInverse : Colors.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.full,
  },
  chipSelected: {
    backgroundColor: Colors.blue,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.textInverse,
  },
  removeBtn: {
    marginLeft: Spacing.xs,
  },
});
