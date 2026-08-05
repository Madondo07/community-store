import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface AuthInputProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  hint?: string;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}

export default function AuthInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  hint,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const borderColor = error
    ? Colors.danger
    : focused
      ? Colors.borderFocused
      : Colors.border;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { borderColor }]}>
        <View style={styles.iconWrap}>{icon}</View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={placeholder}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden(!hidden)}
            style={styles.eyeBtn}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            {hidden ? (
              <EyeOff size={20} color={Colors.textTertiary} />
            ) : (
              <Eye size={20} color={Colors.textSecondary} />
            )}
          </Pressable>
        )}
      </View>
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    height: 52,
  },
  iconWrap: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.blue,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  error: {
    ...Typography.bodySmall,
    color: Colors.danger,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
