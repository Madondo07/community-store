import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showCount?: boolean;
  count?: number;
}

const SIZE_MAP = { sm: 14, md: 18, lg: 24 } as const;

export default function StarRating({
  rating,
  size = 'md',
  interactive = false,
  onRate,
  showCount = false,
  count = 0,
}: StarRatingProps) {
  const iconSize = SIZE_MAP[size];

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(rating);
        const star = (
          <Star
            key={i}
            size={iconSize}
            color={Colors.warning}
            fill={filled ? Colors.warning : 'transparent'}
          />
        );

        if (interactive && onRate) {
          return (
            <Pressable
              key={i}
              onPress={() => onRate(i)}
              hitSlop={4}
              accessibilityLabel={`Rate ${i} star${i > 1 ? 's' : ''}`}
            >
              {star}
            </Pressable>
          );
        }
        return star;
      })}
      {showCount && (
        <Text style={styles.count}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  count: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
  },
});
