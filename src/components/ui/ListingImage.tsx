import React, { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ImageOff } from 'lucide-react-native';

import { useAppTheme } from '@/context/ThemeContext';

interface ListingImageProps {
  /** First image URL for a listing — pass `listing.images[0]`, may be undefined for a listing with no photos. */
  uri: string | null | undefined;
  /** Accepts the same width/height/aspectRatio/borderRadius shape as an Image or View style — passed through to whichever one actually renders. */
  style: StyleProp<ViewStyle>;
  iconSize?: number;
}

/**
 * `<Image>` with a real fallback instead of silently rendering blank —
 * covers both a listing with no `images` at all and a stored URL that 404s
 * (expired upload, broken link). Without this, a bad URI just renders
 * nothing, which is indistinguishable from a layout bug.
 */
export default function ListingImage({ uri, style, iconSize = 28 }: ListingImageProps) {
  // Keyed to the URL that failed, so a recycled list cell given a new image
  // doesn't inherit the previous cell's failure.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = failedUri === uri;
  const { colors } = useAppTheme();
  const placeholderStyle = useMemo(() => ({ backgroundColor: colors.surfaceAlt }), [colors]);

  if (!uri || failed) {
    return (
      <View style={[styles.placeholder, placeholderStyle, style]}>
        <ImageOff size={iconSize} color={colors.textTertiary} />
      </View>
    );
  }

  return (
    // expo-image rather than RN's <Image>: persistent memory+disk cache (a
    // scrolled-back-to grid cell doesn't re-download), decodes off the JS
    // thread, and recycles cleanly inside FlashList cells.
    <Image
      source={{ uri }}
      style={style as StyleProp<ImageStyle>}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={120}
      recyclingKey={uri}
      onError={() => setFailedUri(uri ?? null)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
