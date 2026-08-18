import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const SIZE_MAP = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 17 },
} as const;

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const sizeStyle = SIZE_MAP[size];
  const isDisabled = disabled || loading;

  const bgColor =
    variant === 'primary'
      ? Colors.navy
      : variant === 'danger'
        ? Colors.danger
        : 'transparent';

  const textColor =
    variant === 'secondary' ? Colors.navy : Colors.textInverse;

  const borderColor =
    variant === 'secondary' ? Colors.navy : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        fullWidth && styles.fullWidth,
        variant === 'secondary' && styles.outlined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              { color: textColor, fontSize: sizeStyle.fontSize },
              icon ? { marginLeft: Spacing.sm } : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  outlined: {
    borderWidth: 1.5,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
  },
});
