import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  mode: 'date' | 'time';
  onChange: (date: Date) => void;
  /** Latest selectable value — e.g. disallow logging a source date in the future. */
  maximumDate?: Date;
}

const pad = (n: number) => n.toString().padStart(2, '0');

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 15,
  fontFamily: 'inherit',
  color: Colors.textPrimary,
  backgroundColor: Colors.surface,
  border: `1px solid ${Colors.border}`,
  borderRadius: Radii.md,
  padding: `${Spacing.lg}px`,
  boxSizing: 'border-box',
};

/**
 * Web counterpart to DateTimeField.tsx — @expo/ui's native DateTimePicker
 * renders nothing on web, so this uses the browser's own <input
 * type="date"/"time">, which is itself a native, non-hand-rolled picker
 * (opens the OS/browser's calendar or clock widget).
 */
export default function DateTimeField({ label, value, mode, onChange, maximumDate }: DateTimeFieldProps) {
  if (mode === 'date') {
    const isoDate = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    const isoMax = maximumDate
      ? `${maximumDate.getFullYear()}-${pad(maximumDate.getMonth() + 1)}-${pad(maximumDate.getDate())}`
      : undefined;
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        <input
          type="date"
          aria-label={label}
          value={isoDate}
          max={isoMax}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number);
            if (!y || !m || !d) return;
            const next = new Date(value);
            next.setFullYear(y, m - 1, d);
            onChange(next);
          }}
          style={inputStyle}
        />
      </View>
    );
  }

  // No `step` attribute — the browser's default is 60 seconds, i.e. every
  // minute is selectable, nothing skipped.
  const hhmm = `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <input
        type="time"
        aria-label={label}
        value={hhmm}
        onChange={(e) => {
          const [h, m] = e.target.value.split(':').map(Number);
          if (Number.isNaN(h) || Number.isNaN(m)) return;
          const next = new Date(value);
          next.setHours(h, m, 0, 0);
          onChange(next);
        }}
        style={inputStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...Typography.caption, color: Colors.textTertiary, textTransform: 'none' as const, marginBottom: Spacing.xs },
});
