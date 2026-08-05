/**
 * ContentContainer — centers content with max-width on larger screens.
 * On mobile, it's a no-op pass-through.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';

interface ContentContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Override max-width */
  maxWidth?: number;
}

export default function ContentContainer({ children, style, maxWidth }: ContentContainerProps) {
  const { contentMaxWidth, isMobile } = useResponsive();

  if (isMobile) {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inner, { maxWidth: maxWidth ?? contentMaxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
