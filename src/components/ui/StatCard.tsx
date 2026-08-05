import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

export default function StatCard({ label, value, color }: StatCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  value: {
    ...Typography.displayMd,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
