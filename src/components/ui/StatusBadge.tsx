import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

type Status = 'confirmed' | 'pending' | 'flagged';

interface StatusBadgeProps {
  status: Status;
}

const CONFIG: Record<Status, { bg: string; text: string; label: string; Icon: typeof CheckCircle }> = {
  confirmed: { bg: Colors.successLight, text: Colors.success, label: 'Confirmed', Icon: CheckCircle },
  pending: { bg: Colors.warningLight, text: Colors.warning, label: 'Pending', Icon: Clock },
  flagged: { bg: Colors.dangerLight, text: Colors.danger, label: 'Flagged', Icon: AlertTriangle },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text, label, Icon } = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]} accessibilityLabel={label}>
      <Icon size={14} color={text} />
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
