import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  mode: 'date' | 'time';
  onChange: (date: Date) => void;
  /** Latest selectable value — e.g. disallow logging a source date in the future. */
  maximumDate?: Date;
}

const formatValue = (value: Date, mode: 'date' | 'time') =>
  mode === 'date'
    ? value.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    : value.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

/**
 * Native date/time picker — thin wrapper around @expo/ui's
 * `@expo/ui/community/datetime-picker` (SwiftUI on iOS, Jetpack Compose on
 * Android), not a hand-rolled calendar/clock UI. That package renders
 * nothing on web, so DateTimeField.web.tsx supplies the browser's own
 * <input type="date"/"time"> there instead — Metro/webpack picks whichever
 * file matches the build target automatically.
 */
export default function DateTimeField({ label, value, mode, onChange, maximumDate }: DateTimeFieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <IOSField value={value} mode={mode} onChange={onChange} maximumDate={maximumDate} />
      ) : (
        <AndroidField label={label} value={value} mode={mode} onChange={onChange} maximumDate={maximumDate} />
      )}
    </View>
  );
}

/**
 * iOS ignores the `presentation` prop and always renders inline — with the
 * default display style that meant a full-size wheel/calendar swallowing
 * the form. `display="compact"` renders it as a small native pill that
 * opens its own self-contained popover instead, so no open/close state or
 * wrapper is needed here.
 */
function IOSField({ value, mode, onChange, maximumDate }: Omit<DateTimeFieldProps, 'label'>) {
  return (
    <View style={styles.iosWrap}>
      <DateTimePicker
        value={value}
        mode={mode}
        display="compact"
        maximumDate={maximumDate}
        onValueChange={(_event, selectedDate) => onChange(selectedDate)}
      />
    </View>
  );
}

/**
 * Android's `presentation="dialog"` (the default) is a one-shot native
 * modal dialog that opens when the component mounts and closes itself —
 * so this field is just a button that mounts/unmounts the picker, not a
 * persistently-rendered control.
 */
function AndroidField({ label, value, mode, onChange, maximumDate }: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)} accessibilityLabel={label} accessibilityRole="button">
        <Text style={styles.fieldText}>{formatValue(value, mode)}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode={mode}
          maximumDate={maximumDate}
          onValueChange={(_event, selectedDate) => {
            onChange(selectedDate);
            setOpen(false);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  label: { ...Typography.caption, color: Colors.textTertiary, textTransform: 'none' as const, marginBottom: Spacing.xs },
  iosWrap: { alignItems: 'flex-start' },
  field: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.lg,
  },
  fieldText: { ...Typography.body, color: Colors.textPrimary },
});
