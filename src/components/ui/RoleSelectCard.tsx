import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface RoleSelectCardProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function RoleSelectCard({
  icon,
  label,
  selected,
  onPress,
}: RoleSelectCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        {icon}
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    minHeight: 110,
  },
  cardSelected: {
    borderColor: Colors.navy,
    backgroundColor: Colors.overlayLight,
  },
  iconWrap: {
    marginBottom: Spacing.sm,
  },
  iconWrapSelected: {},
  label: {
    ...Typography.titleSm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  labelSelected: {
    color: Colors.navy,
  },
});
