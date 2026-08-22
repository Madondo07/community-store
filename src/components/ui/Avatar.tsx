import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

const SIZES = { sm: 32, md: 48, lg: 64, xl: 80 } as const;

const BG_COLORS = [
  '#2F4858', '#0072CE', '#8ED4D0', '#059669',
  '#D97706', '#7C3AED', '#DC2626', '#2563EB',
];

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export default function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const dim = SIZES[size];
  const fontSize = dim * 0.38;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]}
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: getColor(name) },
      ]}
      accessibilityLabel={name}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surfaceAlt,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
});
